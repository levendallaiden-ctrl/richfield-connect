# Richfield Connect

**Student Name & Surname:** Aiden Levendall
**Student ITS Number:** 402411117
**Module:** Web Technology 512 (WT512)
**Assignment:** Richfield Connect — React Single-Page Application

## About This Application

Richfield Connect is a React SPA built for Richfield Graduate Institute of
Technology. Students can create profiles, sign in, share posts with optional
image or file attachments, comment, like content, and manage their community
presence — including study, project, and social groups with their own
discussion threads, shared files, and member management. Staff accounts have
additional moderation tools for deleting posts, comments, and user accounts.

The app uses React Router for client-side navigation, Context providers for
global state, CSS Modules for component styling, and browser localStorage for
persistence. It is a frontend prototype and does not use a backend server.

### Component Architecture

- `App` — root component; wraps the app in `ThemeProvider`, `AppProvider`, and
  `GroupsProvider`, defines all routes, and renders a persistent `Navbar` /
  `Footer` / `Toast`
- `Navbar` / `Footer` — persistent nav and footer on every view; the Navbar
  links to Home, About, Feed, Groups, People, and Profile, adds an Admin link
  for staff accounts, and includes the light/dark theme toggle and a responsive
  mobile menu
- `PageTransition` — wraps the currently routed page so navigating replays a
  fade-in entry animation
- `Home` — landing page with hero section, platform stats, and feature highlights
- `About` — platform purpose, community guidelines, and contact info
- `SignUpForm` — controlled registration form with validation; also handles
  editing an existing profile and optional gated admin registration
- `SignInForm` — email/password sign-in with validation and a development-only
  admin shortcut available through the `?devadmin` query flag in development
- `ResetPassword` — local prototype password reset flow for saved accounts
- `People` — searchable directory of saved community profiles
- `ProfilePreview` — live preview, receives all data as props from `SignUpForm`
- `Profile` — displays the registered user's data from global state/localStorage;
  also supports viewing another member's public profile; editing, sign out, and
  account deletion controls are limited to your own profile
- `Feed` — manages the posts list, renders `CreatePost` and a list of `Post`
- `CreatePost` — controlled composer for text posts with optional image and file attachments
- `Post` — individual post card with post likes, comment likes, attachments, and permission-based delete functionality
- `Admin` — protected staff dashboard with account search, role filtering, statistics,
  and account deletion
- `Toast` — global notification banner for actions like posting, deleting, and signing out
- `NotFound` — catch-all 404 page for unmatched routes

The Groups feature lives in `src/features/groups/`:

- `GroupsContext` — `GroupsProvider` owns group, membership, message, and shared
  file state plus every mutation; `useGroups()` reads that state and
  `useGroupPermissions(groupId)` derives the current user's per-group flags
- `GroupExplorer` — searchable, type- and privacy-filtered directory of groups
  with permission-aware Join, Request, Open, and "Pending…" actions
- `CreateGroupModal` — creates a group from a name, description, type, privacy
  setting, and optional house rules
- `GroupWorkspace` — per-group workspace with Discussion, Files, Members, and
  (for members who can manage the group) Settings views; non-members get a
  locked card offering Join, Request to join, or Accept invite
- `MessageFeed` / `FileUploadModal` — discussion thread with optional file and
  image attachments
- `SharedFilesPanel` — newest-first list of everything shared with the group,
  including attachments posted in the discussion
- `MemberManagementPanel` — active roster for every member; join requests,
  invites, and the invite-by-email form for members who can manage the group
- `GroupSettings` — edits name, description, type, privacy, and rules, or
  deletes the group
- `GroupsPage` / `GroupDetailPage` — route-level screens for the directory and a
  single group

Global state (`user`, `accounts`, `posts`, and `toast`) lives in
`src/context/AppContext.jsx`. A separate `src/context/ThemeContext.jsx` manages
the light/dark theme, and `GroupsProvider` in
`src/features/groups/GroupsContext.jsx` sits inside it to supply group state to
the whole router.

