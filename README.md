# Lifecycle Management

A multi-tenant SaaS platform for lifecycle management of technology and equipment portfolios. Organizations import inventory, organize equipment into **Spaces**, establish lifecycle assumptions, forecast future replacement costs, and plan capital budgets.

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, RLS)
- **Hosting:** AWS Amplify (planned)

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Supabase CLI (for local development, Phase 2+)

### Installation

```bash
npm install
cp .env.example .env.local
# Add Supabase credentials (see Environment Variables below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Supabase setup (Phase 2)

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Add credentials to `.env.local` (see table below).
3. Apply migrations from `supabase/migrations/` using the Supabase SQL editor or CLI:
   ```bash
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
4. Sign up at `/signup` to create your organization.
5. Seed demo portfolio data (optional):
   ```bash
   ORGANIZATION_ID=<your-org-uuid> npm run db:seed
   ```
6. Import Asset QT query-table data (optional):
   ```bash
   # All 8 accounts → one organization per acc.Account Name (requires service role)
   SUPABASE_SECRET_KEY=... npm run db:import-qt -- --all-accounts --replace

   # Or a single account into your signed-up organization
   IMPORT_EMAIL=you@example.com IMPORT_PASSWORD=... ORGANIZATION_ID=<uuid> \
     npm run db:import-qt -- --account "University of Utah" --replace
   ```
   CSV source: `data/Lifecycle_Management_Asset_QT.csv` (2,586 assets, 8 accounts).

### Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Project URL for `@supabase/server` |
| `SUPABASE_PUBLISHABLE_KEY` | New publishable API key |
| `SUPABASE_SECRET_KEY` | Server-only secret key — never expose to browser |
| `SUPABASE_JWKS_URL` | JWKS endpoint for JWT verification |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser-safe project URL for Next.js clients |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe publishable key |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Alias for the publishable (or legacy anon) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Legacy alias for `SUPABASE_SECRET_KEY` |

## Project Structure

```
src/
  app/              # Next.js App Router pages
  components/       # React components (ui, layout, feature)
  config/           # App configuration (navigation, etc.)
  lib/              # Utilities, types, Supabase clients, demo data
docs/               # Product and architecture documentation
supabase/           # Supabase config and migrations
```

## Development Status

**Phase 1:** Application foundation, UI shell, demo data, documentation.

**Phase 2:** Supabase schema, tenant isolation, RLS, authentication, live data on Overview and Spaces pages.

**Phase 3:** Lifecycle engine, compound-inflation forecasts, planning status, and in-app refresh actions.

**Phase 4 (current):** CSV/Excel import for Add Spaces, Full Refresh, Partial Refresh, and Correct Inventory.

## Documentation

See the [`/docs`](./docs/) directory for product specification, architecture, data model, and engineering decisions.

## AI Engineering

See [`AGENTS.md`](./AGENTS.md) for repository-level instructions for AI agents working on this codebase.
