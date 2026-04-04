"use client";

import { useState } from "react";

interface ShareButtonProps {
  /** Paires clé-valeur encodées en query params dans l'URL partagée */
  params: Record<string, string | number>;
  /** Label du bouton (par défaut "Partager") */
  label?: string;
}

/**
 * Bouton qui copie l'URL courante + les paramètres encodés dans le presse-papiers.
 * Affiche brièvement "Lien copie !" après le clic.
 */
export default function ShareButton({ params, label = "Partager" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = new URL(window.location.href);
    // Nettoyage des anciens params avant d'ajouter les nouveaux
    Object.keys(params).forEach((key) => {
      url.searchParams.set(key, String(params[key]));
    });
    // Supprime le hash pour une URL propre
    url.hash = "";

    try {
      await navigator.clipboard.writeText(url.toString());
    } catch {
      // Fallback pour navigateurs restrictifs
      const ta = document.createElement("textarea");
      ta.value = url.toString();
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleShare}
      className="rounded-lg border border-card-border px-4 py-2 text-xs font-medium text-muted hover:bg-background transition-colors"
    >
      {copied ? "Lien copie !" : label}
    </button>
  );
}
