import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, AlertCircle, Loader2 } from "lucide-react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { useAuth } from "../lib/useAuth";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already signed in as admin, jump to dashboard
  useEffect(() => {
    if (!authLoading && isAdmin) navigate("/admin", { replace: true });
  }, [authLoading, isAdmin, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabaseConfigured) {
      setError("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const { data, error: signInErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInErr) {
      setError(signInErr.message);
      setSubmitting(false);
      return;
    }
    if (!data.user) {
      setError("Login succeeded but no user returned.");
      setSubmitting(false);
      return;
    }
    // Verify admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();
    if (!profile || profile.role !== "admin") {
      await supabase.auth.signOut();
      setError("This account doesn't have admin access.");
      setSubmitting(false);
      return;
    }
    navigate("/admin", { replace: true });
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
          <div className="flex items-center gap-3 mb-8">
            <Lock className="text-red-600" size={20} />
            <h1 className="text-xl font-black uppercase tracking-widest">Admin Sign In</h1>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-2 bg-red-950/40 border border-red-900 px-4 py-3 text-sm text-red-300">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
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
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                required
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
              {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
              {submitting ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="mt-8 text-[10px] text-zinc-600 uppercase tracking-widest text-center">
            Admins only · <Link to="/" className="hover:text-red-500">Back to site</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
