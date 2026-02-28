# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start dev server (localhost:5173)
npm run build     # TypeScript check + production build
npm run lint      # ESLint
npm run preview   # preview production build
firebase deploy --only hosting   # deploy frontend
firebase deploy --only firestore # deploy rules + indexes
```

## Stack

- **Vite + React 19 + TypeScript** (`verbatimModuleSyntax` is on — always use `import type` for type-only imports)
- **Mantine v8** for UI — use Mantine components throughout, avoid custom CSS
- **`@mantine/hooks`** — use `useLocalStorage` for persistent state (survives refresh)
- **Firebase 12**: Auth (Google Sign-In) + Firestore (no backend functions)

## Architecture

```
src/
  firebase.ts              # Firebase app, auth, db exports
  types.ts                 # Shared types: BabyName, UserScore, RankedName, Gender, Match
  locales.ts               # All user-facing strings (ES + EN) — never hardcode strings in components
  context/
    AuthContext.tsx         # Auth state + allUsers list (live-synced from /users collection)
    LocaleContext.tsx       # i18n: provides { t, locale, toggleLocale }
  hooks/
    useAuth.ts             # Reads AuthContext; exposes { user, allUsers, loading, logOut }
    useAdmin.ts            # Reads /config/admins doc; exposes isAdmin, allUsersWithStats, admin actions
    useNames.ts            # CRUD for /names collection; deleteName cascades to scores + matches
    useVote.ts             # ELO vote logic → writes /userScores + /matches
    useRanking.ts          # Builds myRanking, combinedRanking, buildRanking(userId?) from /userScores
    useUserProfile.ts      # Fetches matches + scores for a target user; resetVotes, deleteMatch
  lib/
    elo.ts                 # Pure ELO math (K=32, DEFAULT_ELO=1000)
    weightedRandom.ts      # pickTwo() — weighted by 1/(matches+1)
    utils.ts               # capitalizeName(text) — display-only capitalizer, never mutates stored data
  components/
    NameDetailModal.tsx    # Modal: name, gender badge, clickable proposer, combined ranking position
  pages/
    LoginPage.tsx
    AddNamesPage.tsx       # Tab 1: suggest names; optimistic pending list; slide-in animation; clickable names
    VotePage.tsx           # Tab 2: ELO duels; gender-colored cards; pair persisted in localStorage
    RankingPage.tsx        # Tab 3: combined/mine toggle; per-user breakdown; clickable rows
    UsersPage.tsx          # Tab 4: all users list; current user marked with (tú); tap to open profile
    UserProfilePage.tsx    # Profile: ranking, suggested names, vote history; admin/self delete actions
    AdminPage.tsx          # Admin drawer: user stats, admin grants, danger zone
  App.tsx                  # AppShell + 4-tab nav + profile overlay + info modal
  main.tsx                 # MantineProvider + AuthProvider mount
