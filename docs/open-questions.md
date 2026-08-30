# Open Questions

Unresolved items requiring product or technical decisions. Do not silently decide these during implementation.

## Product

1. **External/customer asset ID format** — What validation rules apply when this is added?
2. **Space types** — Should organizations define their own type list, or is there a suggested starter set?
3. **Read Only role** — Is this needed in the first release with real auth?
4. **Planned full refresh interaction** — Exact UX for overriding individual asset refresh years while preserving calculations?
5. **Emergency / Individual Replacement** — Phase 3 folds this into Partial Refresh. Selecting one asset writes `individual_replacement`. A separate menu item is still optional later.
6. **Export formats priority** — Which export format is needed first: CSV, Excel, or PDF?
7. **Multi-campus default structure** — How should organizations with a single campus be onboarded? Skip campus level?
8. **Fiscal year vs calendar year** — Do organizations forecast by fiscal year? Configurable?
9. **Currency** — Single currency (USD) for MVP, or multi-currency support needed?
10. **Team-assisted import** — Internal admin role for uploading on behalf of customers?

## Technical

1. **Forecast materialization** — Pre-compute forecast amounts or calculate on demand?
2. **Large import batch size** — Thresholds for background processing vs synchronous? Phase 4 stays synchronous up to 50 MB.
3. **Amplify SSR configuration** — Specific Next.js features supported on Amplify hosting?
4. **Supabase project strategy** — One project per environment, or branch-based local dev only?
5. **Session management** — Cookie-based SSR auth pattern details for Amplify deployment?

## Compliance (Future)

1. **Data residency** — Required for any target customers?
2. **Retention policies** — How long to retain retired asset records and audit logs?
