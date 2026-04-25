// GET /api/og-preview?url=https://...
// Returns: { title, description, image, siteName, url }
//
// Scrapes Open Graph / Twitter Card / standard <meta> tags from the target URL
// so the Articles admin can auto-fill a card from a pasted link.
import { json } from "./_authHelper";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; SenjuBot/1.0; +https://senjuinjapan.com)",
  Accept: "text/html,application/xhtml+xml",
};

function extractMeta(html: string, ...names: string[]): string | undefined {
  for (const name of names) {
    // <meta property="og:title" content="...">
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']+)["']`,
      "i"
    );
    const m = re.exec(html);
    if (m?.[1]) return decodeHtmlEntities(m[1]);
    // attribute order swapped
    const re2 = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${name}["']`,
      "i"
    );
    const m2 = re2.exec(html);
    if (m2?.[1]) return decodeHtmlEntities(m2[1]);
  }
  return undefined;
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function extractTitle(html: string): string | undefined {
  const m = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  return m?.[1] ? decodeHtmlEntities(m[1].trim()) : undefined;
}

function absolutize(url: string | undefined, base: string): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url, base).toString();
  } catch {
    return undefined;
  }
}

export default async function handler(req: Request) {
  const reqUrl = new URL(req.url);
  const target = reqUrl.searchParams.get("url");
  if (!target) return json({ error: "Missing url param" }, 400);

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return json({ error: "Invalid URL" }, 400);
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return json({ error: "Only http/https supported" }, 400);
  }

  try {
    const r = await fetch(parsed.toString(), {
      headers: HEADERS,
      redirect: "follow",
      // Edge runtime fetch handles streaming
    });
    if (!r.ok) return json({ error: `Fetch failed: ${r.status}` }, 502);
    const html = await r.text();
    // Limit size to avoid runaway memory on huge pages
    const slice = html.length > 1_000_000 ? html.slice(0, 1_000_000) : html;

    const title =
      extractMeta(slice, "og:title", "twitter:title") ?? extractTitle(slice) ?? parsed.hostname;
    const description = extractMeta(
      slice,
      "og:description",
      "twitter:description",
      "description"
    );
    const image = absolutize(
      extractMeta(slice, "og:image", "twitter:image", "twitter:image:src"),
      parsed.toString()
    );
    const siteName = extractMeta(slice, "og:site_name");

    return json({
      title,
      description,
      image,
      siteName,
      url: parsed.toString(),
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Fetch failed" }, 500);
  }
}

export const config = { runtime: "edge" };
