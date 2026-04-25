import { useEffect, useState } from "react";
import { Plus, Trash2, Save, Upload, Sparkles } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { Article } from "../../lib/database.types";
import { Banner, Button, Field, Input, PageHeader, Select, Textarea } from "./_formKit";
import { uploadFile } from "../../lib/uploadFile";

export default function EditArticles() {
  const [rows, setRows] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error: e } = await supabase.from("articles").select("*").order("position");
    if (e) setError(e.message);
    else setRows((data as Article[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  function patch(id: string, p: Partial<Article>) {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...p } : x)));
    setSuccess(false);
  }

  async function add() {
    const { data, error: e } = await supabase
      .from("articles")
      .insert({
        kind: "feature",
        title: "New article",
        excerpt: "",
        position: rows.length + 1,
      })
      .select().single();
    if (e) setError(e.message);
    else if (data) setRows((r) => [...r, data as Article]);
  }

  async function remove(id: string) {
    if (!confirm("Delete this article?")) return;
    const { error: e } = await supabase.from("articles").delete().eq("id", id);
    if (e) setError(e.message);
    else setRows((r) => r.filter((x) => x.id !== id));
  }

  async function uploadImage(id: string, file: File) {
    try {
      const { url } = await uploadFile("media", file, "article-");
      patch(id, { image_url: url });
    } catch (e) { setError(e instanceof Error ? e.message : "Upload failed"); }
  }

  // Auto-fill from URL via Vercel API
  async function autoFill(id: string, url: string) {
    if (!url) return;
    setPreviewLoading(id);
    setError(null);
    try {
      const r = await fetch(`/api/og-preview?url=${encodeURIComponent(url)}`);
      if (!r.ok) throw new Error("Could not fetch preview");
      const og = (await r.json()) as { title?: string; description?: string; image?: string };
      patch(id, {
        title: og.title || "",
        excerpt: og.description || "",
        image_url: og.image || null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setPreviewLoading(null);
    }
  }

  async function saveAll() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    for (const r of rows) {
      const { error: e } = await supabase
        .from("articles")
        .update({
          kind: r.kind,
          title: r.title,
          excerpt: r.excerpt,
          url: r.url,
          tag: r.tag,
          image_url: r.image_url,
          date: r.date,
          position: r.position,
        })
        .eq("id", r.id);
      if (e) { setError(e.message); setSaving(false); return; }
    }
    setSuccess(true);
    setSaving(false);
  }

  return (
    <>
      <PageHeader
        title="Articles"
        sub="Press, appearances, tweet quotes. Paste a URL and click ✨ to auto-fill the card."
      />
      {error && <Banner kind="error">{error}</Banner>}
      {success && <Banner kind="success">Saved.</Banner>}

      {loading ? <p className="text-zinc-500">Loading…</p> : (
        <div className="space-y-4 max-w-3xl">
          {rows.map((r) => (
            <div key={r.id} className="bg-zinc-950 border border-zinc-800 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
                  Article #{r.position}
                </span>
                <button type="button" onClick={() => remove(r.id)} className="text-zinc-600 hover:text-red-500"><Trash2 size={16} /></button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Style">
                  <Select value={r.kind} onChange={(e) => patch(r.id, { kind: e.target.value as Article["kind"] })}>
                    <option value="feature">Feature (full image card)</option>
                    <option value="tweet">Tweet (X-style)</option>
                    <option value="minimal">Minimal (text-only)</option>
                  </Select>
                </Field>
                <Field label="Tag (optional)">
                  <Input value={r.tag ?? ""} onChange={(e) => patch(r.id, { tag: e.target.value })} placeholder="Featured News" />
                </Field>
                <Field label="Date (optional)">
                  <Input value={r.date ?? ""} onChange={(e) => patch(r.id, { date: e.target.value })} placeholder="MAR 21, 2026" />
                </Field>
              </div>

              <Field label="URL" hint="Paste then click the sparkle to auto-fill title/excerpt/image.">
                <div className="flex gap-2">
                  <Input value={r.url ?? ""} onChange={(e) => patch(r.id, { url: e.target.value })} placeholder="https://example.com/article" />
                  <button
                    type="button"
                    onClick={() => autoFill(r.id, r.url ?? "")}
                    disabled={previewLoading === r.id}
                    className="px-4 border border-zinc-800 text-zinc-400 hover:bg-zinc-900 disabled:opacity-50"
                    title="Auto-fill from URL"
                  >
                    <Sparkles size={14} />
                  </button>
                </div>
              </Field>

              <Field label="Title">
                <Input value={r.title} onChange={(e) => patch(r.id, { title: e.target.value })} />
              </Field>
              <Field label="Excerpt">
                <Textarea value={r.excerpt ?? ""} onChange={(e) => patch(r.id, { excerpt: e.target.value })} rows={3} />
              </Field>
              {r.kind === "feature" && (
                <Field label="Cover image">
                  <div className="flex items-center gap-3">
                    {r.image_url && (
                      <img src={r.image_url} alt="" className="h-16 w-28 object-cover bg-zinc-900" />
                    )}
                    <label className="cursor-pointer inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 border border-zinc-800 px-3 py-2 hover:bg-zinc-900">
                      <Upload size={12} /> Upload
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void uploadImage(r.id, f);
                        }}
                      />
                    </label>
                    {r.image_url && (
                      <button type="button" onClick={() => patch(r.id, { image_url: null })} className="text-xs text-zinc-500 hover:text-red-500">
                        Remove
                      </button>
                    )}
                  </div>
                </Field>
              )}
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={add}><Plus size={14} /> Add article</Button>
            <Button type="button" loading={saving} onClick={saveAll}><Save size={14} /> Save all</Button>
          </div>
        </div>
      )}
    </>
  );
}
