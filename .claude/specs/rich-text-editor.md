# Feature: Rich Text Editor for Description & Comments

## Status: done

## Context
Replace plain textarea with Tiptap. Supports bold, italic, headings, code blocks, bullet lists, and inline image paste. Backward compatible with existing plain text data.

## Acceptance Criteria
- [x] Bold, italic, heading H1–H3, code block, bullet/numbered list render correctly
- [x] Paste image inline — convert to base64 and store in description field
- [x] Existing plain text data renders without breaking
- [x] Editor used in both IssueDetail description and CommentForm
- [x] Character count warning at 5000 chars

## Technical Notes
- Tiptap with StarterKit + Placeholder + CharacterCount + Image extensions
- `immediatelyRender: false` required for Next.js SSR compatibility
- No DB schema change — stores HTML string in existing description/content fields
- Comments use `minimal` prop (no headings, no image button)
- `RichContent` component for read-only HTML rendering with `dangerouslySetInnerHTML`

## Files Affected
- `src/components/shared/rich-editor/index.tsx` — RichEditor + RichContent components
- `src/app/(main)/issues/[key]/client.tsx` — description editing
- `src/features/projects/components/issue-comments.tsx` — comment form + display
