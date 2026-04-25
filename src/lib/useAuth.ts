import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "./supabase";
import type { Profile } from "./database.types";

interface AuthState {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isReader: boolean;
}

/**
 * Subscribes to Supabase auth state and keeps the user's profile row fresh.
 * `loading` stays true until both the session *and* the profile (if there is a
 * user) have been resolved, so consumers can safely gate redirects on !loading
 * without flashing through a false "no session" state.
 */
export function useAuth(): AuthState {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }
    let active = true;

    async function fetchProfile(userId: string): Promise<Profile | null> {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      return (data as Profile | null) ?? null;
    }

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      const sess = data.session;
      setSession(sess);
      if (sess?.user) {
        const p = await fetchProfile(sess.user.id);
        if (!active) return;
        setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    }
    void init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      if (!active) return;
      setSession(sess);
      if (sess?.user) {
        const p = await fetchProfile(sess.user.id);
        if (!active) return;
        setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return {
    loading,
    session,
    user: session?.user ?? null,
    profile,
    isAdmin: profile?.role === "admin",
    isReader: profile?.role === "reader" || profile?.role === "admin",
  };
}

export async function signOut() {
  await supabase.auth.signOut();
}
