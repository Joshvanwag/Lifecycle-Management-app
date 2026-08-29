"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ACTIVE_ORGANIZATION_COOKIE } from "@/lib/auth/constants";
import { requireAuthContext } from "@/lib/auth/context";

export async function setActiveOrganization(organizationId: string) {
  const auth = await requireAuthContext();

  if (!auth.isPlatformAdmin) {
    throw new Error("Only DEV organization members can switch customer organizations.");
  }

  const allowed = auth.organizations.some((organization) => organization.id === organizationId);
  if (!allowed) {
    throw new Error("Organization not found.");
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORGANIZATION_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  revalidatePath("/", "layout");
}
