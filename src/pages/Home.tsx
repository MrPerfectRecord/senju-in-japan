import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Youtube,
  Instagram,
  ExternalLink,
  Menu,
  X,
  MessageCircle,
  Users,
  ArrowUp,
  Music2,
  Mail,
  Sparkles,
  BookOpen,
  Lock,
  LogOut,
} from "lucide-react";
import { useSiteContent } from "../lib/useSiteContent";
import { useAuth, signOut } from "../lib/useAuth";
import { TweetEmbed, extractTweetId } from "../components/TweetEmbed";
import type {
  Article,
  MangaChapter,
  Social,
  StatCluster as StatClusterRow,
  StatSummary,
} from "../lib/database.types";

// X (formerly Twitter) brand mark — lucide doesn't ship this glyph, so we
// inline the official X logo path here.
const XIcon: React.FC<{ size?: number | string; className?: string }> = ({
  size = 24,
  className,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

type SocialIconComponent = React.ComponentType<{
  size?: number | string;
  className?: string;
}>;

const PLATFORM_META: Record<string, { Icon: SocialIconComponent; hoverBg: string }> = {
  youtube:   { Icon: Youtube,       hoverBg: "hover:bg-[#FF0000]" },
  twitter:   { Icon: XIcon,         hoverBg: "hover:bg-white hover:text-black" },
  instagram: { Icon: Instagram,     hoverBg: "hover:bg-[#E4405F]" },
  discord:   { Icon: MessageCircle, hoverBg: "hover:bg-[#5865F2]" },
  tiktok:    { Icon: Music2,        hoverBg: "hover:bg-white hover:text-black" },
};

function getPlatformMeta(platform: string) {
  return PLATFORM_META[platform] ?? { Icon: ExternalLink, hoverBg: "hover:bg-zinc-700" };
}

/** Hook: returns true once the element scrolls into view. */
function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15, ...options }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

function smoothScrollTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------
const Navbar: React.FC<{ creatorName: string }> = ({ creatorName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const navLink = (id: string, label: string) => (
    <button
      onClick={() => {
        smoothScrollTo(id);
        setIsOpen(false);
      }}
      className="text-xs font-black text-white hover:text-red-500 transition-colors uppercase tracking-widest"
    >
      {label}
    </button>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-nav border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <button
            onClick={() => smoothScrollTo("home")}
            className="flex-shrink-0 flex items-center"
          >
            <span className="text-xl font-black tracking-tighter text-white uppercase italic">
              {creatorName}
            </span>
          </button>

          <div className="hidden md:flex items-center space-x-8">
            {navLink("home", "Home")}
            {navLink("analytics", "Analytics")}
            <Link
              to="/manga"
              className="text-xs font-black text-white hover:text-red-500 transition-colors uppercase tracking-widest"
            >
              Manga
            </Link>
            {navLink("press", "Press")}
            {navLink("inquiries", "Inquiries")}
            {user ? (
              <button
                onClick={() => signOut()}
                className="text-xs font-black text-zinc-500 hover:text-white transition-colors uppercase tracking-widest"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            ) : null}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden bg-black py-4 px-6 space-y-4 border-t border-zinc-800 flex flex-col items-start">
          {navLink("home", "Home")}
          {navLink("analytics", "Analytics")}
          <Link to="/manga" onClick={() => setIsOpen(false)} className="text-xs font-black text-white uppercase tracking-widest">
            Manga
          </Link>
          {navLink("press", "Press")}
          {navLink("inquiries", "Inquiries")}
        </div>
      )}
    </nav>
  );
};

