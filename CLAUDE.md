# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Expo / React Native mobile app — a student diary ("электронный дневник") that wraps the
Top Academy web journal API (`msapi.top-academy.ru`, the backend of `journal.top-academy.ru`).
All major features are built: **auth** (login, remember-password / auto-login, session
hydration), **profile** (name/photo/group/stream/level/points), **homework** (summary +
per-day list), **grades** (marks per subject, average, attendance), **schedule** (per-day),
under a **bottom tab navbar**. The codebase and all user-facing strings are in **Russian** —
keep in-app text and comments Russian. Chat with the maintainer in English (their terminal
can't render Cyrillic). Public repo: `github.com/evansvl/it-top-diary` (the README there is a
user install guide, not dev docs; APK ships via GitHub Releases).

## Commands

This machine has Node at `C:\Program Files\nodejs` **but it is not on PATH**. In every shell,
prefix it or call the full path:

```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path   # then: node / npm / npx
# or call directly, e.g.  & "C:\Program Files\nodejs\npx.cmd" tsc --noEmit
```

```bash
npx expo start          # dev server (needs a dev build, NOT Expo Go — reanimated/gesture-handler)
npm run typecheck       # tsc --noEmit — the ONLY check in the project (no tests, no linter). Run before committing.
npx expo-doctor         # config/deps health check (keep at 21/21 before building)
npx expo install <pkg>  # add native deps SDK-compatibly (package.json pins many to "*"); --fix to realign
```

`.npmrc` sets `legacy-peer-deps=true` — required (react/react-dom skew under SDK 56 otherwise ERESOLVE-fails).

### Building the APK (EAS cloud)

The repo has git now, but builds still pass `EAS_NO_VCS=1` to archive the **working tree
directly** (uncommitted changes included; `.easignore` controls exclusions). Auth is via token,
not interactive login:

```powershell
$env:EXPO_TOKEN = "<token from expo.dev → Account → Access tokens>"
$env:EAS_NO_VCS = "1"
& "C:\Program Files\nodejs\npx.cmd" eas-cli build -p android --profile preview --non-interactive
```

Profile `preview` emits an `.apk` (`buildType: apk`, `autoIncrement` on). EAS project slug:
`@evansvl/college-diary` (note: differs from the GitHub repo name). Builds run ~15–25 min — run
in the background; the CLI prints an install page + direct `.apk` URL (also `eas-cli build:view
<id> --json` → `.artifacts.applicationArchiveUrl`). To publish a build to users: download the
APK and attach it to a GitHub Release (the README links to `releases/latest`).

## Architecture

**Routing** — file-based `expo-router` (typed routes). Three areas under the root `Stack`
(`app/_layout.tsx` mounts providers GestureHandler → ReactQuery → SafeArea, forces dark theme,
calls `authStore.hydrate()` once):
- `app/index.tsx` — `/` gate: neutral screen while `status` is `idle`/`hydrating`, then
  `<Redirect>` to `/home` or `/(auth)/login`.
- `app/(auth)/login.tsx` — has a **mirror redirect** to `/home` when authenticated (that's how a
  successful login navigates; nothing imperative does it).
- `app/(tabs)/_layout.tsx` — the **bottom navbar** (Tabs) + an **auth guard**: if
  `status !== 'authenticated'` it `<Redirect>`s to login. This guard is how **logout navigates** —
  `profile.tsx` just calls `authStore.logout()`, status flips, the guard kicks back to login.
  Tabs: `home`, `schedule`, `grades`, `homework`, `profile` (icons via `@expo/vector-icons`
  Ionicons; needs the `expo-font` peer dep). `/home` is the home **tab**, not a top-level file.

**Feature-module pattern** (`src/features/<name>/`): `types.ts` (domain types + raw→domain
helpers), `<name>Api.ts` (adapter mapping raw API JSON → domain types), react-query hooks
(`useX.ts`). UI in `src/components/`, routes in `app/`. Alias `@/*` → `./src/*`. To add a
feature: endpoint in `src/api/endpoints.ts` → feature module → hook → a summary card in
`src/components/home/` (shown on the home dashboard, tappable to its tab) → the tab screen.
Existing modules: `auth`, `homework`, `grades`, `schedule`.

