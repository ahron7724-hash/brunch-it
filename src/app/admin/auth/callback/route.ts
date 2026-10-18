import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const codeSchema = z.string().min(10).max(500);
const tokenHashSchema = z.string().min(10).max(500);
const typeSchema = z.enum(["magiclink", "email"]);

/**
 * Completes an email sign-in link. Supports both forms Supabase can send:
 * ?code=… (PKCE, default template) and ?token_hash=…&type=… (token-hash template).
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const login = new URL("/admin/login", request.url);
  login.searchParams.set("error", "link");
  const supabase = await createClient();

  const code = codeSchema.safeParse(params.get("code"));
  if (code.success) {
    const { error } = await supabase.auth.exchangeCodeForSession(code.data);
    return NextResponse.redirect(error ? login : new URL("/admin", request.url));
  }

  const tokenHash = tokenHashSchema.safeParse(params.get("token_hash"));
  const type = typeSchema.safeParse(params.get("type"));
  if (tokenHash.success && type.success) {
    const otpType: EmailOtpType = type.data;
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash.data, type: otpType });
    return NextResponse.redirect(error ? login : new URL("/admin", request.url));
  }

  return NextResponse.redirect(login);
}
