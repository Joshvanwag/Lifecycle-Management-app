import { PlaceholderPage } from "@/components/layout/placeholder-page";
import { lifecycleActions } from "@/config/navigation";

export default function ImportsPage() {
  return (
    <PlaceholderPage
      title="Imports"
      description="Import and update inventory data"
    >
      <p className="text-sm text-muted-foreground">
        CSV and Excel upload is Phase 4. You can already record these actions from a Space
        without a file:
      </p>
      <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
        {lifecycleActions.map((action) => (
          <li key={action.title}>
            <span className="font-medium text-foreground">{action.title}</span> —{" "}
            {action.description}
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">
        See <code className="text-xs">docs/import-model.md</code> in the repository for workflow
        details.
      </p>
    </PlaceholderPage>
  );
}
