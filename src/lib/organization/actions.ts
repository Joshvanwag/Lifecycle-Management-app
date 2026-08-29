"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthContext } from "@/lib/auth/context";
import { INDUSTRY_TYPE_CODES } from "@/lib/benchmark/constants";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

type OrganizationUpdate = Database["public"]["Tables"]["organizations"]["Update"];

export async function updateOrganizationSettings(formData: FormData) {
  const auth = await requireAuthContext();

  if (auth.membership.role !== "owner" && auth.membership.role !== "admin") {
    redirect("/settings?error=unauthorized");
  }

  const industryType = String(formData.get("industryType") ?? "").trim();
  const benchmarkParticipation = formData.get("benchmarkParticipation") === "on";

  if (!INDUSTRY_TYPE_CODES.includes(industryType as (typeof INDUSTRY_TYPE_CODES)[number])) {
    redirect("/settings?error=invalid-industry");
  }

  const payload: OrganizationUpdate = {
    industry_type: industryType,
    benchmark_participation: benchmarkParticipation,
  };

  const supabase = await createClient();
  const organizations = supabase.from("organizations") as unknown as {
    update: (values: OrganizationUpdate) => {
      eq: (column: "id", value: string) => PromiseLike<{ error: { message: string } | null }>;
    };
  };
  const { error } = await organizations.update(payload).eq("id", auth.organization.id);

  if (error) {
    redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/settings");
  redirect("/settings?saved=1");
}
