# Groups Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a localStorage-backed Groups module with public/private privacy, Group Admin / Member RBAC, Platform Admin override, feed discussion, file sharing, invites, and join requests.

**Architecture:** Dedicated `src/features/groups/` module with JSDoc types, pure `permissions.js`, `groupsStorage.js`, and `GroupsContext` nested under `AppProvider`. Pages at `/groups` and `/groups/:groupId` with Explorer + Workspace tabs. UI reuses existing CSS variables and Feed attachment (data URL) patterns.

**Tech Stack:** React 19, React Router 7, Vite 8, JSX + JSDoc, localStorage, Node built-in `node:test` for permission/storage unit tests (no new test runner dependency).

**Spec:** `docs/superpowers/specs/2026-09-25-groups-feature-design.md`

## Global Constraints

- Persistence: localStorage only (keys prefixed `richfieldConnectGroup*`)
- Language: JSX + JSDoc typedefs — no TypeScript migration
- Discussion: feed-based only (no chat UI)
- Private join: invite **and** join request via membership `status`
- Creation: any signed-in user; creator becomes `GROUP_ADMIN`
- Platform Admin: `user.role === "admin" || user.isAdmin` — full access to all groups
- Group types: soft create defaults only (`social`/`project`/`study`)
- Match existing UI tokens (`var(--surface)`, `var(--richfield-blue)`, etc.)
- Mutating routes require signed-in user; explorer requires sign-in
- Context mutations must re-check `canPerformAction` before writing

## File structure

| Path | Responsibility |
|------|----------------|
| `src/features/groups/types.js` | JSDoc typedefs + constants (`PRIVACY`, `GROUP_TYPES`, `ACTIONS`, roles) |
| `src/features/groups/permissions.js` | Pure access helpers |
| `src/features/groups/permissions.test.js` | Unit tests for permissions |
| `src/features/groups/groupsStorage.js` | Read/write localStorage arrays |
| `src/features/groups/groupsStorage.test.js` | Storage helper tests (mock localStorage) |
| `src/features/groups/GroupsContext.jsx` | Provider, CRUD, `useGroups`, `useGroupPermissions` |
| `src/features/groups/components/*/` | UI components + CSS modules |
| `src/features/groups/pages/*.jsx` | Route page wrappers |
| `src/App.jsx` | Provider nest + routes |
| `src/components/Navbar/Navbar.jsx` | Groups nav link |
| `package.json` | Add `"test": "node --test src/features/groups/**/*.test.js"` |

---

### Task 1: Types and permission helpers

**Files:**
- Create: `src/features/groups/types.js`
- Create: `src/features/groups/permissions.js`
- Create: `src/features/groups/permissions.test.js`
- Modify: `package.json` (add `test` script)

**Interfaces:**
- Consumes: none
- Produces:
  - Constants: `PRIVACY`, `GROUP_ROLES`, `MEMBER_STATUS`, `GROUP_TYPES`, `GROUP_ACTIONS`, `TYPE_DEFAULTS`
  - `isPlatformAdmin(user) → boolean`
  - `getActiveMembership(memberships, groupId, userEmail) → GroupMember|null`
  - `hasGroupAccess(user, group, membership) → boolean`
  - `canPerformAction(user, group, membership, action) → boolean`

- [ ] **Step 1: Add test script to package.json**

Add to `"scripts"`:

```json
"test": "node --test src/features/groups/**/*.test.js"
```

- [ ] **Step 2: Write failing permission tests**

Create `src/features/groups/permissions.test.js`:

