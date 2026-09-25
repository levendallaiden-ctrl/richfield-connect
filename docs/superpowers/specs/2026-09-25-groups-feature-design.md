# Groups Feature Design

**Date:** 2026-09-25  
**Status:** Approved for planning  
**App:** Richfield Connect (Vite + React JSX, localStorage)

## Summary

Add an end-to-end Groups module supporting social, project, and study spaces with feed-based discussion, file sharing, RBAC (Group Admin / Group Member), public/private privacy, and Platform Admin override. Persistence matches the existing app: localStorage. Language remains JSX with JSDoc shape contracts (no TypeScript migration).

## Decisions

| Topic | Choice |
|-------|--------|
| Persistence | localStorage (same model as users/posts) |
| Language | JSX + JSDoc / `types.js` contracts |
| Discussion | Feed-based for v1; chat deferred |
| Private join | Invite **and** join request |
| Who can create | Any signed-in user; Platform Admins create/moderate any group |
| Group types | Soft defaults only (same features/permissions for all types) |
| Architecture | Dedicated `GroupsContext` + pure `permissions.js` + `src/features/groups/` |

## Architecture

### Module layout

```
src/features/groups/
  types.js
  permissions.js
  groupsStorage.js
  GroupsContext.jsx
  components/
    GroupExplorer/
    GroupWorkspace/
    MessageFeed/
    FileUploadModal/
    MemberManagementPanel/
    GroupSettings/
    CreateGroupModal/
  pages/
    GroupsPage.jsx          # /groups
    GroupDetailPage.jsx     # /groups/:groupId
```

### App wiring

- Nest `<GroupsProvider>` inside existing `AppProvider` (needs current `user`).
- Routes (signed-in for create/join/post; explorer requires sign-in for consistency with Feed/People community features):
  - `/groups` → GroupsPage (Explorer)
  - `/groups/:groupId` → GroupDetailPage (Workspace)
- Navbar: add **Groups** alongside Feed / People.

### Role model

| Role | Source |
|------|--------|
| Platform Admin | `user.role === "admin"` \|\| `user.isAdmin` |
| Group Admin | Membership `role: "GROUP_ADMIN"` and `status: "active"` |
| Group Member | Membership `role: "GROUP_MEMBER"` and `status: "active"` |
| Non-member | No active membership |

Platform Admins retain full visibility and moderation on **all** groups regardless of privacy.

## Data models

Defined in `types.js` via JSDoc `@typedef`.

### Group

- `id` (UUID)
- `name`, `description`, `rules` (strings)
- `type`: `"social"` \| `"project"` \| `"study"`
- `privacy`: `"PUBLIC"` \| `"PRIVATE"`
- `createdBy` (user email)
- `createdAt`, `updatedAt` (ISO strings)

### GroupMember

- `id`, `groupId`, `userEmail`
- `role`: `"GROUP_ADMIN"` \| `"GROUP_MEMBER"`
- `status`: `"active"` \| `"pending"` \| `"invited"`
- `joinedAt` (ISO; set when becoming `active`)

Memberships with status are the single source of truth for invites and join requests (no separate invite tables).

### GroupMessage

- `id`, `groupId`
- `authorEmail`, `authorName`
- `content` (string)
- `attachment` (nullable `FileAttachment`)
- `createdAt` (ISO)

### FileAttachment / SharedFile

Matches existing Feed attachment shape:

- `type`, `name`, `size`, `mimeType`, `dataUrl`
- Shared-files list entries also carry `id`, `groupId`, `uploadedBy`, `createdAt`

Files tab aggregates: (1) dedicated `sharedFiles` uploads and (2) message attachments for that group. When a message is posted with an attachment, context also creates a matching `sharedFiles` entry (same attachment payload, linked by message id where useful) so Files stays complete without a separate sync pass.

### Soft defaults by type (create form only)

| Type | Default privacy | Notes |
|------|-----------------|-------|
| Social | PUBLIC | Light community rules stub |
| Project | PRIVATE | Collaboration rules stub |
| Study | PUBLIC | Study norms rules stub |

User may override privacy and rules before save.

## Access control

Pure helpers in `permissions.js` (no React dependencies):

- `hasGroupAccess(user, group, membership)` — may view Discussion / Files / Members content
- `canPerformAction(user, group, membership, action)` — boolean for UI + mutations

### Permission matrix

