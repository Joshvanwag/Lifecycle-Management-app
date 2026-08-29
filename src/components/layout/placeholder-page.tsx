import Link from "next/link";
import { AuthenticatedDashboardShell } from "@/components/layout/authenticated-dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PlaceholderPageProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

export async function PlaceholderPage({ title, description, children }: PlaceholderPageProps) {
  return (
    <AuthenticatedDashboardShell title={title} description={description}>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>
            This section is part of the planned product roadmap and will be implemented in a
            future phase.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {children}
          <Button asChild variant="outline">
            <Link href="/">Return to Overview</Link>
          </Button>
        </CardContent>
      </Card>
    </AuthenticatedDashboardShell>
  );
}