## Routes

- `/` - Home
- `/about` - About the platform
- `/signup` - Create or edit a profile
- `/signin` - Sign in
- `/reset-password` - Reset a saved account password
- `/profile` - Current user profile
- `/profile/edit` - Edit the signed-in user's profile
- `/profile/:email` - Public profile for another saved account
- `/people` - Searchable community directory
- `/feed` - Community posts
- `/groups` - Group directory for signed-in users
- `/groups/:groupId` - A single group workspace (discussion, files, members)
- `/admin` - Admin-only account dashboard
- `/terms-and-conditions` - Terms and conditions

## Running Locally

1. Unzip the project folder
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`
4. Open the URL shown in the terminal (usually `http://localhost:5173`)

### View the App on a Phone

Connect the phone and development computer to the same Wi-Fi network, then
start Vite so it listens on the local network:

```bash
npm run dev -- --host 0.0.0.0
```

Open `http://YOUR-COMPUTER-IP:5173` on the phone. On Windows, find the local
IP with `ipconfig`. Keep the dev server running while testing.

### Production Preview

Build the optimized production bundle and preview it locally:

```bash
npm run build
npm run preview
```

The project is Vercel-ready. Vercel can deploy it directly from the `main`
branch using the standard Vite settings: `npm run build` as the build command
and `dist` as the output directory.

## Testing Admin Features

Admin tools can be tested locally without a backend:

1. Open `/signup` and complete the registration form.
2. Select `Register as an admin`.
3. Enter the admin access code: `RICHFIELD-ADMIN-2026`.
4. Complete registration and open `/admin` from the navigation bar.
5. Use the admin dashboard to search accounts, filter by role, and delete accounts.

Admin users can also delete any post or comment in the feed. Regular users can
only delete their own posts and comments.

### Development Admin Shortcut

When running the Vite development server, open `/signin?devadmin` and select
`DEV: Admin shortcut`. This shortcut is only shown in development mode and is
not available in a production build.

## Groups

Groups let students organise into study, project, and social spaces. The feature
is a self-contained module in `src/features/groups/`, and both of its routes
require a signed-in user, so signed-out visitors are redirected to `/signin`.

### Roles, Privacy, and Permissions

Each group has a type (`social`, `project`, or `study`) and a privacy level of
`PUBLIC` or `PRIVATE`. Memberships carry a role (`GROUP_ADMIN` or
`GROUP_MEMBER`) and a status (`active`, `pending`, or `invited`), and only an
active membership grants access to the workspace.

| Action | Platform admin | Group admin | Active member | Signed-in non-member |
| --- | --- | --- | --- | --- |
| View discussion and files | Yes | Yes | Yes | No |
| Post messages and share files | Yes | Yes | Yes | No |
| Invite members, manage members, edit settings | Yes | Yes | No | No |
| Delete the group | Yes | Yes | Creator only | No |
| Join a public group | Not needed — already has access | — | — | Yes |
| Request to join a private group | Not needed — already has access | — | — | Yes |

A pending request or an open invite never counts as membership, so a workspace
stays locked until a group admin approves the request or the invitee accepts.

### Joining a Group

- **Public group** — `Join group` from the explorer card or from the locked
  workspace is immediate; the visitor becomes an active `GROUP_MEMBER`
- **Private group** — `Request to join` creates a pending row that a group admin
  accepts or rejects from the Members view
- **Invited by email** — a member who can manage the group invites an email that
  already has a saved account; the invitee sees a pending state until they open
  the group and select `Accept invite`

### House Rules Enforced in the Store

The workspace only offers actions the store would allow, because every flag from
`useGroupPermissions` is derived from the same `canPerformAction` call the
mutations make. Behind that, `GroupsContext` rejects:

- An empty or duplicate group name (the comparison is case-insensitive)
- Joining or requesting twice — an existing active, pending, or invited row
  short-circuits with an explanatory toast
