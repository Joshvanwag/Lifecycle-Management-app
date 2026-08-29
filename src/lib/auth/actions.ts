"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getInvitationPreview } from "@/lib/data/invitations";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/");

  if (!email || !password) {
    redirect("/login?error=missing-credentials");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=invalid-credentials");
  }

  await supabase.rpc("accept_pending_invitations");

  redirect(redirectTo.startsWith("/") ? redirectTo : "/");
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const inviteToken = String(formData.get("inviteToken") ?? "").trim();

  if (!email || !password || !inviteToken) {
    redirect("/signup?error=missing-fields");
  }

  const supabase = await createClient();

  const invitation = await getInvitationPreview(supabase, inviteToken);
  if (!invitation?.is_valid) {
    redirect("/signup?error=invalid-invite");
  }

  if (invitation.email.toLowerCase() !== email) {
    redirect("/signup?error=email-mismatch");
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirect(`/signup?invite=${inviteToken}&error=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
