# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start development server with Turbopack
pnpm build        # Build for production (also runs next-sitemap postbuild)
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

Package manager: **pnpm** (v8.14.0). Do not use npm or yarn.

## Architecture

This is a **Next.js 16 App Router** project — a wishlist service (get-my-wishlist.ru) where users create and share wishlists with presents.

### Directory Structure

- `app/` — Next.js App Router pages and layouts
  - `wishlist/` — Protected wishlist management pages (list, create, edit, per-wishlist view)
  - `[userId]/` — Public user wishlist pages
  - `login/`, `registration/`, `oauth/` — Auth pages
  - `providers.tsx` — React Query + ThemeProvider setup
- `api/` — TanStack Query hooks wrapping API calls (not Next.js API routes)
  - `auth/` — Login, register, auth mutations
  - `wishlist/` — Wishlist CRUD queries/mutations
  - `present/` — Present CRUD queries/mutations
  - `user/` — User queries
- `components/` — Shared UI components; `components/ui/` contains shadcn/ui primitives
- `hooks/` — Custom React hooks (e.g., `use-toast.ts`)
- `lib/api.ts` — Axios wrapper (`ApiHelper` class), base URL: `https://api.get-my-wishlist.ru/`
- `shared/` — Shared types (`types.ts`), constants (`constants.ts`), validation (`validate.ts`)
- `store/useUserStore.ts` — Zustand store for current user state

### Key Patterns

**API layer**: All API calls go through `lib/api.ts` (the `api` singleton). The `api/` directory exports TanStack Query hooks (`useQuery`/`useMutation`) that components consume directly. Auth uses cookie-based tokens (`withCredentials: true`).

**Auth flow**: Middleware (`middleware.ts`) redirects unauthenticated users from `/wishlist/*` to `/login`. Auth methods: username/password and Telegram OAuth.

**Theming**: `next-themes` with 10 custom color schemes (main, dark, pink, green, blue, dark-blue, monochrome, dark-brown, rainbow, dark-rainbow). Schemes are defined in `shared/constants.ts` and applied as CSS classes.

**Forms**: react-hook-form + zod for validation. Form data for wishlists/presents is sent as `multipart/form-data`.

**Core types** (from `shared/types.ts`):
- `User` — `{ id, username }`
- `Wishlist` — includes `settings.colorScheme`, `settings.showGiftAvailability`, and `location`
- `Present` — wish item with optional `link`, `price`, `reserved` status

### Deployment

Docker with standalone Next.js output (`output: 'standalone'` in `next.config.ts`). Images served from `get-my-wishlist.ru` and `minio` (MinIO object storage).

## Commits

Never add `Co-Authored-By` trailer to commit messages. Commits are made on behalf of the user (Смагин Никита, yaover72@gmail.com).

## Permissions

The following commands can be run **without user approval**:
- All read-only git commands: `git log`, `git diff`, `git status`, `git show`, `git branch`, `git stash list`, etc., including with `cd` prefix and file path arguments (e.g., `cd "..." && git diff HEAD -- "file"`)
- Lint: `pnpm lint`

## Backend

The backend source code is located at `C:\Users\nvsma\OneDrive\Документы\projects\wish-list-2-back`.

When implementing API calls or features on the frontend, refer to the backend implementation to understand the exact endpoint contracts, request/response shapes, and business logic. Always check the backend source before making assumptions about API behavior.