```

## Firestore Data Model

- `/names/{nameId}` — shared across all users; fields: `text`, `gender: 'male'|'female'`, `addedBy`, `addedAt`
- `/userScores/{userId}_{nameId}` — per-user ELO; fields: `userId`, `nameId`, `eloScore`, `wins`, `losses`, `matches`
- `/matches/{matchId}` — audit log; fields: `userId`, `winnerId`, `loserId`, `gender`, `timestamp` (serverTimestamp)
  - Note: the `Match` TypeScript type calls this field `createdAt: Date` (converted on read via `.toDate()`)
- `/users/{userId}` — written on first login with `merge: true`; fields: `uid`, `displayName`, `photoURL`, `lastSeen`
- `/config/admins` — single doc; field: `uids: string[]` — list of admin UIDs

**Combined ranking** = client-side average ELO across all `userScores` per name. ELO badge is teal if `>= 1000` (above starting score), red if below.

## Firestore Rules & Indexes

`firestore.rules` — enforces that users can only write their own scores/matches.
`firestore.indexes.json` — composite indexes for gender+addedAt, userId+gender, gender+eloScore queries.

## Admin System

- Admin UIDs stored in `/config/admins` → `uids[]`.
- `useAdmin.ts` subscribes live to that doc and exposes `isAdmin: boolean`.
- `SEED_ADMIN_UID` constant bootstraps the first admin: if the doc doesn't exist and the current user matches the seed UID, it writes the doc. Only runs once.
- When `isAdmin === true`, `useAdmin` also subscribes to users, names, matches, and scores to build `allUsersWithStats` — an array of `{ uid, displayName, photoURL, namesAdded, matchCount, scores }`. These subscriptions are only active while the user is admin.
- **Admin actions**: `addAdmin(uid)` / `removeAdmin(uid)` (arrayUnion/arrayRemove on `/config/admins`), `resetVotes(uid)` (batch-delete all matches + scores for a user), `resetDatabase()` (batch-delete all names, scores, and matches — does NOT touch `/users` or `/config/admins`).
- **AdminPage** exports `ProfileLink` component (re-exported from `UserProfilePage.tsx`) for clicking user names.

## Permission Model

```
canDeleteNames  = isAdmin
canDeleteVotes  = isAdmin || isOwnProfile
canDeleteMatch  = isAdmin  (individual match row in vote history)
```

## Features

### Name suggestions (Tab 1 — AddNamesPage)
- Users suggest names per gender.
- **Optimistic pending list**: name appears instantly in `pendingNames` state while the Firestore write is in-flight. When Firestore confirms, the real name arrives via `onSnapshot` and the pending entry is removed (case-insensitive match). Rolls back with error toast on failure.
- **Slide-in animation**: new names enter from the left. Pre-existing names render with `entered=true` (no animation). New names start hidden and animate via double `requestAnimationFrame`.
- **Recent highlight**: `recentNames` Set tracks names for 1200ms; newly added names get a background colour that fades out over 1s.
- Clicking any name opens `NameDetailModal`.

### Voting (Tab 2 — VotePage)
- ELO duels within the same gender; gender is randomly chosen 50/50 per round.
- **Pair selection**: enumerates all valid pairs per gender, filters out already-voted pairs (key format: `"id1|id2"` sorted alphabetically), then picks with weighted random (weight = `1/(matchesA+1) + 1/(matchesB+1)`). Returns null when all pairs exhausted.
- **Three-ref pattern**: `namesRef`, `scoresRef`, `votedPairsRef` mirror the corresponding state so `computeNextPair()` always reads fresh data without stale closures.
- **Loading**: two independent flags (`namesLoaded`, `votedPairsLoaded`) — only shows content when both are true.
- **Saved pair**: current pair IDs persisted to `babyname-current-pair`. On reload, validates both names still exist and haven't been voted; falls back to fresh pair otherwise.
- **Vote timing**: click → 450ms delay → exit animation (150ms) → 155ms gap → enter animation. Firestore write runs in parallel; on failure the pair is restored to `votedPairsRef` and an error toast shows.
- **Card states**: normal (gender-coloured border), winner (scale 1.04, vivid border, tinted bg, ❤️), loser (scale 0.97, opacity 0.45).
- Requires ≥ 2 names in at least one gender to start voting.
- All names start at ELO 1000 (`DEFAULT_ELO` constant in `lib/elo.ts`, K=32).

### Ranking (Tab 3 — RankingPage)
- Toggle between **Combined** (average across all users) and **Mine** (current user only).
- Combined view shows per-user ELO breakdown in an avatar tooltip column (`allScores` array on each `RankedName`).
- Ranking position only counts names that have at least one match (`matches > 0`); others shown at 40% opacity.
- Entire table row is clickable → opens `NameDetailModal`.

### Users (Tab 4 — UsersPage)
- Lists all registered users from `useAuth().allUsers`. Current user has `(tú)` label.
- Tap any user to navigate to their profile page.

### User profile page (UserProfilePage)
- Accessible from: Users tab, "Mi perfil" menu item, admin panel.
- When `profileUserId` is set, the profile page replaces the tab content entirely (tabs hidden). Clearing it (back button or logo click) restores tabs.
- Profile UID persisted in `babyname-profile-uid` localStorage — survives refresh.
- **Ranking section**: female/male toggle, rows clickable → `NameDetailModal`.
- **Names section**: names suggested by this user. Admins see a trash icon; deletion is optimistic (`useOptimistic`) and cascades (see Cascade deletes).
- **Vote history**: last 10 matches shown (`✅ winner vs ❌ loser + date`). Admins see a trash icon per row for individual match deletion. A bulk "Borrar votos" button is shown to admins and the profile owner if there are any matches. "... y X duelos más" label is hardcoded in Spanish (not in locales).

### Name detail modal (NameDetailModal)
- Opens from: ranking rows (RankingPage + UserProfilePage), names list (AddNamesPage).
- Shows: large name, gender badge, proposer avatar + name (blue underlined, clickable → navigates to proposer's profile if `onNavigateToUser` is provided), combined ranking position (#X of Y names with votes).
- Outer wrapper + inner `ModalContent` child: hooks inside `ModalContent` (`useRanking`, etc.) only run when a name is selected (see Conditional hook pattern below).
- `onNavigateToUser` is optional; when missing, proposer is displayed but not clickable.

### Info modal
- Pink `ⓘ` button in the navbar (always visible) opens a modal explaining the app's purpose (in ES/EN).
- Content covers: app purpose, disclaimer (not binding), reference to Lucía, gender-reveal info, estimated due date.

### App-level navigation
- Clicking the navbar logo clears the profile overlay and navigates to the vote tab.
- Admin gear icon only visible when `isAdmin === true`; opens `AdminPage` in a right-side Drawer.

## Internationalization (i18n)

All user-facing strings live in **`src/locales.ts`** — edit there to update copy in ES/EN.
- `LocaleContext` provides `{ t, locale, toggleLocale }` via React Context.
- Every component uses `const { t } = useLocale()` — do NOT hardcode strings in components.
- All user-facing strings are in `locales.ts`; no known hardcoded strings remain.
- Language stored in `localStorage` key `babyname-locale` (default: `'es'`).
- To add a string: add the key+type to the `Strings` interface, then add the value in both `es` and `en` locales.
- Desktop and mobile can use separate keys (e.g. `langToggleLabel` vs `langToggleLabelMobile`).

## Patterns

### Persistent state
Use `useLocalStorage` from `@mantine/hooks`. Current keys:
- `babyname-tab` — active main tab (`'add' | 'vote' | 'ranking' | 'users'`); default `'vote'`
- `babyname-current-pair` — current duel pair IDs `[id1, id2] | null`
- `babyname-profile-uid` — profile page UID (`string | null`); read synchronously via `useState` lazy initializer, written back via `useEffect`
- `babyname-locale` — language preference (`'es' | 'en'`)

### Dual-state tab management
`tab` (from `useLocalStorage`) persists to localStorage but updates asynchronously (after first render). `displayTab` (from `useState`) is initialized synchronously by reading `localStorage` directly in the lazy initializer and lags behind `tab` during transitions so content only swaps after the exit animation completes.

### Tab transition direction
`TAB_ORDER = { add: 0, vote: 1, ranking: 2, users: 3 }` — used to compute animation direction. Moving to a higher-order tab slides content in from the right; moving to a lower-order tab slides from the left.

### Optimistic updates
For list mutations (delete name, delete match) use React 19's `useOptimistic` + `startTransition`:
```tsx
const [optimisticItems, removeOptimistic] = useOptimistic(
  items,
  (current, deletedId: string) => current.filter((item) => item.id !== deletedId)
);
startTransition(async () => {
  removeOptimistic(id);
  try { await deleteFromFirestore(id); }
  catch { notifications.show({ color: 'red', message: t.adminErrorMsg }); }
});
```
For fire-and-forget adds (AddNamesPage): update `pendingNames` immediately, call Firestore in background, roll back on `.catch()`.

### Animations
Use inline CSS `transform + opacity + transition` (not Mantine's `<Transition>` component). Double `requestAnimationFrame` ensures the browser commits the "reset" position before the enter animation starts:
```tsx
setPairStyle({ opacity: 0, transform: 'translateX(32px)', transition: 'none' });
requestAnimationFrame(() => requestAnimationFrame(() =>
  setPairStyle({ opacity: 1, transform: 'translateX(0)', transition: 'opacity 0.2s ease, transform 0.2s ease' })
));
```

### Responsive breakpoints
Use `xs` (not `sm`) everywhere: `visibleFrom="xs"`, `hiddenFrom="xs"`, `px={{ base: '...', xs: '...' }}`.
Below 380px (`useMediaQuery('(max-width: 380px)')`), tab labels stack vertically: emoji on top, smaller text below.

### Name display
Always wrap stored name text with `capitalizeName(text)` from `src/lib/utils.ts` before rendering. The raw text is stored as-is in Firestore and used for all comparisons/lookups — only display output is capitalized.

### Cascade deletes
- **Delete a name**: batch-delete all `userScores` where `nameId == id` AND all `matches` where `winnerId == id` OR `loserId == id` (two separate queries for the OR), then delete the name doc.
- **Delete all user votes** (`resetVotes`): batch-delete all `matches` + `userScores` where `userId == targetUserId`.
- **Delete a single vote** (`deleteMatch`): delete the match doc, then call `recalculateUserElo(userId)` which replays all remaining matches for that user from scratch and rewrites their `userScores`.
- All batch ops chunk in groups of 500 to stay within Firestore limits.

### Conditional hook pattern
When a modal's content uses hooks that should only fire when content is visible, use an outer wrapper + an inner child component:
```tsx
export function NameDetailModal({ name, onClose }) {
  return (
    <Modal opened={!!name} onClose={onClose}>
      {name && <ModalContent name={name} />}
    </Modal>
  );
}
function ModalContent({ name }) {
  const { data } = useSomeHook(name.id); // safe — only mounted when name != null
}
```

### Stale-closure avoidance with refs
In `VotePage`, `namesRef`, `scoresRef`, and `votedPairsRef` mirror their corresponding state so that `computeNextPair()` can always read the latest values synchronously without being recreated on every render. `namesRef.current = names` is assigned unconditionally on every render (not inside an effect).

## Pain Points & Known Rough Edges

### Firestore field name mismatch on matches
Matches are written to Firestore with a field named `timestamp` (via `serverTimestamp()`), but the `Match` TypeScript interface calls it `createdAt: Date`. The conversion (`d.data().createdAt?.toDate()`) works only because Firestore ignores the TypeScript name, but the stored field name and the type name are inconsistent.

### Race condition in ELO voting
`useVote` reads current ELO scores, computes new ratings client-side, and writes them back with `setDoc`. If two votes on the same name happen concurrently (e.g. two users voting at the same moment), the second write overwrites the first because both reads see the same stale score. No Firestore transaction is used.

### Admin bootstrap race condition
If the `/config/admins` document is missing and the seed admin opens the app in two tabs simultaneously, both tabs detect the missing doc and both fire `setDoc`. `setIsAdmin(true)` is set optimistically before the write completes, so if one write fails the UI may claim admin status incorrectly.

### O(n²) pair enumeration in VotePage
`pickPair()` enumerates all possible pairs with a nested loop (O(n²)), filters out voted pairs, then does a weighted random draw. With many names this blocks the main thread. Additionally, VotePage opens its own `onSnapshot(collection(db, 'names'))` independently of any `useNames` hook already active in the same session — duplicate subscriptions to the same collection.

### Combined ranking recomputed on every change
`buildRanking()` in `useRanking` iterates O(names × scores × users) on every call and every data change. No memoisation by name or score. With 5 users and 100 names this is thousands of operations per render cycle.

### All data loaded into memory, no pagination
- All names are loaded client-side (for VotePage, ranking, name lists).
- All `userScores` for a user are loaded into VotePage.
- All matches for a user are loaded into `useUserProfile` (even though only 10 are shown).
- All users are streamed in `AuthContext` indefinitely.

### Deleted name shows '?' in vote history
Match documents store only `winnerId`/`loserId` (IDs). When a name is deleted its ID is gone, so the vote history shows `✅ ? vs ❌ ?`. No name snapshot is stored in the match document.

### Client-side duplicate name check has a race condition
`AddNamesPage` checks for duplicates against the locally cached `femaleNames`/`maleNames` before writing. If two users add the same name simultaneously, both pass the local check and both writes succeed, creating duplicates in Firestore.

### Type-unsafe Firestore reads throughout
All Firestore documents are read with `doc.data() as Omit<Type, 'id'>`, which bypasses TypeScript. Schema drift between Firestore and TypeScript types produces no compile-time error.

### Silent catch blocks
Most `catch` blocks in the app swallow the original error object and show only a generic toast (`t.adminErrorMsg`). The actual Firestore or network error is discarded with no console logging, making debugging difficult.

### Unused returned values
- `useUserProfile` returns a `scores` array that is not destructured in `UserProfilePage.tsx`.
- `useVote` exposes a `loading` boolean that is never consumed by `VotePage`.

### Dual-state tab pattern complexity
`App.tsx` maintains two sources of truth for the active tab: `tab` (from `useLocalStorage`, async) and `displayTab` (from `useState`, initialised by directly reading `localStorage`). This workaround is necessary because Mantine's `useLocalStorage` applies its value in a `useEffect` (after first render), but it creates two places to update and a subtle window where the two values diverge beyond the intended animation gap.

### Hardcoded admin UID in source
`SEED_ADMIN_UID` in `useAdmin.ts` is a plain string literal committed to the repo. Anyone who reads the source code knows which UID triggers the bootstrap and could exploit it if the `/config/admins` doc is ever deleted.

### UserScore updates not restricted by Firestore rules
The Firestore rule for `/userScores` allows `update` as long as `request.resource.data.userId == request.auth.uid`. This means a user can directly patch their own `eloScore`, `wins`, and `losses` via the Firestore SDK, bypassing the app's ELO logic entirely.

## Firebase Project

Project ID: `babyname-e092d`
Deploy: `firebase deploy --only firestore` (rules + indexes), `firebase deploy --only hosting` (frontend).
