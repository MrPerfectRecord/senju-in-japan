// POST /api/invite-admin
// Body: { email: string }
// Auth: Authorization: Bearer <user JWT> — must be an existing admin
//
// Sends an invite email via Supabase Auth admin API and pre-promotes the
// invited user's profile row to role='admin'. The recipient lands on
// /accept-invite, sets a password, and gains access.
import { adminClient, json, requireAdmin } from "./_authHelper";

export default async function handler(req: Request) {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let userId: string;
  try {
    userId = await requireAdmin(req);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unauthorized" }, 401);
  }

  let body: { email?: string } = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const email = (body.email || "").trim().toLowerCase();
  if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    return json({ error: "Valid email required" }, 400);
  }

  const supa = adminClient();

  // Build the redirect URL — the host header tells us where the request came from
  const origin = req.headers.get("origin") || `https://${req.headers.get("host")}`;
  const redirectTo = `${origin}/accept-invite`;

  const { data, error } = await supa.auth.admin.inviteUserByEmail(email, {
    redirectTo,
  });
  if (error) return json({ error: error.message }, 400);
  if (!data.user) return json({ error: "No user returned" }, 500);

  // Upgrade their profile row to admin (handle_new_user trigger created it as 'reader')
  const { error: upErr } = await supa
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", data.user.id);
  if (upErr) return json({ error: upErr.message }, 500);

  return json({ ok: true, invited: { id: data.user.id, email }, by: userId });
}

export const config = { runtime: "edge" };