```js
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  hasGroupAccess,
  canPerformAction,
  isPlatformAdmin,
} from "./permissions.js";
import { GROUP_ACTIONS, PRIVACY } from "./types.js";

const memberUser = { email: "m@test.com", role: "user" };
const adminUser = { email: "a@test.com", role: "admin" };
const publicGroup = { id: "g1", privacy: PRIVACY.PUBLIC, createdBy: "c@test.com" };
const privateGroup = { id: "g2", privacy: PRIVACY.PRIVATE, createdBy: "c@test.com" };
const activeMember = {
  groupId: "g2",
  userEmail: "m@test.com",
  role: "GROUP_MEMBER",
  status: "active",
};
const activeGroupAdmin = {
  groupId: "g2",
  userEmail: "m@test.com",
  role: "GROUP_ADMIN",
  status: "active",
};

describe("isPlatformAdmin", () => {
  it("detects role admin and isAdmin flag", () => {
    assert.equal(isPlatformAdmin({ role: "admin" }), true);
    assert.equal(isPlatformAdmin({ isAdmin: true }), true);
    assert.equal(isPlatformAdmin({ role: "user" }), false);
    assert.equal(isPlatformAdmin(null), false);
  });
});

describe("hasGroupAccess", () => {
  it("allows anyone signed-relevant for PUBLIC content when member or public join context", () => {
    assert.equal(hasGroupAccess(memberUser, publicGroup, activeMember), true);
  });

  it("denies non-member on PRIVATE", () => {
    assert.equal(hasGroupAccess(memberUser, privateGroup, null), false);
  });

  it("allows active member on PRIVATE", () => {
    assert.equal(hasGroupAccess(memberUser, privateGroup, activeMember), true);
  });

  it("allows platform admin on PRIVATE without membership", () => {
    assert.equal(hasGroupAccess(adminUser, privateGroup, null), true);
  });
});

describe("canPerformAction", () => {
  it("blocks post for non-member on private", () => {
    assert.equal(
      canPerformAction(memberUser, privateGroup, null, GROUP_ACTIONS.POST_MESSAGE),
      false,
    );
  });

  it("allows post for active member", () => {
    assert.equal(
      canPerformAction(memberUser, privateGroup, activeMember, GROUP_ACTIONS.POST_MESSAGE),
      true,
    );
  });

  it("allows settings only for group admin or platform admin", () => {
    assert.equal(
      canPerformAction(memberUser, privateGroup, activeMember, GROUP_ACTIONS.UPDATE_SETTINGS),
      false,
    );
    assert.equal(
      canPerformAction(memberUser, privateGroup, activeGroupAdmin, GROUP_ACTIONS.UPDATE_SETTINGS),
      true,
    );
    assert.equal(
      canPerformAction(adminUser, privateGroup, null, GROUP_ACTIONS.UPDATE_SETTINGS),
      true,
    );
  });

  it("allows platform admin to post without membership", () => {
    assert.equal(
      canPerformAction(adminUser, privateGroup, null, GROUP_ACTIONS.POST_MESSAGE),
      true,
    );
  });
});
```

- [ ] **Step 3: Run tests — expect FAIL**

Run: `npm test`

Expected: FAIL (Cannot find module `./permissions.js` or `./types.js`)

- [ ] **Step 4: Implement types.js**

Create `src/features/groups/types.js`:

