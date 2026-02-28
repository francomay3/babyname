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
- Exception: `"... y X duelos más"` in vote history and `title="Ver perfil"` in AdminPage are hardcoded in Spanish.
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
- **Delete a single vote** (`deleteMatch`): delete the match doc + `increment(-1)` wins/matches on winner's score and losses/matches on loser's score. ELO is NOT recalculated.
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

## Firebase Project

Project ID: `babyname-e092d`
Deploy: `firebase deploy --only firestore` (rules + indexes), `firebase deploy --only hosting` (frontend).
