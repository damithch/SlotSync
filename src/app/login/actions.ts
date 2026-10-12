"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export type LoginState = { error?: string; email?: string };

// Only allow redirects inside this app, so a crafted ?callbackUrl= can't send users to another site.
function safeRedirect(url: FormDataEntryValue | null) {
  return typeof url === "string" && url.startsWith("/") && !url.startsWith("//") ? url : "/";
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const parsed = loginSchema.safeParse({ email, password: formData.get("password") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, email };
  }

  try {
    await signIn("credentials", { ...parsed.data, redirectTo: safeRedirect(formData.get("callbackUrl")) });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password.", email };
    }
    // signIn signals a successful login by throwing a redirect, which Next.js must handle.
    throw error;
  }
  return {};
}