```js
/**
 * @typedef {"PUBLIC"|"PRIVATE"} PrivacyLevel
 * @typedef {"social"|"project"|"study"} GroupType
 * @typedef {"GROUP_ADMIN"|"GROUP_MEMBER"} GroupRole
 * @typedef {"active"|"pending"|"invited"} MemberStatus
 *
 * @typedef {Object} Group
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} rules
 * @property {GroupType} type
 * @property {PrivacyLevel} privacy
 * @property {string} createdBy
 * @property {string} createdAt
 * @property {string} updatedAt
 *
 * @typedef {Object} GroupMember
 * @property {string} id
 * @property {string} groupId
 * @property {string} userEmail
 * @property {GroupRole} role
 * @property {MemberStatus} status
 * @property {string|null} joinedAt
 *
 * @typedef {Object} FileAttachment
 * @property {string} type
 * @property {string} name
 * @property {number} size
 * @property {string} mimeType
 * @property {string} dataUrl
 *
 * @typedef {Object} GroupMessage
 * @property {string} id
 * @property {string} groupId
 * @property {string} authorEmail
 * @property {string} authorName
 * @property {string} content
 * @property {FileAttachment|null} attachment
 * @property {string} createdAt
 *
 * @typedef {Object} SharedFile
 * @property {string} id
 * @property {string} groupId
 * @property {string} uploadedBy
 * @property {string} createdAt
 * @property {string} [messageId]
 * @property {string} type
 * @property {string} name
 * @property {number} size
 * @property {string} mimeType
 * @property {string} dataUrl
 */

export const PRIVACY = Object.freeze({
  PUBLIC: "PUBLIC",
  PRIVATE: "PRIVATE",
});

export const GROUP_ROLES = Object.freeze({
  GROUP_ADMIN: "GROUP_ADMIN",
  GROUP_MEMBER: "GROUP_MEMBER",
});

export const MEMBER_STATUS = Object.freeze({
  ACTIVE: "active",
  PENDING: "pending",
  INVITED: "invited",
});

export const GROUP_TYPES = Object.freeze({
  SOCIAL: "social",
  PROJECT: "project",
  STUDY: "study",
});

export const GROUP_ACTIONS = Object.freeze({
  VIEW_CONTENT: "VIEW_CONTENT",
  POST_MESSAGE: "POST_MESSAGE",
  UPLOAD_FILE: "UPLOAD_FILE",
  INVITE_MEMBER: "INVITE_MEMBER",
  MANAGE_MEMBERS: "MANAGE_MEMBERS",
  UPDATE_SETTINGS: "UPDATE_SETTINGS",
  DELETE_GROUP: "DELETE_GROUP",
  JOIN_PUBLIC: "JOIN_PUBLIC",
  REQUEST_JOIN: "REQUEST_JOIN",
});

/** Soft defaults applied only when opening the create form. */
export const TYPE_DEFAULTS = Object.freeze({
  social: {
    privacy: PRIVACY.PUBLIC,
    rules: "Be respectful. Keep discussion on topic.",
  },
  project: {
    privacy: PRIVACY.PRIVATE,
    rules: "Share progress, files, and decisions with the team.",
  },
  study: {
    privacy: PRIVACY.PUBLIC,
    rules: "Help each other learn. No answer dumping for graded work.",
  },
});
```

- [ ] **Step 5: Implement permissions.js**

Create `src/features/groups/permissions.js`:

```js
import {
  GROUP_ACTIONS,
  GROUP_ROLES,
  MEMBER_STATUS,
  PRIVACY,
} from "./types.js";

export function isPlatformAdmin(user) {
  if (!user) return false;
  return user.role === "admin" || user.isAdmin === true;
}

export function getActiveMembership(memberships, groupId, userEmail) {
  if (!memberships || !groupId || !userEmail) return null;
  const normalized = String(userEmail).trim().toLowerCase();
  return (
    memberships.find(
      (m) =>
        m.groupId === groupId &&
        String(m.userEmail).trim().toLowerCase() === normalized &&
        m.status === MEMBER_STATUS.ACTIVE,
    ) || null
  );
}

export function hasGroupAccess(user, group, membership) {
  if (!user || !group) return false;
  if (isPlatformAdmin(user)) return true;
  if (membership && membership.status === MEMBER_STATUS.ACTIVE) return true;
  // Public groups: content still requires membership after join;
  // Explorer metadata is separate. Workspace content needs membership.
  return false;
}

function isGroupAdmin(membership) {
  return (
    membership &&
    membership.status === MEMBER_STATUS.ACTIVE &&
    membership.role === GROUP_ROLES.GROUP_ADMIN
  );
}

function isActiveMember(membership) {
  return membership && membership.status === MEMBER_STATUS.ACTIVE;
}

/**
 * @param {object|null} user
 * @param {object} group
 * @param {object|null} membership active or null (pending/invited do not count as active)
 * @param {string} action GROUP_ACTIONS value
 */
export function canPerformAction(user, group, membership, action) {
  if (!user || !group || !action) return false;

  const platformAdmin = isPlatformAdmin(user);
  const groupAdmin = isGroupAdmin(membership);
  const member = isActiveMember(membership);

  switch (action) {
    case GROUP_ACTIONS.VIEW_CONTENT:
      return hasGroupAccess(user, group, membership);

    case GROUP_ACTIONS.POST_MESSAGE:
    case GROUP_ACTIONS.UPLOAD_FILE:
      return platformAdmin || member;

    case GROUP_ACTIONS.INVITE_MEMBER:
    case GROUP_ACTIONS.MANAGE_MEMBERS:
    case GROUP_ACTIONS.UPDATE_SETTINGS:
      return platformAdmin || groupAdmin;

    case GROUP_ACTIONS.DELETE_GROUP:
      return (
        platformAdmin ||
        groupAdmin ||
        (member &&
          String(group.createdBy).trim().toLowerCase() ===
            String(user.email).trim().toLowerCase())
      );

    case GROUP_ACTIONS.JOIN_PUBLIC:
      return (
        !platformAdmin &&
        !member &&
        group.privacy === PRIVACY.PUBLIC
      );

    case GROUP_ACTIONS.REQUEST_JOIN:
      return (
        !platformAdmin &&
        !member &&
        group.privacy === PRIVACY.PRIVATE
      );

    default:
      return false;
  }
}
```

