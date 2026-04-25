// Type definitions matching the Supabase schema (supabase/schema.sql).
// These are hand-written rather than generated, so if you change the schema,
// update this file to match.

export type UserRole = "reader" | "admin";

export interface Profile {
  id: string;
  display_name: string | null;
  role: UserRole;
  created_at: string;
}

export interface SiteConfig {
  id: number;
  creator_name: string;
  handle: string;
  tagline: string;
  contact_email: string;
  character_image: string;
  hero_background: string;
  copyright_start_year: number;

  inquiry_headline: string;
  inquiry_accent_words: string[];
  inquiry_body: string;
  inquiry_cta_label: string;
  inquiry_cta_email_subject: string;
  inquiry_image: string | null;
  inquiry_image_badge: string | null;

  analytics_as_of_label: string | null;

  updated_at: string;
}

export interface Social {
  id: string;
  platform: string;
  label: string;
  url: string;
  position: number;
  created_at: string;
}

export interface StatCluster {
  id: string;
  platform: string;
  position: number;
  stats: Array<{ label: string; value: string }>;
  created_at: string;
}

export interface StatSummary {
  id: string;
  platform: string;
  metric: string;
  metric_label: string;
  audience: string | null;
  audience_label: string | null;
  position: number;
  created_at: string;
}

export interface Sponsor {
  id: string;
  name: string;
  logo_url: string;
  href: string | null;
  position: number;
  created_at: string;
}

export interface Article {
  id: string;
  kind: "feature" | "tweet" | "minimal";
  title: string;
  excerpt: string | null;
  url: string | null;
  tag: string | null;
  image_url: string | null;
  date: string | null;
  position: number;
  created_at: string;
}

export interface MangaChapter {
  id: string;
  number: number;
  title: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  is_premium: boolean;
  is_published: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface MangaPage {
  id: string;
  chapter_id: string;
  page_number: number;
  image_url: string;
  created_at: string;
}
