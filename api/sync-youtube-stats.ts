// POST /api/sync-youtube-stats
// Auth: Authorization: Bearer <admin JWT>
//
// Fetches the latest channel statistics from YouTube Data API v3 and writes
// them into stat_clusters (round dial) + stat_summary (bottom card) + bumps
// site_config.analytics_as_of_label to today's month/year. Idempotent — safe
// to call as often as you want (1 unit per call against a 10K/day quota).
//
// Setup: requires `YOUTUBE_API_KEY` env var on Vercel (and locally for dev).
// The channel handle is read from socials.platform='youtube'.url.
import { adminClient, json, requireAdmin } from "./_authHelper";

function formatBig(n: number): string {
  if (!Number.isFinite(n) || n < 0) return String(n);
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 10_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString();
}

function extractHandle(url: string): string | null {
  const m = url.match(/youtube\.com\/@([\w.-]+)/i);
  return m?.[1] ?? null;
}

export default async function handler(req: Request) {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return json(
      {
        error:
          "YOUTUBE_API_KEY env var is not set. Add it in Vercel → Settings → Environment Variables, then redeploy.",
      },
      500
    );
  }

  try {
    await requireAdmin(req);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unauthorized" }, 401);
  }

  const supa = adminClient();

  // Read the YouTube social URL to derive the handle
  const { data: yt, error: ytErr } = await supa
    .from("socials")
    .select("url")
    .eq("platform", "youtube")
    .maybeSingle();
  if (ytErr) return json({ error: ytErr.message }, 500);
  if (!yt?.url) {
    return json(
      { error: "No YouTube link in Socials. Add it in Admin → Socials, then try again." },
      400
    );
  }
  const handle = extractHandle(yt.url);
  if (!handle) {
    return json(
      {
        error: `Couldn't extract a YouTube handle from "${yt.url}". URL should look like https://youtube.com/@YourHandle`,
      },
      400
    );
  }

  // Hit the YouTube Data API
  const ytUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
  ytUrl.searchParams.set("part", "statistics,snippet");
  ytUrl.searchParams.set("forHandle", `@${handle}`);
  ytUrl.searchParams.set("key", apiKey);

  const r = await fetch(ytUrl.toString());
  if (!r.ok) {
    const body = await r.text().catch(() => "");
    return json(
      { error: `YouTube API ${r.status}: ${body.slice(0, 300)}` },
      r.status === 403 ? 403 : 502
    );
  }
  const data = (await r.json()) as {
    items?: Array<{
      statistics: {
        subscriberCount: string;
        viewCount: string;
        videoCount: string;
      };
      snippet?: { title: string };
    }>;
  };
  if (!data.items?.[0]) {
    return json({ error: `No YouTube channel found for handle "@${handle}"` }, 404);
  }

  const stats = data.items[0].statistics;
  const subs = parseInt(stats.subscriberCount || "0", 10);
  const views = parseInt(stats.viewCount || "0", 10);
  const videos = parseInt(stats.videoCount || "0", 10);
  const avg = videos > 0 ? Math.round(views / videos) : 0;

  const subsFmt = formatBig(subs);
  const viewsFmt = formatBig(views);
  const videosFmt = videos.toLocaleString();
  const avgFmt = formatBig(avg);

  // Update the round dial
  const newClusterStats = [
    { label: "Subscribers", value: subsFmt },
    { label: "Total Views", value: viewsFmt },
    { label: "Videos", value: videosFmt },
    { label: "Avg. Views", value: avgFmt },
  ];
  const { error: clusterErr } = await supa
    .from("stat_clusters")
    .update({ stats: newClusterStats })
    .eq("platform", "youtube");
  if (clusterErr) return json({ error: clusterErr.message }, 500);

  // Update the summary card (case-insensitive match for "youtube")
  const { error: summaryErr } = await supa
    .from("stat_summary")
    .update({
      metric: viewsFmt,
      metric_label: "Total Views",
      audience: subsFmt,
      audience_label: "Subs",
    })
    .ilike("platform", "youtube%");
  if (summaryErr) return json({ error: summaryErr.message }, 500);

  // Bump the "as of" label to today's month
  const now = new Date();
  const monthYear = now.toLocaleString("en-US", { month: "long", year: "numeric" });
  await supa
    .from("site_config")
    .update({ analytics_as_of_label: `Stats as of ${monthYear}` })
    .eq("id", 1);

  return json({
    ok: true,
    youtube: {
      subscribers: subsFmt,
      views: viewsFmt,
      videos: videosFmt,
      avgViews: avgFmt,
      raw: { subs, views, videos, avg },
    },
    asOfLabel: `Stats as of ${monthYear}`,
  });
}

export const config = { runtime: "edge" };
