# Feature: File Attachments

## Status: done

## Context
Upload files to issues. Drag-drop or click to browse. Image preview modal. Author can delete.

## Acceptance Criteria
- [x] Drag-and-drop upload zone in issue detail sidebar
- [x] Click to browse files
- [x] Max 10MB per file
- [x] Allowed: images, PDF, zip, doc/docx, xls/xlsx, txt, csv
- [x] Files listed with filename, size, uploader, date
- [x] Click image thumbnail → opens preview modal
- [x] Click non-image filename → opens in new tab
- [x] Download button on hover
- [x] Author can delete their own attachment
- [x] Activity logged on upload (ATTACHED action)
- [x] Upload spinner during upload

## Technical Notes
### Backend
- New module: `src/modules/attachments/` (controller + service + module)
- Uses Multer with diskStorage → `uploads/` directory
- `@nestjs/serve-static` serves `/uploads/*` as static files
- Endpoints: `POST /issues/:id/attachments` (multipart), `GET /issues/:id/attachments`, `DELETE /attachments/:id`
- File validation: mime type whitelist + 10MB size limit
- Author-only delete check

### Frontend
- Component: `src/features/projects/components/attachment-section.tsx`
- Hooks: `useAttachments`, `useUploadAttachment`, `useDeleteAttachment` in `hooks/use-attachments.ts`
- Drag-drop zone with visual highlight on dragOver
- Image preview: fixed overlay modal with click-to-close
- File size formatted: B / KB / MB

## Files Affected
### Backend
- `src/modules/attachments/attachments.module.ts` — new
- `src/modules/attachments/attachments.controller.ts` — new
- `src/modules/attachments/attachments.service.ts` — new
- `src/app.module.ts` — added AttachmentsModule + ServeStaticModule
- `src/core/constants/endpoint.constant.ts` — added BURNDOWN route (sprints)

### Frontend
- `src/features/projects/components/attachment-section.tsx` — new
- `src/features/projects/hooks/use-attachments.ts` — new
- `src/features/projects/hooks/index.ts` — barrel export
- `src/features/projects/api.ts` — attachment API methods
- `src/features/projects/types.ts` — Attachment type
- `src/features/projects/components/issue-detail-sidebar.tsx` — integrated
- `src/lib/constants/endpoints.ts` — attachments endpoints
- `src/messages/en.json` + `vi.json` — i18n keys

## Dependencies Added
- @nestjs/serve-static (BE)
- @types/multer (BE dev)
