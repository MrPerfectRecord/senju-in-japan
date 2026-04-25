import { useEffect, useState } from "react";
import { UserPlus, Trash2, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/useAuth";
import { authedFetch } from "../../lib/authedFetch";
import type { Profile } from "../../lib/database.types";
import { Banner, Button, Field, Input, PageHeader } from "./_formKit";

export default function ManageUsers() {
  const { user: me } = useAuth();
  const [admins, setAdmins] = useState<Array<Profile & { email: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    // We can read all profiles where role='admin' thanks to "admins see all profiles" RLS.
    const { data, error: e } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "admin")
      .order("created_at");
    if (e) {
      setError(e.message);
      setLoading(false);
      return;
    }
    // We need to look up emails — the invite API returns them via a server function we'll
    // call here as well. To keep client-only logic simple, we'll just show display_name
    // and id; the api/list-admins endpoint enriches with email if available.
    try {
      const r = await authedFetch("/api/list-admins");
      if (r.ok) {
        const enriched = (await r.json()) as Array<{ id: string; email: string | null }>;
        const map = new Map(enriched.map((x) => [x.id, x.email]));
        setAdmins(((data as Profile[]) ?? []).map((p) => ({ ...p, email: map.get(p.id) ?? null })));
      } else {
        setAdmins(((data as Profile[]) ?? []).map((p) => ({ ...p, email: null })));
      }
    } catch {
      setAdmins(((data as Profile[]) ?? []).map((p) => ({ ...p, email: null })));
    }
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setError(null);
    setSuccess(null);
    try {
      const r = await authedFetch("/api/invite-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body.error || "Invite failed");
      setSuccess(`Invite sent to ${email}. They'll receive an email to set their password.`);
      setEmail("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invite failed");
    } finally {
      setInviting(false);
    }
  }

  async function demote(id: string) {
    if (id === me?.id) {
      alert("You can't remove your own admin access.");
      return;
    }
    if (!confirm("Remove admin access from this user? They'll keep their reader account.")) return;
    const { error: e } = await supabase
      .from("profiles")
      .update({ role: "reader" })
      .eq("id", id);
    if (e) setError(e.message);
    else void load();
  }

  return (
    <>
      <PageHeader title="Users" sub="Invite collaborators with full admin access." />
      {error && <Banner kind="error">{error}</Banner>}
      {success && <Banner kind="success">{success}</Banner>}

      <form onSubmit={invite} className="bg-zinc-950 border border-zinc-800 p-5 mb-8 max-w-2xl">
        <Field label="Invite a new admin" hint="They'll get an email to set their own password.">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="collaborator@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" loading={inviting}><UserPlus size={14} /> Send invite</Button>
          </div>
        </Field>
      </form>

      <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-4">
        Current admins ({admins.length})
      </h2>

      {loading ? (
        <Loader2 className="animate-spin text-zinc-500" size={18} />
      ) : (
        <div className="space-y-2 max-w-2xl">
          {admins.map((a) => (
            <div key={a.id} className="bg-zinc-950 border border-zinc-800 p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm font-bold truncate">{a.display_name || a.email || a.id}</div>
                {a.email && <div className="text-xs text-zinc-500 truncate">{a.email}</div>}
                {a.id === me?.id && (
                  <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-widest text-red-500">
                    You
                  </span>
                )}
              </div>
              {a.id !== me?.id && (
                <button
                  onClick={() => demote(a.id)}
                  className="text-zinc-600 hover:text-red-500 flex-shrink-0"
                  title="Remove admin access"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
