"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const init = async () => {
      // 1. Cross-domain SSO: tokens passed via hash (from tevaxia.lu → energy.tevaxia.lu)
      // detectSessionInUrl does NOT handle hash tokens in PKCE mode, so we do it manually
      if (typeof window !== "undefined" && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        if (accessToken && refreshToken) {
          const { data, error } = await supabase!.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!error && data.session) {
            setUser(data.session.user);
            setLoading(false);
            window.history.replaceState({}, "", window.location.pathname);
            return; // Session established, done
          }
        }
      }

      // 2. Get existing session (cookie-based, handles returning users)
      const { data: { session } } = await supabase!.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    init();

    // Listen for auth state changes (PKCE callback via detectSessionInUrl, sign out, refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (loading) setLoading(false);
      // Clean up PKCE code from URL after sign in
      if (event === "SIGNED_IN" && typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.has("code")) {
          window.history.replaceState({}, "", window.location.pathname);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
