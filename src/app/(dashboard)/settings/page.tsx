import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function SettingsPage() {
  return (
    <PlaceholderPage
      title="Settings"
      description="Organization and application settings"
    >
      <p className="text-sm text-muted-foreground">
        Settings will include organization defaults (refresh cycle, inflation), user management,
        and future SSO configuration.
      </p>
    </PlaceholderPage>
  );
}
