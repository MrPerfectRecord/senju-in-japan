import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Image, Newspaper, Users, BarChart3 } from "lucide-react";

const TILES = [
  { to: "/admin/creator",  title: "Creator info",   sub: "Name, tagline, contact email",  icon: Users },
  { to: "/admin/media",    title: "Hero & images",  sub: "Background, character art, inquiries photo", icon: Image },
  { to: "/admin/stats",    title: "Analytics",      sub: "YouTube and X stat clusters",   icon: BarChart3 },
  { to: "/admin/articles", title: "Articles",       sub: "Press, appearances, tweets",    icon: Newspaper },
  { to: "/admin/manga",    title: "Manga",          sub: "Chapters, pages, free/premium", icon: BookOpen },
];

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic mb-2">
        Dashboard<span className="text-red-600">.</span>
      </h1>
      <p className="text-zinc-500 mb-10 text-sm">
        Edit any section. Changes go live the moment you save.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TILES.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to}
              className="group bg-zinc-950 border border-zinc-800 hover:border-red-600 p-6 transition flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-4 min-w-0">
                <div className="w-10 h-10 bg-zinc-900 flex items-center justify-center text-red-600 flex-shrink-0">
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-black uppercase tracking-widest group-hover:text-red-500 transition">
                    {t.title}
                  </h2>
                  <p className="text-zinc-500 text-sm mt-1 truncate">{t.sub}</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-zinc-600 group-hover:text-red-500 mt-2 flex-shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
