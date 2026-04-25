import { useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "./supabase";
import type {
  Article,
  MangaChapter,
  SiteConfig,
  Social,
  Sponsor,
  StatCluster,
  StatSummary,
} from "./database.types";
import * as fallback from "../siteData";

export interface SiteContent {
  config: SiteConfig;
  socials: Social[];
  statClusters: StatCluster[];
  statSummary: StatSummary[];
  sponsors: Sponsor[];
  articles: Article[];
  mangaChapters: MangaChapter[];
}

/** Build a SiteContent object from the static siteData.ts as a fallback. */
function buildFallback(): SiteContent {
  const fakeId = (n: number) => `fallback-${n}`;
  return {
    config: {
      id: 1,
      creator_name: fallback.creator.name,
      handle: fallback.creator.handle,
      tagline: fallback.creator.tagline,
      contact_email: fallback.creator.contactEmail,
      character_image: fallback.creator.characterImage,
      hero_background: fallback.creator.heroBackground,
      copyright_start_year: fallback.creator.copyrightStartYear,
      inquiry_headline: fallback.inquiries.headline,
      inquiry_accent_words: [...fallback.inquiries.accentWords],
      inquiry_body: fallback.inquiries.body,
      inquiry_cta_label: fallback.inquiries.ctaLabel,
      inquiry_cta_email_subject: fallback.inquiries.ctaEmailSubject,
      inquiry_image: fallback.inquiries.image,
      inquiry_image_badge: fallback.inquiries.imageBadge,
      analytics_as_of_label: fallback.analytics.asOfLabel,
      updated_at: new Date().toISOString(),
    },
    socials: fallback.socials.map((s, i) => ({
      id: fakeId(i),
      platform: s.id,
      label: s.label,
      url: s.url,
      position: i,
      created_at: "",
    })),
    statClusters: [
      {
        id: fakeId(0),
        platform: "youtube",
        position: 1,
        stats: fallback.analytics.youtubeCluster.stats.map((s) => ({ ...s })),
        created_at: "",
      },
      {
        id: fakeId(1),
        platform: "twitter",
        position: 2,
        stats: fallback.analytics.twitterCluster.stats.map((s) => ({ ...s })),
        created_at: "",
      },
    ],
    statSummary: fallback.analytics.summaryRow.map((row, i) => ({
      id: fakeId(i),
      platform: row.platform,
      metric: row.metric,
      metric_label: row.metricLabel,
      audience: row.audience,
      audience_label: row.audienceLabel,
      position: i,
      created_at: "",
    })),
    sponsors: [],
    articles: [],
    mangaChapters: [],
  };
}

export function useSiteContent() {
  const [content, setContent] = useState<SiteContent>(() => buildFallback());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!supabaseConfigured) {
      setContent(buildFallback());
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [
        configRes,
        socialsRes,
        clustersRes,
        summaryRes,
        sponsorsRes,
        articlesRes,
        chaptersRes,
      ] = await Promise.all([
        supabase.from("site_config").select("*").eq("id", 1).maybeSingle(),
        supabase.from("socials").select("*").order("position"),
        supabase.from("stat_clusters").select("*").order("position"),
        supabase.from("stat_summary").select("*").order("position"),
        supabase.from("sponsors").select("*").order("position"),
        supabase.from("articles").select("*").order("position"),
        supabase
          .from("manga_chapters")
          .select("*")
          .eq("is_published", true)
          .order("number"),
      ]);

      if (configRes.error) throw configRes.error;
      if (socialsRes.error) throw socialsRes.error;
      if (clustersRes.error) throw clustersRes.error;
      if (summaryRes.error) throw summaryRes.error;
      if (sponsorsRes.error) throw sponsorsRes.error;
      if (articlesRes.error) throw articlesRes.error;
      if (chaptersRes.error) throw chaptersRes.error;

      // If config row doesn't exist yet, fall back to seed data
      const config = (configRes.data as SiteConfig | null) ?? buildFallback().config;

      setContent({
        config,
        socials: (socialsRes.data as Social[]) ?? [],
        statClusters: (clustersRes.data as StatCluster[]) ?? [],
        statSummary: (summaryRes.data as StatSummary[]) ?? [],
        sponsors: (sponsorsRes.data as Sponsor[]) ?? [],
        articles: (articlesRes.data as Article[]) ?? [],
        mangaChapters: (chaptersRes.data as MangaChapter[]) ?? [],
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load content";
      setError(msg);
      // eslint-disable-next-line no-console
      console.error("[useSiteContent]", msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return { content, loading, error, refresh };
}
