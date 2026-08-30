import { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;

export interface OrganizationMember {
  userId: string;
  email: string;
  role: "owner" | "admin" | "member" | "read_only";
  createdAt: string;
}

export async function listOrganizationMembers(
  client: Client,
  organizationId: string,
): Promise<OrganizationMember[]> {
  const { data, error } = await (
    client as unknown as {
      rpc: (
        fn: "list_organization_members",
        args: { target_organization_id: string },
      ) => Promise<{
        data: Array<{
          user_id: string;
          email: string;
          role: OrganizationMember["role"];
          created_at: string;
        }> | null;
        error: { message: string } | null;
      }>;
    }
  ).rpc("list_organization_members", { target_organization_id: organizationId });

  if (error) {
    throw new Error(`Failed to load members: ${error.message}`);
  }

  return ((data ?? []) as Array<{
    user_id: string;
    email: string;
    role: OrganizationMember["role"];
    created_at: string;
  }>).map((row) => ({
    userId: row.user_id,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
  }));
}
