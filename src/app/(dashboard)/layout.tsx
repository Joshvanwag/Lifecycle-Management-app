import { requireAuthContext } from "@/lib/auth/context";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAuthContext();
  return children;
}
