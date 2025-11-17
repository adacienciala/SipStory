# SipStory

> A specialized, personal matcha tasting journal for tracking, comparing, and learning from your premium matcha experiences.

## Table of Contents

1. [Project Name](#sipstory)
2. [Project Description](#project-description)
3. [Tech Stack](#tech-stack)
4. [Getting Started Locally](#getting-started-locally)
5. [Available Scripts](#available-scripts)
6. [Project Scope](#project-scope)
7. [Project Status](#project-status)
8. [License](#license)

## Project Description

Matcha enthusiasts investing in premium products often lack a structured, dedicated tool to record nuanced tasting details (umami depth, foam quality, sweetness vs bitterness). General note or tea apps miss matcha-specific attributes, making it hard to remember which expensive blends are worth reordering. SipStory solves this by providing an authenticated, private web application where users:

- Log detailed tasting notes with both required and optional structured fields.
- Maintain consistency via autocomplete suggestion of previously used Brands, Blends, and Regions.
- Filter and sort entries to rapidly locate high-quality tastings.
- Compare any two tastings side-by-side for direct evaluation.

## Tech Stack

| Layer                | Technology                                      | Purpose / Notes                                       |
| -------------------- | ----------------------------------------------- | ----------------------------------------------------- |
| Framework            | Astro 5 (`astro@^5.13.7`)                       | Hybrid rendering, performance-first, server endpoints |
| UI Library           | React 19 (`react@^19.1.1`)                      | Interactive components where needed                   |
| Styling              | Tailwind CSS 4 (`tailwindcss@^4.1.13`)          | Utility-first responsive styling                      |
| Component Primitives | Shadcn/ui + Radix (`@radix-ui/react-slot`)      | Accessible, composable UI foundations                 |
| Backend & Auth       | Supabase                                        | PostgreSQL + Auth (email/password)                    |
| Unit Testing         | Vitest + React Testing Library                  | Component & function testing with coverage (c8)       |
| E2E Testing          | Playwright                                      | End-to-end user flow testing                          |
| API Testing          | REST Client (VS Code) + Postman                 | Direct endpoint validation                            |
| Tooling              | TypeScript 5, ESLint 9, Prettier + Astro plugin | Quality, consistency                                  |
| Deployment           | Cloudflare Pages                                | Jamstack platform for frontend applications           |
| CI/CD                | GitHub Actions                                  | Automated build, lint, tests                          |

Runtime Node version: see `.nvmrc`.

## Getting Started Locally

### Prerequisites

- Node.js (use `nvm` for version management)
- npm (bundled with Node) or alternative (pnpm/yarn) if preferred
- A Supabase project (for Auth & DB)

### 1. Clone the repository

```bash
git clone <repository-url>
cd SipStory
```

### 2. Use the correct Node version

```bash
nvm install
nvm use
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file:

```bash
cp .env.example .env
```

Add your Supabase credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

**Note:** This project uses Astro's `astro:env` module for type-safe environment variables. Variables are defined in `astro.config.mjs` and automatically validated.

### 5. Run the development server

```bash
npm run dev
```

Access the app at the printed local URL (default: `http://localhost:3000`).

### 6. Lint & Format (optional during development)

```bash
npm run lint
npm run format
```

### 7. Build for production

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

### 8. Deployments & Releases

The project is configured for continuous deployment to **Cloudflare Pages**. Every push to the `main` branch triggers a new build and deployment via GitHub Actions.

### 9. Shadcn/ui Components

Components will reside under `src/components/ui`. Generate new components using the project’s helper scripts (to be added). Follow accessibility guidelines (ARIA attributes, focus management).

### 10. Tailwind CSS

Global styles: `src/styles/global.css`. Use arbitrary values for one-offs and responsive variants (`sm: md: lg:`). Prefer semantic component abstractions + variant utilities.

## Available Scripts

| Script   | Command              | Purpose                        |
| -------- | -------------------- | ------------------------------ |
| dev      | `astro dev`          | Start local development server |
| build    | `astro build`        | Production build               |
| preview  | `astro preview`      | Preview built site locally     |
| astro    | `astro`              | Direct Astro CLI access        |
| lint     | `eslint .`           | Run linter                     |
| lint:fix | `eslint . --fix`     | Auto-fix lint issues           |
| format   | `prettier --write .` | Format codebase                |

## Project Scope

### In Scope (MVP)

- Supabase email/password authentication & protected routes.
- Mandatory onboarding screen on first login.
- Full CRUD for tasting notes with structured matcha-specific fields.
- Side-by-side comparison view for any two user notes.
- Filtering by Brand, Region, Minimum Rating.
- Autocomplete suggestions based on user’s own historical entries.
- Responsive UI (mobile ~390px, desktop ~1440px).
- CI/CD pipeline (build + lint + E2E tests) via GitHub Actions.
- Deployment to publicly accessible URL (Cloudflare Pages target).

### Out of Scope (MVP)

- Image/photo uploads.
- Community sharing, messaging, or public profiles.
- Central moderation of master Brand/Blend lists.
- Advanced trackers (availability, price/value trend, seasonal origin insights, cafés, inventory, swap network).
- Native mobile apps (iOS/Android).
- Third-party retailer or external API integrations.

## Project Status

**Current Phase: MVP Complete & Launched** 🎉✨

**Launch Date: November 16, 2025**

### ✅ All Features Completed

#### Backend & Database

- ✅ Supabase client integration with TypeScript types
- ✅ Database migrations for all core entities (regions, brands, blends, tasting_notes)
- ✅ Row-level security (RLS) policies implemented
- ✅ Database indexes and triggers configured
- ✅ Custom email templates for authentication flows

#### Authentication & Authorization

- ✅ Email/password authentication via Supabase Auth
- ✅ User registration and login flows
- ✅ Password reset functionality with email confirmation
- ✅ Protected routes middleware
- ✅ Session management
- ✅ Branded confirmation and recovery email templates

#### Core CRUD Features

- ✅ Full CRUD API endpoints for tasting notes
- ✅ Create, read, update, delete tasting notes
- ✅ Validation with Zod schemas
- ✅ API endpoints for brands, blends, and regions

#### User Interface

- ✅ Responsive design (mobile ~390px, desktop ~1440px)
- ✅ Mandatory onboarding screen for first-time users
- ✅ Dashboard view with tasting notes list
- ✅ Detailed tasting note view
- ✅ Create/Edit tasting note form with all required and optional fields
- ✅ Star rating input (1-5 stars)
- ✅ Dot rating inputs (1-5 dots for Umami, Bitter, Sweet, Foam Quality)
- ✅ Autocomplete for Brand, Blend, and Region based on user's history
- ✅ Side-by-side comparison view for any two tasting notes
- ✅ Filtering by Brand, Region, and Minimum Star Rating
- ✅ User navigation component with logout

#### Testing

- ✅ Unit testing framework (Vitest) with 80% coverage threshold
- ✅ React Testing Library integration
- ✅ E2E testing framework (Playwright) configured
- ✅ All 3 required MVP E2E tests implemented:
  - ✅ Login → Create tasting flow
  - ✅ View → Edit tasting flow
  - ✅ View → Delete tasting flow
- ✅ Page Object Model pattern for maintainable E2E tests
- ✅ API test scripts for manual endpoint validation

#### CI/CD & Infrastructure

- ✅ GitHub Actions workflow for pull requests
- ✅ Automated linting, type checking, and build validation
- ✅ Cloudflare Pages deployment configuration
- ✅ Environment variable management
- ✅ Production deployment ready

### 📊 Success Metrics (Post-Launch Tracking)

- **User Adoption Target:** 10% acquisition rate from TikTok profile link (1 month)
- **Database Growth Target:** 10+ unique brand-blend combinations (1 month)

## License

MIT License (to be confirmed). If a different license is chosen, update this section and badge.

```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

---

Need clarifications or want to contribute? Open an issue or submit a pull request.
