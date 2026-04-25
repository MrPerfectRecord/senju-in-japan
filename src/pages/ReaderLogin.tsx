import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BookOpen, AlertCircle, Loader2 } from "lucide-react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { useAuth } from "../lib/useAuth";

export default function ReaderLogin({ mode }: { mode: "login" | "signup" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/manga";
  const { user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) navigate(redirectTo, { replace: true });
  }, [authLoading, user, navigate, redirectTo]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabaseConfigured) {
      setError("Sign-in isn't configured yet. Try again later.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setInfo(null);

    if (mode === "signup") {
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: displayName.trim() || null },
        },
      });
      if (signUpErr) {
        setError(signUpErr.message);
        setSubmitting(false);
        return;
      }
      if (data.user && displayName.trim()) {
        // Update profile with display name
        await supabase
          .from("profiles")
          .update({ display_name: displayName.trim() })
          .eq("id", data.user.id);
      }
      if (!data.session) {
        setInfo(
          "Check your email to confirm your account, then come back and sign in."
        );
        setSubmitting(false);
        return;
      }
      navigate(redirectTo, { replace: true });
    } else {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInErr) {
        setError(signInErr.message);
        setSubmitting(false);
        return;
      }
      navigate(redirectTo, { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="block text-center mb-8">
          <span className="text-2xl font-black tracking-tighter uppercase italic">
            Senju in Japan
          </span>
        </Link>

        <div className="bg-zinc-950 border border-zinc-800 p-8 md:p-10">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="text-red-600" size={20} />
            <h1 className="text-xl font-black uppercase tracking-widest">
              {mode === "signup" ? "Reader Sign Up" : "Sign In to Read"}
            </h1>
          </div>
          <p className="text-zinc-500 text-sm mb-8">
            {mode === "signup"
              ? "Free account — unlocks premium chapters."
              : "Welcome back."}
          </p>

          {error && (
            <div className="mb-6 flex items-start gap-2 bg-red-950/40 border border-red-900 px-4 py-3 text-sm text-red-300">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {info && (
            <div className="mb-6 bg-green-950/40 border border-green-900 px-4 py-3 text-sm text-green-300">
              {info}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            {mode === "signup" && (
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2 block">
                  Display name (optional)
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-black border border-zinc-800 px-4 py-3 text-sm focus:border-red-600 focus:outline-none transition"
                />
              </div>
            )}
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2 block">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border border-zinc-800 px-4 py-3 text-sm focus:border-red-600 focus:outline-none transition"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2 block">
                Password {mode === "signup" && "(8+ chars)"}
              </label>
              <input
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                minLength={mode === "signup" ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-zinc-800 px-4 py-3 text-sm focus:border-red-600 focus:outline-none transition"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-4 text-xs font-black uppercase tracking-[0.3em] transition flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="animate-spin" size={16} />}
              {submitting ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-xs text-zinc-500 text-center">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <Link to={`/login${redirectTo !== "/manga" ? `?redirect=${redirectTo}` : ""}`} className="text-red-500 hover:text-red-400">
                  Sign in
                </Link>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <Link to={`/signup${redirectTo !== "/manga" ? `?redirect=${redirectTo}` : ""}`} className="text-red-500 hover:text-red-400">
                  Sign up free
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
