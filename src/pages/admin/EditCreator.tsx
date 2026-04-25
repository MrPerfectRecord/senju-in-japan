import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { SiteConfig } from "../../lib/database.types";
import { Banner, Button, Field, Input, PageHeader, Textarea } from "./_formKit";

export default function EditCreator() {
  const [data, setData] = useState<Partial<SiteConfig> | null>(null);
  const [saving, setSaving] = useState(false);
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

  function update<K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) {
    setData((prev) => ({ ...(prev ?? {}), [key]: value }));
    setSuccess(false);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    setSaving(true);
    setError(null);
    const { error: e2 } = await supabase
      .from("site_config")
      .update({
        creator_name: data.creator_name,
        handle: data.handle,
        tagline: data.tagline,
        contact_email: data.contact_email,
        copyright_start_year: data.copyright_start_year,
      })
      .eq("id", 1);
    if (e2) setError(e2.message);
    else setSuccess(true);
    setSaving(false);
  }

  if (!data) {
    return (
      <>
        <PageHeader title="Creator" sub="Loading…" />
        {error && <Banner kind="error">{error}</Banner>}
      </>
    );
  }

  return (
    <>
      <PageHeader title="Creator" sub="Display name, handle, tagline, contact email." />

      {error && <Banner kind="error">{error}</Banner>}
      {success && <Banner kind="success">Saved.</Banner>}

      <form onSubmit={onSave} className="space-y-5 max-w-2xl">
        <Field label="Creator name" hint="Shown in the navbar, hero headline, and footer.">
          <Input
            value={data.creator_name ?? ""}
            onChange={(e) => update("creator_name", e.target.value)}
            required
          />
        </Field>
        <Field label="Handle (no @)" hint="Used in the tweet-style article cards.">
          <Input
            value={data.handle ?? ""}
            onChange={(e) => update("handle", e.target.value)}
            required
          />
        </Field>
        <Field
          label="Tagline"
          hint="Roles in the marquee, separated by ` | ` (vertical bar)."
        >
          <Textarea
            value={data.tagline ?? ""}
            onChange={(e) => update("tagline", e.target.value)}
            rows={3}
            required
          />
        </Field>
        <Field
          label="Contact email"
          hint="Receives emails from the Inquiries CTA and partnership pitches."
        >
          <Input
            type="email"
            value={data.contact_email ?? ""}
            onChange={(e) => update("contact_email", e.target.value)}
            required
          />
        </Field>
        <Field label="Copyright start year" hint="Footer shows e.g. © 2026–2027.">
          <Input
            type="number"
            value={data.copyright_start_year ?? 2026}
            onChange={(e) => update("copyright_start_year", parseInt(e.target.value, 10))}
            required
          />
        </Field>

        <div className="pt-2">
          <Button type="submit" loading={saving}>
            <Save size={14} /> Save changes
          </Button>
        </div>
      </form>
    </>
  );
}
