import { redirect } from "next/navigation";
import type { AuthContext } from "@/lib/auth/context";

export function canWriteOrganization(role: AuthContext["membership"]["role"]): boolean {
  return role === "owner" || role === "admin" || role === "member";
}

export function requireWriter(auth: AuthContext, unauthorizedPath: string) {
  if (!canWriteOrganization(auth.membership.role)) {
    redirect(`${unauthorizedPath}${unauthorizedPath.includes("?") ? "&" : "?"}error=unauthorized`);
  }
}
