import React, { useEffect, useRef, useState } from "react";
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
} from "lucide-react";

// X (formerly Twitter) brand mark — lucide doesn't ship this glyph, so we
// inline the official X logo path here. Same prop shape as a lucide icon.
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
import {
  creator,
  socials,
  analytics,
  sponsors,
  articles,
  inquiries,
  type SocialPlatform,
} from "./siteData";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Per-platform icon + hover color used in the hero and footer.
 *  Type is permissive so both Lucide icons and our inline XIcon satisfy it. */
type SocialIconComponent = React.ComponentType<{
  size?: number | string;
  className?: string;
}>;
const PLATFORM_META: Record<
  SocialPlatform,
  { Icon: SocialIconComponent; hoverBg: string }
> = {
  youtube:   { Icon: Youtube,        hoverBg: "hover:bg-[#FF0000]" },
  twitter:   { Icon: XIcon,          hoverBg: "hover:bg-white hover:text-black" },
  instagram: { Icon: Instagram,      hoverBg: "hover:bg-[#E4405F]" },
  discord:   { Icon: MessageCircle,  hoverBg: "hover:bg-[#5865F2]" },
  tiktok:    { Icon: Music2,         hoverBg: "hover:bg-white hover:text-black" },
};

/** Small hook: returns true once the element has scrolled into view. */
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

/** Smoothly scroll to an in-page anchor. */
function smoothScrollTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------
const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

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
              {creator.name}
            </span>
          </button>

          <div className="hidden md:flex items-center space-x-8">
            {navLink("home", "Home")}
            {navLink("analytics", "Analytics")}
            {navLink("press", "Press")}
            {navLink("inquiries", "Inquiries")}
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
          {navLink("press", "Press")}
          {navLink("inquiries", "Inquiries")}
        </div>
      )}
    </nav>
  );
};

