import { useEffect, useRef, useState } from "react";

/**
 * Embeds a live tweet/X post using the official platform.twitter.com widget.
 * Loads the script once, caches it, and renders in dark theme to match the site.
 *
 * Usage: <TweetEmbed url="https://x.com/username/status/12345" />
 */
declare global {
  interface Window {
    twttr?: {
      widgets: {
        createTweet: (id: string, el: HTMLElement, options?: unknown) => Promise<unknown>;
        load?: (el?: HTMLElement) => void;
      };
      ready?: (cb: () => void) => void;
    };
  }
}

let loadPromise: Promise<void> | null = null;
function loadTwitterScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.twttr?.widgets) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve) => {
    const s = document.createElement("script");
    s.src = "https://platform.twitter.com/widgets.js";
    s.async = true;
    s.charset = "utf-8";
    s.onload = () => resolve();
    s.onerror = () => resolve(); // fail-open so we don't block render
    document.head.appendChild(s);
  });
  return loadPromise;
}

export function extractTweetId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:twitter\.com|x\.com)\/[^/]+\/status(?:es)?\/(\d+)/i);
  return m?.[1] ?? null;
}

export function TweetEmbed({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const tweetId = extractTweetId(url);

  useEffect(() => {
    if (!ref.current || !tweetId) return;
    let cancelled = false;
    setStatus("loading");
    void loadTwitterScript().then(() => {
      if (cancelled || !ref.current || !window.twttr?.widgets) {
        setStatus("error");
        return;
      }
      ref.current.innerHTML = "";
      window.twttr.widgets
        .createTweet(tweetId, ref.current, { theme: "dark", dnt: true, align: "center" })
        .then((el) => {
          if (cancelled) return;
          setStatus(el ? "ready" : "error");
        })
        .catch(() => !cancelled && setStatus("error"));
    });
    return () => {
      cancelled = true;
    };
  }, [tweetId]);

  if (!tweetId) return null;

  return (
    <div className="w-full flex justify-center">
      <div ref={ref} className="w-full max-w-[550px]" />
      {status === "loading" && (
        <div className="text-xs text-zinc-600 uppercase tracking-widest">Loading post…</div>
      )}
      {status === "error" && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-zinc-500 underline"
        >
          View on X
        </a>
      )}
    </div>
  );
}