**Auth + credential persistence**:
```
LoginForm (RHF+zod) → useLogin (mutation) → authApi.login() → authStore.setSession()
   → secureStore (persist) + fetchMe() (enrich profile from /settings/user-info)
```
- `src/features/auth/authStore.ts` — Zustand, single source of truth (`status|user|tokens`).
  `hydrate()` restores from SecureStore, force-logs-out if the **refresh** token is expired.
  At module load it registers the access-token provider with the HTTP client (bottom of file) —
  this is how `client.ts` gets the Bearer token **without importing the store** (avoids a cycle).
- `src/lib/secureStore.ts` — encrypted (Keychain/Keystore) storage of `auth.tokens`, a light
  `auth.user` cache, and **saved credentials** (`auth.credentials`: `{login, password, autoLogin}`).
  `LoginForm` prefills from saved creds and auto-submits if `autoLogin`. **`logout()` calls
  `disableAutoLogin()`** (keeps login/password prefilled but won't auto-resubmit, so you can
  actually stay logged out); "Забыть сохранённый пароль" in profile fully `clearCredentials()`.
- `src/api/client.ts` — `fetch` wrapper. Throws `ApiError(status, message, payload)` (`status:0`
  = no connection). Auto-refresh on 401 is **not implemented** (refresh endpoint unconfirmed).

**Settings + self-update (GitHub Releases)**
- `app/settings.tsx` — root-stack screen opened from the profile tab (auto-login toggle, forget
  password, update checks, clear react-query cache, about). Rows via the shared
  `src/components/settings/SettingsRow.tsx` (text / chevron / Switch).
- `src/features/settings/settingsStore.ts` — Zustand persisted to SecureStore key `app.settings`
  (currently `autoCheckUpdates`); hydrated from `app/_layout.tsx`.
- `src/features/updates/` — checks `api.github.com/repos/evansvl/it-top-diary/releases/latest`
  with **plain `fetch`** (NOT `apiRequest` — that injects journal Origin headers). An update is
  "available" when the release `tag_name` (semver, `v` prefix ok) is **greater than**
  `app.json version` — so **bump `version` before tagging a release**, or users are never (or
  forever) prompted. Flow: download the `.apk` asset via `expo-file-system/legacy`
  `createDownloadResumable` (progress) → `getContentUriAsync` → `expo-intent-launcher`
  `ACTION_INSTALL_PACKAGE` (flags:1). Needs `REQUEST_INSTALL_PACKAGES` in `app.json`
  `android.permissions`. Launch auto-check lives in `useAutoUpdateCheck` (mounted in the tabs
  layout, once per session, Android only).

**Conventions**
- NativeWind v4 (`className`). Tokens (`primary`, `ink-900..600`, `success/warning/danger`,
  `rounded-card`) in `tailwind.config.js`; app forces dark mode. `className` is typed as a
  **string** — no function form; use `active:` variants for pressed state. Runtime-concatenated
  class strings work **only if the literal class appears somewhere in source**. `divide-*`
  utilities don't work (RN has no sibling selector) — use explicit borders.
- Russian date formatting lives in `src/lib/date.ts` (month/day names, `monthAnchorFromIso`,
  `shiftDay`, `dayTitle`, `todayIso`). App-runtime `Date` is fine here.
- TS strict + `noUncheckedIndexedAccess` — guard array/index access.
- `babel.config.js`: `react-native-worklets/plugin` (Reanimated 4 moved it here) **must stay last**.

## Top Academy API — hard-won specifics

`src/api/endpoints.ts` holds paths + flags (`USE_MOCK_AUTH`, `USE_USER_INFO`). `APPLICATION_KEY`
is the shared public web-journal key (not a per-user secret). All requests go through
`apiRequest`. **Verify any new endpoint with a real Bearer token before wiring** (PowerShell
`Invoke-WebRequest` with the headers below) — the maintainer pastes cURLs from the web journal's
DevTools; map exact field names, don't guess.

