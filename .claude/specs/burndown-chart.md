# Feature: Burndown Chart

## Status: done

## Context
Burndown chart in Sprint Summary tab showing ideal vs actual remaining story points per day.

## Acceptance Criteria
- [x] Chart renders in Summary tab for active sprints
- [x] X-axis: days of sprint (MM-DD format). Y-axis: story points remaining
- [x] Ideal burndown: dashed gray line, linear from totalPoints to 0
- [x] Actual burndown: solid primary-color line, based on completedAt dates
- [x] Tooltip shows exact values on hover
- [x] Loading skeleton while data fetches
- [x] Empty state when no active sprint

## Technical Notes
### Backend
- New endpoint: `GET /sprints/:id/burndown`
- Returns `{ totalPoints, days: [{ date, ideal, actual }] }`
- Calculates from sprint.startDate → sprint.endDate (or now)
- Issues with no storyPoints counted as 1 point
- Uses issue.completedAt to determine when issues were done

### Frontend
- Uses `recharts` (ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend)
- Tooltip uses CSS variables for theme-aware styling
- BurndownChart component at features/projects/components/burndown-chart.tsx
- useSprintBurndown hook in hooks/use-sprints.ts
- Integrated in SummaryView as full-width card above sprint details

## Files Affected
### Backend
- `src/core/constants/endpoint.constant.ts` — added BURNDOWN route
- `src/modules/sprints/sprints.controller.ts` — GET burndown endpoint
- `src/modules/sprints/sprints.service.ts` — getBurndown() method

### Frontend
- `src/lib/constants/endpoints.ts` — added sprints.burndown
- `src/features/projects/api.ts` — sprintsApi.burndown()
- `src/features/projects/hooks/use-sprints.ts` — useSprintBurndown hook
- `src/features/projects/components/burndown-chart.tsx` — new component
- `src/features/projects/components/summary-view.tsx` — integrated chart

## Dependencies Added
- recharts (FE)
