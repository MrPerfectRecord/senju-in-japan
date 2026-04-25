import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/useAuth";
import type { MangaChapter, MangaPage } from "../lib/database.types";

export default function MangaReader() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [chapter, setChapter] = useState<MangaChapter | null>(null);
  const [pages, setPages] = useState<MangaPage[]>([]);
  const [allChapters, setAllChapters] = useState<MangaChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [premiumGate, setPremiumGate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || authLoading) return;
    let active = true;
    void (async () => {
      setLoading(true);
      setPremiumGate(false);
      setError(null);

      const { data: c, error: e1 } = await supabase
        .from("manga_chapters")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (!active) return;

      if (e1) {
        setError(e1.message);
        setLoading(false);
        return;
      }
      if (!c) {
        // Either doesn't exist OR row hidden by RLS (premium and user not logged in)
        // Try detecting via direct sign-in check
        if (!user) setPremiumGate(true);
        else setError("Chapter not found.");
        setLoading(false);
        return;
      }
      const chapterRow = c as MangaChapter;
      setChapter(chapterRow);

      if (chapterRow.is_premium && !user) {
        setPremiumGate(true);
        setLoading(false);
        return;
      }

      const [pagesRes, listRes] = await Promise.all([
        supabase
          .from("manga_pages")
          .select("*")
          .eq("chapter_id", chapterRow.id)
          .order("page_number"),
        supabase
          .from("manga_chapters")
          .select("*")
          .eq("is_published", true)
          .order("number"),
      ]);
      if (!active) return;
      if (pagesRes.error) setError(pagesRes.error.message);
      else setPages((pagesRes.data as MangaPage[]) ?? []);
      if (!listRes.error) setAllChapters((listRes.data as MangaChapter[]) ?? []);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [slug, user, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin text-red-600" size={32} />
      </div>
    );
  }

  if (premiumGate) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-zinc-950 border border-zinc-800 p-8 md:p-10 text-center">
          <Lock className="mx-auto text-red-600 mb-6" size={28} />
          <h1 className="text-2xl font-black uppercase mb-2">Premium chapter</h1>
          <p className="text-zinc-500 mb-8">
            Sign in (or create a free account) to keep reading.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => navigate(`/signup?redirect=/manga/${slug}`)}
              className="w-full bg-red-600 hover:bg-red-500 text-white py-4 text-xs font-black uppercase tracking-[0.3em] transition"
            >
              Create free account
            </button>
            <button
              onClick={() => navigate(`/login?redirect=/manga/${slug}`)}
              className="w-full border border-zinc-800 hover:bg-zinc-900 text-white py-4 text-xs font-black uppercase tracking-[0.3em] transition"
            >
              Sign in
            </button>
          </div>
          <Link to="/manga" className="block mt-6 text-xs text-zinc-500 hover:text-white uppercase tracking-widest">
            <ArrowLeft size={12} className="inline mr-1" /> Back to chapters
          </Link>
        </div>
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-zinc-500 mb-4">{error || "Chapter not found."}</p>
          <Link to="/manga" className="text-red-500 hover:text-red-400 text-sm font-black uppercase tracking-widest">
            Back to chapters
          </Link>
        </div>
      </div>
    );
  }

  const idx = allChapters.findIndex((c) => c.id === chapter.id);
  const prev = idx > 0 ? allChapters[idx - 1] : null;
  const next = idx >= 0 && idx < allChapters.length - 1 ? allChapters[idx + 1] : null;

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-30 bg-black/90 backdrop-blur border-b border-zinc-900 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <Link to="/manga" className="text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white inline-flex items-center gap-2">
            <ArrowLeft size={14} /> Chapters
          </Link>
          <div className="text-center min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">
              Chapter {chapter.number}
            </p>
            <h1 className="text-sm font-black uppercase truncate">{chapter.title}</h1>
          </div>
          <div className="text-[10px] text-zinc-600 uppercase tracking-widest min-w-[60px] text-right">
            {pages.length} pages
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto">
        {pages.length === 0 ? (
          <p className="text-zinc-500 text-center py-24">No pages uploaded yet.</p>
        ) : (
          <div className="flex flex-col">
            {pages.map((p) => (
              <img
                key={p.id}
                src={p.image_url}
                alt={`Page ${p.page_number}`}
                loading="lazy"
                className="w-full block bg-zinc-950"
              />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-900 px-4 py-12 mt-12">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-4 items-center justify-between">
          {prev ? (
            <Link to={`/manga/${prev.slug}`} className="text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-red-500 inline-flex items-center gap-2">
              <ArrowLeft size={14} /> Ch {prev.number}: {prev.title}
            </Link>
          ) : <span />}
          {next ? (
            <Link to={`/manga/${next.slug}`} className="text-xs font-black uppercase tracking-widest text-white hover:text-red-500 inline-flex items-center gap-2">
              Ch {next.number}: {next.title} <ArrowRight size={14} />
            </Link>
          ) : <span className="text-xs text-zinc-600 uppercase tracking-widest">End of latest chapter</span>}
        </div>
      </footer>
    </div>
  );
}
