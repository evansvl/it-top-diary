# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Expo / React Native mobile app — a student diary ("электронный дневник") that wraps the
Top Academy web journal API (`msapi.top-academy.ru`, the backend of `journal.top-academy.ru`).
Working features: **auth** (login, secure token storage, session hydration), **profile**
(name/photo/group/stream/level), and **homework** (summary counts + paginated list). Grades
and schedule are in progress. The codebase and all user-facing strings are in **Russian** —
match that language when editing comments and UI text. Chat with the maintainer in English
(their terminal can't render Cyrillic), but keep in-app text Russian.

## Commands

This machine has Node at `C:\Program Files\nodejs` **but it is not on PATH**. In every shell,
prefix it or call the full path:

```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path   # then: node / npm / npx
# or call directly, e.g.  & "C:\Program Files\nodejs\npx.cmd" tsc --noEmit
```

```bash
npx expo start          # dev server (needs a dev build, NOT Expo Go — reanimated/gesture-handler)
npm run typecheck       # tsc --noEmit — the ONLY check in the project (no tests, no linter)
npx expo-doctor         # config/deps health check (keep at 21/21 before building)
npx expo install --fix  # realign deps to the installed SDK (package.json pins many to "*")
```

`.npmrc` sets `legacy-peer-deps=true` — required (react/react-dom skew under SDK 56 otherwise ERESOLVE-fails).

### Building the APK (EAS cloud)

There is **no git repo**, so builds use no-VCS mode. Auth is via token, not interactive login:

```powershell
$env:EXPO_TOKEN = "<token from expo.dev → Account → Access tokens>"
$env:EAS_NO_VCS = "1"                       # archive the dir directly (respects .easignore)
& "C:\Program Files\nodejs\npx.cmd" eas-cli init --force --non-interactive   # first time only
& "C:\Program Files\nodejs\npx.cmd" eas-cli build -p android --profile preview --non-interactive
```

Profile `preview` emits an `.apk` (`buildType: apk`, `autoIncrement` on). EAS project:
`@evansvl/college-diary`. Builds run ~15–25 min; the CLI prints the install page + a direct
`.apk` artifact URL (also via `eas-cli build:view <id> --json`). Run builds in the background.

## Architecture

**Routing** — file-based `expo-router` (typed routes). Entry `expo-router/entry`.
- `app/_layout.tsx` — providers (GestureHandler → ReactQuery → SafeArea), forces dark theme,
  calls `authStore.hydrate()` once.
- `app/index.tsx` — `/` gate: neutral screen while `status` is `idle`/`hydrating`, then
  `<Redirect>` to `/home` or `/(auth)/login`. **`login.tsx` has the mirror redirect** (→ `/home`
  when authenticated) — that's how a successful login navigates; nothing imperative does it.
- Screens: `app/(auth)/login.tsx`, `app/home.tsx`, `app/homework.tsx`.

**Feature-module pattern** (`src/features/<name>/`): `types.ts` (domain types + raw→domain),
`<name>Api.ts` (adapter mapping raw API JSON → domain), and react-query hooks (`useX.ts`).
UI lives in `src/components/`, routes in `app/`. Path alias `@/*` → `./src/*`. Follow this
shape when adding grades/schedule: add the endpoint to `src/api/endpoints.ts`, a feature
module, a hook, a card on `home.tsx`, and (if it has a list) a route screen.

**Auth subsystem** — one-directional:
```
LoginForm (RHF+zod) → useLogin (mutation) → authApi.login() → authStore.setSession()
   → secureStore (persist) + fetchMe() (enrich profile from /settings/user-info)
```
- `src/features/auth/authStore.ts` — Zustand, single source of truth (`status|user|tokens`).
  `hydrate()` restores from SecureStore, force-logs-out if the **refresh** token is expired.
  At module load it registers the access-token provider with the HTTP client (bottom of file) —
  this is how `client.ts` gets the Bearer token **without importing the store** (avoids a cycle).
- `src/api/client.ts` — `fetch` wrapper. Throws `ApiError(status, message, payload)` (`status:0`
  = no connection). Auto-refresh on 401 is **not implemented** (refresh endpoint unconfirmed).
- `src/lib/secureStore.ts` — persists `auth.tokens` + a light `auth.user` cache for instant cold start.
- `src/lib/jwt.ts` — dependency-free JWT payload decoder (pulls `userId`).

**Conventions**
- NativeWind v4 (`className`). Tokens (`primary`, `ink-900..600`, `success/warning/danger`,
  `rounded-card`) in `tailwind.config.js`; app forces dark mode. NativeWind types `className`
  as a **string** — no function form; use `active:` variants for pressed state. Class strings
  built by runtime concatenation work **only if the literal class appears somewhere in source**.
- TS strict + `noUncheckedIndexedAccess` — guard array/index access.
- `babel.config.js`: `react-native-worklets/plugin` (Reanimated 4 moved it here) **must stay last**.

## Top Academy API — hard-won specifics

`src/api/endpoints.ts` holds paths + flags (`USE_MOCK_AUTH`, `USE_USER_INFO`). `APPLICATION_KEY`
is the shared public web-journal key (not a per-user secret). All requests go through
`apiRequest`, which is where these quirks are handled — verify new endpoints with a real Bearer
token before wiring (`Invoke-WebRequest` with the headers below):

- **WAF requires `Origin: https://journal.top-academy.ru` + `Referer: https://journal.top-academy.ru/`
  on every request** — without them the API returns **403** (not 401). These are set as defaults
  in `client.ts`. (Browser `sec-ch-ua`/`user-agent` headers are NOT needed.)
- **Login** (`/auth/login`): POST with `Authorization: Bearer null`, body
  `{application_key, id_city:null, username, password}`. The success body does **not** contain
  the user's name — only tokens, `user_role`, `city_data`.
- **Token lifetimes** come as `expires_in_*` **durations in seconds** (~21600 = 6h access), not
  absolute timestamps. `authApi.toAbsoluteExpiry()` normalizes them; the store works in absolute
  unix seconds. (This was a real bug — durations stored as absolute → instant logout on relaunch.)
- **Error bodies** vary: `{message}`, `{error}`, or an array `[{field, message}]` (validation,
  e.g. bad login → 422). `extractErrorMessage` in `client.ts` handles all three.
- **`/settings/user-info`** (GET) is the profile source: `full_name`, `photo` (full public
  `fs.top-academy.ru` URL — loads without auth), `group_name`, `current_group_id` (needed for
  homework/grades queries), `stream_name`, `level`, `achieves_count`, `gaming_points[]`.
- **Homework**: `/count/homework` → `[{counter_type, counter}]` where type `0`=overdue,
  `1`=checked, `2`=on review, `3`=to do, `4`=total, `5`=deleted (see `HOMEWORK_STATUSES`).
  `/homework/operations/list?page=&status=&type=0&group_id=` is the same status codes, paginated
  (stop when a page returns empty).
- **Grades/attendance**: `/progress/operations/student-visits` (GET, no params) returns the
  **entire lesson journal** (~1500 rows): `date_visit`, `status_was` (1=present, 0=absent,
  2=special), `spec_name` (subject), and six mark columns (`*_work_mark`). Marks are a **5-point
  scale** with special codes (11/12 = зачёт/незачёт) — exclude non-1..5 from any computed
  average. Official средний балл trend: `/dashboard/chart/average-progress` (monthly, rounded).
  Bonus: `/dashboard/progress/leader-group`, `/dashboard/progress/leader-stream`.

Still unconfirmed: refresh-token, schedule (look for `/schedule/...` with date params),
announcements, attendance detail.