// ---------------------------------------------------------------------------
// Tagline marquee — continuously scrolls the tagline right-to-left,
// bounded by the two red horizontal lines. Pauses on hover.
// ---------------------------------------------------------------------------
const TaglineMarquee: React.FC<{ tagline: string }> = ({ tagline }) => {
  const segments = tagline
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

  // Render `|` after EVERY segment (including the last) so the loop seam
  // between the two duplicated blocks reads as just another `|`.
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
      <div
        className="overflow-hidden flex-1 marquee-mask opacity-90"
        role="marquee"
        aria-label={tagline}
      >
        <div className="marquee-track">
          {/* Two identical copies side-by-side for a seamless loop */}
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
const Hero: React.FC = () => {
  // Pre-split the creator name for the red accent middle word if present.
  // "Senju in Japan" -> "SENJU" + "IN" + "JAPAN"
  const words = creator.name.trim().split(/\s+/);
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
    return creator.name.toUpperCase();
  };

  return (
    <section
      id="home"
      className="relative h-screen min-h-[600px] flex flex-col items-center justify-center text-center px-4 overflow-hidden"
    >
      {/* Background scenery */}
      <div className="absolute inset-0 bg-black">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${creator.heroBackground})` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black" />
      </div>

      <div className="relative z-10 space-y-6 mt-32 max-w-5xl">
        <h1 className="text-6xl md:text-9xl font-black tracking-tighter text-white uppercase drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]">
          {renderName()}
        </h1>
        <TaglineMarquee tagline={creator.tagline} />

        <div className="flex flex-wrap justify-center gap-4 pt-12">
          {socials.map(({ id, label, url }) => {
            const { Icon, hoverBg } = PLATFORM_META[id];
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
// StatCluster — the four bubbles around a platform icon
// ---------------------------------------------------------------------------
type Cluster = {
  platform: "youtube" | "twitter";
  stats: { label: string; value: string }[];
};

const StatCluster: React.FC<{ cluster: Cluster; delay?: number }> = ({
  cluster,
  delay = 0,
}) => {
  const { ref, inView } = useInView<HTMLDivElement>();
  const platformStyle =
    cluster.platform === "youtube"
      ? { border: "border-[#FF0000]", color: "text-[#FF0000]" }
      : { border: "border-white", color: "text-white" };
  const PlatformIcon = cluster.platform === "youtube" ? Youtube : XIcon;

  // Four corner positions for the bubbles
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

      {cluster.stats.map((stat, i) => (
        <div
          key={stat.label}
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
const Analytics: React.FC = () => {
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

        {/* Character portrait with red glow */}
        <div className="flex justify-center mb-24 md:mb-32 relative">
          <div className="absolute -z-10 w-[500px] h-[500px] bg-red-600/10 blur-[120px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="w-64 md:w-80 h-[360px] md:h-[450px] bg-zinc-900 overflow-hidden relative border-4 border-zinc-800 shadow-[20px_20px_0px_0px_rgba(220,38,38,0.3)]">
            <img
              src={creator.characterImage}
              alt={`${creator.name} character artwork`}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Stat dials */}
        <div className="flex flex-col lg:flex-row items-center justify-around gap-16 md:gap-20 mb-24 md:mb-32">
          <StatCluster cluster={analytics.youtubeCluster} />
          <StatCluster cluster={analytics.twitterCluster} delay={200} />
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-center border-t border-zinc-900 pt-16 max-w-4xl mx-auto">
          {analytics.summaryRow.map((row, i) => (
            <SummaryCard key={row.platform} row={row} delay={i * 150} />
          ))}
        </div>

        <p className="mt-16 md:mt-20 text-center text-zinc-600 font-black text-[10px] tracking-[0.3em] uppercase">
          {analytics.asOfLabel}
        </p>
      </div>
    </section>
  );
};

const SummaryCard: React.FC<{
  row: (typeof analytics.summaryRow)[number];
  delay: number;
}> = ({ row, delay }) => {
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
        <span className="text-red-600 not-italic text-2xl">
          {row.metricLabel.toUpperCase()}
        </span>
      </h3>
      <div className="flex items-center justify-center gap-2 text-zinc-400 font-bold tracking-widest text-xs uppercase">
        {row.platform}
        <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
        <Users size={12} className="text-red-500" /> {row.audience} {row.audienceLabel}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sponsors
// ---------------------------------------------------------------------------
const Sponsors: React.FC = () => {
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
                  <a
                    key={s.name}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.name}
                  >
                    <img
                      src={s.logoUrl}
                      alt={s.name}
                      loading="lazy"
                      className="h-8 object-contain grayscale hover:grayscale-0 transition"
                    />
                  </a>
                ) : (
                  <img
                    key={s.name}
                    src={s.logoUrl}
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
              ctaHref={`mailto:${creator.contactEmail}?subject=${encodeURIComponent(
                "Partnership Inquiry"
              )}`}
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
const Articles: React.FC = () => {
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
              <ArticleCard key={`${a.title}-${i}`} article={a} index={i} />
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
  article: import("./siteData").Article;
  index: number;
}> = ({ article, index }) => {
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
          {article.imageUrl ? (
            <img
              src={article.imageUrl}
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
            {article.url && (
              <ExternalLink size={16} className="mt-1 flex-shrink-0 opacity-60" />
            )}
          </h3>
          <p className="text-zinc-400 text-sm leading-relaxed">{article.excerpt}</p>
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
            <img
              src={creator.characterImage}
              alt="Profile"
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-sm font-black flex items-center gap-1">
              {creator.name.split(" ")[0]}
              <XIcon size={12} className="text-white" />
            </p>
            <p className="text-xs text-zinc-500 font-bold">@{creator.handle}</p>
          </div>
        </div>
        <p className="text-sm font-medium leading-relaxed">{article.excerpt}</p>
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
      <p className="text-zinc-400 text-sm leading-relaxed">{article.excerpt}</p>
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
// Shared "Coming Soon" block for empty sections
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
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500 mb-4">
        {kind}
      </p>
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
const Inquiries: React.FC = () => {
  const { ref, inView } = useInView<HTMLDivElement>();

  // Highlight accent words in the headline
  const renderHeadline = () => {
    let parts: (string | JSX.Element)[] = [inquiries.headline];
    inquiries.accentWords.forEach((word, idx) => {
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

  const mailto = `mailto:${creator.contactEmail}?subject=${encodeURIComponent(
    inquiries.ctaEmailSubject
  )}`;

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
          <div className="w-full lg:w-1/2 aspect-square bg-zinc-900 overflow-hidden relative group border border-zinc-800">
            <img
              src={inquiries.image}
              alt={inquiries.imageBadge}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
            <div className="absolute bottom-8 left-8">
              <div className="px-6 py-2 bg-red-600 text-white font-black text-xs uppercase tracking-[0.2em]">
                {inquiries.imageBadge}
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2 space-y-8 md:space-y-10">
            <p className="text-2xl md:text-3xl text-zinc-300 leading-tight font-black uppercase tracking-tight italic">
              {renderHeadline()}
            </p>
            <p className="text-zinc-500 font-medium leading-relaxed">
              {inquiries.body}
            </p>
            <a
              href={mailto}
              className="inline-flex items-center gap-3 px-12 py-5 bg-white text-black text-xs font-black uppercase tracking-[0.3em] hover:bg-red-600 hover:text-white transition-all duration-300 shadow-[10px_10px_0px_0px_rgba(255,255,255,0.1)]"
            >
              <Mail size={16} />
              {inquiries.ctaLabel}
            </a>
            <p className="text-xs text-zinc-600 font-bold tracking-widest uppercase">
              or email direct:{" "}
              <a
                href={`mailto:${creator.contactEmail}`}
                className="text-zinc-300 hover:text-red-500 transition-colors normal-case tracking-normal"
              >
                {creator.contactEmail}
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
const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  const yearLabel =
    year > creator.copyrightStartYear
      ? `${creator.copyrightStartYear}–${year}`
      : `${year}`;

  return (
    <footer className="py-20 bg-black text-center border-t border-zinc-900">
      <div className="mb-10 flex justify-center gap-8 text-zinc-600 flex-wrap px-4">
        {socials.map(({ id, label, url }) => {
          const { Icon } = PLATFORM_META[id];
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
        © {yearLabel} {creator.name.toUpperCase().replace(/\s+/g, "")}{" "}
        <span className="text-red-600">/</span> ALL RIGHTS RESERVED
      </p>
    </footer>
  );
};

// ---------------------------------------------------------------------------
// ScrollToTop floating button
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
// App root
// ---------------------------------------------------------------------------
export default function App() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-600 selection:text-white">
      <Navbar />
      <Hero />
      <Analytics />
      <Sponsors />
      <Articles />
      <Inquiries />
      <Footer />
      <ScrollToTop />
    </div>
  );
}
