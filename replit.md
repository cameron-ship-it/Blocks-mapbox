# Blocks - NYC Apartment Search

## Overview

Blocks is a modern NYC apartment search application featuring a 4-step wizard flow that guides users through budget selection, borough choice, neighborhood filtering, and an interactive Mapbox-powered map for selecting city blocks. The application emphasizes clean design, accessibility, and mobile responsiveness with a map-first approach where the interactive block selection is the hero feature.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Block Selection Refactoring (October 2025)
Fixed the map block selection system to ensure clicking one block only selects that specific block:
- **Issue**: Previously, clicking one block was selecting all blocks on the map
- **Solution**: Refactored to use Mapbox's feature-state API with proper per-feature isolation
- **Implementation Details**:
  - Created `toggleFeature(fid)` function for scoped feature state updates
  - Created `reapplySelections()` function to restore selections after data reloads
  - Improved ID extraction with fallback logic (feature.id → block_id → GEOID)
  - Added sourcedata event listener to automatically restore selections during zoom/pan
  - Fixed TypeScript null check errors in map event handlers
  - Cleaned up ProgressStepper component code structure

## System Architecture

### Frontend Architecture

**Framework & Build System**
- **React 18** with TypeScript in strict mode for full type safety
- **Vite** as the build tool and development server with HMR support
- **Wouter** for client-side routing (lightweight React Router alternative)
- **File Structure**: Monorepo-style setup with `client/`, `server/`, and `shared/` directories

**UI Component System**
- **shadcn/ui** components built on Radix UI primitives
- **Tailwind CSS** for styling with custom design tokens
- **Design Philosophy**: Apple HIG-inspired minimalism with Material Design map interactions
- **Component Approach**: Utility-first, map-focused design where clarity takes priority over decoration
- **Accessibility**: Full keyboard navigation and ARIA compliance through Radix UI primitives

**State Management & Data Fetching**
- **TanStack Query (React Query)** for server state management
- **React Hook Form** with Zod resolvers for form validation
- Local state with React hooks for wizard flow management

**Map Integration**
- **Mapbox GL JS** (vanilla, not React wrapper) for interactive mapping
- Custom vector tiles layer for NYC city blocks with clickable polygons
- Configurable map styles and data sources via environment variables
- Progressive disclosure pattern: wizard steps prepare users before reaching the map
- **Block Selection System**: Feature-state based per-block selection using Mapbox's `setFeatureState()` API
  - Unique feature IDs promoted via `promoteId: "block_id"` on vector source
  - Robust ID extraction with fallbacks: `feature.id`, `block_id`, `GEOID`
  - `toggleFeature()` function for independent block selection/deselection
  - `reapplySelections()` function to restore selections after zoom/pan/data reloads
  - Selections persist through tile updates via sourcedata event listener

### Backend Architecture

**Server Framework**
- **Express.js** with TypeScript for the API server
- **Development Mode**: Vite middleware integration for SSR and HMR
- **Production Mode**: Pre-built static assets served from `dist/public`

**API Design**
- RESTful API pattern with `/api` prefix for all endpoints
- Centralized error handling middleware
- Request/response logging in development mode

**Database Layer**
- **Drizzle ORM** configured for PostgreSQL via `@neondatabase/serverless`
- Schema-first approach with TypeScript types generated from Drizzle schemas
- Database migrations managed through `drizzle-kit`
- Session storage using `connect-pg-simple` for PostgreSQL-backed sessions

**Storage Interface Pattern**
- Abstract `IStorage` interface for CRUD operations
- Current implementation: `MemStorage` (in-memory, development)
- Designed to be swapped with database-backed implementation
- Supports user management operations (create, read by ID/username)

### Design System

**Color Palette**
- Light mode primary: Professional blue (220° 90% 56%) for trust and clarity
- Success/Selected state: NYC parks green (142° 71% 45%)
- Sophisticated neutral grays with subtle borders (220° 13% 91%)
- Dark mode support with adjusted lightness values

**Typography**
- **Font Family**: Inter (Google Fonts) for professional readability
- **Hierarchy**: Text-xs for labels → text-base for body → text-2xl for titles
- **Weights**: 400 (body), 500 (labels), 600 (headings)

**Interactive States**
- Hover effects with `--elevate-1` (3% opacity overlay)
- Active/pressed effects with `--elevate-2` (8% opacity overlay)
- Custom CSS properties for consistent elevation across components

## External Dependencies

### Third-Party Services

**Mapbox**
- **Service**: Mapbox GL JS for interactive maps
- **Authentication**: Access token via `VITE_MAPBOX_TOKEN` environment variable
- **Free Tier**: 50,000 map loads per month
- **Configuration Options**:
  - `VITE_MAP_STYLE`: Mapbox style URL (default: light-v11)
  - `VITE_BLOCKS_TILES`: Optional custom vector tiles URL
  - `VITE_BLOCKS_SOURCE`: Source name for blocks layer
  - `VITE_BLOCKS_LAYER`: Fill layer name for blocks
  - `VITE_BLOCKS_SOURCE_LAYER`: Source layer in tileset

### Database & Hosting

**Neon PostgreSQL** (via `@neondatabase/serverless`)
- Serverless PostgreSQL database
- Connection via `DATABASE_URL` environment variable
- Required for production deployment

**Replit Platform Integration**
- `@replit/vite-plugin-runtime-error-modal` for development error handling
- `@replit/vite-plugin-cartographer` for code mapping (development only)
- `@replit/vite-plugin-dev-banner` for development UI indicators

### UI Libraries & Tools

**Core UI Dependencies**
- **Radix UI**: Comprehensive primitive components for accessibility
- **Lucide React**: Icon library for consistent iconography
- **class-variance-authority**: Type-safe component variants
- **tailwind-merge** & **clsx**: Utility for conditional className merging

**Form & Validation**
- **React Hook Form**: Performance-focused form management
- **Zod**: Schema validation with TypeScript inference
- **@hookform/resolvers**: Integration between RHF and Zod

**Specialized Components**
- **cmdk**: Command palette/menu component
- **date-fns**: Date manipulation utilities
- **vaul**: Drawer component for mobile interactions
- **embla-carousel-react**: Carousel functionality
- **recharts**: Data visualization (chart components)

### Development Tools

**Type Safety & Validation**
- TypeScript 5.x with strict mode enabled
- Drizzle-Zod for database schema validation
- Path aliases: `@/` for client, `@shared/` for shared code, `@assets/` for assets

**Build & Development**
- esbuild for server bundling in production
- PostCSS with Tailwind and Autoprefixer
- Source map support via `@jridgewell/trace-mapping`