---
paths:
  - "src/**/*.tsx"
---

# Component Patterns

## Shared Constants (NEVER redefine locally)
- ALWAYS import from `@/lib/constants/issue-config`: TYPE_CONFIG, PRIORITY_CONFIG, STATUS_DOT_COLORS, STATUS_BADGE_COLORS, AVATAR_GRADIENT, ISSUE_TYPES, PRIORITIES, UNASSIGNED_VALUE
- ALWAYS import from `@/lib/utils`: getInitials(), formatDate(), formatDateShort(), formatDateTime(), toggleArrayItem()

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

## Rich Text
- ALWAYS use `RichEditor` from `@/components/shared/rich-editor` for editable text (description, comments)
- ALWAYS use `RichContent` from same module for read-only HTML rendering
- PREFER `minimal` prop on RichEditor for comments (hides headings and image button)
- NEVER use plain `<Textarea>` for description or comment fields — use RichEditor
- Content stored as HTML string in DB — no schema change needed
- Loading spinner: use `<Spinner>` from `@/components/ui/spinner` on async submit buttons
