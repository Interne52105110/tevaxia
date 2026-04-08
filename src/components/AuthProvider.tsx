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
      // 1. If OAuth callback with PKCE code, exchange it for a session
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (code) {
          await supabase!.auth.exchangeCodeForSession(code);
          window.history.replaceState({}, "", window.location.pathname);
        }
      }

      // 2. Get current session (either from step 1 or existing cookie)
      const { data: { session } } = await supabase!.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    init();

    // 3. Listen for future auth changes (sign out, token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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
