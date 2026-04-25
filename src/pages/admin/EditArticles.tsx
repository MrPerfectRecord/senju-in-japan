import { useEffect, useState } from "react";
import { Plus, Trash2, Save, Upload, Sparkles, Loader2, Twitter } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { Article } from "../../lib/database.types";
import { Banner, Button, Field, Input, PageHeader, Select, Textarea } from "./_formKit";
import { uploadFile } from "../../lib/uploadFile";
import { TweetEmbed, extractTweetId } from "../../components/TweetEmbed";

export default function EditArticles() {
  const [rows, setRows] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

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
    setError(null);
    setUploadingId(id);
    try {
      // Basic client-side validation
      if (!file.type.startsWith("image/")) {
        throw new Error(`Not an image file: ${file.type || "unknown type"}`);
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("Image too large — max 10MB.");
      }
      const { url } = await uploadFile("media", file, "article-");
      patch(id, { image_url: url });
      // Auto-save so the upload sticks even if the user forgets to click Save All
      const { error: saveErr } = await supabase
        .from("articles")
        .update({ image_url: url })
        .eq("id", id);
      if (saveErr) throw saveErr;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      console.error("[uploadImage]", e);
      setError(`Image upload failed: ${msg}`);
    } finally {
      setUploadingId(null);
    }
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
        sub="Press, appearances, X posts. Paste a URL and click ✨ to auto-fill — paste an X post URL with style set to 'Tweet' to embed the real post."
      />
      {error && <Banner kind="error">{error}</Banner>}
      {success && <Banner kind="success">Saved.</Banner>}

      {loading ? <p className="text-zinc-500">Loading…</p> : (
        <div className="space-y-4 max-w-3xl">
          {rows.map((r) => {
            const tweetId = r.kind === "tweet" && r.url ? extractTweetId(r.url) : null;
            return (
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
                      <option value="tweet">Tweet / X post (live embed)</option>
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

                {/* Tweet-specific UX */}
                {r.kind === "tweet" ? (
                  <>
                    <Field
                      label="X / Twitter post URL"
                      hint="Paste the full URL of a tweet, e.g. https://x.com/username/status/1234567890"
                    >
                      <Input
                        value={r.url ?? ""}
                        onChange={(e) => patch(r.id, { url: e.target.value })}
                        placeholder="https://x.com/…/status/…"
                      />
                    </Field>
                    {tweetId ? (
                      <div className="bg-black border border-zinc-900 p-3 rounded">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-2 flex items-center gap-2">
                          <Twitter size={10} /> Preview
                        </p>
                        <TweetEmbed url={r.url!} />
                      </div>
                    ) : r.url ? (
                      <p className="text-xs text-amber-500">
                        Doesn't look like a tweet URL. Must match x.com/USER/status/ID or twitter.com/USER/status/ID.
                      </p>
                    ) : null}
                  </>
                ) : (
                  <>
                    <Field label="URL" hint="Paste then click the sparkle to auto-fill title/excerpt/image.">
                      <div className="flex gap-2">
                        <Input value={r.url ?? ""} onChange={(e) => patch(r.id, { url: e.target.value })} placeholder="https://example.com/article" />
                        <button
                          type="button"
                          onClick={() => autoFill(r.id, r.url ?? "")}
                          disabled={previewLoading === r.id}
                          className="px-4 border border-zinc-800 text-zinc-400 hover:bg-zinc-900 disabled:opacity-50 flex items-center"
                          title="Auto-fill from URL"
                        >
                          {previewLoading === r.id ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
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
                        <div className="flex items-center gap-3 flex-wrap">
                          {r.image_url && (
                            <img
                              src={r.image_url}
                              alt=""
                              className="h-20 w-32 object-cover bg-zinc-900 border border-zinc-800"
                            />
                          )}
                          <label className={`cursor-pointer inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border px-3 py-2 transition ${
                            uploadingId === r.id
                              ? "border-red-600 text-red-400"
                              : "border-zinc-800 text-zinc-400 hover:bg-zinc-900"
                          }`}>
                            {uploadingId === r.id ? (
                              <>
                                <Loader2 size={12} className="animate-spin" /> Uploading…
                              </>
                            ) : (
                              <>
                                <Upload size={12} /> {r.image_url ? "Replace image" : "Upload image"}
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingId === r.id}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) void uploadImage(r.id, f);
                                // Reset so selecting the same file again re-triggers upload
                                e.target.value = "";
                              }}
                            />
                          </label>
                          {r.image_url && uploadingId !== r.id && (
                            <button
                              type="button"
                              onClick={() => patch(r.id, { image_url: null })}
                              className="text-xs text-zinc-500 hover:text-red-500"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </Field>
                    )}
                  </>
                )}
              </div>
            );
          })}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={add}><Plus size={14} /> Add article</Button>
            <Button type="button" loading={saving} onClick={saveAll}><Save size={14} /> Save all</Button>
          </div>
        </div>
      )}
    </>
  );
}
