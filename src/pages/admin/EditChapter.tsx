import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { Save, ArrowLeft, Trash2, Loader2, Upload, FileText, Image as ImageIcon, GripVertical } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { MangaChapter, MangaPage } from "../../lib/database.types";
import { Banner, Button, Field, Input, PageHeader, Textarea } from "./_formKit";
import { uploadFile } from "../../lib/uploadFile";

export default function EditChapter() {
  const { id } = useParams<{ id: string }>();
  const [chapter, setChapter] = useState<MangaChapter | null>(null);
  const [pages, setPages] = useState<MangaPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError(null);
    const [c, p] = await Promise.all([
      supabase.from("manga_chapters").select("*").eq("id", id).single(),
      supabase.from("manga_pages").select("*").eq("chapter_id", id).order("page_number"),
    ]);
    if (c.error) setError(c.error.message);
    else setChapter(c.data as MangaChapter);
    if (p.error) setError(p.error.message);
    else setPages((p.data as MangaPage[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, [id]);

  function patch(p: Partial<MangaChapter>) {
    setChapter((c) => (c ? { ...c, ...p } : c));
    setSuccess(false);
  }

  async function saveMeta(e: React.FormEvent) {
    e.preventDefault();
    if (!chapter) return;
    setSaving(true);
    setError(null);
    const { error: er } = await supabase
      .from("manga_chapters")
      .update({
        number: chapter.number,
        title: chapter.title,
        slug: chapter.slug,
        description: chapter.description,
        cover_image: chapter.cover_image,
        is_premium: chapter.is_premium,
        is_published: chapter.is_published,
      })
      .eq("id", chapter.id);
    if (er) setError(er.message);
    else setSuccess(true);
    setSaving(false);
  }

  async function uploadCover(file: File) {
    if (!chapter) return;
    try {
      const { url } = await uploadFile("media", file, "cover-");
      patch({ cover_image: url });
    } catch (e) { setError(e instanceof Error ? e.message : "Upload failed"); }
  }

  // Multi-image drop
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [], "application/pdf": [] },
    multiple: true,
    onDrop: async (files) => {
      if (!chapter || files.length === 0) return;
      setError(null);
      setProgress({ done: 0, total: 0 });

      // Separate images vs PDFs
      const imgs = files.filter((f) => f.type.startsWith("image/"));
      const pdfs = files.filter((f) => f.type === "application/pdf");

      // Sort images by filename so "page-001.jpg" lands in order
      imgs.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

      // Extract pages from each PDF using pdfjs
      const pdfPages: Array<{ blob: Blob; name: string }> = [];
      if (pdfs.length > 0) {
        const pdfjs: any = await import("pdfjs-dist");
        // Set worker URL — pdfjs needs this. Using the CDN version matched to the lib.
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        for (const pdf of pdfs) {
          const buf = await pdf.arrayBuffer();
          const doc = await pdfjs.getDocument({ data: buf }).promise;
          for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);
            const viewport = page.getViewport({ scale: 2 });
            const canvas = document.createElement("canvas");
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) continue;
            await page.render({ canvasContext: ctx, viewport, canvas }).promise;
            const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.92));
            if (blob) pdfPages.push({ blob, name: `${pdf.name}-page-${String(i).padStart(3, "0")}.jpg` });
          }
        }
      }

      const total = imgs.length + pdfPages.length;
      setProgress({ done: 0, total });
      let nextNum = pages.reduce((m, p) => Math.max(m, p.page_number), 0) + 1;
      const newPages: MangaPage[] = [];

      for (const f of imgs) {
        try {
          const { url } = await uploadFile("manga", f, `${chapter.id}/`);
          const { data, error: e } = await supabase
            .from("manga_pages")
            .insert({ chapter_id: chapter.id, page_number: nextNum, image_url: url })
            .select().single();
          if (e) throw e;
          if (data) newPages.push(data as MangaPage);
          nextNum++;
        } catch (e) {
          setError(e instanceof Error ? e.message : "Upload failed");
        }
        setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
      }

      for (const p of pdfPages) {
        try {
          const file = new File([p.blob], p.name, { type: "image/jpeg" });
          const { url } = await uploadFile("manga", file, `${chapter.id}/`);
          const { data, error: e } = await supabase
            .from("manga_pages")
            .insert({ chapter_id: chapter.id, page_number: nextNum, image_url: url })
            .select().single();
          if (e) throw e;
          if (data) newPages.push(data as MangaPage);
          nextNum++;
        } catch (e) {
          setError(e instanceof Error ? e.message : "Upload failed");
        }
        setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
      }

      setPages((cur) => [...cur, ...newPages].sort((a, b) => a.page_number - b.page_number));
      setProgress(null);
    },
  });

  async function removePage(p: MangaPage) {
    if (!confirm(`Remove page ${p.page_number}?`)) return;
    const { error: e } = await supabase.from("manga_pages").delete().eq("id", p.id);
    if (e) { setError(e.message); return; }
    setPages((arr) => arr.filter((x) => x.id !== p.id));
  }

  async function reorderPage(p: MangaPage, dir: -1 | 1) {
    const sorted = [...pages].sort((a, b) => a.page_number - b.page_number);
    const i = sorted.findIndex((x) => x.id === p.id);
    const j = i + dir;
    if (j < 0 || j >= sorted.length) return;
    // Three-step swap to avoid the unique(chapter_id, page_number) collision
    const a = sorted[i];
    const b = sorted[j];
    const tempNum = -1 * Math.floor(Math.random() * 1_000_000) - 1;
    const r1 = await supabase.from("manga_pages").update({ page_number: tempNum }).eq("id", a.id);
    if (r1.error) { setError(r1.error.message); return; }
    const r2 = await supabase.from("manga_pages").update({ page_number: a.page_number }).eq("id", b.id);
    if (r2.error) { setError(r2.error.message); return; }
    const r3 = await supabase.from("manga_pages").update({ page_number: b.page_number }).eq("id", a.id);
    if (r3.error) { setError(r3.error.message); return; }
    void load();
  }

  if (loading || !chapter) return <PageHeader title="Chapter" sub="Loading…" />;

  return (
    <>
      <Link to="/admin/manga" className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-white mb-4 uppercase tracking-widest">
        <ArrowLeft size={14} /> Back to chapters
      </Link>
      <PageHeader title={chapter.title} sub={`Chapter ${chapter.number}`} />

      {error && <Banner kind="error">{error}</Banner>}
      {success && <Banner kind="success">Saved.</Banner>}

      <form onSubmit={saveMeta} className="bg-zinc-950 border border-zinc-800 p-5 mb-10 max-w-2xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Number">
            <Input type="number" value={chapter.number} onChange={(e) => patch({ number: parseInt(e.target.value, 10) })} />
          </Field>
          <Field label="Slug" hint="URL: /manga/[slug]">
            <Input value={chapter.slug} onChange={(e) => patch({ slug: e.target.value })} />
          </Field>
          <Field label="Cover image">
            <div className="flex items-center gap-2">
              {chapter.cover_image && <img src={chapter.cover_image} alt="" className="h-10 w-10 object-cover bg-zinc-900" />}
              <label className="cursor-pointer text-zinc-400 hover:text-white border border-zinc-800 px-3 py-2 text-[10px] font-black uppercase tracking-widest">
                <Upload size={12} className="inline mr-1" /> Pick
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadCover(f); }} />
              </label>
            </div>
          </Field>
        </div>
        <Field label="Title"><Input value={chapter.title} onChange={(e) => patch({ title: e.target.value })} /></Field>
        <Field label="Description"><Textarea value={chapter.description ?? ""} onChange={(e) => patch({ description: e.target.value })} rows={2} /></Field>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <input type="checkbox" checked={chapter.is_premium} onChange={(e) => patch({ is_premium: e.target.checked })} />
            Premium (sign-in required)
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <input type="checkbox" checked={chapter.is_published} onChange={(e) => patch({ is_published: e.target.checked })} />
            Published (visible on /manga)
          </label>
        </div>
        <Button type="submit" loading={saving}><Save size={14} /> Save chapter info</Button>
      </form>

      <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-4">
        Pages ({pages.length})
      </h2>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed p-10 text-center cursor-pointer transition mb-6 ${
          isDragActive ? "border-red-600 bg-red-950/20" : "border-zinc-800 hover:border-zinc-700"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex items-center justify-center gap-3 text-zinc-500 mb-3">
          <ImageIcon size={20} />
          <FileText size={20} />
        </div>
        {isDragActive ? (
          <p className="text-red-500 font-black uppercase tracking-widest text-sm">Drop to upload</p>
        ) : (
          <>
            <p className="text-sm font-black uppercase tracking-widest text-zinc-300">
              Drop images or PDFs here
            </p>
            <p className="text-xs text-zinc-500 mt-2">
              Multiple files OK · PDFs auto-extracted into pages · Filename order respected
            </p>
          </>
        )}
        {progress && (
          <p className="text-xs text-zinc-400 mt-4">
            Uploading {progress.done} / {progress.total}…
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {pages.map((p, i) => (
          <div key={p.id} className="bg-zinc-950 border border-zinc-800 group relative">
            <div className="aspect-[3/4] overflow-hidden">
              <img src={p.image_url} alt={`Page ${p.page_number}`} className="w-full h-full object-cover" />
            </div>
            <div className="px-2 py-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
              <span>P {p.page_number}</span>
              <div className="flex gap-1">
                <button type="button" disabled={i === 0} onClick={() => reorderPage(p, -1)} className="hover:text-white disabled:opacity-30">↑</button>
                <button type="button" disabled={i === pages.length - 1} onClick={() => reorderPage(p, 1)} className="hover:text-white disabled:opacity-30">↓</button>
                <button type="button" onClick={() => removePage(p)} className="hover:text-red-500"><Trash2 size={10} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
