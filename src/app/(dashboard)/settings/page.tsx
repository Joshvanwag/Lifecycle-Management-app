import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function SettingsPage() {
  return (
    <PlaceholderPage
      title="Settings"
      description="Organization and application settings"
    >
      <p className="text-sm text-muted-foreground">
        Organization defaults, user management, and SSO configuration will expand in later phases.
        Chart colors are customized from each chart&apos;s options menu.
      </p>
    </PlaceholderPage>
  );
}
