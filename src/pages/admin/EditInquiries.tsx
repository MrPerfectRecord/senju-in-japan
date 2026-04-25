import { useEffect, useState } from "react";
import { Save, Upload, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { SiteConfig } from "../../lib/database.types";
import { Banner, Button, Field, Input, PageHeader, Textarea } from "./_formKit";
import { uploadFile } from "../../lib/uploadFile";

export default function EditInquiries() {
  const [data, setData] = useState<Partial<SiteConfig> | null>(null);
  const [accentText, setAccentText] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data: row, error: e } = await supabase
        .from("site_config")
        .select("*")
        .eq("id", 1)
        .single();
      if (e) setError(e.message);
      else if (row) {
        setData(row);
        setAccentText((row.inquiry_accent_words ?? []).join(", "));
      }
    })();
  }, []);

  function update<K extends keyof SiteConfig>(k: K, v: SiteConfig[K]) {
    setData((p) => ({ ...(p ?? {}), [k]: v }));
    setSuccess(false);
  }

  async function onUpload(file: File) {
    setUploading(true);
    try {
      const { url } = await uploadFile("media", file, "inquiry-");
      update("inquiry_image", url);
    } catch (e) { setError(e instanceof Error ? e.message : "Upload failed"); }
    setUploading(false);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    setSaving(true);
    setError(null);
    const accent = accentText.split(",").map((s) => s.trim()).filter(Boolean);
    const { error: er } = await supabase
      .from("site_config")
      .update({
        inquiry_headline: data.inquiry_headline,
        inquiry_accent_words: accent,
        inquiry_body: data.inquiry_body,
        inquiry_cta_label: data.inquiry_cta_label,
        inquiry_cta_email_subject: data.inquiry_cta_email_subject,
        inquiry_image: data.inquiry_image,
        inquiry_image_badge: data.inquiry_image_badge,
      })
      .eq("id", 1);
    if (er) setError(er.message);
    else setSuccess(true);
    setSaving(false);
  }

  if (!data) {
    return <><PageHeader title="Inquiries" sub="Loading…" /></>;
  }

  return (
    <>
      <PageHeader title="Inquiries" sub="The pitch text, CTA, and side photo." />
      {error && <Banner kind="error">{error}</Banner>}
      {success && <Banner kind="success">Saved.</Banner>}

      <form onSubmit={onSave} className="space-y-5 max-w-2xl">
        <Field label="Headline (italic, big)" hint="Wrap accent words with the field below to highlight them red.">
          <Textarea
            value={data.inquiry_headline ?? ""}
            onChange={(e) => update("inquiry_headline", e.target.value)}
            rows={3}
            required
          />
        </Field>
        <Field label="Accent words" hint="Comma-separated. Each match in the headline turns red.">
          <Input value={accentText} onChange={(e) => setAccentText(e.target.value)} placeholder="PC building, custom advice" />
        </Field>
        <Field label="Body paragraph">
          <Textarea
            value={data.inquiry_body ?? ""}
            onChange={(e) => update("inquiry_body", e.target.value)}
            rows={4}
            required
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="CTA button label">
            <Input value={data.inquiry_cta_label ?? ""} onChange={(e) => update("inquiry_cta_label", e.target.value)} required />
          </Field>
          <Field label="Email subject prefilled">
            <Input value={data.inquiry_cta_email_subject ?? ""} onChange={(e) => update("inquiry_cta_email_subject", e.target.value)} required />
          </Field>
        </div>
        <Field label="Side image">
          <div className="flex items-center gap-4">
            {data.inquiry_image && (
              <div className="relative">
                <img src={data.inquiry_image} alt="" className="h-24 w-24 object-cover bg-zinc-900" />
                <button
                  type="button"
                  onClick={() => update("inquiry_image", null)}
                  className="absolute -top-2 -right-2 bg-zinc-900 border border-zinc-800 p-1 text-zinc-400 hover:text-red-500"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            <label className="cursor-pointer inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 border border-zinc-800 px-4 py-3 hover:bg-zinc-900">
              <Upload size={12} /> {uploading ? "Uploading…" : "Upload image"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onUpload(f);
                }}
              />
            </label>
          </div>
        </Field>
        <Field label="Image badge label" hint='e.g. "Hardware Expert" — overlays bottom-left of the photo.'>
          <Input value={data.inquiry_image_badge ?? ""} onChange={(e) => update("inquiry_image_badge", e.target.value)} />
        </Field>

        <div className="pt-2">
          <Button type="submit" loading={saving}><Save size={14} /> Save</Button>
        </div>
      </form>
    </>
  );
}