| Action | Non-member | Member | Group Admin | Platform Admin |
|--------|------------|--------|-------------|----------------|
| View public metadata | Yes | Yes | Yes | Yes |
| View private / full content | No | Yes | Yes | Yes |
| Post message / upload file | No | Yes | Yes | Yes (override) |
| Invite / accept-reject requests / remove members | No | No | Yes | Yes |
| Update group settings | No | No | Yes | Yes |
| Delete group | No | No | Creator or Group Admin | Yes |
| Join public instantly | Yes (signed-in) | — | — | Yes |
| Request join (private) | Yes (signed-in) | — | — | N/A (already full access) |

**Rules:**

- UI hides controls the user cannot use.
- Context mutations **re-check** `canPerformAction` before writing.
- Private group content never rendered for non-members unless Platform Admin.
- Explorer may show private groups as limited cards (name, type, “Private”) without messages/files/member details.

## State / context layer

`GroupsContext` holds and persists:

- `groups`
- `memberships`
- `messages`
- `sharedFiles`

localStorage keys (namespaced), e.g.:

- `richfieldConnectGroups`
- `richfieldConnectGroupMemberships`
- `richfieldConnectGroupMessages`
- `richfieldConnectGroupFiles`

### Operations

- Group: `createGroup`, `updateGroup`, `deleteGroup`
- Membership: `joinPublicGroup`, `requestToJoin`, `inviteMember`, `respondToRequest`, `removeMember`, `changeMemberRole`
- Content: `postMessage`, `uploadSharedFile`, `deleteMessage`, `deleteSharedFile`

`useGroupPermissions(groupId)` derives membership and `can*` flags for the active user.

Creator of a new group is added as `GROUP_ADMIN` / `active`.

## Components

### GroupExplorer

- Search and filter by name, type, privacy
- Cards: name, type badge, privacy, member count
- Actions: Join (public), Request / Pending (private), Open (member or Platform Admin)
- Create Group CTA → CreateGroupModal

### GroupWorkspace

- Header + tabs: Discussion | Files | Members | Settings
- Settings tab only if `canManageSettings`
- Access-denied locked panel for non-members on private groups (Platform Admin never locked)

### MessageFeed

- Chronological message list + composer
- Optional attachment via FileUploadModal
- Loading / empty / error states

### FileUploadModal

- Drag-and-drop or file picker
- Produce data URL attachment (same pattern as Feed `CreatePost`)
- Warn when file is large (localStorage practical limits)

### MemberManagementPanel

- Active members, pending requests, pending invites
- Promote/demote, accept/reject, remove
- Invite by email (must match an existing account in `AppContext.accounts`)

### GroupSettings

- Edit name, description, rules, type, privacy
- Save → toast on success; validation errors inline

## Data flow

```
User action → component → GroupsContext mutation
  → canPerformAction check
  → update React state
  → persist localStorage
  → showToast / surface error
```

## UI states

| State | Behavior |
|-------|----------|
| Loading | Hydration message or skeleton while reading storage |
| Empty | Explorer / feed / files empty copy + CTA where appropriate |
| Error | Inline message + toast; permission failures never silent |
| Access denied | Locked workspace panel with join/request guidance |

## Integration steps

1. Add `src/features/groups/` module as above.
2. Wrap app with `GroupsProvider` inside `AppProvider` in `App.jsx`.
3. Register `/groups` and `/groups/:groupId` routes; gate mutating flows with signed-in user.
4. Add Groups link to `Navbar`.
5. Reuse existing CSS variables / surface styles for visual consistency with Feed and Admin.
6. Seed optional demo groups only if useful for QA (not required for production path).

## Out of scope (v1)

- Real-time chat UI and WebSocket sync
- Push/email notifications
- Server-side file storage or virus scanning
- Cross-device sync beyond shared browser localStorage
- Per-type feature branching beyond soft create defaults

## Testing notes (manual QA)

- Public join, private request + invite approve/reject
- Non-member cannot open private Discussion/Files
- Platform Admin can open and moderate any private group
- Group Admin can change privacy, roles, and remove members
- Member can post/upload; cannot open Settings
- Large attachment warning; empty and error states visible

## Success criteria

- Signed-in users can create and participate in groups with correct RBAC
- Private content is inaccessible to non-members except Platform Admins
- Discussion feed and shared files work with attachments
- Module is modular, permission logic is centralized, and UI handles loading/empty/error
