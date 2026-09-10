"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { DELETED_AUTH_EVENT, DELETED_AUTH_PREFIX, visibleAuthUser, type DeletedAuthNotice } from "@/lib/deleted-auth-owner";
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
  const [deletionNotice, setDeletionNotice] = useState("");

  useEffect(() => {
    if (!supabase) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    let active = true;
    let receivedAuthEvent = false;
    let currentUser: User | null = null;
    const receiveUser = (incoming: User | null) => {
      currentUser = visibleAuthUser(incoming);
      setUser(currentUser);
      if (currentUser) setDeletionNotice("");
    };
    const onDeleted = (event: Event) => {
      const notice = (event as CustomEvent<DeletedAuthNotice>).detail;
      if (notice?.owner !== currentUser?.id) return;
      setDeletionNotice(notice.message);
      receiveUser(null);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key?.startsWith(DELETED_AUTH_PREFIX) && currentUser && !visibleAuthUser(currentUser)) receiveUser(null);
    };
    window.addEventListener(DELETED_AUTH_EVENT, onDeleted);
    window.addEventListener("storage", onStorage);

    // Listen for auth changes (PKCE callback, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      receivedAuthEvent = true;
      receiveUser(session?.user ?? null);
      setLoading(false);
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          if (params.has("code")) {
            window.history.replaceState({}, "", window.location.pathname);
          }
        }
      }
    });

    // Subscribe before reading the initial snapshot. A later auth event takes
    // precedence over a stale getSession response (including sign-out).
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (active && !receivedAuthEvent) receiveUser(session?.user ?? null);
    }).catch(() => {
      if (active && !receivedAuthEvent) setUser(null);
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
      window.removeEventListener(DELETED_AUTH_EVENT, onDeleted);
      window.removeEventListener("storage", onStorage);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {deletionNotice && <p role="status" className="border-b border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 [overflow-wrap:anywhere]">{deletionNotice}</p>}
      {children}
    </AuthContext.Provider>
  );
}