- **WAF requires `Origin: https://journal.top-academy.ru` + `Referer: https://journal.top-academy.ru/`
  on every request** — without them the API returns **403** (not 401). Set as defaults in
  `client.ts`. Browser `sec-ch-ua`/`user-agent` headers are NOT needed.
- **Login** (`/auth/login`): POST `Authorization: Bearer null`, body
  `{application_key, id_city:null, username, password}`. Success body has only tokens,
  `user_role`, `city_data` — **not** the name.
- **Token lifetimes** arrive as `expires_in_*` **durations in seconds** (~21600 = 6h), not
  absolute timestamps. `authApi.toAbsoluteExpiry()` normalizes; the store uses absolute unix
  seconds. (Storing durations as absolute caused instant logout on relaunch.)
- **Error bodies** vary: `{message}`, `{error}`, or array `[{field, message}]` (validation, bad
  login → 422). `extractErrorMessage` in `client.ts` handles all three.
- **`/settings/user-info`** (GET): `full_name`, `photo` (full public `fs.top-academy.ru` URL,
  loads without auth), `group_name`, `current_group_id` (**required** for homework queries),
  `stream_name`, `level`, `achieves_count`, `gaming_points[]`.
- **Homework**: `/count/homework` → `[{counter_type, counter}]` (0=overdue, 1=checked,
  2=on review, 3=to do, 4=total, 5=deleted — see `HOMEWORK_STATUSES`).
  `/homework/operations/list?page=&status=&type=0&group_id=` — same status codes, paginated.
  **Quirk:** out-of-range pages **repeat page 1** (not empty), so `useHomeworkList` stops when a
  page brings no new ids and the screen dedupes by id — otherwise it loops forever.
  **Submit** (`/homework/operations/create`, POST, confirmed by curl): `multipart/form-data` with
  fields `id` (homework id), `file` (optional binary), `answerText`, `spentTimeHour`,
  `spentTimeMin`; response = the `homework_stud` object (`stud_answer`, `file_path`,
  `creation_time`, `mark`, `auto_mark`). `apiRequest` detects a FormData body and skips
  `Content-Type` so fetch sets the multipart boundary itself. Task/submission files
  (`fs.top-academy.ru` links, public, opaque token URLs — real filename only in
  `Content-Disposition`) are downloaded via `downloadAndShare` in `src/lib/files.ts`
  (expo-file-system → expo-sharing share sheet). UI: tap a row on the homework tab →
  `HomeworkDetailModal` (details, download, submit form via expo-document-picker); marked work
  with mark < 4 gets a «Пересдать работу» button that re-POSTs the same create endpoint
  (server-side overwrite behavior not yet confirmed live).
- **Grades/attendance**: `/progress/operations/student-visits` (GET, no params) — the **entire
  lesson journal** (~1500 rows): `date_visit`, `status_was` (1=present, 0=absent, 2=special),
  `spec_name`, six `*_work_mark` columns. Marks are **5-point**; values **>5 are legacy** from
  the abandoned 12-point system — `gradesApi` drops them entirely (display AND averages; averages
  use 1..5 only). The schedule screen shows the selected day's marks (`marksForDate` +
  `normalizeSubject` to match journal `spec_name` against schedule `subject_name`; unmatched
  marks go to an «Оценки за день» card). Official средний балл trend:
  `/dashboard/chart/average-progress` (monthly, rounded). Leaderboards:
  `/dashboard/progress/leader-group`, `/dashboard/progress/leader-stream`.
- **Schedule**: `/schedule/operations/get-month?date_filter=YYYY-MM-DD` (any day of the month) →
  flat array for the whole month: `date`, `lesson`, `started_at`, `finished_at`, `teacher_name`,
  `subject_name`, `room_name`. `scheduleApi` groups by day; the screen shows one day at a time.

Still unconfirmed: refresh-token, announcements, attendance detail.
