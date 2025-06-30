# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hüttenplan is a React + TypeScript + Vite application for planning multi-day Alpine hut tours. The app helps users find consecutive dates with available beds across selected huts by fetching real-time availability data.

## Development Commands

- `yarn dev` - Start development server with hot reload (NEVER run this in Claude Code as it won't return control)
- `yarn build` - Build for production (runs TypeScript compilation then Vite build)
- `yarn lint` - Run ESLint with standard recommended rules
- `yarn preview` - Preview production build locally
- `yarn test` - Run tests in watch mode with Vitest (NEVER run this in Claude Code as it won't return control)
- `yarn test:run` - Run tests once and exit
- `yarn fetch-hut-reservation-info` - Fetch hut info from hut-reservation.org API to hut_reservation_info.json
- `yarn fetch-osm-huts` - Fetch all Alpine huts from OpenStreetMap to osm_alpine_huts.json (for coordinate data)
- `yarn generate-hut-list` - Generate src/hut_ids.json with accurate OSM coordinates using intelligent name matching

## Claude Code Slash Commands

- `/project:validate` - Runs full validation (build + lint + tests) to ensure code quality before committing

## Project Structure

```
src/
├── App.tsx              # Main application with tour planning logic
├── main.tsx             # React app entry point with React Query setup and i18n
├── components/          # React components
│   ├── HutSelector.tsx  # Filterable hut selection with search
│   ├── HutSearch.tsx    # Search input component for adding huts
│   ├── TourCalendar.tsx # 4-month calendar display
│   ├── LanguageSelector.tsx # Language switcher component (footer)
│   ├── Impressum.tsx    # German legal notice page
│   ├── Datenschutz.tsx  # German privacy policy page
│   └── ui/              # Reusable UI components (Button, Input, Select)
├── hooks/               # Custom React hooks
│   └── useHutAvailability.ts # React Query hook for hut data fetching
├── services/            # API services and business logic
│   ├── hutApi.ts        # Simple API service for hut availability
│   └── tourPlanner.ts   # Logic for finding available tour dates
├── types/               # TypeScript type definitions
│   └── index.ts         # Shared types (Hut, HutAvailability, TourDate)
├── lib/                 # Utility libraries
│   └── utils.ts         # Tailwind utility functions
├── i18n/                # Internationalization
│   ├── index.ts         # i18n configuration
│   └── locales/         # Translation files
│       ├── de.json      # German translations (default)
│       ├── en.json      # English translations
│       ├── it.json      # Italian translations
│       └── fr.json      # French translations
├── assets/              # Static assets
├── index.css            # Tailwind CSS imports
└── hut_ids.json         # Static data with 400+ mountain hut definitions and OSM coordinates

scripts/
├── fetch-hut-reservation-info.ts # Fetches hut info from hut-reservation.org API to hut_reservation_info.json
├── fetch-all-osm-huts.ts # Fetches all Alpine huts from OpenStreetMap
└── generate-hut-list.ts  # Intelligent OSM coordinate matching to generate src/hut_ids.json
```

## Technology Stack

- **Frontend**: React 19.1.0 with TypeScript 5.8.3
- **Build Tool**: Vite 6.3.5 with SWC plugin and Tailwind CSS v4 integration
- **Styling**: Tailwind CSS v4 via @tailwindcss/vite plugin with shadcn/ui color system
- **Data Fetching**: @tanstack/react-query for caching and state management
- **Internationalization**: react-i18next with browser language detection
- **UI Components**: Custom shadcn/ui-inspired components with Tailwind
- **Icons**: Lucide React + Simple Icons (for brand icons like GitHub)
- **Package Manager**: Yarn 4.9.1
- **Linting**: ESLint with standard recommended rules
- **Testing**: Vitest with jsdom environment and React Testing Library
- **Dev Environment**: Modern ESM-based setup with Netlify Edge Functions

## Architecture

### Data Flow
1. **HutSelector** - User selects huts and group size
2. **useHutAvailability** - React Query fetches and caches availability data
3. **TourPlannerService** - Finds consecutive available dates
4. **TourCalendar** - Displays results in 4-month view

### API Integration
- Netlify Edge Function at `netlify/edge-functions/api.ts` proxies `/api/*` to `https://www.hut-reservation.org`
- Same-origin policy enforced (no CORS headers) for security
- React Query handles caching (5min for availability, 24h for hut info), retries, and error states
- Clean separation: `hutApi.ts` only handles HTTP, React Query handles caching

### State Management
- React Query for server state (hut availability data)
- Local component state for UI interactions
- Simple page routing for legal pages (Impressum/Datenschutz)
- No global state management needed

## Key Features

- **Hut Selection**: Filterable dropdown search through 400+ Alpine huts
- **Availability Checking**: Real-time API calls with intelligent caching
- **Tour Planning**: Finds consecutive dates where all selected huts have enough beds
- **Calendar Display**: 4-month view with hover tooltips showing availability details
- **Responsive Design**: Works on desktop and mobile
- **Dark Mode**: Automatic OS preference detection with semantic color system
- **Internationalization**: Multi-language support (German, English, Italian, French)
- **Language Detection**: Automatic browser language detection
- **Legal Compliance**: German Impressum and Datenschutz pages with proper GDPR disclosures

## Development Guidelines

### Code Style
- No explanatory comments - code should be self-documenting
- Use TypeScript for all new code
- Follow React 19 patterns and hooks

### Data Fetching
- Use React Query for all API calls
- API services should be pure functions without caching logic
- Multiple cache durations: 5 minutes for availability data, 24 hours for hut info

### Component Organization
- Place reusable UI components in `src/components/ui/`
- Business logic components in `src/components/`
- Custom hooks in `src/hooks/`
- Keep components focused and composable

### Styling Guidelines
- Use semantic color names (bg-card, text-foreground, etc.) instead of hardcoded colors
- Color system defined in `src/index.css` with OKLCH values for better color accuracy
- Automatic dark mode via `@media (prefers-color-scheme: dark)`
- All semantic colors automatically mapped to Tailwind classes via Tailwind v4 CSS configuration
- Never hardcode colors like `bg-white` or `text-gray-500` - use semantic equivalents

### Internationalization Guidelines
- All user-facing text must use translation keys via `useTranslation()` hook
- Translation files located in `src/i18n/locales/` as TypeScript modules
- Use casual, friendly tone in all languages (Du/tu form, not Sie/vous for German/French)
- German is the default fallback language (appropriate for Alpine context)
- Use proper pluralization forms: `_zero`, `_one`, `_other` for count-based translations
- Language detection based on browser settings

### Testing Guidelines
- Use Vitest for unit and integration tests
- React Testing Library for component testing
- Test files should be co-located with components (e.g., `Component.test.tsx`)
- Focus on testing user interactions and business logic
- Use `yarn test` for watch mode during development
- Use `yarn test:run` in CI/CD pipelines

### Data Maintenance
- `hut_reservation_info.json` is git-ignored and generated by `yarn fetch-hut-reservation-info`
- `osm_alpine_huts.json` is git-ignored and generated by `yarn fetch-osm-huts` (4000+ Alpine huts from OSM)
- `src/hut_ids.json` is committed and generated by `yarn generate-hut-list` using intelligent OSM coordinate matching
- To update the search list: run `yarn fetch-hut-reservation-info` and `yarn fetch-osm-huts` followed by `yarn generate-hut-list`

### Common Tasks
1. Run `yarn lint` to check code quality before committing
2. Use `yarn build` to verify changes work correctly
3. Run `yarn test:run` to verify tests pass before committing
4. New API endpoints go in `src/services/`
5. New types go in `src/types/index.ts`
6. UI components should use semantic Tailwind color classes (bg-card, text-foreground, etc.)
7. Data maintenance scripts are in `scripts/` directory
8. All new UI text must be translatable - add keys to all language files in `src/i18n/locales/`
9. Language selector is located in the footer for easy access