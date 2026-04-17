/**
 * Génère une paire de clés RSA 2048 pour Enable Banking PSD2.
 *
 * Usage (depuis la racine tevaxia) :
 *   node scripts/generate_psd2_keys.mjs
 *
 * Produit 3 fichiers dans ./psd2-keys/ (gitignoré) :
 *   - private.pem                    → Vercel env ENABLE_BANKING_PRIVATE_KEY (format PEM)
 *   - private-oneline.txt            → Vercel env ENABLE_BANKING_PRIVATE_KEY (une seule ligne avec \n)
 *   - public.pem                     → à uploader à Enable Banking
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const OUT_DIR = path.resolve("psd2-keys");
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

fs.writeFileSync(path.join(OUT_DIR, "private.pem"), privateKey);
fs.writeFileSync(path.join(OUT_DIR, "public.pem"), publicKey);
fs.writeFileSync(path.join(OUT_DIR, "private-oneline.txt"), privateKey.replace(/\r?\n/g, "\\n"));

console.log("\n✓ Clés générées dans psd2-keys/");
console.log("  - public.pem           → uploader à Enable Banking");
console.log("  - private.pem          → NE JAMAIS COMMITER, NE JAMAIS PARTAGER");
console.log("  - private-oneline.txt  → copier le contenu dans Vercel env ENABLE_BANKING_PRIVATE_KEY\n");
