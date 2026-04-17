/**
 * Génère une paire RSA 2048 + certificat X.509 auto-signé pour Enable Banking PSD2.
 *
 * Enable Banking exige un certificat X.509 self-signed (format -----BEGIN CERTIFICATE-----),
 * pas une public key brute. Doc: https://enablebanking.com/docs/api/reference/
 *
 * Usage (depuis racine tevaxia) :
 *   node scripts/generate_psd2_keys.mjs
 *
 * Produit 3 fichiers dans ./psd2-keys/ (gitignoré) :
 *   - private.pem             → clé privée PKCS#8 (format PEM)
 *   - private-oneline.txt     → clé privée en une ligne avec \n littéral (pour Vercel env)
 *   - certificate.pem         → certificat X.509 self-signed à uploader chez Enable Banking
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const OUT_DIR = path.resolve("psd2-keys");
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

// 1. Génère paire RSA 2048 (format PEM)
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

// 2. Génère un certificat X.509 auto-signé valide 10 ans
// Node 19+ expose crypto.X509Certificate pour la création de certificats simples
// On utilise l'API crypto.createPrivateKey/createPublicKey + une approche manuelle ASN.1
// pour rester sans dépendance externe.
//
// Astuce : Node n'a pas d'API native pour CRÉER un cert X.509 (uniquement parser).
// On utilise donc la surface minimale nécessaire : générer un self-signed cert
// via la commande openssl locale OU via le module 'node-forge' s'il est installé.

let certificatePem;
try {
  // Tente via node-forge si dispo
  const forge = await import("node-forge");
  const pki = forge.default.pki;
  const forgeKeys = pki.rsa.generateKeyPair({ bits: 2048 });
  // Recharge notre paire dans forge via PEM round-trip
  const forgePrivate = pki.privateKeyFromPem(privateKey);
  const forgePublic = pki.publicKeyFromPem(publicKey);
  void forgeKeys;

  const cert = pki.createCertificate();
  cert.publicKey = forgePublic;
  cert.serialNumber = "01" + Date.now().toString(16);
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);
  const attrs = [
    { name: "commonName", value: "tevaxia" },
    { name: "countryName", value: "LU" },
    { name: "organizationName", value: "tevaxia" },
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(forgePrivate, forge.default.md.sha256.create());
  certificatePem = pki.certificateToPem(cert);
} catch {
  console.error("\n❌ node-forge non trouvé. Installation : npm install --save-dev node-forge\n");
  process.exit(1);
}

fs.writeFileSync(path.join(OUT_DIR, "private.pem"), privateKey);
fs.writeFileSync(path.join(OUT_DIR, "certificate.pem"), certificatePem);
fs.writeFileSync(path.join(OUT_DIR, "private-oneline.txt"), privateKey.replace(/\r?\n/g, "\\n"));

console.log("\n✓ Clés + certificat générés dans psd2-keys/");
console.log("  - certificate.pem       → uploader à Enable Banking (X.509 self-signed)");
console.log("  - private.pem           → NE JAMAIS COMMITER");
console.log("  - private-oneline.txt   → copier contenu dans Vercel env ENABLE_BANKING_PRIVATE_KEY\n");
