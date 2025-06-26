# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hüttenplan is a React + TypeScript + Vite application for planning multi-day Alpine hut tours. The app helps users find consecutive dates with available beds across selected huts by fetching real-time availability data.

## Development Commands

- `yarn dev` - Start development server with hot reload
- `yarn build` - Build for production (runs TypeScript compilation then Vite build)
- `yarn lint` - Run ESLint with enhanced rules for unused code detection
- `yarn preview` - Preview production build locally

## Project Structure

```
src/
├── App.tsx              # Main application with tour planning logic
├── main.tsx             # React app entry point with React Query setup
├── components/          # React components
│   ├── HutSelector.tsx  # Filterable hut selection with search
│   ├── TourCalendar.tsx # 4-month calendar display
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
├── assets/              # Static assets
├── index.css            # Tailwind CSS imports
└── hut_ids.json         # Static data with 400+ mountain hut definitions
```

## Technology Stack

- **Frontend**: React 19.1.0 with TypeScript 5.8.3
- **Build Tool**: Vite 6.3.5 with SWC plugin and Tailwind CSS v4 integration
- **Styling**: Tailwind CSS v4 via @tailwindcss/vite plugin with shadcn/ui color system
- **Data Fetching**: @tanstack/react-query for caching and state management
- **UI Components**: Custom shadcn/ui-inspired components with Tailwind
- **Icons**: Lucide React
- **Package Manager**: Yarn 4.9.1
- **Linting**: ESLint with enhanced rules for catching unused code
- **Dev Environment**: Modern ESM-based setup with API proxy

## Architecture

### Data Flow
1. **HutSelector** - User selects huts and group size
2. **useHutAvailability** - React Query fetches and caches availability data
3. **TourPlannerService** - Finds consecutive available dates
4. **TourCalendar** - Displays results in 4-month view

### API Integration
- Proxied through Vite dev server (`/api` → `https://www.hut-reservation.org`)
- React Query handles caching (5min stale time), retries, and error states
- Clean separation: `hutApi.ts` only handles HTTP, React Query handles caching

### State Management
- React Query for server state (hut availability data)
- Local component state for UI interactions
- No global state management needed

## Key Features

- **Hut Selection**: Filterable dropdown search through 400+ Alpine huts
- **Availability Checking**: Real-time API calls with intelligent caching
- **Tour Planning**: Finds consecutive dates where all selected huts have enough beds
- **Calendar Display**: 4-month view with hover tooltips showing availability details
- **Responsive Design**: Works on desktop and mobile
- **Dark Mode**: Automatic OS preference detection with semantic color system

## Data Structure

### Hut Data (`src/hut_ids.json`)
```typescript
interface Hut {
  hutId: number
  hutName: string
}
```

### API Response Format
```typescript
interface HutAvailability {
  freeBedsPerCategory: Record<string, number>
  freeBeds: number
  hutStatus: 'SERVICED' | 'NOT_SERVICED' | 'CLOSED'
  date: string
  dateFormatted: string
  totalSleepingPlaces: number
  percentage: 'AVAILABLE' | 'FULL' | 'LIMITED'
}
```

## Development Guidelines

### Code Style
- No explanatory comments - code should be self-documenting
- Use TypeScript for all new code
- Follow React 19 patterns and hooks

### Data Fetching
- Use React Query for all API calls
- API services should be pure functions without caching logic
- 5-minute cache duration

### Component Organization
- Place reusable UI components in `src/components/ui/`
- Business logic components in `src/components/`
- Custom hooks in `src/hooks/`
- Keep components focused and composable

### Styling Guidelines
- Use semantic color names (bg-card, text-foreground, etc.) instead of hardcoded colors
- Color system defined in `src/index.css` with OKLCH values for better color accuracy
- Automatic dark mode via `@media (prefers-color-scheme: dark)`
- All semantic colors automatically mapped to Tailwind classes via `tailwind.config.js`
- Never hardcode colors like `bg-white` or `text-gray-500` - use semantic equivalents

### Common Tasks
1. Run `yarn lint` to catch unused code before committing
2. Use `yarn build` to verify changes work correctly
3. New API endpoints go in `src/services/`
4. New types go in `src/types/index.ts`
5. UI components should use semantic Tailwind color classes (bg-card, text-foreground, etc.)