Note: `JOIN_PUBLIC` / `REQUEST_JOIN` return false for platform admins because they already have access and should not create redundant memberships from those CTAs (optional: still allow; UI simply hides join for admins).

- [ ] **Step 6: Run tests — expect PASS**

Run: `npm test`

Expected: all tests PASS

- [ ] **Step 7: Commit**

```bash
git add package.json src/features/groups/types.js src/features/groups/permissions.js src/features/groups/permissions.test.js
git commit -m "feat(groups): add types and RBAC permission helpers"
```

---

### Task 2: localStorage helpers

**Files:**
- Create: `src/features/groups/groupsStorage.js`
- Create: `src/features/groups/groupsStorage.test.js`

**Interfaces:**
- Consumes: none
- Produces:
  - Keys: `GROUPS_KEY`, `MEMBERSHIPS_KEY`, `MESSAGES_KEY`, `FILES_KEY`
  - `readList(key) → array`
  - `writeList(key, list) → void`
  - `loadGroupsState() → { groups, memberships, messages, sharedFiles }`
  - `saveGroupsState(state) → void`

- [ ] **Step 1: Write failing storage tests**

Create `src/features/groups/groupsStorage.test.js`:

```js
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  GROUPS_KEY,
  loadGroupsState,
  saveGroupsState,
  readList,
  writeList,
} from "./groupsStorage.js";

const memory = new Map();

beforeEach(() => {
  memory.clear();
  globalThis.localStorage = {
    getItem: (k) => (memory.has(k) ? memory.get(k) : null),
    setItem: (k, v) => memory.set(k, String(v)),
    removeItem: (k) => memory.delete(k),
  };
});

describe("groupsStorage", () => {
  it("returns empty arrays when nothing stored", () => {
    const state = loadGroupsState();
    assert.deepEqual(state.groups, []);
    assert.deepEqual(state.memberships, []);
    assert.deepEqual(state.messages, []);
    assert.deepEqual(state.sharedFiles, []);
  });

  it("round-trips state", () => {
    const next = {
      groups: [{ id: "1", name: "G" }],
      memberships: [],
      messages: [],
      sharedFiles: [],
    };
    saveGroupsState(next);
    assert.deepEqual(loadGroupsState(), next);
  });

  it("readList falls back on corrupt JSON", () => {
    localStorage.setItem(GROUPS_KEY, "{not-json");
    assert.deepEqual(readList(GROUPS_KEY), []);
  });

  it("writeList persists JSON", () => {
    writeList(GROUPS_KEY, [{ id: "a" }]);
    assert.equal(localStorage.getItem(GROUPS_KEY), JSON.stringify([{ id: "a" }]));
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npm test`

Expected: FAIL missing `groupsStorage.js`

- [ ] **Step 3: Implement groupsStorage.js**