// ---------------------------------------------------------------------------
// Tagline marquee
// ---------------------------------------------------------------------------
const TaglineMarquee: React.FC<{ tagline: string }> = ({ tagline }) => {
  const segments = tagline.split("|").map((s) => s.trim()).filter(Boolean);

  const Block: React.FC = () => (
    <div
      aria-hidden="true"
      className="flex items-center shrink-0 text-sm md:text-lg font-bold text-white tracking-[0.3em] md:tracking-[0.4em] uppercase"
    >
      {segments.map((seg, i) => (
        <React.Fragment key={i}>
          <span className="px-6">{seg}</span>
          <span className="text-red-600">|</span>
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="flex items-center justify-center gap-4 w-full max-w-4xl mx-auto px-4">
      <span className="w-12 h-[2px] bg-red-600 flex-shrink-0 hidden sm:block" />
      <div className="overflow-hidden flex-1 marquee-mask opacity-90" role="marquee" aria-label={tagline}>
        <div className="marquee-track">
          <Block />
          <Block />
        </div>
      </div>
      <span className="w-12 h-[2px] bg-red-600 flex-shrink-0 hidden sm:block" />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------
const Hero: React.FC<{
  creatorName: string;
  tagline: string;
  heroBackground: string;
  socials: Social[];
}> = ({ creatorName, tagline, heroBackground, socials }) => {
  const words = creatorName.trim().split(/\s+/);
  const renderName = () => {
    if (words.length === 3) {
      return (
        <>
          {words[0].toUpperCase()}
          <span className="text-red-600 italic">{words[1].toUpperCase()}</span>
          {words[2].toUpperCase()}
        </>
      );
    }
    return creatorName.toUpperCase();
  };

  return (
    <section
      id="home"
      className="relative h-screen min-h-[600px] flex flex-col items-center justify-center text-center px-4 overflow-hidden"
    >
      <div className="absolute inset-0 bg-black">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBackground})` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black" />
      </div>

      <div className="relative z-10 space-y-6 mt-32 max-w-5xl">
        <h1 className="text-6xl md:text-9xl font-black tracking-tighter text-white uppercase drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]">
          {renderName()}
        </h1>
        <TaglineMarquee tagline={tagline} />

        <div className="flex flex-wrap justify-center gap-4 pt-12">
          {socials.map(({ id, platform, url, label }) => {
            const { Icon, hoverBg } = getPlatformMeta(platform);
            return (
              <a
                key={id}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className={`w-12 h-12 md:w-14 md:h-14 rounded-full bg-zinc-900/80 backdrop-blur-md flex items-center justify-center text-white cursor-pointer hover:scale-110 transition-all duration-300 shadow-xl border border-zinc-800 ${hoverBg}`}
              >
                <Icon size={24} />
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// StatCluster
// ---------------------------------------------------------------------------
const StatClusterDial: React.FC<{ cluster: StatClusterRow; delay?: number }> = ({
  cluster,
  delay = 0,
}) => {
  const { ref, inView } = useInView<HTMLDivElement>();
  const isYoutube = cluster.platform === "youtube";
  const platformStyle = isYoutube
    ? { border: "border-[#FF0000]", color: "text-[#FF0000]" }
    : { border: "border-white", color: "text-white" };
  const PlatformIcon = isYoutube ? Youtube : XIcon;

  const positions = [
    "top-0 left-0",
    "top-0 right-0",
    "bottom-0 left-0",
    "bottom-0 right-0",
  ];

  return (
    <div
      ref={ref}
      className={`relative w-80 h-80 flex items-center justify-center scale-90 md:scale-100 transition-all duration-1000 ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div
        className={`platform-center w-24 h-24 flex items-center justify-center text-white border-2 ${platformStyle.border}`}
      >
        <PlatformIcon size={40} className={platformStyle.color} />
      </div>

      {cluster.stats.slice(0, 4).map((stat, i) => (
        <div
          key={stat.label + i}
          className={`absolute ${positions[i]} w-32 h-32 stat-bubble border border-zinc-100/10 transition-all duration-700`}
          style={{
            transitionDelay: `${delay + 200 + i * 120}ms`,
            transform: inView ? "scale(1)" : "scale(0.6)",
            opacity: inView ? 1 : 0,
          }}
        >
          <span className="text-2xl font-black">{stat.value}</span>
          <span className="text-[10px] uppercase font-bold text-zinc-600 text-center px-2">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------
const Analytics: React.FC<{
  characterImage: string;
  creatorName: string;
  clusters: StatClusterRow[];
  summary: StatSummary[];
  asOfLabel: string | null;
}> = ({ characterImage, creatorName, clusters, summary, asOfLabel }) => {
  const { ref: headerRef, inView: headerIn } = useInView<HTMLDivElement>();

  return (
    <section id="analytics" className="py-24 bg-black relative scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={headerRef}
          className={`transition-all duration-700 ${
            headerIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <h2 className="text-5xl md:text-7xl font-black text-white mb-20 tracking-tighter uppercase italic">
            Analytics<span className="text-red-600">.</span>
          </h2>
        </div>

        <div className="flex justify-center mb-24 md:mb-32 relative">
          <div className="absolute -z-10 w-[500px] h-[500px] bg-red-600/10 blur-[120px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="w-64 md:w-80 h-[360px] md:h-[450px] bg-zinc-900 overflow-hidden relative border-4 border-zinc-800 shadow-[20px_20px_0px_0px_rgba(220,38,38,0.3)]">
            <img
              src={characterImage}
              alt={`${creatorName} character artwork`}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-around gap-16 md:gap-20 mb-24 md:mb-32 flex-wrap">
          {clusters.map((c, i) => (
            <StatClusterDial key={c.id} cluster={c} delay={i * 200} />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-center border-t border-zinc-900 pt-16 max-w-4xl mx-auto">
          {summary.map((row, i) => (
            <SummaryCard key={row.id} row={row} delay={i * 150} />
          ))}
        </div>

        {asOfLabel && (
          <p className="mt-16 md:mt-20 text-center text-zinc-600 font-black text-[10px] tracking-[0.3em] uppercase">
            {asOfLabel}
          </p>
        )}
      </div>
    </section>
  );
};

const SummaryCard: React.FC<{ row: StatSummary; delay: number }> = ({ row, delay }) => {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`space-y-2 transition-all duration-700 ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <h3 className="text-5xl font-black italic">
        {row.metric}{" "}
        <span className="text-red-600 not-italic text-2xl">{row.metric_label.toUpperCase()}</span>
      </h3>
      <div className="flex items-center justify-center gap-2 text-zinc-400 font-bold tracking-widest text-xs uppercase">
        {row.platform}
        <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
        <Users size={12} className="text-red-500" /> {row.audience} {row.audience_label}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Manga teaser (links into the full /manga page)
// ---------------------------------------------------------------------------
const MangaTeaser: React.FC<{ chapters: MangaChapter[] }> = ({ chapters }) => {
  if (chapters.length === 0) {
    return (
      <section id="manga-teaser" className="py-24 bg-zinc-950 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tighter uppercase italic">
            Manga<span className="text-red-600">.</span>
          </h2>
          <p className="text-zinc-500 mt-6 max-w-xl mx-auto">
            Chapters coming soon. Check back to read original work.
          </p>
        </div>
      </section>
    );
  }
  const featured = chapters.slice(0, 3);
  return (
    <section id="manga-teaser" className="py-24 bg-zinc-950 border-t border-zinc-900">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic">
            Manga<span className="text-red-600">.</span>
          </h2>
          <Link
            to="/manga"
            className="text-xs font-black uppercase tracking-[0.3em] text-white hover:text-red-500 inline-flex items-center gap-2"
          >
            View all chapters <ExternalLink size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((c) => (
            <Link
              key={c.id}
              to={`/manga/${c.slug}`}
              className="group bg-zinc-900 border border-zinc-800 hover:border-red-600 transition-colors block"
            >
              <div className="aspect-[3/4] bg-zinc-800 overflow-hidden relative">
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
                {c.description && (
                  <p className="text-zinc-500 text-sm mt-2 line-clamp-2">{c.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// Sponsors
// ---------------------------------------------------------------------------
const Sponsors: React.FC<{
  sponsors: Array<{ id: string; name: string; logo_url: string; href: string | null }>;
  contactEmail: string;
}> = ({ sponsors, contactEmail }) => {
  const { ref, inView } = useInView<HTMLDivElement>();
  const hasSponsors = sponsors.length > 0;

  return (
    <section className="py-24 bg-zinc-950 border-t border-zinc-900">
      <div className="max-w-7xl mx-auto px-4">
        <div
          ref={ref}
          className={`transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h2 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">
            Sponsors <span className="text-zinc-700">/</span> Partners
          </h2>
          <div className="w-12 h-[3px] bg-red-600 mb-12" />

          {hasSponsors ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-8 items-center justify-items-center opacity-60 hover:opacity-100 transition-all duration-500">
              {sponsors.map((s) =>
                s.href ? (
                  <a key={s.id} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.name}>
                    <img
                      src={s.logo_url}
                      alt={s.name}
                      loading="lazy"
                      className="h-8 object-contain grayscale hover:grayscale-0 transition"
                    />
                  </a>
                ) : (
                  <img
                    key={s.id}
                    src={s.logo_url}
                    alt={s.name}
                    loading="lazy"
                    className="h-8 object-contain grayscale hover:grayscale-0 transition"
                  />
                )
              )}
            </div>
          ) : (
            <ComingSoon
              kind="Partnerships"
              line1="Open for collaboration."
              line2="Brands & creators — reach out below."
              ctaHref={`mailto:${contactEmail}?subject=${encodeURIComponent("Partnership Inquiry")}`}
              ctaLabel="Pitch a partnership"
            />
          )}
        </div>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------
const Articles: React.FC<{ articles: Article[]; characterImage: string; creatorName: string; handle: string }> = ({
  articles,
  characterImage,
  creatorName,
  handle,
}) => {
  const hasArticles = articles.length > 0;
  return (
    <section id="press" className="py-24 bg-black scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-5xl font-black text-white mb-4 tracking-tighter uppercase italic">
          Articles<span className="text-red-600">/</span>Appearances
        </h2>
        <div className="w-12 h-[3px] bg-red-600 mb-16" />
        {hasArticles ? (
          <div className="masonry-grid">
            {articles.map((a, i) => (
              <ArticleCard
                key={a.id}
                article={a}
                index={i}
                characterImage={characterImage}
                creatorName={creatorName}
                handle={handle}
              />
            ))}
          </div>
        ) : (
          <ComingSoon
            kind="Press & Appearances"
            line1="Coming soon."
            line2="Interviews, features, and collabs — curated here as they drop."
          />
        )}
      </div>
    </section>
  );
};

const ArticleCard: React.FC<{
  article: Article;
  index: number;
  characterImage: string;
  creatorName: string;
  handle: string;
}> = ({ article, index, characterImage, creatorName, handle }) => {
  const { ref, inView } = useInView<HTMLDivElement>();
  const baseTransition = `transition-all duration-700 ${
    inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
  }`;
  const styleDelay = { transitionDelay: `${index * 100}ms` };

  if (article.kind === "feature") {
    const content = (
      <div
        ref={ref}
        style={styleDelay}
        className={`group bg-zinc-900 border border-zinc-800 flex flex-col hover:border-red-600 transition-colors cursor-pointer h-full ${baseTransition}`}
      >
        <div className="h-56 bg-zinc-800 flex items-center justify-center relative overflow-hidden">
          {article.image_url ? (
            <img
              src={article.image_url}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <span className="text-zinc-600 font-bold uppercase tracking-widest text-xs">
              {article.tag || "Featured"}
            </span>
          )}
          <div className="absolute inset-0 bg-red-600 opacity-0 group-hover:opacity-10 transition-opacity" />
        </div>
        <div className="p-8">
          {article.tag && (
            <span className="inline-block mb-3 text-[10px] font-black uppercase tracking-widest text-red-500">
              {article.tag}
            </span>
          )}
          <h3 className="text-xl font-black mb-4 group-hover:text-red-500 transition-colors uppercase flex items-start gap-2">
            {article.title}
            {article.url && <ExternalLink size={16} className="mt-1 flex-shrink-0 opacity-60" />}
          </h3>
          {article.excerpt && (
            <p className="text-zinc-400 text-sm leading-relaxed">{article.excerpt}</p>
          )}
          {article.date && (
            <p className="mt-6 text-zinc-600 text-[10px] font-black uppercase tracking-widest">
              {article.date}
            </p>
          )}
        </div>
      </div>
    );
    return article.url ? (
      <a href={article.url} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    ) : (
      content
    );
  }

  if (article.kind === "tweet") {
    // If the URL is a real X/Twitter post, embed it live via the platform widget.
    // Otherwise, fall back to the stylized quote card (backwards-compat).
    const tweetId = article.url ? extractTweetId(article.url) : null;

    if (tweetId && article.url) {
      return (
        <div
          ref={ref}
          style={styleDelay}
          className={`bg-black border border-zinc-800 p-3 flex flex-col items-center ${baseTransition}`}
        >
          <TweetEmbed url={article.url} />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        style={styleDelay}
        className={`bg-black border border-zinc-800 p-6 flex flex-col gap-4 relative overflow-hidden ${baseTransition}`}
      >
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <XIcon size={80} />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-700 rounded-full overflow-hidden">
            <img src={characterImage} alt="Profile" loading="lazy" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-sm font-black flex items-center gap-1">
              {creatorName.split(" ")[0]}
              <XIcon size={12} className="text-white" />
            </p>
            <p className="text-xs text-zinc-500 font-bold">@{handle}</p>
          </div>
        </div>
        {article.excerpt && (
          <p className="text-sm font-medium leading-relaxed">{article.excerpt}</p>
        )}
        {article.date && (
          <div className="flex justify-between items-center text-zinc-600 text-[10px] font-black uppercase mt-2 pt-4 border-t border-zinc-900">
            <p>{article.date}</p>
          </div>
        )}
      </div>
    );
  }

  // minimal
  const content = (
    <div
      ref={ref}
      style={styleDelay}
      className={`bg-zinc-900 border border-zinc-800 p-8 hover:border-red-600 transition-colors cursor-pointer h-full ${baseTransition}`}
    >
      <div className="w-12 h-[2px] bg-red-600 mb-6"></div>
      <h3 className="text-2xl font-black mb-4 uppercase italic">{article.title}</h3>
      {article.excerpt && (
        <p className="text-zinc-400 text-sm leading-relaxed">{article.excerpt}</p>
      )}
    </div>
  );
  return article.url ? (
    <a href={article.url} target="_blank" rel="noopener noreferrer">
      {content}
    </a>
  ) : (
    content
  );
};

// ---------------------------------------------------------------------------
// ComingSoon (reusable empty-state)
// ---------------------------------------------------------------------------
const ComingSoon: React.FC<{
  kind: string;
  line1: string;
  line2: string;
  ctaLabel?: string;
  ctaHref?: string;
}> = ({ kind, line1, line2, ctaLabel, ctaHref }) => {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`relative border border-dashed border-zinc-800 py-20 px-8 text-center overflow-hidden transition-all duration-700 ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 via-transparent to-transparent pointer-events-none" />
      <Sparkles size={32} className="mx-auto text-red-600 mb-6" />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500 mb-4">{kind}</p>
      <h3 className="text-3xl md:text-4xl font-black uppercase italic tracking-tight mb-2">
        {line1}
      </h3>
      <p className="text-zinc-500 font-medium max-w-xl mx-auto">{line2}</p>
      {ctaHref && ctaLabel && (
        <a
          href={ctaHref}
          className="mt-8 inline-block px-10 py-4 bg-white text-black text-[11px] font-black uppercase tracking-[0.3em] hover:bg-red-600 hover:text-white transition-all duration-300"
        >
          {ctaLabel}
        </a>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Inquiries
// ---------------------------------------------------------------------------
const Inquiries: React.FC<{
  headline: string;
  accentWords: string[];
  body: string;
  ctaLabel: string;
  emailSubject: string;
  contactEmail: string;
  image: string | null;
  imageBadge: string | null;
}> = ({ headline, accentWords, body, ctaLabel, emailSubject, contactEmail, image, imageBadge }) => {
  const { ref, inView } = useInView<HTMLDivElement>();

  const renderHeadline = () => {
    let parts: (string | React.ReactNode)[] = [headline];
    accentWords.forEach((word, idx) => {
      parts = parts.flatMap((p, i) => {
        if (typeof p !== "string") return p;
        const segments = p.split(new RegExp(`(${word})`, "i"));
        return segments.map((s, j) =>
          s.toLowerCase() === word.toLowerCase() ? (
            <span key={`${idx}-${i}-${j}`} className="text-red-600">
              {s}
            </span>
          ) : (
            s
          )
        );
      });
    });
    return parts;
  };

  const mailto = `mailto:${contactEmail}?subject=${encodeURIComponent(emailSubject)}`;

  return (
    <section
      id="inquiries"
      className="py-24 md:py-32 bg-zinc-950 border-t border-zinc-900 scroll-mt-16"
    >
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-5xl md:text-8xl font-black text-white mb-16 md:mb-20 tracking-tighter uppercase italic">
          Inquiries<span className="text-red-600">.</span>
        </h2>
        <div
          ref={ref}
          className={`flex flex-col lg:flex-row items-center gap-12 md:gap-20 transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {image && (
            <div className="w-full lg:w-1/2 aspect-square bg-zinc-900 overflow-hidden relative group border border-zinc-800">
              <img
                src={image}
                alt={imageBadge ?? ""}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
              {imageBadge && (
                <div className="absolute bottom-8 left-8">
                  <div className="px-6 py-2 bg-red-600 text-white font-black text-xs uppercase tracking-[0.2em]">
                    {imageBadge}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={`w-full ${image ? "lg:w-1/2" : ""} space-y-8 md:space-y-10`}>
            <p className="text-2xl md:text-3xl text-zinc-300 leading-tight font-black uppercase tracking-tight italic">
              {renderHeadline()}
            </p>
            <p className="text-zinc-500 font-medium leading-relaxed">{body}</p>
            <a
              href={mailto}
              className="inline-flex items-center gap-3 px-12 py-5 bg-white text-black text-xs font-black uppercase tracking-[0.3em] hover:bg-red-600 hover:text-white transition-all duration-300 shadow-[10px_10px_0px_0px_rgba(255,255,255,0.1)]"
            >
              <Mail size={16} />
              {ctaLabel}
            </a>
            <p className="text-xs text-zinc-600 font-bold tracking-widest uppercase">
              or email direct:{" "}
              <a
                href={`mailto:${contactEmail}`}
                className="text-zinc-300 hover:text-red-500 transition-colors normal-case tracking-normal"
              >
                {contactEmail}
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
const Footer: React.FC<{ creatorName: string; copyrightStartYear: number; socials: Social[] }> = ({
  creatorName,
  copyrightStartYear,
  socials,
}) => {
  const year = new Date().getFullYear();
  const yearLabel = year > copyrightStartYear ? `${copyrightStartYear}–${year}` : `${year}`;

  return (
    <footer className="py-20 bg-black text-center border-t border-zinc-900">
      <div className="mb-10 flex justify-center gap-8 text-zinc-600 flex-wrap px-4">
        {socials.map(({ id, platform, url, label }) => {
          const { Icon } = getPlatformMeta(platform);
          return (
            <a
              key={id}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              title={label}
              className="hover:text-red-500 transition-colors"
            >
              <Icon size={20} />
            </a>
          );
        })}
      </div>
      <p className="text-[10px] text-zinc-700 uppercase font-black tracking-[0.5em] px-4">
        © {yearLabel} {creatorName.toUpperCase().replace(/\s+/g, "")}{" "}
        <span className="text-red-600">/</span> ALL RIGHTS RESERVED
      </p>
    </footer>
  );
};

// ---------------------------------------------------------------------------
// ScrollToTop
// ---------------------------------------------------------------------------
const ScrollToTop: React.FC = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <button
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-6 right-6 z-40 w-12 h-12 bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition-all duration-300 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <ArrowUp size={20} />
    </button>
  );
};

// ---------------------------------------------------------------------------
// Page root
// ---------------------------------------------------------------------------
export default function Home() {
  const { content, loading } = useSiteContent();

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-zinc-500 text-xs uppercase tracking-[0.4em] font-black">Loading…</div>
      </div>
    );
  }

  const { config, socials, statClusters, statSummary, sponsors, articles, mangaChapters } = content;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-600 selection:text-white">
      <Navbar creatorName={config.creator_name} />
      <Hero
        creatorName={config.creator_name}
        tagline={config.tagline}
        heroBackground={config.hero_background}
        socials={socials}
      />
      <Analytics
        characterImage={config.character_image}
        creatorName={config.creator_name}
        clusters={statClusters}
        summary={statSummary}
        asOfLabel={config.analytics_as_of_label}
      />
      <MangaTeaser chapters={mangaChapters} />
      <Sponsors sponsors={sponsors} contactEmail={config.contact_email} />
      <Articles
        articles={articles}
        characterImage={config.character_image}
        creatorName={config.creator_name}
        handle={config.handle}
      />
      <Inquiries
        headline={config.inquiry_headline}
        accentWords={config.inquiry_accent_words}
        body={config.inquiry_body}
        ctaLabel={config.inquiry_cta_label}
        emailSubject={config.inquiry_cta_email_subject}
        contactEmail={config.contact_email}
        image={config.inquiry_image}
        imageBadge={config.inquiry_image_badge}
      />
      <Footer
        creatorName={config.creator_name}
        copyrightStartYear={config.copyright_start_year}
        socials={socials}
      />
      <ScrollToTop />
    </div>
  );
}
