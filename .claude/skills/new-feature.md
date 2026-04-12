---
name: new-feature
description: Add a new feature page with proper page/client split, hooks, i18n, and metadata
allowed-tools: Bash, Write, Edit, Read, Grep
---

# Add New Feature

## Checklist

1. **Create page files:**
   - `src/app/(main)/{route}/page.tsx` — server component:
     ```tsx
     import { createGenerateMetadata } from "@/lib/utils/server";
     import PageClient from "./client";
     export const generateMetadata = createGenerateMetadata("meta.{titleKey}", "meta.{descKey}");
     export default PageClient;
     ```
   - `src/app/(main)/{route}/client.tsx` — "use client" component with actual UI

2. **Add i18n keys** to BOTH `src/messages/vi.json` AND `src/messages/en.json`:
   - `meta.{titleKey}` and `meta.{descKey}` for page metadata
   - Any UI text keys needed

3. **Add route** to `src/lib/constants/routes.ts`

4. **Add API endpoints** to `src/lib/constants/endpoints.ts` (if new BE endpoints)

5. **Add API methods** to `src/features/{module}/api.ts`

6. **Add hooks** to appropriate `src/features/{module}/hooks/use-{domain}.ts` file. Re-export from hooks/index.ts

7. **Add types** to `src/features/{module}/types.ts`

8. **Use shared imports:**
   - Constants from `@/lib/constants/issue-config`
   - Utils from `@/lib/utils` (getInitials, formatDate, etc.)
   - COOKIE_AUTH from `@/lib/constants/settings`

9. **Dark mode:** Add `dark:` variants for all hardcoded bg colors

10. **Build check:** Run `npx next build`
