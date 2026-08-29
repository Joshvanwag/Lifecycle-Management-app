# Lifecycle Model

## Space Lifecycle

When a Space is created, equipment initially inherits the Space's lifecycle timing.

Example:
- Space commissioned: 2024
- Refresh cycle: 7 years
- Recommended initial refresh: 2031

## Independent Asset Lifecycles

**Spaces do not have to be refreshed all together.**

After partial replacements, replaced assets receive independent lifecycle schedules. Remaining original assets continue on their original schedule.

Example — Classroom 101:
- Original equipment: 2024, 7-year cycle → 2031 refresh
- Display replaced: 2028 → new Display refresh: 2035
- DSP, Processor, Amplifier, Speakers still contribute to 2031

One Space may contribute replacement costs to multiple future years.

## Lifecycle Status (Calculated)

| Status | Condition |
|--------|-----------|
| Upcoming | Recommended year is in the future |
| Due | Recommended year is the current year |
| Overdue | Recommended year is in the past |

**Deferred is NOT a lifecycle status.** It is a planning status.

## Planning Status (Separate)

| Status | Description |
|--------|-------------|
| Unplanned | No planning decision recorded |
| Scheduled | Planned for a specific future period |
| Deferred | Intentionally pushed to a later period |
| Completed | Refresh has been completed |

Example: Lifecycle Status = Overdue, Planning = Scheduled FY2030.

## Default Refresh Cycle

- Default: 7 years
- Configurable at organization level
- Future: by Space type, by asset category
- Individual Spaces/assets may override

Do not hard-code 7 years in business logic.

## Refresh Events

Spaces preserve history. Do not archive and recreate Spaces after refreshes.

| Event Type | Description |
|------------|-------------|
| Initial Deployment | First equipment installation |
| Full Refresh | All active assets replaced |
| Partial Refresh | Selected assets replaced |
| Emergency / Individual Replacement | Single asset replacement |

History is never deleted.

## Asset History

When physical equipment changes:
- Old asset → retired/historical (preserves install and removal dates)
- New asset → new record, active, new install date, new lifecycle

Never overwrite one physical asset with another.

## Planned Full Refresh

Organizations can intentionally plan a full Space refresh even when assets have different lifecycle years. This is a planning decision that does not destroy asset-level history or calculations.

## Four Primary Workflows

### Add New Spaces
Create Spaces, Assets, locations, costs, lifecycle timing, and forecast components from import.

### Full Refresh
- Retire existing active assets
- Imported assets become active inventory
- Space remains the same
- Create Full Refresh event
- Update commissioned/refresh date
- Preserve all history

### Partial Refresh
- User explicitly selects assets being replaced
- User uploads/enters new assets
- Does NOT reset entire Space lifecycle
- No automatic old-to-new asset matching required

### Correct Inventory
- Fix data errors only
- Must NOT trigger refresh events or lifecycle resets
