import { useEffect, useState } from "react";
import { Save, Plus, Trash2, RefreshCw, Youtube as YoutubeIcon } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { authedFetch } from "../../lib/authedFetch";
import type { StatCluster, StatSummary } from "../../lib/database.types";
import { Banner, Button, Field, Input, PageHeader } from "./_formKit";

export default function EditStats() {
  const [clusters, setClusters] = useState<StatCluster[]>([]);
  const [summary, setSummary] = useState<StatSummary[]>([]);
  const [asOfLabel, setAsOfLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [c, s, conf] = await Promise.all([
      supabase.from("stat_clusters").select("*").order("position"),
      supabase.from("stat_summary").select("*").order("position"),
      supabase.from("site_config").select("analytics_as_of_label").eq("id", 1).single(),
    ]);
    if (c.error) setError(c.error.message);
    else setClusters((c.data as StatCluster[]) ?? []);
    if (s.error) setError(s.error.message);
    else setSummary((s.data as StatSummary[]) ?? []);
    if (conf.data) setAsOfLabel(conf.data.analytics_as_of_label ?? "");
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  function patchCluster(id: string, patch: Partial<StatCluster>) {
    setClusters((arr) => arr.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    setSuccess(false);
  }
  function patchClusterStat(clusterId: string, idx: number, p: Partial<{ label: string; value: string }>) {
    setClusters((arr) =>
      arr.map((c) => {
        if (c.id !== clusterId) return c;
        const stats = c.stats.map((s, i) => (i === idx ? { ...s, ...p } : s));
        return { ...c, stats };
      })
    );
    setSuccess(false);
  }
  function patchSummary(id: string, p: Partial<StatSummary>) {
    setSummary((arr) => arr.map((s) => (s.id === id ? { ...s, ...p } : s)));
    setSuccess(false);
  }

  async function addSummary() {
    const { data, error: e } = await supabase
      .from("stat_summary")
      .insert({
        platform: "Platform",
        metric: "0",
        metric_label: "Metric",
        audience: "0",
        audience_label: "Followers",
        position: summary.length + 1,
      })
      .select().single();
    if (e) setError(e.message);
    else if (data) setSummary((arr) => [...arr, data as StatSummary]);
  }
  async function removeSummary(id: string) {
    if (!confirm("Delete this summary card?")) return;
    const { error: e } = await supabase.from("stat_summary").delete().eq("id", id);
    if (e) setError(e.message);
    else setSummary((arr) => arr.filter((s) => s.id !== id));
  }

  async function saveAll() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    for (const c of clusters) {
      const { error: e } = await supabase
        .from("stat_clusters")
        .update({ platform: c.platform, position: c.position, stats: c.stats })
        .eq("id", c.id);
      if (e) { setError(e.message); setSaving(false); return; }
    }
    for (const s of summary) {
      const { error: e } = await supabase
        .from("stat_summary")
        .update({
          platform: s.platform,
          metric: s.metric,
          metric_label: s.metric_label,
          audience: s.audience,
          audience_label: s.audience_label,
          position: s.position,
        })
        .eq("id", s.id);
      if (e) { setError(e.message); setSaving(false); return; }
    }
    const { error: e3 } = await supabase
      .from("site_config")
      .update({ analytics_as_of_label: asOfLabel })
      .eq("id", 1);
    if (e3) { setError(e3.message); setSaving(false); return; }
    setSuccess(true);
    setSaving(false);
  }

  async function syncYoutube() {
    setSyncing(true);
    setError(null);
    setSyncMsg(null);
    try {
      const r = await authedFetch("/api/sync-youtube-stats", { method: "POST" });
      const body = (await r.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        youtube?: { subscribers: string; views: string; videos: string; avgViews: string };
        asOfLabel?: string;
      };
      if (!r.ok || !body.ok) throw new Error(body.error || "Sync failed");
      setSyncMsg(
        `YouTube synced — ${body.youtube?.subscribers} subs · ${body.youtube?.views} views · ${body.youtube?.videos} videos`
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <>
      <PageHeader title="Stats" sub="Numbers in the analytics section." />
      {error && <Banner kind="error">{error}</Banner>}
      {success && <Banner kind="success">Saved.</Banner>}
      {syncMsg && <Banner kind="success">{syncMsg}</Banner>}

      <div className="bg-zinc-950 border border-zinc-800 p-4 mb-8 max-w-3xl flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-2 mb-1">
            <YoutubeIcon size={14} className="text-red-500" /> Auto-sync
          </p>
          <p className="text-xs text-zinc-500">
            Pulls live subscriber/view/video counts from your YouTube channel and updates the
            dial + summary card. Click as often as you want — runs against a free 10K/day quota.
          </p>
        </div>
        <Button type="button" onClick={syncYoutube} loading={syncing} variant="ghost">
          <RefreshCw size={14} /> {syncing ? "Syncing…" : "Sync from YouTube"}
        </Button>
      </div>

      {loading ? <p className="text-zinc-500">Loading…</p> : (
        <div className="space-y-10 max-w-3xl">
          {/* Stat clusters (the round dials) */}
          <section>
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-4">
              Round dials
            </h2>
            <div className="space-y-4">
              {clusters.map((c) => (
                <div key={c.id} className="bg-zinc-950 border border-zinc-800 p-5 space-y-4">
                  <Field label="Platform">
                    <Input
                      value={c.platform}
                      onChange={(e) => patchCluster(c.id, { platform: e.target.value })}
                    />
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {c.stats.map((s, i) => (
                      <div key={i} className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Label"
                          value={s.label}
                          onChange={(e) => patchClusterStat(c.id, i, { label: e.target.value })}
                        />
                        <Input
                          placeholder="Value"
                          value={s.value}
                          onChange={(e) => patchClusterStat(c.id, i, { value: e.target.value })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Summary row */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">
                Summary cards
              </h2>
              <Button type="button" variant="ghost" onClick={addSummary}>
                <Plus size={12} /> Add card
              </Button>
            </div>
            <div className="space-y-3">
              {summary.map((s) => (
                <div key={s.id} className="bg-zinc-950 border border-zinc-800 p-4 grid grid-cols-1 sm:grid-cols-5 gap-3 items-start">
                  <Input placeholder="Platform" value={s.platform} onChange={(e) => patchSummary(s.id, { platform: e.target.value })} />
                  <Input placeholder="Metric" value={s.metric} onChange={(e) => patchSummary(s.id, { metric: e.target.value })} />
                  <Input placeholder="Metric label" value={s.metric_label} onChange={(e) => patchSummary(s.id, { metric_label: e.target.value })} />
                  <Input placeholder="Audience" value={s.audience ?? ""} onChange={(e) => patchSummary(s.id, { audience: e.target.value })} />
                  <div className="flex gap-2">
                    <Input placeholder="Audience label" value={s.audience_label ?? ""} onChange={(e) => patchSummary(s.id, { audience_label: e.target.value })} />
                    <button onClick={() => removeSummary(s.id)} type="button" className="text-zinc-600 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Field label='"As of" label' hint='e.g. "Stats as of April 2026" — shown under the stats grid.'>
            <Input value={asOfLabel} onChange={(e) => setAsOfLabel(e.target.value)} />
          </Field>

          <Button onClick={saveAll} loading={saving}><Save size={14} /> Save all stats</Button>
        </div>
      )}
    </>
  );
}
