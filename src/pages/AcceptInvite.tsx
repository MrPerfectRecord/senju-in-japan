import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2, AlertCircle, KeyRound } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/useAuth";

export default function AcceptInvite() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // The Supabase client auto-handles the access_token in the URL hash
  // (detectSessionInUrl is on). After it processes, useAuth reflects the user.

  useEffect(() => {
    if (!authLoading && !user) {
      // No user — invite link likely expired or already used
      setError(
        "This invite link is invalid or expired. Ask the admin who invited you to send a fresh link."
      );
    }
  }, [authLoading, user]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    const { error: updateErr } = await supabase.auth.updateUser({ password });
    if (updateErr) {
      setError(updateErr.message);
      setSubmitting(false);
      return;
    }
    setSuccess(true);
    setSubmitting(false);
    // Redirect into admin after a moment
    setTimeout(() => navigate("/admin", { replace: true }), 1500);
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-2xl font-black tracking-tighter uppercase italic">
            Senju in Japan
          </span>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 p-8 md:p-10">
          <div className="flex items-center gap-3 mb-2">
            <KeyRound className="text-red-600" size={20} />
            <h1 className="text-xl font-black uppercase tracking-widest">
              Set Your Password
            </h1>
          </div>
          <p className="text-zinc-500 text-sm mb-8">
            You've been invited as an admin. Choose a password to finish.
          </p>

          {error && (
            <div className="mb-6 flex items-start gap-2 bg-red-950/40 border border-red-900 px-4 py-3 text-sm text-red-300">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-center gap-2 bg-green-950/40 border border-green-900 px-4 py-3 text-sm text-green-300">
              <CheckCircle2 size={16} />
              <span>Password set. Redirecting to admin…</span>
            </div>
          )}

          {!success && user && (
            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2 block">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email ?? ""}
                  disabled
                  className="w-full bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-zinc-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2 block">
                  New Password (8+ chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black border border-zinc-800 px-4 py-3 text-sm focus:border-red-600 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2 block">
                  Confirm
                </label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full bg-black border border-zinc-800 px-4 py-3 text-sm focus:border-red-600 focus:outline-none transition"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-4 text-xs font-black uppercase tracking-[0.3em] transition flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="animate-spin" size={16} />}
                {submitting ? "Saving…" : "Set Password & Continue"}
              </button>
            </form>
          )}

          {authLoading && (
            <div className="flex items-center justify-center py-8 text-zinc-500">
              <Loader2 className="animate-spin" size={20} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