```js
export const GROUPS_KEY = "richfieldConnectGroups";
export const MEMBERSHIPS_KEY = "richfieldConnectGroupMemberships";
export const MESSAGES_KEY = "richfieldConnectGroupMessages";
export const FILES_KEY = "richfieldConnectGroupFiles";

export function readList(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

export function loadGroupsState() {
  return {
    groups: readList(GROUPS_KEY),
    memberships: readList(MEMBERSHIPS_KEY),
    messages: readList(MESSAGES_KEY),
    sharedFiles: readList(FILES_KEY),
  };
}

export function saveGroupsState(state) {
  writeList(GROUPS_KEY, state.groups || []);
  writeList(MEMBERSHIPS_KEY, state.memberships || []);
  writeList(MESSAGES_KEY, state.messages || []);
  writeList(FILES_KEY, state.sharedFiles || []);
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `npm test`

Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/groups/groupsStorage.js src/features/groups/groupsStorage.test.js
git commit -m "feat(groups): add localStorage persistence helpers"
```

---

### Task 3: GroupsContext provider

**Files:**
- Create: `src/features/groups/GroupsContext.jsx`

**Interfaces:**
- Consumes: `useApp()` from `src/context/AppContext.jsx` (`user`, `accounts`, `showToast`); permissions + storage helpers
- Produces: `GroupsProvider`, `useGroups()`, `useGroupPermissions(groupId)`
- `useGroups()` value includes: state arrays + mutations listed in the spec (`createGroup`, `updateGroup`, `deleteGroup`, `joinPublicGroup`, `requestToJoin`, `inviteMember`, `respondToRequest`, `removeMember`, `changeMemberRole`, `postMessage`, `uploadSharedFile`, `deleteMessage`, `deleteSharedFile`)

- [ ] **Step 1: Implement GroupsContext.jsx**

Create `src/features/groups/GroupsContext.jsx` with:

1. Lazy `useState` init via `loadGroupsState()`.
2. `useEffect` that calls `saveGroupsState` whenever `groups`, `memberships`, `messages`, or `sharedFiles` change.
3. Helper `resolveMembership(groupId)` using `getActiveMembership` + current user email.
4. Each mutation:
   - Early-return + `showToast(..., "error")` if permission fails
   - Use `crypto.randomUUID()` for ids
   - Normalize emails with `.trim().toLowerCase()` when comparing
5. `createGroup({ name, description, rules, type, privacy })`:
   - Requires signed-in user
   - Pushes group + membership `{ role: GROUP_ADMIN, status: active, joinedAt: now }`
6. `joinPublicGroup(groupId)` / `requestToJoin(groupId)`:
   - Skip if existing membership row for same email+group (any status); toast accordingly
7. `inviteMember(groupId, email)`:
   - Email must exist in `accounts`; create `status: invited`, `role: GROUP_MEMBER`
8. `respondToRequest(membershipId, accept)`:
   - pending → active (set `joinedAt`) or remove row; invited accept by invitee uses same path when current user matches
9. `postMessage(groupId, content, attachment)`:
   - If `attachment`, also push `sharedFiles` entry with `messageId`
10. `uploadSharedFile(groupId, attachment)` — dedicated Files upload
11. `useGroupPermissions(groupId)`:
    - Finds group + membership
    - Returns `{ group, membership, canViewContent, canPost, canUpload, canManageMembers, canManageSettings, canDeleteGroup, canJoinPublic, canRequestJoin, isPlatformAdmin: boolean }`

Export pattern matching AppContext:

```js
// eslint-disable-next-line react-refresh/only-export-components
export { GroupsProvider, useGroups, useGroupPermissions };
```

Keep file focused: prefer small internal helpers (`persist toast on deny`, `findGroup`) inside the same module.

- [ ] **Step 2: Manual smoke (no component UI yet)**

Temporarily in a throwaway console or skip to Task 4 — preferred: proceed after reading lints.

Run: ensure `npm test` still passes.

- [ ] **Step 3: Commit**

```bash
git add src/features/groups/GroupsContext.jsx
git commit -m "feat(groups): add GroupsContext with CRUD and permission guards"
```

---

### Task 4: Explorer, create modal, Groups page

