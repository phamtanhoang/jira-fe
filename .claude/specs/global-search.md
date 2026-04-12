# Feature: Global Search with Cmd+K

## Status: done

## Context
Command palette that lets users search issues, projects, and workspaces from anywhere in the app.

## Acceptance Criteria
- [x] Cmd+K (Mac) and Ctrl+K (Windows) opens the palette
- [x] Search across issue titles, issue keys (via BE API `GET /issues?search=`)
- [x] Search workspaces client-side from cached data
- [x] Results grouped by type: Issues / Workspaces
- [x] Keyboard navigation: arrow keys + Enter to select
- [x] Esc closes the palette (click overlay also closes)
- [x] Recent workspaces shown when input is empty (first 5)
- [x] Navigate to result on Enter or click
- [x] Search trigger button in header with "Ctrl K" hint
- [x] Debounce 300ms on issue search
- [x] Loading spinner while searching

## Technical Notes
- Uses `cmdk` library for Command component (aria-compliant, keyboard nav built-in)
- `shouldFilter={false}` — filtering handled by BE for issues, client-side for workspaces
- Issue search: direct API call to `GET /issues?search=query` (debounced 300ms)
- Workspace search: client-side filter on `useWorkspaces()` cached data
- Results limited: issues 8, workspaces 5
- Overlay: fixed z-50, black/50 backdrop, click-to-close
- Footer: keyboard shortcut hints (↑↓ navigate, ↵ select, esc close)

## Files Affected
- `src/components/shared/command-palette/index.tsx` — new component
- `src/components/layouts/main-layout/components/header/index.tsx` — CommandPalette in header

## Dependencies Added
- cmdk
