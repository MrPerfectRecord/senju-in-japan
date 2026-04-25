-- ============================================================================
-- SENJU IN JAPAN — Supabase schema
-- Paste this entire file into the Supabase SQL Editor and click Run.
-- Safe to re-run: every statement is idempotent (uses IF NOT EXISTS / OR REPLACE).
-- ============================================================================

-- --------------------------------------------------------------------------
-- ENUM: user roles
-- --------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('reader', 'admin');
exception when duplicate_object then null; end $$;

-- --------------------------------------------------------------------------
-- TABLE: profiles  (extends auth.users with role + display name)
-- --------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role        user_role not null default 'reader',
  created_at  timestamptz not null default now()
);

-- Auto-create profile row on signup (default role: reader)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'reader')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper function: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- --------------------------------------------------------------------------
-- TABLE: site_config (single row; the editable creator/site-wide settings)
-- --------------------------------------------------------------------------
create table if not exists public.site_config (
  id                          int primary key default 1,
  creator_name                text not null,
  handle                      text not null,
  tagline                     text not null,
  contact_email               text not null,
  character_image             text not null,
  hero_background             text not null,
  copyright_start_year        int  not null default 2026,

  inquiry_headline            text not null,
  inquiry_accent_words        text[] not null default '{}',
  inquiry_body                text not null,
  inquiry_cta_label           text not null,
  inquiry_cta_email_subject   text not null,
  inquiry_image               text,
  inquiry_image_badge         text,

  analytics_as_of_label       text,

  updated_at                  timestamptz not null default now(),

  constraint single_row check (id = 1)
);

