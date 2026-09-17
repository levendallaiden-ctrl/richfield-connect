# Richfield Connect

**Student Name & Surname:** Aiden Levendall
**Student ITS Number:** 402411117
**Module:** Web Technology 512 (WT512)
**Assignment:** Richfield Connect — React Single-Page Application

## About This Application

Richfield Connect is a React SPA built for Richfield Graduate Institute of
Technology. Students can create profiles, sign in, share posts, comment, like
content, and manage their community presence. Staff accounts have additional
moderation tools for deleting posts, comments, and user accounts.

The app uses React Router for client-side navigation, Context providers for
global state, CSS Modules for component styling, and browser localStorage for
persistence. It is a frontend prototype and does not use a backend server.

### Component Architecture

- `App` — root component; wraps the app in `AppProvider` and `ThemeProvider`,
  defines all routes, and renders a persistent `Navbar` / `Footer` / `Toast`
- `Navbar` / `Footer` — persistent nav and footer on every view; Navbar
  includes the light/dark theme toggle and a responsive mobile menu
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
- `CreatePost` — controlled textarea for composing new posts
- `Post` — individual post card with like, comment, and permission-based delete functionality
- `Admin` — protected staff dashboard with account search, role filtering, statistics,
  and account deletion
- `Toast` — global notification banner for actions like posting, deleting, and signing out
- `NotFound` — catch-all 404 page for unmatched routes

Global state (`user`, `accounts`, `posts`, and `toast`) lives in
`src/context/AppContext.jsx`. A separate `src/context/ThemeContext.jsx` manages
the light/dark theme.

## Routes

- `/` - Home
- `/about` - About the platform
- `/signup` - Create or edit a profile
- `/signin` - Sign in
- `/reset-password` - Reset a saved account password
- `/profile` - Current user profile
- `/profile/:email` - Public profile for another saved account
- `/people` - Searchable community directory
- `/feed` - Community posts
- `/admin` - Admin-only account dashboard

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

## Useful Commands

```bash
npm run dev       # Start the development server
npm run build     # Create a production build in dist/
npm run lint      # Run ESLint
npm run preview   # Preview the production build locally
```

## External Resources Referenced

- W3Schools — React Hooks (useState, useEffect) — https://www.w3schools.com/react/react_hooks.asp
- W3Schools — React Router — https://www.w3schools.com/react/react_router.asp
- React Router v6 documentation — https://reactrouter.com
- MDN Web Docs — Window: localStorage property

## Design Notes

- CSS Modules used throughout for component-scoped styling
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
- Profile's Posts count is calculated live from real post data; Connections
  and Groups are deterministic placeholders seeded from the student number,
  since the brief doesn't require a friends/groups feature
- Comments on posts and the dark mode toggle are bonus features beyond the
  brief's formal requirements — the brief's background section mentions
  "likes and comments" as part of the platform's vision, but only Like and
  Delete are formally specified under the graded functional requirements
- Signing out clears the active session while keeping the saved account on the
  device. `Clear Saved Account` removes the current account from localStorage.

## Note on Project Structure

This project uses Vite (as recommended in the assignment brief), which places
`index.html` at the project root rather than inside `public/`. This is Vite's
standard convention, not a deviation from the required structure — `public/`
is used here for static assets only, per Vite's documentation.