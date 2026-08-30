# Import Model

## Supported Formats

- CSV
- Excel (.xlsx)

## Import Philosophy

Importing must be extremely simple. Customers upload files themselves or provide files for team-assisted upload.

## Workflow

```
Upload → Inspect headers → Auto-map recognized fields → Ask about ambiguous fields → Preview → Process
```

- Mappings reusable for future imports from same organization/format
- Only interrupt user when necessary
- Do not make duplicate detection the center of the experience

## Phase 2 Development Import (Asset QT)

For development and testing, `scripts/import-asset-qt.mjs` ingests the Asset QT query-table CSV export.

**All accounts (recommended for this dataset):** creates one organization per `acc.Account Name`:

```bash
SUPABASE_SECRET_KEY=... npm run db:import-qt -- --all-accounts --replace
```

Accounts in the sample file: University of Utah, Weber State University, University Health Care, Yaamava Resort & Casino, Clearvista, Onset Financial, Utah Department of Transportation, Henkel of America.

**Single account** into an existing organization:

```bash
ORGANIZATION_ID=<uuid> npm run db:import-qt -- --account "Weber State University" --replace
```

Column mapping:

| CSV column | Target |
| --- | --- |
| `acc.Account Name` | Campus name; optional `--account` filter |
| `Lifecycle Asset Type` | Space type |
| `lm.Building Name` | Building |
| `lm.Room Code` | Physical location |
| `lm.Room Name` | Space display name |
| Asset columns (`al.*`) | Asset fields |
| `Install Date` / `Replacement Year` | Lifecycle timing |

This is a **development import**, not the Phase 4 user-facing import workflow. CSV has no cost column — valid lump-sum Spaces with $0 per-asset costs.

## Four Primary Import Actions

### 1. Add New Spaces

Used for initial onboarding and new deployments.

Creates:
- Spaces
- Assets
- Location assignments
- Costs
- Lifecycle timing
- Forecast components

### 2. Full Refresh

User declares intent: imported data represents current inventory after full refresh.

Behavior:
- Existing active assets → retired/historical
- Imported assets → active inventory
- Space remains the same
- Create Full Refresh event
- Update Space commissioned/refresh date
- Recalculate forecasts
- Preserve all history

Do NOT try to match old assets to new assets.

### 3. Partial Refresh

User must explicitly select existing assets being replaced.

Workflow:
```
Select Space → Select assets being replaced → Upload/enter new assets → Enter refresh date → Review → Complete
```

- No automatic inference of which assets were replaced
- No one-to-one replacement mapping required
- Does NOT reset entire Space lifecycle

### 4. Correct Inventory

For data corrections only:
- Fix manufacturer, model, serial, IP, MAC
- Add missing equipment or pricing
- Correct location data
- Fix import mistakes

Must NOT trigger refresh events or lifecycle resets.

Matching uses serial number, then MAC address. Manufacturer and model are not unique IDs. Unmatched rows with equipment fields are inserted. Empty mapped cells do not overwrite existing values. Forecasts are recalculated from the corrected inventory; `commissioned_date` is not changed.

## Column Mapping

System recognizes common column headings automatically. Unrecognized columns prompt user:

```
Source column: "EQ COST"
→ Dropdown: Cost
```

## Duplicate Handling

| Workflow | Duplicate Behavior |
|----------|-------------------|
| Add New Spaces | User declares intent; imported data is truth |
| Full Refresh | No reconciliation; imported data replaces active inventory |
| Partial Refresh | User selects assets being replaced |
| Correct Inventory | May use serial, MAC, external ID for matching |

Manufacturer/model/location assist matching but are not unique identifiers.

## Phase 4 Status

User-facing import is available at `/imports`.

Workflow:
1. Choose Add New Spaces, Full Refresh, Partial Refresh, or Correct Inventory
2. Select the Space (except Add New Spaces) and, for Partial Refresh, the assets being replaced
3. Upload CSV or Excel (max 50 MB; all rows in the file)
4. Inspect headers; recognized columns are mapped automatically
5. Confirm or fix remaining columns, optionally save the mapping
6. Process

Writes use the signed-in session and RLS (`can_write_organization`). Service role is not used for in-app imports. The Asset QT CLI script above remains a development tool.

Reusable mappings are stored in `import_mappings` per organization and workflow.

## Server-Side Processing

Imports are processed in Next.js server actions. The browser keeps the file and re-sends it for preview and process; nothing is stored as a temp upload. The upload limit is 50 MB so a full university inventory can go in one sheet. Larger files should be split. Background processing for even larger jobs is still an open question.
