# CartKhata ERP — Agent Guidelines

## Project Overview

CartKhata is a Food Cart Rent Manager ERP — a cross-platform mobile app (React + Capacitor +
Firebase) for managing vendors, cart rentals, payments, and collections. Runs on Android via
Capacitor wrapper and can be developed/tested in browser via Vite.

## Architecture & Tech Stack

- **UI:** React 18 + TypeScript + Tailwind CSS (dark mode via `class` strategy on `<html>`) + Framer
  Motion + Lucide icons
- **State:** React hooks + context (`ThemeContext`) — no global state library
- **Backend:** Firebase (Auth, Firestore, Storage) — real-time sync via `useFirestoreSync` hook
- **Mobile:** Capacitor 6 (Android) — `npx cap sync android` copies `dist/` to Android assets
- **Charts:** Recharts; **Maps:** Leaflet + react-leaflet; **PDF:** jsPDF
- **Alias:** `@` maps to `src/`

## Key Conventions

- **Tailwind first** — all styling via utility classes; custom CSS only in `src/index.css`. Dark
  mode uses `dark:` prefix. Light mode overrides via `html:not(.dark)`.
- **Theme transitions** — add `theme-transition` class for smooth bg/border/color changes
- **UI patterns** — cards use `rounded-2xl`, `shadow-md/ shadow-lg`, `border`. Modals use
  `animate-fade-in`.
- **Animations** — Framer Motion for staggered list items; CSS animations for glow, fade, ripple
- **Icons** — Lucide React; import from `lucide-react`
- **File/folder naming** — PascalCase for components, camelCase for hooks/utils/services. One
  component per file in domain folders under `src/components/`.

## Build & Run Commands

| Command                                                            | Purpose                                                |
|--------------------------------------------------------------------|--------------------------------------------------------|
| `npm run dev`                                                      | Start Vite dev server (port 3000, host)                |
| `npm run build`                                                    | `tsc && vite build` — compile TS + bundle into `dist/` |
| `npx cap sync android`                                             | Copy `dist/` to Android project assets                 |
| `cd android && .\gradlew.bat assembleDebug`                        | Build debug APK                                        |
| `adb install -r android/app/build/outputs/apk/debug/app-debug.apk` | Install on device                                      |

### ⚠️ CRITICAL: Build Order (must follow exactly)

Every code change requires all 3 steps before the APK reflects it:

1. **`npm run build`** — compiles TypeScript + Vite bundle → outputs to `dist/`
2. **`npx cap sync android`** — copies `dist/` contents into `android/app/src/main/assets/public/`
3. **`cd android && .\gradlew.bat assembleDebug`** — builds the APK with updated assets

**Do NOT skip steps 1 or 2.** The APK reads its web assets from the Android assets folder; if
`dist/` is stale or not synced, the APK will run old code regardless of changes in `src/`.

### One-step build (run from project root):

```
build.cmd
```

This runs all 3 steps above plus `adb install`.

## Firebase Services

- **Auth:** Email/password login in `src/components/auth/` — `LoginScreen` + `GetStartedScreen`
- **Firestore:** Real-time data in `src/services/firestore.ts` — vendors, carts, agreements,
  payments, auditLogs, notifications collections
- **Storage:** File uploads in `src/services/storage.ts`
- **Config:** `src/firebase/config.ts`
- **Seeding:** `scripts/seedFirestore.ts`

## Types (`src/types/index.ts`)

Key entities: `User` (admin/collector), `Vendor`, `Cart` (rented/available/maintenance),
`RentAgreement`, `Payment`, `AuditLog`, `AppNotification`, `Zone`, `PartnerLead`.

## Critical Patterns

- **Payments use `calculateVendorLedger()`** from `src/utils/ledger.ts` — all financial logic
  centralized
- **Modals overlay** — collect payment, add vendor, return cart, notifications, staff manager,
  drawer, etc. No react-router; tab-based navigation via `BottomNav`
- **Hardware back button** — handled in `App.tsx` with priority chain: modals → tabs → exit confirm
- **Collectors** only see assigned vendors (`currentUser.assignedVendorIds`)
- **Firestore sync** — `useFirestoreSync` hook in `src/hooks/` handles real-time + offline cache

## ⚠️ CRITICAL SAFETY RULE: NEVER DELETE WORKING TREE FILES

**NEVER delete, remove, or modify any file or directory from the working tree (disk) without
explicit user permission.** This applies to:

- Source files (`src/`, `admin-panel/`, `android/`, etc.)
- Config files, scripts, assets
- Any file or folder created by the user or by any previous agent session

This rule is absolute. Even if:
- Files seem like junk, duplicates, or test artifacts
- Git filter operations or cleanup scripts are needed
- A previous operation left files in a bad state

If any deletion or cleanup is needed → **ask the user first**. No exceptions.

### Backup Protocol

Before any destructive git operation (filter-repo, reset --hard, branch -D, etc.):
1. Create a full project backup
2. Wait for user confirmation before proceeding

## Vercel Deployment

This repo deploys to Vercel as a Vite SPA from the root (for the admin panel website):

- **vercel.json** at root configures SPA rewrites and build command
- Build: `npm run build` (runs `tsc && vite build`)
- Output directory: `dist`
- Env vars (set in Vercel dashboard): `VITE_FIREBASE_*` from `.env.example`
- The `admin-panel/` Next.js app has its own `vercel.json` for separate deployment

## Commit Style

- Use conventional messages: `feat:`, `fix:`, `refactor:`, `style:`, `chore:`, `docs:`
- Include context in commit body for complex changes
