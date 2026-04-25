# Senju in Japan — Content Creator Hub

A dark, high-impact personal brand site for **Senju in Japan** (Streamer · Creator · Entertainer).

- Built with **React 18 + TypeScript + Vite**
- Styled with **Tailwind CSS** (via Play CDN for simplicity)
- All content lives in one editable file: **`src/siteData.ts`**

---

## 1 · Run it locally

You need Node 18+ installed once (download at [nodejs.org](https://nodejs.org)). Then, in a terminal inside this folder:

```bash
npm install       # one-time, installs dependencies
npm run dev       # starts the local dev server on http://localhost:3000
```

Open http://localhost:3000 — edits you save appear instantly (hot reload).

Other useful scripts:

```bash
npm run build       # produces a production bundle in ./dist
npm run preview     # serves the production bundle locally to sanity-check it
npm run typecheck   # runs TypeScript without emitting — catches type errors
```

---

## 2 · Where to edit your content

**Almost everything is in `src/siteData.ts`.** Open that file and you'll find sections for:

| What you want to change | Where |
|---|---|
| Creator name, tagline, handle, contact email | `creator` object (top of file) |
| Social links (YouTube / X / Instagram / Discord / TikTok) | `socials` array |
| Your stats (YouTube + Twitter clusters + summary row) | `analytics` object |
| Sponsors / partners | `sponsors` array (empty = shows "Open for collaboration" block) |
| Press articles / appearances | `articles` array (empty = shows "Coming Soon" block) |
| PC-build inquiries pitch + CTA | `inquiries` object |

Save the file — the site updates instantly. No other code changes needed.

### Swapping the character artwork

1. Drop your image into `public/` (e.g. `public/character.jpg` or `public/character.png`).
2. Open `src/siteData.ts` and change `creator.characterImage` to match, e.g. `"/character.jpg"`.

A stylized SVG placeholder ships at `public/character.svg` so the site looks polished even before you swap it.

### Adding a real article

In `src/siteData.ts`, replace the empty `articles: []` array with entries like:

```ts
export const articles: Article[] = [
  {
    kind: "feature",
    tag: "Featured News",
    title: "Article title goes here",
    excerpt: "One-line hook.",
    url: "https://example.com/article",
    imageUrl: "https://example.com/cover.jpg", // optional
    date: "APR 23, 2026",                       // optional
  },
  {
    kind: "tweet",
    title: "",
    excerpt: "Tweet text here.",
    date: "4:38 PM · MAR 21, 2026",
  },
  {
    kind: "minimal",
    title: "Text-only feature title",
    excerpt: "Short description.",
    url: "https://example.com",
  },
];
```

### Adding a sponsor logo

```ts
export const sponsors = [
  { name: "Elgato", logoUrl: "https://…/elgato.svg", href: "https://elgato.com" },
];
```

As soon as you add one, the "Open for collaboration" block turns into the standard logo grid.

---

## 3 · Deploying — go live

The build output is a static `dist/` folder, which means you can host it **anywhere that serves static files**. Pick one:

### Option A · Vercel (easiest, free, 2 minutes)

1. Push this folder to GitHub (or GitLab / Bitbucket). If you're new to git:
   ```bash
   git init
   git add .
   git commit -m "Initial site"
   gh repo create senju-in-japan --source . --push --public
   ```
   (The `gh` CLI is at [cli.github.com](https://cli.github.com). Or use the GitHub web UI — create an empty repo, then `git remote add origin …` and `git push`.)
2. Go to [vercel.com/new](https://vercel.com/new), "Import" your repo.
3. Vercel auto-detects Vite. Leave the defaults (`npm run build`, output `dist`). Hit **Deploy**.
4. In ~30 seconds you get a URL like `senjuinjapan.vercel.app`.
5. In Vercel's Domains tab, add your custom domain (e.g. `senjuinjapan.com`) and follow the DNS instructions.

### Option B · Netlify

1. Push to GitHub.
2. [app.netlify.com/start](https://app.netlify.com/start) → import your repo.
3. Build command: `npm run build` · Publish directory: `dist`. Deploy.

### Option C · GitHub Pages

1. Push to GitHub (repo name e.g. `senju-in-japan`).
2. In `vite.config.ts` add `base: "/senju-in-japan/"` (the repo name).
3. Install the deploy helper: `npm install -D gh-pages`
4. Add to `package.json` scripts: `"deploy": "npm run build && gh-pages -d dist"`
5. Run `npm run deploy`. Your site goes live at `https://<your-github-username>.github.io/senju-in-japan/`.

### Option D · Cloudflare Pages

Same idea as Vercel — connect the repo, framework preset "Vite", build command `npm run build`, output `dist`.

### Custom domain checklist

Once deployed, to point your domain (e.g. `senjuinjapan.com`):

1. At your domain registrar (Namecheap, GoDaddy, Google Domains, etc.), add the DNS records your host asks for (usually a `CNAME` to `cname.vercel-dns.com` or an `A` record).
2. In your host's dashboard (Vercel/Netlify), add the custom domain. They auto-provision SSL.
3. Wait up to 60 min for DNS to propagate.

---

## 4 · Before you ship (quick polish checklist)

These are the small things that make the site feel "done":

- [ ] Replace `public/character.svg` with your real character artwork (`.jpg` or `.png`, ≥ 1200×1200 ideally).
- [ ] Add a proper Open Graph image at `public/og-image.png` (1200×630). This is what shows when someone shares the link on X/Discord/iMessage.
- [ ] Add `public/apple-touch-icon.png` (180×180) so iOS home-screen icons look right.
- [ ] Update the canonical URL in `index.html` from `https://senjuinjapan.com/` to your actual domain.
- [ ] Update the Twitter `@site` / `@creator` handles in `index.html` if they differ.
- [ ] Refresh numbers in `src/siteData.ts` → `analytics.asOfLabel` whenever you update stats.

---

## 5 · What's wired up

| Feature | State |
|---|---|
| Navbar: sticky, mobile menu, smooth-scroll links | ✅ |
| Hero: big name, tagline, social icon row | ✅ (icons linked to your real URLs) |
| Analytics: YouTube + Twitter clusters + summary row | ✅ (animates on scroll-in, staggered) |
| Sponsors: grid OR "Open for collaboration" placeholder | ✅ |
| Articles: masonry grid OR "Coming Soon" placeholder | ✅ |
| Inquiries: PC build pitch + `mailto:` CTA | ✅ (links to `Senjureviews@gmail.com`) |
| Footer: socials + year-accurate copyright | ✅ |
| Scroll-to-top button | ✅ |
| External links open in new tab with `rel="noopener noreferrer"` | ✅ |
| Lazy-loaded images | ✅ |
| Open Graph / Twitter Card / favicon | ✅ (OG image is a placeholder — add your own) |
| Respects `prefers-reduced-motion` | ✅ |

---

## 6 · File map

```
├── index.html            SEO/meta tags, Tailwind CDN, font, root element
├── package.json          Dependencies & scripts
├── tsconfig.json         TypeScript config
├── vite.config.ts        Dev server + build config
├── public/
│   ├── character.svg     Placeholder character art (replace with your own)
│   └── favicon.svg       Site favicon
└── src/
    ├── main.tsx          App entry point
    ├── App.tsx           All React components for the page
    └── siteData.ts       ⭐ Edit this file to change site content
```

---

## 7 · Optional upgrades

If you want to take this further, good next steps are:

1. **Production-grade Tailwind** — replace the CDN in `index.html` with the PostCSS pipeline (`npm install -D tailwindcss postcss autoprefixer`, then `npx tailwindcss init -p`). Smaller CSS bundle + no FOUC.
2. **Newsletter signup** — drop in a ConvertKit / Beehiiv / Mailchimp form in the `Inquiries` section.
3. **Blog / video grid** — pull live YouTube uploads via the YouTube Data API and render a grid instead of static article cards.
4. **Animated hero name** — add a subtle loop (e.g. typewriter, wave) to the title.
5. **Analytics** — add Plausible / Umami for privacy-friendly traffic stats.

Good luck — go build something loud. 🥢
