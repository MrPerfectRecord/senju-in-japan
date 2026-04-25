// ============================================================================
// SITE DATA — The one place to edit the content on your site.
// Change anything in this file and save; the site updates automatically.
// ============================================================================

export const creator = {
  /** Display name used in the navbar and footer */
  name: "Senju in Japan",
  /** Short handle shown inline with stats / tweets (no @) */
  handle: "Senju_in_Japan",
  /** Tagline that appears under the hero headline (split by `|` for the marquee). */
  tagline:
    "Streamer | Creator | Entertainer | Live Commentary Host | Internet Personality | Influencer | Community Builder",
  /** Contact email — used by the Inquiries CTA */
  contactEmail: "Senjureviews@gmail.com",
  /** Path to the character artwork (used in the Analytics portrait).
   *  A stylized placeholder lives at public/character.svg.
   *  To use your real art: drop your file into `public/` (e.g. character.jpg)
   *  and change this path to "/character.jpg". */
  characterImage: "/character.svg",
  /** Path to the hero section's full-bleed background image.
   *  Defaults to an anime-style Japan landscape (Mt. Fuji, torii, sakura).
   *  Replace by dropping a new image into `public/` and updating this path. */
  heroBackground: "/hero-bg.svg",
  /** Displayed in the footer */
  copyrightStartYear: 2026,
} as const;

// ---------------------------------------------------------------------------
// SOCIAL LINKS
// Order here determines the order icons appear in the hero row and footer.
// To remove a platform, comment the line out. To add one, follow the pattern.
// ---------------------------------------------------------------------------
export type SocialPlatform =
  | "youtube"
  | "twitter"
  | "instagram"
  | "discord"
  | "tiktok";

export const socials: Array<{
  id: SocialPlatform;
  label: string;
  url: string;
}> = [
  { id: "youtube",   label: "YouTube",   url: "https://www.youtube.com/@SenjuinJapan" },
  { id: "twitter",   label: "Twitter",   url: "https://x.com/Senju_in_Japan" },
  { id: "instagram", label: "Instagram", url: "https://www.instagram.com/senju_in_japan/" },
  { id: "discord",   label: "Discord",   url: "https://discord.gg/NHveAPQY4j" },
  { id: "tiktok",    label: "TikTok",    url: "https://www.tiktok.com/@senjuinjapan" },
];

// ---------------------------------------------------------------------------
// ANALYTICS / STATS
// Update these numbers whenever you want the site to reflect current metrics.
// The two `cluster` objects render as circular stat dials in the hero-analytics
// section. The `summaryRow` renders as the three big number cards underneath.
// ---------------------------------------------------------------------------
export const analytics = {
  /** Timestamp label shown under the stat grid — change whenever you refresh numbers */
  asOfLabel: "Stats as of April 2026",

  /** The circular stat dial for YouTube */
  youtubeCluster: {
    platform: "youtube" as const,
    stats: [
      { label: "Subscribers",  value: "28.7K" },
      { label: "Total Views",  value: "9.9M"  },
      { label: "Videos",       value: "—"     },
      { label: "Avg. Views",   value: "—"     },
    ],
  },

  /** The circular stat dial for Twitter / X */
  twitterCluster: {
    platform: "twitter" as const,
    stats: [
      { label: "Followers",     value: "10.7K" },
      { label: "Tweets",        value: "9,846" },
      { label: "Impressions",   value: "—"     },
      { label: "Profile Visits",value: "—"     },
    ],
  },

  /** Bottom summary row — one card per platform where you have real numbers */
  summaryRow: [
    { platform: "YouTube",   metric: "9.9M",  metricLabel: "Total Views",   audience: "28.7K", audienceLabel: "Subs" },
    { platform: "Twitter/X", metric: "10.7K", metricLabel: "Followers",     audience: "9,846", audienceLabel: "Tweets" },
  ],
};

// ---------------------------------------------------------------------------
// SPONSORS / PARTNERS
// Leave `sponsors` as an empty array to show the "Partnerships — Open for
// collaboration" coming-soon placeholder. Populate it when you sign partners.
// ---------------------------------------------------------------------------
export const sponsors: Array<{ name: string; logoUrl: string; href?: string }> = [
  // Example once you have a partner:
  // { name: "Elgato", logoUrl: "https://.../elgato.svg", href: "https://elgato.com" },
];

// ---------------------------------------------------------------------------
// ARTICLES / PRESS APPEARANCES
// Leave `articles` empty to show a "Press & Appearances — Coming Soon" block.
// Add entries in this shape to populate the masonry grid.
// ---------------------------------------------------------------------------
export type Article = {
  title: string;
  excerpt: string;
  /** "feature" = full-image card | "tweet" = stylized twitter quote | "minimal" = text-only */
  kind: "feature" | "tweet" | "minimal";
  url?: string;
  tag?: string;       // e.g. "Press Release", "Featured News"
  imageUrl?: string;  // used when kind === "feature"
  date?: string;      // free text, e.g. "MAR 21, 2026"
};

export const articles: Article[] = [
  // Example feature card:
  // {
  //   kind: "feature",
  //   tag: "Featured News",
  //   title: "Your press title here",
  //   excerpt: "Short description of the piece.",
  //   url: "https://example.com/article",
  //   imageUrl: "https://example.com/cover.jpg",
  // },
];

// ---------------------------------------------------------------------------
// INQUIRIES / SERVICES
// What you offer beyond streaming (PC builds, consultations, etc.).
// ---------------------------------------------------------------------------
export const inquiries = {
  headline: `"Need a new rig? Introduction to PC building? I offer custom advice for high-performance setups."`,
  accentWords: ["PC building"], // words in the headline that will be highlighted red
  body:
    "I have built many PCs and offer dedicated component advice to those looking for it. Whether it's for streaming, gaming, or content creation, I can help you find the perfect balance of parts.",
  ctaLabel: "Get in touch",
  /** The CTA button will open a mailto: with this subject prefilled */
  ctaEmailSubject: "PC Build Inquiry",
  /** Side image displayed next to the pitch */
  image: "https://images.unsplash.com/photo-1587202377405-836165970a6a?auto=format&fit=crop&q=80&w=1200",
  imageBadge: "Hardware Expert",
};
