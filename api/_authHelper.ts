// Helpers for the Vercel API routes. Validates that the caller is an admin,
// and provides a service-role Supabase client for privileged ops.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function getEnv() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !serviceRole) {
    throw new Error(
      "Missing env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return { url, anon, serviceRole };
}

export function adminClient(): SupabaseClient {
  const { url, serviceRole } = getEnv();
  return createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function userClient(token: string): SupabaseClient {
  const { url, anon } = getEnv();
  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Reads the Authorization: Bearer <token> header from the request, looks up the
 * user via Supabase, then verifies they have role='admin' in the profiles table.
 * Returns the user ID on success, or throws.
 */
export async function requireAdmin(req: Request): Promise<string> {
  const auth = req.headers.get("authorization");
  const token = auth?.replace(/^Bearer\s+/i, "")?.trim();
  if (!token) throw new Error("Missing Authorization header");

  const u = userClient(token);
  const { data: userData, error: userErr } = await u.auth.getUser();
  if (userErr || !userData.user) throw new Error("Invalid auth token");

  const admin = adminClient();
  const { data: profile, error: profErr } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();
  if (profErr || !profile) throw new Error("Profile not found");
  if (profile.role !== "admin") throw new Error("Forbidden: admin only");

  return userData.user.id;
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