**Files:**
- Create: `src/features/groups/components/CreateGroupModal/CreateGroupModal.jsx`
- Create: `src/features/groups/components/CreateGroupModal/CreateGroupModal.module.css`
- Create: `src/features/groups/components/GroupExplorer/GroupExplorer.jsx`
- Create: `src/features/groups/components/GroupExplorer/GroupExplorer.module.css`
- Create: `src/features/groups/pages/GroupsPage.jsx`

**Interfaces:**
- Consumes: `useGroups`, `useApp`, `TYPE_DEFAULTS`, `PRIVACY`, `GROUP_TYPES`, React Router `Link`/`useNavigate`
- Produces: Explorer UI + create flow

- [ ] **Step 1: Implement CreateGroupModal**

Controlled modal props: `{ open, onClose }`.

Fields: name (required), description, type select, privacy select, rules textarea.

On type change: apply `TYPE_DEFAULTS[type]` to privacy + rules **only if** user has not manually edited those fields (track `privacyTouched` / `rulesTouched` booleans), or simpler v1: always re-apply soft defaults when type changes (document in UI: “Defaults update when type changes”).

Submit → `createGroup(...)` → toast success → `onClose` → navigate to `/groups/${id}` (return id from `createGroup`).

- [ ] **Step 2: Implement GroupExplorer**

