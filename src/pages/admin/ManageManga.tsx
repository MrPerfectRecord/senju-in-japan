import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Eye, EyeOff, Lock, Unlock, Trash2, Edit3, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { MangaChapter } from "../../lib/database.types";
import { Banner, Button, Field, Input, PageHeader, Textarea } from "./_formKit";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "chapter";
}

export default function ManageManga() {
  const [rows, setRows] = useState<MangaChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPremium, setNewPremium] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error: e } = await supabase
      .from("manga_chapters")
      .select("*")
      .order("number");
    if (e) setError(e.message);
    else setRows((data as MangaChapter[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function createChapter(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    const number = (rows.reduce((m, r) => Math.max(m, r.number), 0) || 0) + 1;
    let slug = slugify(newTitle || `chapter-${number}`);
    // ensure unique slug
    while (rows.find((r) => r.slug === slug)) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 5)}`;
    }
    const { data, error: er } = await supabase
      .from("manga_chapters")
      .insert({
        number,
        title: newTitle || `Chapter ${number}`,
        slug,
        description: newDesc || null,
        is_premium: newPremium,
        is_published: false,
        position: rows.length + 1,
      })
      .select().single();
    setCreating(false);
    if (er) setError(er.message);
    else {
      setNewTitle("");
      setNewDesc("");
      setNewPremium(false);
      setShowNew(false);
      if (data) setRows((r) => [...r, data as MangaChapter]);
    }
  }

  async function togglePublished(c: MangaChapter) {
    const { error: e } = await supabase
      .from("manga_chapters")
      .update({ is_published: !c.is_published })
      .eq("id", c.id);
    if (e) setError(e.message);
    else void load();
  }
  async function togglePremium(c: MangaChapter) {
    const { error: e } = await supabase
      .from("manga_chapters")
      .update({ is_premium: !c.is_premium })
      .eq("id", c.id);
    if (e) setError(e.message);
    else void load();
  }

  async function remove(c: MangaChapter) {
    if (!confirm(`Delete chapter "${c.title}"? This also deletes all uploaded pages.`)) return;
    const { error: e } = await supabase.from("manga_chapters").delete().eq("id", c.id);
    if (e) setError(e.message);
    else setRows((r) => r.filter((x) => x.id !== c.id));
  }

  return (
    <>
      <PageHeader title="Manga" sub="Chapters, page uploads, free/premium toggle." />
      {error && <Banner kind="error">{error}</Banner>}

      <div className="mb-6">
        {showNew ? (
          <form onSubmit={createChapter} className="bg-zinc-950 border border-zinc-800 p-5 space-y-3 max-w-2xl">
            <Field label="Title">
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Chapter 1: The Awakening" required />
            </Field>
            <Field label="Description (optional)">
              <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={2} />
            </Field>
            <label className="flex items-center gap-2 text-sm text-zinc-400">
              <input type="checkbox" checked={newPremium} onChange={(e) => setNewPremium(e.target.checked)} />
              Premium (readers must sign in)
            </label>
            <div className="flex gap-2 pt-2">
              <Button type="submit" loading={creating}>Create chapter</Button>
              <Button type="button" variant="ghost" onClick={() => setShowNew(false)}>Cancel</Button>
            </div>
          </form>
        ) : (
          <Button onClick={() => setShowNew(true)}><Plus size={14} /> New chapter</Button>
        )}
      </div>

      {loading ? (
        <Loader2 className="animate-spin text-zinc-500" size={18} />
      ) : rows.length === 0 ? (
        <div className="text-zinc-500 text-sm">No chapters yet. Create your first one above.</div>
      ) : (
        <div className="space-y-3 max-w-3xl">
          {rows.map((c) => (
            <div key={c.id} className="bg-zinc-950 border border-zinc-800 p-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">
                    Ch {c.number}
                  </span>
                  <h3 className="text-base font-black truncate">{c.title}</h3>
                  {c.is_premium && (
                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 border border-amber-900 px-1.5 py-0.5">
                      Premium
                    </span>
                  )}
                  {!c.is_published && (
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 border border-zinc-800 px-1.5 py-0.5">
                      Draft
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-1 truncate">{c.description || "No description."}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => togglePremium(c)}
                  className="p-2 text-zinc-500 hover:text-amber-500"
                  title={c.is_premium ? "Make free" : "Make premium"}
                >
                  {c.is_premium ? <Lock size={14} /> : <Unlock size={14} />}
                </button>
                <button
                  onClick={() => togglePublished(c)}
                  className="p-2 text-zinc-500 hover:text-green-500"
                  title={c.is_published ? "Unpublish" : "Publish"}
                >
                  {c.is_published ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <Link
                  to={`/admin/manga/${c.id}`}
                  className="p-2 text-zinc-500 hover:text-white"
                  title="Edit pages"
                >
                  <Edit3 size={14} />
                </Link>
                <button
                  onClick={() => remove(c)}
                  className="p-2 text-zinc-500 hover:text-red-500"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
