# Jira Frontend

A modern Next.js application for Jira frontend with authentication, internationalization, and responsive UI components.

## Tech Stack

- **Framework**: Next.js 14+ with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Form Handling**: React Hook Form
- **API Client**: Axios
- **Internationalization**: i18n (EN, VI)
- **UI Components**: Custom component library

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
