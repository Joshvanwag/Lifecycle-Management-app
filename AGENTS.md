# AI Engineering Rules

These rules are mandatory project-level engineering constraints for AI agents and human contributors.

## General

- Read the relevant `/docs` files before major implementation.
- Do not invent business requirements.
- Do not silently change product behavior.
- Update documentation when architecture changes.
- Prefer understandable code and simple architecture.
- Avoid unnecessary dependencies.
- Do not prematurely create abstractions or microservices.
- Do not introduce a new package or service without documenting why it is needed.
- Do not replace an existing architectural decision without recording the change in `/docs/decisions.md`.
- If a requirement is ambiguous, stop that implementation path and add it to `/docs/open-questions.md` rather than inventing an answer.

## Security and Tenancy

- Every customer-owned table must be evaluated for `organization_id` and tenant isolation.
- Every data-access path must be evaluated for authentication and authorization.
- Never trust `organization_id`, `user_id`, `role`, or permissions solely because they came from the browser.
- Never bypass Supabase RLS as a shortcut.
- Never weaken tenant security to make functionality work.
- Never expose service-role credentials to the client.
- Never commit secrets.
- Any code that changes permissions or RLS must update the security documentation.
- Cross-tenant access must never be enabled for convenience.

## Database and Migrations

- Use database migrations for all schema changes.
- Never make production data model changes without a migration.
- Clearly flag destructive database changes.
- Destructive migrations require explicit human approval.
- Do not automatically perform destructive production operations.
- Do not remove historical data to simplify implementation.

## Lifecycle and Forecasting

- Any code that changes lifecycle calculations must update `/docs/lifecycle-model.md` and/or `/docs/forecasting-model.md`.
- Do not overwrite physical asset history when equipment is replaced.
- Do not collapse lump-sum cost logic into fake per-asset costs.
- Historical actual costs must never be rewritten because inflation assumptions changed.
- Never silently reset a Space lifecycle because assets were edited.
- Do not assume all assets in a Space share the same future replacement year after partial refreshes.
- Forecasting must preserve separate lifecycle timing for independently refreshed assets and lump-sum cost components.
- The dashboard may be Space-driven, but the underlying forecast must correctly account for asset-level and lump-sum lifecycle timing.

## Imports

- Any code that changes import behavior must update `/docs/import-model.md`.
- Preserve the four primary workflows:
  1. Add New Spaces
  2. Full Refresh
  3. Partial Refresh
  4. Correct Inventory
- Partial Refresh must require the user to explicitly select the assets being replaced.
- Full Refresh must not try to reconcile old and new assets as duplicates.
- Correct Inventory must not accidentally trigger lifecycle events.
- Do not make duplicate matching the center of the workflow.
- Import UX should minimize required manual intervention.

## UX

- Do not make the UI expose internal financial/lifecycle complexity unless the user needs it.
- Optimize for simple user workflows even when the underlying data model is sophisticated.
- Avoid clutter.
- Avoid exposing internal IDs unnecessarily.
- Do not force customers to manufacture data they do not have.
- Use sensible defaults.
- Only ask for information when it is necessary to complete the user's intended action.
- Every clickable element must display the pointer cursor on hover.
- Text-entry elements must display the text cursor.

## Tooling and Infrastructure

- Avoid adding enterprise tooling, testing frameworks, monitoring services, or infrastructure unless explicitly approved.
- Do not create unnecessary backend services when Supabase or Next.js already provides the required capability.
- Do not provision external infrastructure or production resources without explicit approval.
- Do not add Docker, Kubernetes, Redis, a separate API service, GitHub Actions, Playwright, Vitest, Sentry, Vanta, or similar tooling unless explicitly approved later.

## Git / Source Control

- Use the existing connected GitHub repository.
- Do not initialize a new Git repository.
- Do not create a new GitHub repository.
- Do not replace, reinitialize, or change the Git remote without explicit approval.
- Preserve the existing Git remote and repository configuration.
- Keep commits focused and understandable.
- Do not commit secrets, local environment files, build artifacts, generated dependency directories, or other inappropriate files.
- Never force-push or rewrite shared Git history without explicit approval.

## Cursor Cloud specific instructions

- **Secrets:** Cloud Agents need `SUPABASE_SECRET_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`) in Cursor environment secrets or `/workspace/.env.local` for admin scripts. The publishable/anon key alone is not enough for `--all-accounts` import or `db:seed`.
- **Portfolio import:** After migrations are applied, run `./scripts/run-import-all-accounts.sh` (or `npm run db:import-qt -- --all-accounts --replace`) — uses the Node script and Supabase JS client, not MCP SQL chunks.
- **Demo org:** `University of Example` (`b0c29489-416a-46b0-ad61-4fc44cc2b9f7`) is separate from the 8 benchmark portfolio orgs. Do not rename it during import tests.
- **Dev server:** `npm run dev` on port 3000 (also configured in `.cursor/environment.json` terminals).
