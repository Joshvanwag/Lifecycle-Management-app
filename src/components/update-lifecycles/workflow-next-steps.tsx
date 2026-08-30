import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthenticatedDashboardShell } from "@/components/layout/authenticated-dashboard-shell";
import { Button } from "@/components/ui/button";

interface WorkflowOption {
  title: string;
  description: string;
  href: string;
}

interface WorkflowNextStepsProps {
  title: string;
  description: string;
  options: WorkflowOption[];
}

export function WorkflowNextSteps({ title, description, options }: WorkflowNextStepsProps) {
  return (
    <AuthenticatedDashboardShell title={title} description={description}>
      <div className="mx-auto max-w-2xl space-y-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
          <Link href="/update-lifecycles">
            <ArrowLeft className="h-4 w-4" />
            Back to Update Lifecycles
          </Link>
        </Button>
        <div className="space-y-3">
          {options.map((option) => (
            <Link
              key={option.href}
              href={option.href}
              className="block cursor-pointer rounded-xl border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-accent/30"
            >
              <h2 className="text-sm font-semibold">{option.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{option.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </AuthenticatedDashboardShell>
  );
}
