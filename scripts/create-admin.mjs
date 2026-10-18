// Creates (or finds) a Supabase Auth user for the given email and marks it as an admin.
// No password is set: the admin signs in with a one-time email link.
// Usage: node --env-file=.env.local scripts/create-admin.mjs someone@example.com
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error("Usage: node --env-file=.env.local scripts/create-admin.mjs <email>");
  process.exit(1);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let userId;
const { data: created, error: createError } = await supabase.auth.admin.createUser({ email, email_confirm: true });
if (created?.user) {
  userId = created.user.id;
  console.log("created user");
} else {
  // Already exists: find it.
  const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;
  userId = list.users.find((u) => u.email?.toLowerCase() === email)?.id;
  if (!userId) throw createError ?? new Error("user not found");
  console.log("user already existed");
}

const { error: adminError } = await supabase.from("admin_users").upsert({ id: userId });
if (adminError) throw adminError;
console.log("admin ready");
