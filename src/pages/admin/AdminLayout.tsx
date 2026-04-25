import { useEffect } from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  Share2,
  BarChart3,
  Building2,
  Newspaper,
  Briefcase,
  Image as ImageIcon,
  BookOpen,
  Users,
  LogOut,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useAuth, signOut } from "../../lib/useAuth";
import { supabaseConfigured } from "../../lib/supabase";

const NAV = [
  { to: "/admin",          label: "Dashboard",  icon: LayoutDashboard, end: true },
  { to: "/admin/creator",  label: "Creator",    icon: User },
  { to: "/admin/socials",  label: "Socials",    icon: Share2 },
  { to: "/admin/stats",    label: "Stats",      icon: BarChart3 },
  { to: "/admin/sponsors", label: "Sponsors",   icon: Building2 },
  { to: "/admin/articles", label: "Articles",   icon: Newspaper },
  { to: "/admin/inquiries",label: "Inquiries",  icon: Briefcase },
  { to: "/admin/media",    label: "Media",      icon: ImageIcon },
  { to: "/admin/manga",    label: "Manga",      icon: BookOpen },
  { to: "/admin/users",    label: "Users",      icon: Users },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { isAdmin, loading, user, profile } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/admin/login", { replace: true });
      return;
    }
    if (!isAdmin) {
      navigate("/", { replace: true });
    }
  }, [loading, user, isAdmin, navigate]);

  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="max-w-lg text-center">
          <h1 className="text-2xl font-black uppercase mb-4">Supabase not configured</h1>
          <p className="text-zinc-400 mb-6">
            Add <code className="text-red-500">VITE_SUPABASE_URL</code> and{" "}
            <code className="text-red-500">VITE_SUPABASE_ANON_KEY</code> to{" "}
            <code className="text-red-500">.env.local</code> (and to your Vercel project's
            environment variables) to enable the admin panel.
          </p>
          <Link to="/" className="text-red-500 hover:text-red-400 text-sm font-black uppercase tracking-widest">
            Back to site
          </Link>
        </div>
      </div>
    );
  }

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin text-red-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-zinc-900 bg-zinc-950">
        <Link to="/" className="px-6 py-6 border-b border-zinc-900 hover:bg-zinc-900 transition">
          <div className="text-sm font-black uppercase tracking-tighter italic">Senju in Japan</div>
          <div className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1">Admin Panel</div>
        </Link>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-xs font-black uppercase tracking-widest transition ${
                  isActive
                    ? "bg-red-600 text-white"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                }`
              }
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-zinc-900 p-4 space-y-2">
          <Link
            to="/"
            target="_blank"
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white"
          >
            <ExternalLink size={12} /> View site
          </Link>
          <div className="text-[10px] text-zinc-700 uppercase tracking-widest truncate">
            {profile?.display_name ?? user?.email}
          </div>
          <button
            onClick={async () => {
              await signOut();
              navigate("/admin/login");
            }}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-red-500"
          >
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-zinc-950 border-b border-zinc-900 px-4 py-3 flex justify-between items-center">
        <Link to="/admin" className="text-sm font-black uppercase italic">SIJ Admin</Link>
        <button
          onClick={async () => {
            await signOut();
            navigate("/admin/login");
          }}
          className="text-zinc-500 hover:text-red-500"
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* Main */}
      <main className="flex-1 min-w-0 md:pt-0 pt-14">
        {/* Mobile horizontal nav */}
        <div className="md:hidden bg-zinc-950 border-b border-zinc-900 overflow-x-auto">
          <div className="flex gap-1 px-2 py-2 min-w-max">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest transition whitespace-nowrap ${
                    isActive
                      ? "bg-red-600 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`
                }
              >
                <Icon size={12} />
                {label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="px-6 md:px-10 py-8 md:py-12 max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
