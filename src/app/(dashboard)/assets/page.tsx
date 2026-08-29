import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function AssetsPage() {
  return (
    <PlaceholderPage
      title="Assets"
      description="Equipment inventory across all Spaces"
    >
      <p className="text-sm text-muted-foreground">
        The Assets list will support server-side search, filtering, and pagination for large
        inventories.
      </p>
    </PlaceholderPage>
  );
}
