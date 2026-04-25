import { useEffect, useState } from "react";
import { Plus, Trash2, Save, Upload } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { Sponsor } from "../../lib/database.types";
import { Banner, Button, Field, Input, PageHeader } from "./_formKit";
import { uploadFile } from "../../lib/uploadFile";

export default function EditSponsors() {
  const [rows, setRows] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error: e } = await supabase.from("sponsors").select("*").order("position");
    if (e) setError(e.message);
    else setRows((data as Sponsor[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  function patch(id: string, p: Partial<Sponsor>) {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...p } : x)));
    setSuccess(false);
  }

  async function add() {
    const { data, error: e } = await supabase
      .from("sponsors")
      .insert({ name: "New Partner", logo_url: "", position: rows.length + 1 })
      .select().single();
    if (e) setError(e.message);
    else if (data) setRows((r) => [...r, data as Sponsor]);
  }

  async function remove(id: string) {
    if (!confirm("Delete this sponsor?")) return;
    const { error: e } = await supabase.from("sponsors").delete().eq("id", id);
    if (e) setError(e.message);
    else setRows((r) => r.filter((x) => x.id !== id));
  }

  async function uploadLogo(id: string, file: File) {
    try {
      const { url } = await uploadFile("media", file, "sponsor-");
      patch(id, { logo_url: url });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    }
  }

  async function saveAll() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    for (const r of rows) {
      const { error: e } = await supabase
        .from("sponsors")
        .update({ name: r.name, logo_url: r.logo_url, href: r.href, position: r.position })
        .eq("id", r.id);
      if (e) { setError(e.message); setSaving(false); return; }
    }
    setSuccess(true);
    setSaving(false);
  }

  return (
    <>
      <PageHeader title="Sponsors" sub="Empty list shows the 'Open for collaboration' placeholder." />
      {error && <Banner kind="error">{error}</Banner>}
      {success && <Banner kind="success">Saved.</Banner>}

      {loading ? <p className="text-zinc-500">Loading…</p> : (
        <div className="space-y-3 max-w-3xl">
          {rows.map((r) => (
            <div key={r.id} className="bg-zinc-950 border border-zinc-800 p-4 grid grid-cols-1 md:grid-cols-[1fr_2fr_2fr_auto] gap-3 items-center">
              <div className="flex items-center gap-2">
                {r.logo_url && (
                  <img src={r.logo_url} alt="" className="h-8 w-16 object-contain bg-zinc-900" />
                )}
                <label className="cursor-pointer text-zinc-500 hover:text-white">
                  <Upload size={14} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadLogo(r.id, f);
                    }}
                  />
                </label>
              </div>
              <Input placeholder="Name" value={r.name} onChange={(e) => patch(r.id, { name: e.target.value })} />
              <Input placeholder="Link (optional)" value={r.href ?? ""} onChange={(e) => patch(r.id, { href: e.target.value })} />
              <button onClick={() => remove(r.id)} type="button" className="text-zinc-600 hover:text-red-500 self-center"><Trash2 size={16} /></button>
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={add}><Plus size={14} /> Add sponsor</Button>
            <Button type="button" loading={saving} onClick={saveAll}><Save size={14} /> Save all</Button>
          </div>
        </div>
      )}
    </>
  );
}
