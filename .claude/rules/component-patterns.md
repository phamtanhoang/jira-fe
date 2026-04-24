---
paths:
  - "src/**/*.tsx"
---

# Component Patterns

## Shared Constants (NEVER redefine locally)
- ALWAYS import from `@/lib/constants/issue-config`: TYPE_CONFIG, PRIORITY_CONFIG, STATUS_DOT_COLORS, STATUS_BADGE_COLORS, AVATAR_GRADIENT, ISSUE_TYPES, PRIORITIES, UNASSIGNED_VALUE
- ALWAYS import from `@/lib/utils`: getInitials(), formatDate(), formatDateShort(), formatDateTime(), toggleArrayItem()
- ALWAYS import UI sizing / timing / HTTP thresholds from `@/lib/constants/ui`: `UI_SIZES`, `RICH_EDITOR`, `HTTP_STATUS_RANGE`, `DEBOUNCE`. NEVER hardcode `240` / `300ms` / `400`.

## Avatar Initials
- ALWAYS use `getInitials(name, email?)` from @/lib/utils
- NEVER write `(name ?? "?").charAt(0).toUpperCase()` inline
- ALWAYS use `AVATAR_GRADIENT` constant for gradient avatar fallback class

## Dark Mode
- ALWAYS add `dark:` variant when using hardcoded light colors: bg-blue-50 → dark:bg-blue-950
- PREFER semantic Tailwind colors: bg-card, bg-muted, text-foreground, border

## Transitions
- ALWAYS add `transition-all duration-150` or `duration-200` on hover/drag effects
- ALWAYS show Pencil icon on hover for inline-editable fields (opacity-0 → group-hover:opacity-100)

## Drag & Drop
- Issue cards: cursor-grab, dragging state → rotate-2 scale-105 opacity-60, onDragEnd resets
- Column drop zone: scale-[1.02] shadow-lg on dragOver
- Backlog rows: press-and-hold (dnd-kit `PointerSensor { activationConstraint: { delay: 180, tolerance: 5 } }`) — no drag-handle icon
- While a mutation is in-flight, disable drag (`draggable={!isPending}`) and show `<Spinner>` overlay. See `IssueCard` + `usePendingIssueIds`

## Rich Text
- ALWAYS use `RichEditor` from `@/components/shared/rich-editor` for editable text (description, comments)
- `RichEditor` is lazy-loaded via `next/dynamic` (Tiptap is ~80KB). Don't import from `./editor.client` directly — always via the public `./rich-editor` entry point
- ALWAYS use `RichContent` from same module for read-only HTML rendering. `RichContent` is sync — no lazy load, no Tiptap dependency
- PREFER `minimal` prop on RichEditor for comments (hides headings and image button)
- NEVER use plain `<Textarea>` for description or comment fields — use RichEditor
- Content stored as HTML string in DB — no schema change needed
- Loading spinner: use `<Spinner>` from `@/components/ui/spinner` on async submit buttons

## Empty state
- ALWAYS use `<EmptyState icon title description action />` from `@/components/ui/empty-state` for "no data" blocks
- NEVER redeclare the `flex flex-col items-center justify-center text-muted-foreground` pattern inline
- `compact` prop for inline panels (inside a card); default is full-page

## Memoizing list rows
- Components rendered 50+ times in a list MUST be wrapped in `React.memo`. Canonical: `IssueCard`, `IssueRow`, `LogsTable::LogRow`
- Parent MUST pass stable `onClick` via `useCallback` or the memo does nothing
