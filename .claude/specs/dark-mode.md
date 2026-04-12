# Feature: Dark Mode Toggle

## Status: done

## Context
TailwindCSS + Shadcn already support dark mode via CSS variables. Added toggle and fixed hardcoded light-only colors.

## Acceptance Criteria
- [x] Sun/Moon toggle button in header
- [x] Supports system preference (auto)
- [x] Persists theme choice across sessions
- [x] Dashboard stat cards have dark variants
- [x] Summary view charts/progress bars work in dark mode

## Technical Notes
- Uses `next-themes` ThemeProvider in root layout (attribute: class, defaultTheme: system)
- Toggle in `main-layout/components/header/index.tsx`
- All hardcoded `bg-*-50` colors need `dark:bg-*-950` variants

## Files Affected
- `src/app/layout.tsx` — ThemeProvider wrapper
- `src/components/layouts/main-layout/components/header/index.tsx` — toggle button
- `src/app/(main)/dashboard/client.tsx` — stat card dark colors
- `src/features/projects/components/summary-view.tsx` — chart/progress dark colors
