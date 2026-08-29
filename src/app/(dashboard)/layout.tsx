import { DashboardProviders } from "@/components/providers/dashboard-providers";
import { requireAuthContext } from "@/lib/auth/context";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireAuthContext();

  return (
    <DashboardProviders organizationId={auth.organization.id}>{children}</DashboardProviders>
  );
}