- State: `query`, `typeFilter` (`all`|types), `privacyFilter` (`all`|PUBLIC|PRIVATE`), `createOpen`
- List `groups` filtered by name/description substring
- Card shows name, type badge, privacy, active member count (`memberships` filter `groupId` + `active`)
- Actions:
  - If `canViewContent` or platform admin or active member → Link “Open”
  - Else if public → button Join
  - Else if private → Request (or “Pending…” if membership status pending/invited for current user)
- Header button “Create group” opens modal

Loading: if needed expose `isHydrated` from context defaulting `true` after first load (match AppContext pattern).

Empty: “No groups yet. Create one to get started.”

- [ ] **Step 3: Implement GroupsPage**

```jsx
import { Navigate } from "react-router-dom";
import { useApp } from "../../../context/AppContext";
import GroupExplorer from "../components/GroupExplorer/GroupExplorer";

function GroupsPage() {
  const { user } = useApp();
  if (!user) return <Navigate to="/signin" replace />;
  return <GroupExplorer />;
}

export default GroupsPage;
```

- [ ] **Step 4: Style with CSS modules**

Use existing tokens: `var(--surface)`, `var(--richfield-blue)`, `var(--richfield-light-grey)`, `var(--shadow-sm)`, max-width ~1100px centered like Admin/Feed.

- [ ] **Step 5: Commit**

```bash
git add src/features/groups/components/CreateGroupModal src/features/groups/components/GroupExplorer src/features/groups/pages/GroupsPage.jsx
git commit -m "feat(groups): add GroupExplorer and create-group flow"
```

---

### Task 5: MessageFeed and FileUploadModal

**Files:**
- Create: `src/features/groups/components/FileUploadModal/FileUploadModal.jsx`
- Create: `src/features/groups/components/FileUploadModal/FileUploadModal.module.css`
- Create: `src/features/groups/components/MessageFeed/MessageFeed.jsx`
- Create: `src/features/groups/components/MessageFeed/MessageFeed.module.css`

**Interfaces:**
- Consumes: `postMessage`, `deleteMessage`, `useGroupPermissions`, attachment shape from Feed
- Produces: Discussion tab UI

- [ ] **Step 1: Implement FileUploadModal**

Props: `{ open, onClose, onConfirm }` where `onConfirm(attachment)` receives `{ type, name, size, mimeType, dataUrl }`.

- Drag-and-drop zone + file input
- Infer `type`: `file.type.startsWith("image/") ? "image" : "document"`
- If `file.size > 1_500_000` (1.5MB), show warning: “Large files may fail to save in browser storage.”
- Still allow confirm unless you choose hard cap at 2.5MB — **hard-reject above 2_500_000** with error text
- Mirror FileReader pattern from `src/components/CreatePost/CreatePost.jsx`

- [ ] **Step 2: Implement MessageFeed**

Props: `{ groupId }`

- Read messages for `groupId`, sort by `createdAt` ascending (feed chronological oldest→newest) or descending newest-first to match Feed — **use newest-first** to match `addPost` behavior
- Composer: textarea + “Attach” opens FileUploadModal + Post button (disabled if `!canPost`)
- Empty: “No messages yet. Start the discussion.”
- Author can delete own message; group admin / platform admin can delete any (`deleteMessage` enforces)

- [ ] **Step 3: Commit**

```bash
git add src/features/groups/components/FileUploadModal src/features/groups/components/MessageFeed
git commit -m "feat(groups): add MessageFeed and FileUploadModal"
```

---

### Task 6: Shared Files panel and MemberManagementPanel

**Files:**
- Create: `src/features/groups/components/SharedFilesPanel/SharedFilesPanel.jsx`
- Create: `src/features/groups/components/SharedFilesPanel/SharedFilesPanel.module.css`
- Create: `src/features/groups/components/MemberManagementPanel/MemberManagementPanel.jsx`
- Create: `src/features/groups/components/MemberManagementPanel/MemberManagementPanel.module.css`

**Interfaces:**
- Consumes: `uploadSharedFile`, `deleteSharedFile`, membership mutations, `accounts` from `useApp`
- Produces: Files tab + Members tab

- [ ] **Step 1: Implement SharedFilesPanel**

Props: `{ groupId }`

- List `sharedFiles` for group (newest first)
- Upload button → FileUploadModal → `uploadSharedFile`
- Show name, size, uploader, download/open via `dataUrl` link
- Delete if uploader, group admin, or platform admin

Empty: “No shared files yet.”

- [ ] **Step 2: Implement MemberManagementPanel**

Props: `{ groupId }`

Sections:

1. **Active** — name/email (resolve display name from `accounts` when possible), role badge, actions if `canManageMembers`: Promote/Demote (`changeMemberRole`), Remove (block removing last group admin unless platform admin force — if only one `GROUP_ADMIN` active, toast error on demote/remove)
2. **Pending requests** — Accept / Reject (`respondToRequest`)
3. **Invited** — show pending invites; cancel = remove membership row
4. **Invite form** (if `canManageMembers`) — email input → `inviteMember`

Non-managers see Active list only (no action buttons).

- [ ] **Step 3: Commit**

```bash
git add src/features/groups/components/SharedFilesPanel src/features/groups/components/MemberManagementPanel
git commit -m "feat(groups): add shared files and member management panels"
```

---

### Task 7: GroupSettings and GroupWorkspace

**Files:**
- Create: `src/features/groups/components/GroupSettings/GroupSettings.jsx`
- Create: `src/features/groups/components/GroupSettings/GroupSettings.module.css`
- Create: `src/features/groups/components/GroupWorkspace/GroupWorkspace.jsx`
- Create: `src/features/groups/components/GroupWorkspace/GroupWorkspace.module.css`
- Create: `src/features/groups/pages/GroupDetailPage.jsx`

**Interfaces:**
- Consumes: all prior components + `useGroupPermissions`, `updateGroup`, `deleteGroup`, join/request actions
- Produces: full workspace route UI

- [ ] **Step 1: Implement GroupSettings**

Props: `{ groupId }`

Form bound to group fields; Save → `updateGroup`; optional Delete group button with `window.confirm` → `deleteGroup` → navigate `/groups`.

Only rendered when `canManageSettings` (parent hides tab otherwise).

- [ ] **Step 2: Implement GroupWorkspace**

Props: `{ groupId }`

- If group missing → “Group not found” + link back
- If `!canViewContent`:
  - Show locked panel with name/description/privacy
  - Join or Request buttons when allowed
  - If pending/invited, show status text
- If `canViewContent`:
  - Header: name, type, privacy, member count
  - Tabs: `discussion` | `files` | `members` | optional `settings`
  - Render MessageFeed / SharedFilesPanel / MemberManagementPanel / GroupSettings

- [ ] **Step 3: Implement GroupDetailPage**

```jsx
import { Navigate, useParams } from "react-router-dom";
import { useApp } from "../../../context/AppContext";
import GroupWorkspace from "../components/GroupWorkspace/GroupWorkspace";

function GroupDetailPage() {
  const { user } = useApp();
  const { groupId } = useParams();
  if (!user) return <Navigate to="/signin" replace />;
  return <GroupWorkspace groupId={groupId} />;
}

export default GroupDetailPage;
```

- [ ] **Step 4: Commit**

```bash
git add src/features/groups/components/GroupSettings src/features/groups/components/GroupWorkspace src/features/groups/pages/GroupDetailPage.jsx
git commit -m "feat(groups): add GroupWorkspace, settings, and detail page"
```

---

### Task 8: App integration (provider, routes, navbar)

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/Navbar/Navbar.jsx`

**Interfaces:**
- Consumes: `GroupsProvider`, `GroupsPage`, `GroupDetailPage`
- Produces: wired routes + nav

- [ ] **Step 1: Nest GroupsProvider in App.jsx**

Inside `AppProvider`, wrap `BrowserRouter` (or wrap inside router — either works; prefer inside `AppProvider` around `BrowserRouter`):

```jsx
import { GroupsProvider } from "./features/groups/GroupsContext";
import GroupsPage from "./features/groups/pages/GroupsPage";
import GroupDetailPage from "./features/groups/pages/GroupDetailPage";

// In App():
<ThemeProvider>
  <AppProvider>
    <GroupsProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </GroupsProvider>
  </AppProvider>
</ThemeProvider>
```

Add routes next to Feed:

```jsx
<Route
  path="/groups"
  element={
    <SignedInOnly>
      <GroupsPage />
    </SignedInOnly>
  }
/>
<Route
  path="/groups/:groupId"
  element={
    <SignedInOnly>
      <GroupDetailPage />
    </SignedInOnly>
  }
/>
```

(GroupsPage also redirects if signed out — double guard is fine.)

- [ ] **Step 2: Add Navbar link**

In `navItems` array in `Navbar.jsx`, after Feed:

```js
{ to: "/groups", label: "Groups" },
```

- [ ] **Step 3: Manual QA checklist**

Run: `npm run dev`

Verify:

1. Signed-out user hitting `/groups` → redirect sign-in
2. Create social (public) and project (private default) groups
3. Second account joins public; requests private; admin accepts
4. Invite by email to existing account; invitee appears invited then can accept (implement accept-invite on locked panel or Members tab for invitee — **required**: locked panel button “Accept invite” calling `respondToRequest(id, true)` when status is `invited` and email matches)
5. Non-member cannot see private Discussion
6. Platform admin opens private group without membership and can post/settings
7. Member posts with attachment → appears in Discussion and Files
8. `npm test` still green
9. `npm run build` succeeds

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx src/components/Navbar/Navbar.jsx
git commit -m "feat(groups): wire Groups provider, routes, and navbar"
```

---

## Plan self-review

**Spec coverage**

| Spec item | Task |
|-----------|------|
| Types / JSDoc models | Task 1 |
| Permission helpers + matrix | Task 1 |
| localStorage keys | Task 2 |
| GroupsContext CRUD | Task 3 |
| GroupExplorer + create | Task 4 |
| MessageFeed + FileUploadModal | Task 5 |
| Shared files + members/invites/requests | Task 6 |
| GroupSettings + Workspace + privacy lock | Task 7 |
| Router / Navbar / Provider | Task 8 |
| Platform Admin override | Tasks 1, 3, 7 |
| Soft type defaults | Task 4 |
| Message attachment → sharedFiles | Task 3 |
| Loading/empty/error | Tasks 4–7 |
| Chat / realtime | Out of scope (excluded) |

**Placeholder scan:** None intentionally left; UI CSS is described by tokens rather than full CSS dumps (acceptable — match existing modules).

**Type consistency:** Actions use `GROUP_ACTIONS.*`; membership statuses use `MEMBER_STATUS`; privacy `PUBLIC`/`PRIVATE`; roles `GROUP_ADMIN`/`GROUP_MEMBER`.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-25-groups-feature.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration  
2. **Inline Execution** — execute tasks in this session with executing-plans and checkpoints  

Which approach?
