import { useEffect, useState } from "react";
import { Plus, Trash2, GripVertical, Save } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { Social } from "../../lib/database.types";
import { Banner, Button, Field, Input, PageHeader, Select } from "./_formKit";

const PLATFORM_OPTIONS = [
  { value: "youtube",   label: "YouTube" },
  { value: "twitter",   label: "X / Twitter" },
  { value: "instagram", label: "Instagram" },
  { value: "discord",   label: "Discord" },
  { value: "tiktok",    label: "TikTok" },
];

export default function EditSocials() {
  const [rows, setRows] = useState<Social[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error: e } = await supabase
      .from("socials")
      .select("*")
      .order("position");
    if (e) setError(e.message);
    else setRows((data as Social[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  function patch(id: string, p: Partial<Social>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
    setSuccess(false);
  }

  function move(id: string, dir: -1 | 1) {
    setRows((rs) => {
      const i = rs.findIndex((r) => r.id === id);
      if (i < 0) return rs;
      const j = i + dir;
      if (j < 0 || j >= rs.length) return rs;
      const copy = [...rs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy.map((r, idx) => ({ ...r, position: idx + 1 }));
    });
    setSuccess(false);
  }

  async function add() {
    const { data, error: e } = await supabase
      .from("socials")
      .insert({
        platform: "youtube",
        label: "YouTube",
        url: "https://",
        position: rows.length + 1,
      })
      .select()
      .single();
    if (e) setError(e.message);
    else if (data) setRows((rs) => [...rs, data as Social]);
  }

  async function remove(id: string) {
    if (!confirm("Delete this social link?")) return;
    const { error: e } = await supabase.from("socials").delete().eq("id", id);
    if (e) setError(e.message);
    else setRows((rs) => rs.filter((r) => r.id !== id));
  }

  async function saveAll() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    for (const r of rows) {
      const { error: e } = await supabase
        .from("socials")
        .update({
          platform: r.platform,
          label: r.label,
          url: r.url,
          position: r.position,
        })
        .eq("id", r.id);
      if (e) {
        setError(e.message);
        setSaving(false);
        return;
      }
    }
    setSuccess(true);
    setSaving(false);
  }

  return (
    <>
      <PageHeader title="Socials" sub="The icons in your hero row and footer." />
      {error && <Banner kind="error">{error}</Banner>}
      {success && <Banner kind="success">Saved.</Banner>}

      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : (
        <div className="space-y-3 max-w-3xl">
          {rows.map((r, idx) => (
            <div key={r.id} className="bg-zinc-950 border border-zinc-800 p-4">
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <button
                    onClick={() => move(r.id, -1)}
                    disabled={idx === 0}
                    className="text-zinc-600 hover:text-white disabled:opacity-30"
                    title="Move up"
                    type="button"
                  >▲</button>
                  <button
                    onClick={() => move(r.id, 1)}
                    disabled={idx === rows.length - 1}
                    className="text-zinc-600 hover:text-white disabled:opacity-30"
                    title="Move down"
                    type="button"
                  >▼</button>
                </div>
                <GripVertical size={14} className="text-zinc-700" />
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Select value={r.platform} onChange={(e) => patch(r.id, { platform: e.target.value })}>
                    {PLATFORM_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </Select>
                  <Input
                    placeholder="Label"
                    value={r.label}
                    onChange={(e) => patch(r.id, { label: e.target.value })}
                  />
                  <Input
                    placeholder="https://…"
                    value={r.url}
                    onChange={(e) => patch(r.id, { url: e.target.value })}
                  />
                </div>
                <button
                  onClick={() => remove(r.id)}
                  type="button"
                  className="text-zinc-600 hover:text-red-500"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={add}>
              <Plus size={14} /> Add social
            </Button>
            <Button type="button" loading={saving} onClick={saveAll}>
              <Save size={14} /> Save all
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
