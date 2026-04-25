import { useEffect, useState } from "react";
import { Save, Upload } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { SiteConfig } from "../../lib/database.types";
import { Banner, Button, Field, Input, PageHeader } from "./_formKit";
import { uploadFile } from "../../lib/uploadFile";

export default function EditMedia() {
  const [data, setData] = useState<Partial<SiteConfig> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
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
      else setData(row);
    })();
  }, []);

  function update<K extends keyof SiteConfig>(k: K, v: SiteConfig[K]) {
    setData((p) => ({ ...(p ?? {}), [k]: v }));
    setSuccess(false);
  }

  async function onUpload(field: "hero_background" | "character_image", file: File) {
    setUploadingKey(field);
    try {
      const { url } = await uploadFile("media", file, field === "hero_background" ? "hero-" : "char-");
      update(field, url);
    } catch (e) { setError(e instanceof Error ? e.message : "Upload failed"); }
    setUploadingKey(null);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    setSaving(true);
    setError(null);
    const { error: er } = await supabase
      .from("site_config")
      .update({
        hero_background: data.hero_background,
        character_image: data.character_image,
      })
      .eq("id", 1);
    if (er) setError(er.message);
    else setSuccess(true);
    setSaving(false);
  }

  if (!data) return <PageHeader title="Media" sub="Loading…" />;

  return (
    <>
      <PageHeader title="Media" sub="Hero background and character art." />
      {error && <Banner kind="error">{error}</Banner>}
      {success && <Banner kind="success">Saved.</Banner>}

      <form onSubmit={onSave} className="space-y-8 max-w-3xl">
        <ImageField
          label="Hero background"
          hint="Full-screen image behind your name. 16:9 ratio works best (e.g. 1920×1080)."
          value={data.hero_background ?? ""}
          aspect="16/9"
          onUrlChange={(v) => update("hero_background", v)}
          onFileChange={(f) => onUpload("hero_background", f)}
          uploading={uploadingKey === "hero_background"}
        />

        <ImageField
          label="Character / profile artwork"
          hint="Used in the analytics portrait. Square or 3:4 portrait works."
          value={data.character_image ?? ""}
          aspect="3/4"
          onUrlChange={(v) => update("character_image", v)}
          onFileChange={(f) => onUpload("character_image", f)}
          uploading={uploadingKey === "character_image"}
        />

        <Button type="submit" loading={saving}>
          <Save size={14} /> Save changes
        </Button>
      </form>
    </>
  );
}

function ImageField({
  label, hint, value, aspect, onUrlChange, onFileChange, uploading,
}: {
  label: string;
  hint: string;
  value: string;
  aspect: string;
  onUrlChange: (v: string) => void;
  onFileChange: (f: File) => void;
  uploading: boolean;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-start">
        <div
          className="bg-zinc-900 border border-zinc-800 overflow-hidden"
          style={{ aspectRatio: aspect }}
        >
          {value && (
            <img src={value} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="space-y-3">
          <Input
            placeholder="Image URL or upload below"
            value={value}
            onChange={(e) => onUrlChange(e.target.value)}
          />
          <label className="cursor-pointer inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 border border-zinc-800 px-4 py-3 hover:bg-zinc-900">
            <Upload size={12} /> {uploading ? "Uploading…" : "Upload new file"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFileChange(f);
              }}
            />
          </label>
        </div>
      </div>
    </Field>
  );
}
