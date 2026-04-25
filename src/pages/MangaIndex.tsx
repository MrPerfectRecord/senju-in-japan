import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Lock } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { MangaChapter } from "../lib/database.types";

export default function MangaIndex() {
  const [chapters, setChapters] = useState<MangaChapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("manga_chapters")
        .select("*")
        .eq("is_published", true)
        .order("number");
      setChapters((data as MangaChapter[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-900 px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white inline-flex items-center gap-2">
            <ArrowLeft size={14} /> Back to site
          </Link>
          <span className="text-sm font-black uppercase italic tracking-tighter">Manga</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-2">
          Read the manga<span className="text-red-600">.</span>
        </h1>
        <p className="text-zinc-500 mb-12">Chapters listed here.</p>

        {loading ? (
          <p className="text-zinc-500">Loading…</p>
        ) : chapters.length === 0 ? (
          <div className="border border-dashed border-zinc-800 p-12 text-center">
            <BookOpen size={32} className="mx-auto text-zinc-600 mb-4" />
            <p className="text-zinc-500">No chapters published yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {chapters.map((c) => (
              <Link
                key={c.id}
                to={`/manga/${c.slug}`}
                className="group bg-zinc-950 border border-zinc-800 hover:border-red-600 transition-colors block"
              >
                <div className="aspect-[3/4] bg-zinc-900 overflow-hidden relative">
                  {c.cover_image ? (
                    <img
                      src={c.cover_image}
                      alt={c.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen size={48} className="text-zinc-700" />
                    </div>
                  )}
                  {c.is_premium && (
                    <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 flex items-center gap-1">
                      <Lock size={10} /> Premium
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-500">
                    Chapter {c.number}
                  </span>
                  <h3 className="text-lg font-black mt-2 uppercase group-hover:text-red-500 transition-colors">
                    {c.title}
                  </h3>
                  {c.description && <p className="text-zinc-500 text-sm mt-2 line-clamp-3">{c.description}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
