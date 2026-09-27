# Groups SDD Progress Ledger

Branch: feature/groups
Plan: docs/superpowers/plans/2026-09-25-groups-feature.md
Started: 2026-09-25

## Task ledger

| Task | Scope | Status |
|------|-------|--------|
| 1 | `types.js` models + `permissions.js` matrix | done |
| 2 | `groupsStorage.js` persistence | done |
| 3 | `GroupsContext.jsx` CRUD + `useGroupPermissions` | done |
| 4 | `GroupExplorer` + `CreateGroupModal` + `GroupsPage` | done |
| 5 | `MessageFeed` + `FileUploadModal` | done |
| 6 | `SharedFilesPanel` + `MemberManagementPanel` | done |
| 7 | `GroupSettings` + `GroupWorkspace` + `GroupDetailPage` | done |
| 8 | App provider/routes + Navbar link | done |

## Key decisions

- **Single source of truth for permissions.** `useGroupPermissions` derives every
  flag (`canViewContent`, `canPost`, `canUpload`, `canManageMembers`,
  `canManageSettings`, `canDeleteGroup`, `canJoinPublic`, `canRequestJoin`) from
  the same `canPerformAction` the context mutations call, so the UI can never
  offer an action the store would reject. Components only choose *which* CTA to
  render; guards, confirmations, and toasts stay in the context layer.
- **`requestRow` / `requestStatus`** expose the user's pending/invited row, which
  the active-membership lookup deliberately ignores (pending rows must not grant
  access). Drives "Pending…" in the Explorer and "Accept invite" in the locked
  workspace panel.
- **`isPlatformAdmin`** is a boolean flag on the hook (the `permissions.js`
  helper of the same name is the function) — avoids shadowing confusion in
  components.
- **`postMessage` links attachments both ways**: the mirrored `sharedFiles` row
  id is stored on `message.attachment.fileId`, so deleting the file from the
  Files tab clears the badge in Discussion.
- **`GroupSettings` uses lazy `useState` initialisers**, not a sync-setState
  effect (rejected by `react-hooks/set-state-in-effect`); the parent keys it by
  group id so switching groups rebuilds the draft.

## Verification

- `npm test` → 15/15 pass (`groupsStorage`, `isPlatformAdmin`, `hasGroupAccess`,
  `canPerformAction`).
- `npm run lint` → clean (whole repo, `eslint .`).
- `npm run build` → succeeds, 85 modules transformed.
- Ad-hoc audit: every `styles.*` class referenced by the groups JSX exists in its
  co-located `.module.css` (script run once, then removed).
- Plan Task 8 step 3 checklist traced through the code paths: signed-out guard
  (`App.jsx` `SignedInOnly` + page redirects), create/join/request/invite/accept
  flows, non-member private lock, platform-admin override, attachment mirroring.
  Interactive click-through in `npm run dev` is still outstanding.

