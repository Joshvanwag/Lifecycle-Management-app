# Deployment

This app is a Next.js 15 App Router project with Supabase for PostgreSQL, Auth, and RLS. Hosting is planned on AWS Amplify Hosting. **Do not provision Amplify, CI, or monitoring from this repository unless a human explicitly approves it.**

## What would be deployed

- Next.js production build (`npm run build` / `npm run start`)
- Environment variables for the target Supabase project
- Custom domain and HTTPS at the host

## Environment variables

Copy from `.env.example` (or the local `.env.local` keys, never the file itself):

| Variable | Where | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server | Publishable / anon key |
| `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` | Server / admin scripts only | Never expose to the client |
| `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` | Server (`@supabase/server`) if used | Same project |

Admin scripts (`db:seed`, `db:import-qt`, `db:apply-space-costs`) need the secret key. The web app user-facing writes use the signed-in session and RLS.

## Amplify (when approved)

1. Create an Amplify Hosting app for this existing GitHub repository.
2. Build setting: Node, `npm ci` / `npm run build`, output Next.js (SSR).
3. Set the environment variables above per environment (preview vs production).
4. Point the custom domain at Amplify after DNS is ready.
5. Apply Supabase migrations to the target project before first traffic.

Do not add GitHub Actions, Docker, Redis, Sentry, or a separate API service unless approved.

## Database

Schema changes ship as files in `supabase/migrations/`. Apply them with the Supabase CLI or MCP `apply_migration` against the intended project. Destructive migrations need explicit human approval.

## After deploy smoke checks

- Sign in with an invited user
- Overview, Spaces, Assets, Forecast, Capital Plan, Reports
- One file import and one Correct Inventory edit
- Settings members list and MFA enroll (optional)