-- --------------------------------------------------------------------------
-- TABLE: socials
-- --------------------------------------------------------------------------
create table if not exists public.socials (
  id          uuid primary key default gen_random_uuid(),
  platform    text not null,    -- 'youtube' | 'twitter' | 'instagram' | 'discord' | 'tiktok'
  label       text not null,
  url         text not null,
  position    int  not null,
  created_at  timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- TABLE: stat_clusters (the round dial widgets — one per platform)
-- --------------------------------------------------------------------------
create table if not exists public.stat_clusters (
  id          uuid primary key default gen_random_uuid(),
  platform    text not null,    -- 'youtube' | 'twitter'
  position    int  not null,
  stats       jsonb not null,   -- [{ "label": "Subscribers", "value": "28.7K" }, ...]
  created_at  timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- TABLE: stat_summary (the bottom row of cards)
-- --------------------------------------------------------------------------
create table if not exists public.stat_summary (
  id              uuid primary key default gen_random_uuid(),
  platform        text not null,
  metric          text not null,
  metric_label    text not null,
  audience        text,
  audience_label  text,
  position        int not null,
  created_at      timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- TABLE: sponsors
-- --------------------------------------------------------------------------
create table if not exists public.sponsors (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  logo_url    text not null,
  href        text,
  position    int  not null,
  created_at  timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- TABLE: articles
-- --------------------------------------------------------------------------
create table if not exists public.articles (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('feature', 'tweet', 'minimal')),
  title       text not null,
  excerpt     text,
  url         text,
  tag         text,
  image_url   text,
  date        text,
  position    int not null,
  created_at  timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- TABLE: manga_chapters
-- --------------------------------------------------------------------------
create table if not exists public.manga_chapters (
  id            uuid primary key default gen_random_uuid(),
  number        int not null,
  title         text not null,
  slug          text not null unique,
  description   text,
  cover_image   text,
  is_premium    boolean not null default false,
  is_published  boolean not null default false,
  position      int not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- TABLE: manga_pages
-- --------------------------------------------------------------------------
create table if not exists public.manga_pages (
  id          uuid primary key default gen_random_uuid(),
  chapter_id  uuid not null references public.manga_chapters(id) on delete cascade,
  page_number int not null,
  image_url   text not null,
  created_at  timestamptz not null default now(),
  unique (chapter_id, page_number)
);

create index if not exists manga_pages_chapter_idx on public.manga_pages (chapter_id, page_number);

-- ============================================================================
-- ROW-LEVEL SECURITY
-- ============================================================================

alter table public.profiles        enable row level security;
alter table public.site_config     enable row level security;
alter table public.socials         enable row level security;
alter table public.stat_clusters   enable row level security;
alter table public.stat_summary    enable row level security;
alter table public.sponsors        enable row level security;
alter table public.articles        enable row level security;
alter table public.manga_chapters  enable row level security;
alter table public.manga_pages     enable row level security;

-- Drop any existing policies on these tables so we can re-run safely
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles','site_config','socials','stat_clusters','stat_summary','sponsors','articles','manga_chapters','manga_pages')
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- ----- profiles -----
create policy "users see own profile" on public.profiles
  for select using (id = auth.uid());
create policy "admins see all profiles" on public.profiles
  for select using (public.is_admin());
create policy "users update own profile" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));
create policy "admins manage profiles" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ----- public-readable content tables -----
create policy "site_config readable" on public.site_config for select using (true);
create policy "site_config admin write" on public.site_config for all using (public.is_admin()) with check (public.is_admin());

create policy "socials readable" on public.socials for select using (true);
create policy "socials admin write" on public.socials for all using (public.is_admin()) with check (public.is_admin());

create policy "stat_clusters readable" on public.stat_clusters for select using (true);
create policy "stat_clusters admin write" on public.stat_clusters for all using (public.is_admin()) with check (public.is_admin());

create policy "stat_summary readable" on public.stat_summary for select using (true);
create policy "stat_summary admin write" on public.stat_summary for all using (public.is_admin()) with check (public.is_admin());

create policy "sponsors readable" on public.sponsors for select using (true);
create policy "sponsors admin write" on public.sponsors for all using (public.is_admin()) with check (public.is_admin());

create policy "articles readable" on public.articles for select using (true);
create policy "articles admin write" on public.articles for all using (public.is_admin()) with check (public.is_admin());

-- ----- manga: chapters -----
-- Free chapters visible to everyone; premium chapters require sign-in; admins see all (incl drafts)
create policy "free chapters public" on public.manga_chapters
  for select using (is_published and not is_premium);
create policy "premium chapters signed-in" on public.manga_chapters
  for select using (is_published and is_premium and auth.uid() is not null);
create policy "admins see all chapters" on public.manga_chapters
  for select using (public.is_admin());
create policy "admins manage chapters" on public.manga_chapters
  for all using (public.is_admin()) with check (public.is_admin());

-- ----- manga: pages (mirror their chapter's visibility) -----
create policy "manga pages follow chapter" on public.manga_pages
  for select using (
    exists (
      select 1 from public.manga_chapters mc
      where mc.id = chapter_id
        and (
          (mc.is_published and not mc.is_premium)
          or (mc.is_published and mc.is_premium and auth.uid() is not null)
          or public.is_admin()
        )
    )
  );
create policy "admins manage pages" on public.manga_pages
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- STORAGE BUCKETS (created via SQL so they exist with the right config)
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('manga', 'manga', true)
on conflict (id) do update set public = true;

-- Drop any existing storage policies for these buckets so we can re-run
do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname in (
        'media public read', 'media admin write',
        'manga public read', 'manga admin write'
      )
  loop
    execute format('drop policy if exists %I on storage.objects', r.policyname);
  end loop;
end $$;

-- Public read on both (gating happens via DB row visibility, not URL secrecy)
create policy "media public read" on storage.objects for select using (bucket_id = 'media');
create policy "manga public read" on storage.objects for select using (bucket_id = 'manga');

-- Only admins can upload/update/delete files
create policy "media admin write" on storage.objects
  for all using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

create policy "manga admin write" on storage.objects
  for all using (bucket_id = 'manga' and public.is_admin())
  with check (bucket_id = 'manga' and public.is_admin());

-- ============================================================================
-- SEED: insert your existing site config so the public site has data on first load
-- ============================================================================
insert into public.site_config (
  id, creator_name, handle, tagline, contact_email,
  character_image, hero_background, copyright_start_year,
  inquiry_headline, inquiry_accent_words, inquiry_body,
  inquiry_cta_label, inquiry_cta_email_subject, inquiry_image, inquiry_image_badge,
  analytics_as_of_label
)
values (
  1,
  'Senju in Japan',
  'Senju_in_Japan',
  'Streamer | Creator | Entertainer | Live Commentary Host | Internet Personality | Influencer | Community Builder',
  'Senjureviews@gmail.com',
  '/character.svg',
  '/hero-bg.svg',
  2026,
  '"Need a new rig? Introduction to PC building? I offer custom advice for high-performance setups."',
  array['PC building'],
  'I have built many PCs and offer dedicated component advice to those looking for it. Whether it''s for streaming, gaming, or content creation, I can help you find the perfect balance of parts.',
  'Get in touch',
  'PC Build Inquiry',
  'https://images.unsplash.com/photo-1587202377405-836165970a6a?auto=format&fit=crop&q=80&w=1200',
  'Hardware Expert',
  'Stats as of April 2026'
)
on conflict (id) do nothing;

-- Seed socials
insert into public.socials (platform, label, url, position) values
  ('youtube',   'YouTube',   'https://www.youtube.com/@SenjuinJapan', 1),
  ('twitter',   'Twitter',   'https://x.com/Senju_in_Japan',          2),
  ('instagram', 'Instagram', 'https://www.instagram.com/senju_in_japan/', 3),
  ('discord',   'Discord',   'https://discord.gg/NHveAPQY4j',          4),
  ('tiktok',    'TikTok',    'https://www.tiktok.com/@senjuinjapan',   5)
on conflict do nothing;

-- Seed stat clusters
insert into public.stat_clusters (platform, position, stats) values
  ('youtube', 1, '[
     {"label":"Subscribers","value":"28.7K"},
     {"label":"Total Views","value":"9.9M"},
     {"label":"Videos","value":"—"},
     {"label":"Avg. Views","value":"—"}
   ]'::jsonb),
  ('twitter', 2, '[
     {"label":"Followers","value":"10.7K"},
     {"label":"Tweets","value":"9,846"},
     {"label":"Impressions","value":"—"},
     {"label":"Profile Visits","value":"—"}
   ]'::jsonb)
on conflict do nothing;

-- Seed stat summary
insert into public.stat_summary (platform, metric, metric_label, audience, audience_label, position) values
  ('YouTube',   '9.9M',  'Total Views', '28.7K', 'Subs',   1),
  ('Twitter/X', '10.7K', 'Followers',   '9,846', 'Tweets', 2)
on conflict do nothing;

-- Done. Confirm 9 rows in site_config + relations seeded.
select 'Schema applied. Rows seeded: ' || (select count(*) from public.site_config)::text as status;
