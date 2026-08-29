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

## Phase 1 Status

Import functionality not yet implemented. Navigation and documentation prepared.

## Server-Side Processing

Imports should be processed server-side using service role credentials (never exposed to browser). Large files processed in batches with progress feedback.
