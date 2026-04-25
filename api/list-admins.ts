// GET /api/list-admins
// Auth: Authorization: Bearer <admin JWT>
// Returns: [{ id, email }] for all users with role='admin'.
//
// Used by the ManageUsers page to show the email next to each admin.
import { adminClient, json, requireAdmin } from "./_authHelper";

export default async function handler(req: Request) {
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

  try {
    await requireAdmin(req);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unauthorized" }, 401);
  }

  const supa = adminClient();
  const { data: profiles, error: pe } = await supa
    .from("profiles")
    .select("id")
    .eq("role", "admin");
  if (pe) return json({ error: pe.message }, 500);

  const ids = new Set((profiles ?? []).map((p) => p.id));
  // listUsers is paginated; for typical sites a few pages is plenty.
  const result: Array<{ id: string; email: string | null }> = [];
  let page = 1;
  while (true) {
    const { data, error } = await supa.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return json({ error: error.message }, 500);
    for (const u of data.users) {
      if (ids.has(u.id)) result.push({ id: u.id, email: u.email ?? null });
    }
    if (data.users.length < 200) break;
    page++;
    if (page > 25) break; // safety cap
  }
  return json(result);
}

export const config = { runtime: "edge" };
