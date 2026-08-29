# Architecture Decisions

Record of significant decisions. Update when decisions change.

## ADR-001: Next.js App Router at Repository Root

**Date:** Phase 1  
**Status:** Accepted

Scaffold Next.js directly at repository root (not nested folder). Repository root is the application root.

**Rationale:** Simpler deployment, standard monorepo-free startup architecture.

## ADR-002: Supabase as Backend

**Date:** Phase 1  
**Status:** Accepted

Use Supabase for PostgreSQL, authentication, MFA, SSO, and RLS. No separate API server.

**Rationale:** Startup simplicity; Supabase provides required backend capabilities.

## ADR-003: Server-Side Privileged Operations

**Date:** Phase 1  
**Status:** Accepted

Imports, lifecycle updates, financial calculations, and admin functions run server-side via Next.js with service role credentials.

**Rationale:** Security requirement; never expose service role to browser.

## ADR-004: Space as Primary Lifecycle Object

**Date:** Phase 1  
**Status:** Accepted

User-facing term is "Space" for lifecycle-managed environments. Not "AV System", "Managed Unit", or "Lifecycle Group".

**Rationale:** Product specification; generic enough for multiple asset categories.

## ADR-005: Immutable Asset History

**Date:** Phase 1  
**Status:** Accepted

Equipment replacements create new asset records; old assets are retired. Never overwrite physical asset records.

**Rationale:** Historical continuity for lifecycle planning and audit.

## ADR-006: Lump-Sum Cost Support

**Date:** Phase 1  
**Status:** Accepted

Spaces may have lump-sum costs with $0 per-asset costs. Do not force per-asset pricing.

**Rationale:** Many customers only know total Space cost.

## ADR-007: Demo Data for Phase 1 UI

**Date:** Phase 1  
**Status:** Accepted

Overview and Spaces pages use isolated static demo data (`src/lib/demo-data.ts`) until Supabase schema is implemented.

**Rationale:** Enables polished UI development without production database.

## ADR-008: shadcn/ui Component Pattern

**Date:** Phase 1  
**Status:** Accepted

Use shadcn/ui (Radix primitives + Tailwind) for UI components. Components copied into `src/components/ui/`.

**Rationale:** Accessible, customizable, no runtime dependency lock-in.

## ADR-009: AWS Amplify Hosting (Planned)

**Date:** Phase 1  
**Status:** Proposed, not yet configured

Target hosting platform is AWS Amplify. Not provisioned in Phase 1.

**Rationale:** Product specification; deliberate simplicity over Kubernetes/Docker.

## ADR-010: No Testing Framework in Phase 1

**Date:** Phase 1  
**Status:** Accepted

No Playwright, Vitest, or other testing framework added in initial foundation.

**Rationale:** Explicit product guidance to avoid premature tooling.
