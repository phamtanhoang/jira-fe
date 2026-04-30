# Jira Clone — Frontend

[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

A modern Next.js 16 (App Router) frontend for the [Jira Clone backend](../jira-be) — authentication, project boards (Kanban + Scrum), sprint planning, custom fields, real-time mentions, and PWA-ready mobile experience.

🤝 **[CONTRIBUTING.md](./CONTRIBUTING.md)** — quick start + PR checklist + conventions.
🔒 **[SECURITY.md](./SECURITY.md)** — responsible disclosure policy.
📝 **[CHANGELOG.md](../CHANGELOG.md)** — recent changes grouped by phase.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript 5 (strict + noUnused/Implicit/Fallthrough flags)
- **Styling**: TailwindCSS 4 + tw-animate-css + clsx/tailwind-merge
- **UI primitives**: @base-ui/react (shadcn-style) + lucide-react icons
- **State**: Zustand (settings + locale) + TanStack Query 5 (server state)
- **Forms**: react-hook-form + Zod resolvers
- **HTTP**: single axios instance with GET dedupe + 401 auto-refresh + 429 retry
- **Rich text**: Tiptap (lazy-loaded, ~80 KB chunk)
- **i18n**: vi (default) + en — both via JSON message files
- **Observability**: Sentry (production only) + breadcrumb buffer + `/logs/client` ingest
- **PWA**: manifest + service worker + Web Push subscriptions

## Features

- User authentication (Sign In, Sign Up, Email Verification)
- Multi-language support (English, Vietnamese)
- Responsive dashboard
- Role-based layout system
- Server-side middleware for route protection

## Project Structure

```
src/
├── app/              # Next.js app directory with routes
├── components/       # React components (UI, layouts, providers)
├── features/         # Feature modules (auth, main)
├── lib/             # Utilities, API clients, stores, config
├── messages/        # i18n translations
└── middleware.ts    # Route protection middleware
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

### Environment Variables

Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_API_URL=your_api_url
# Add other required environment variables
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Authentication

The application includes built-in authentication flows:
- Sign In page at `/sign-in`
- Sign Up page at `/sign-up`
- Email verification at `/verify-email`

Protected routes are managed via middleware and require valid authentication.

## Internationalization

Translations are located in `src/messages/`:
- `en.json` - English translations
- `vi.json` - Vietnamese translations

Switch languages using the locale switcher component.

## Contributing

Please follow the existing code style and structure when contributing.

## License

MIT