- Content deletion by anyone other than the author/uploader, a group admin, or a
  platform admin; deleting a message also clears the file it mirrored into the
  Files view
- Leaving, removing, or demoting the last active group admin — promote a
  replacement first, or delete the group

Deleting a group removes its memberships, messages, and shared files with it.
Group data is persisted in the browser under `richfieldConnectGroups`,
`richfieldConnectGroupMemberships`, `richfieldConnectGroupMessages`, and
`richfieldConnectGroupFiles`; unreadable values fall back to empty lists instead
of crashing the module.

## Useful Commands

```bash
npm run dev       # Start the development server
npm run build     # Create a production build in dist/
npm run lint      # Run ESLint
npm test          # Run the Groups unit tests with node --test
npm run preview   # Preview the production build locally
```

### Automated Tests

`npm test` runs the Groups unit tests with Node's built-in test runner
(`node --test`), with no extra test framework to install:

- `src/features/groups/groupsStorage.test.js` — storage reads and writes,
  including missing keys, corrupt JSON, and non-array values
- `src/features/groups/permissions.test.js` — `isPlatformAdmin`,
  `hasGroupAccess`, and every row of the `canPerformAction` matrix

The storage suite swaps in a small in-memory `localStorage` stub and the
permission suite is pure, so all 15 tests pass from a clean checkout with no
browser, dev server, or additional test framework.

## External Resources Referenced

- W3Schools — React Hooks (useState, useEffect) — https://www.w3schools.com/react/react_hooks.asp
- W3Schools — React Router — https://www.w3schools.com/react/react_router.asp
- React Router v6 documentation — https://reactrouter.com
- MDN Web Docs — Window: localStorage property

## Design Notes

- CSS Modules used throughout for component-scoped styling
- The sign-up form and live profile preview use the Soft Campus visual variant:
  rounded surfaces, pastel blue and red accents, a white base, and responsive
  form/preview columns
- Account data, including passwords, is stored in browser localStorage because
  this is a frontend-only prototype. Do not use real passwords or deploy this
  authentication model to production.
- Admin registration requires the development access code defined in
  `src/pages/SignUpForm/SignUpForm.jsx`; this is a client-side prototype gate,
  not a secure authorization system. The development shortcut is similarly
  intended only for local testing.
- Campus options reflect Richfield's official locations: Bryanston, Cape Town,
  Umhlanga, Musgrave, Polokwane New Premium, Newtown Junction, Centurion,
  Pretoria, and Online Learning
- Profile's Posts count is calculated live from real post data. The Connections
  and Groups counters on a profile are still deterministic placeholders seeded
  from the student number and are unrelated to the Groups feature described
  above, which keeps its own real state
- Comments on posts and the dark mode toggle are bonus features beyond the
  brief's formal requirements — the brief's background section mentions
  "likes and comments" as part of the platform's vision, but only Like and
  Delete are formally specified under the graded functional requirements
- The Groups module is an additional bonus feature on the same basis: the graded
  requirements cover profiles, posts, and admin moderation, so group creation,
  membership requests, invitations, discussions, shared files, and group roles
  are documented here rather than assumed
- Signing out clears the active session while keeping the saved account on the
  device. `Clear Saved Account` removes the current account from localStorage.
- Posts, comments, likes, attachment metadata, and all group data are persisted
  locally in the browser. Image attachments are stored as data URLs, so large
  files can consume localStorage quickly — this applies both to post
  attachments and to files shared inside a group.

## Deployment Limitations

This application currently has no backend, database, real session management,
or server-side authorization. Admin roles, passwords, posts, comments, group
memberships, and attachments are controlled by client-side code and browser
storage. Use the project as a demonstration prototype only; a production
version should move authentication, authorization, persistence, and media
storage to a secure backend.

## Note on Project Structure

This project uses Vite (as recommended in the assignment brief), which places
`index.html` at the project root rather than inside `public/`. This is Vite's
standard convention, not a deviation from the required structure — `public/`
is used here for static assets only, per Vite's documentation.