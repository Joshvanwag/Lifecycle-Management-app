"use client";

import { useState } from "react";
import {
  SettingsNavigation,
  SettingsSection,
  type SettingsSectionId,
} from "@/components/design-system/settings-navigation";
import { MembersList } from "@/components/settings/members-list";
import { MfaEnrollForm } from "@/components/settings/mfa-enroll-form";
import { OrganizationSettingsForm } from "@/components/settings/organization-settings-form";
import { TeamInvitationForm } from "@/components/settings/team-invitation-form";
import type { OrganizationMember } from "@/lib/data/members";

interface SettingsWorkspaceProps {
  organizationName: string;
  industryType: string;
  benchmarkParticipation: boolean;
  defaultRefreshCycleYears: number;
  defaultInflationRate: number;
  floorsEnabled: boolean;
  canManage: boolean;
  saved: boolean;
  invited: boolean;
  errorMessage: string | null;
  members: OrganizationMember[];
  organizationId: string;
}

export function SettingsWorkspace({
  organizationName,
  industryType,
  benchmarkParticipation,
  defaultRefreshCycleYears,
  defaultInflationRate,
  floorsEnabled,
  canManage,
  saved,
  invited,
  errorMessage,
  members,
  organizationId,
}: SettingsWorkspaceProps) {
  const [section, setSection] = useState<SettingsSectionId>("general");

  return (
    <div className="space-y-6">
      <SettingsNavigation value={section} onChange={setSection} />
      {saved && <p className="text-sm text-green-700">Organization settings saved.</p>}
      {invited && <p className="text-sm text-green-700">Invitation sent.</p>}
      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

      {section === "general" && (
        <SettingsSection title="General" description="Organization identity and location options.">
          <OrganizationSettingsForm
            section="general"
            organizationName={organizationName}
            industryType={industryType}
            benchmarkParticipation={benchmarkParticipation}
            defaultRefreshCycleYears={defaultRefreshCycleYears}
            defaultInflationRate={defaultInflationRate}
            floorsEnabled={floorsEnabled}
            canManage={canManage}
          />
        </SettingsSection>
      )}

      {section === "lifecycle" && (
        <SettingsSection
          title="Lifecycle Defaults"
          description="These apply when no more-specific Space or asset override exists."
        >
          <OrganizationSettingsForm
            section="lifecycle"
            organizationName={organizationName}
            industryType={industryType}
            benchmarkParticipation={benchmarkParticipation}
            defaultRefreshCycleYears={defaultRefreshCycleYears}
            defaultInflationRate={defaultInflationRate}
            floorsEnabled={floorsEnabled}
            canManage={canManage}
          />
        </SettingsSection>
      )}

      {section === "benchmarking" && (
        <SettingsSection title="Benchmarking">
          <OrganizationSettingsForm
            section="benchmarking"
            organizationName={organizationName}
            industryType={industryType}
            benchmarkParticipation={benchmarkParticipation}
            defaultRefreshCycleYears={defaultRefreshCycleYears}
            defaultInflationRate={defaultInflationRate}
            floorsEnabled={floorsEnabled}
            canManage={canManage}
          />
        </SettingsSection>
      )}

      {section === "members" && (
        <SettingsSection title="Members & Access">
          <MembersList members={members} />
          {canManage && <TeamInvitationForm organizationId={organizationId} />}
        </SettingsSection>
      )}

      {section === "authentication" && (
        <SettingsSection title="Authentication" description="Multi-factor authentication for this account.">
          <MfaEnrollForm />
        </SettingsSection>
      )}
    </div>
  );
}
