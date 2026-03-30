"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

export default function Connexion() {
  const { user, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!supabase) {
    return (
      <div className="bg-background py-16">
        <div className="mx-auto max-w-md px-4 text-center">
          <p className="text-muted">Authentification non configurée.</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="bg-background py-16">
        <div className="mx-auto max-w-md px-4">
          <div className="rounded-xl border border-card-border bg-card p-8 shadow-sm text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy/10 mx-auto mb-4">
              <svg className="h-8 w-8 text-navy" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-navy">Connecté</h2>
            <p className="mt-1 text-sm text-muted">{user.email}</p>
            <div className="mt-6 space-y-3">
              <Link href="/mes-evaluations" className="block rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-light transition-colors">
                Mes évaluations
              </Link>
              <button onClick={signOut} className="block w-full rounded-lg border border-card-border px-4 py-2.5 text-sm font-medium text-muted hover:bg-background transition-colors">
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (!supabase) return;

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Vérifiez votre boîte mail pour confirmer votre inscription.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message === "Invalid login credentials" ? "Email ou mot de passe incorrect." : error.message);
      }
    }

    setLoading(false);
  };

  return (
    <div className="bg-background py-16">
      <div className="mx-auto max-w-md px-4">
        <div className="rounded-xl border border-card-border bg-card p-8 shadow-sm">
          <div className="text-center mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold text-navy-dark font-bold text-xl mx-auto">
              T
            </div>
            <h1 className="mt-4 text-xl font-bold text-navy">
              {mode === "login" ? "Connexion" : "Créer un compte"}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {mode === "login"
                ? "Accédez à vos évaluations sauvegardées"
                : "Sauvegardez vos évaluations dans le cloud"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                placeholder="votre@email.lu"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate mb-1">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                placeholder="Min. 6 caractères"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            {message && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                <p className="text-xs text-green-700">{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-light transition-colors disabled:opacity-50"
            >
              {loading ? "..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setMessage(""); }}
              className="text-sm text-navy hover:underline"
            >
              {mode === "login" ? "Pas encore de compte ? Inscrivez-vous" : "Déjà un compte ? Connectez-vous"}
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-muted">
            En créant un compte, vous acceptez nos{" "}
            <Link href="/mentions-legales" className="text-navy hover:underline">mentions légales</Link>
            {" "}et notre{" "}
            <Link href="/confidentialite" className="text-navy hover:underline">politique de confidentialité</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
