# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SipStory** - A matcha tasting journal web application for enthusiasts to rate brands and document their experiences. 

**Tagline:** Track every sip, tell every story

## Tech Stack

- **Astro v5** - SSR-enabled metaframework (output: "server", adapter: node standalone)
- **React v19** - For interactive UI components only
- **TypeScript v5** - Strict mode enabled
- **Tailwind CSS v4** - Utility-first styling via Vite plugin
- **Shadcn/ui** - Accessible component library (New York style, neutral base color)
- **Supabase** - Backend services (auth, database)

## Development Commands

```bash
npm run dev          # Start dev server on port 3000
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Format code with Prettier
```

**Node version:** v22.14.0 (see `.nvmrc`)

## Project Structure

```
src/
├── layouts/          # Astro layouts
├── pages/            # Astro pages (file-based routing)
│   └── api/          # API endpoints (POST, GET handlers)
├── middleware/       # Astro middleware (index.ts)
├── components/       # UI components
│   ├── ui/           # Shadcn/ui components (@/components/ui)
│   └── hooks/        # Custom React hooks
├── lib/              # Services and helpers
├── db/               # Supabase clients and types
├── types.ts          # Shared types (Entities, DTOs)
├── assets/           # Internal static assets
└── styles/           # Global CSS (global.css for Tailwind)
```

**Import aliases** (configured in tsconfig.json):
- `@/*` maps to `./src/*`

## Architecture Patterns

### Component Strategy
- **Astro components** (.astro) for static content and layouts
- **React components** (.tsx) only when interactivity is needed
- Never use "use client" or Next.js directives (React is used with Astro)

### API Routes
- Use uppercase HTTP methods: `export async function POST(context) {}`
- Add `export const prerender = false` for SSR API routes
- Validate input with Zod schemas
- Extract business logic to services in `src/lib/services`

### Supabase Integration
- Access Supabase via `context.locals.supabase` in Astro routes (not direct imports)
- Use `SupabaseClient` type from `src/db/supabase.client.ts`, not from `@supabase/supabase-js`
- Implement middleware in `src/middleware/index.ts` for auth/request handling

### Styling
- Use Tailwind utility classes
- Combine classes with `cn()` helper from `@/lib/utils`
- Shadcn components use CSS variables for theming (see `components.json`)
- Add new Shadcn components: `npx shadcn@latest add [component-name]`

### Error Handling
- Handle errors and edge cases at the beginning of functions
- Use early returns for error conditions
- Place happy path last for readability
- Avoid unnecessary else statements
- Implement proper error logging and user-friendly messages

### React Best Practices
- Use functional components with hooks
- Extract logic into custom hooks in `src/components/hooks`
- Use `React.memo()` for expensive components
- Use `useCallback` for event handlers passed to children
- Use `useMemo` for expensive calculations
- Use `useId()` for accessibility IDs

### Astro-Specific
- Leverage View Transitions API for smooth page transitions
- Use `Astro.cookies` for server-side cookie management
- Use `import.meta.env` for environment variables
- Implement hybrid rendering with `export const prerender = false` where needed

### Accessibility
- Use semantic HTML and ARIA landmarks
- Set `aria-expanded`, `aria-controls` for expandable content
- Use `aria-live` regions for dynamic updates
- Apply `aria-label`/`aria-labelledby` for unlabeled elements
- Avoid redundant ARIA that duplicates native semantics

## Code Quality

- **Linting:** ESLint v9 with Astro, React, TypeScript, and Prettier plugins
- **Pre-commit:** Husky + lint-staged auto-fixes on commit
- **Formatting:** Prettier with astro plugin

Files auto-fixed on commit:
- `*.{ts,tsx,astro}` → ESLint fix
- `*.{json,css,md}` → Prettier format

## MVP Features 

1. **User Authentication** - Registration, login, secure password handling
2. **CRUD Operations** - Create, read, update, delete tasting notes
3. **Core Data Models:**
   - Users (authentication)
   - Tasting Notes/Entries (brand, date, rating, flavor notes, preparation, photos, price, source)
   - Matcha Brands (reference data)

See `PROJECT_BRIEF.md` for complete feature roadmap and future expansion plans.