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
# Add Supabase credentials when available
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service role key — never expose to browser |

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

**Phase 1 (current):** Application foundation, UI shell, demo data, documentation.

**Phase 2 (next):** Supabase schema, tenant isolation, RLS, real data.

## Documentation

See the [`/docs`](./docs/) directory for product specification, architecture, data model, and engineering decisions.

## AI Engineering

See [`AGENTS.md`](./AGENTS.md) for repository-level instructions for AI agents working on this codebase.
