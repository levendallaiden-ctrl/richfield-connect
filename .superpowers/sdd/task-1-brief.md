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
  - `isPlatformAdmin(user) â†’ boolean`
  - `getActiveMembership(memberships, groupId, userEmail) â†’ GroupMember|null`
  - `hasGroupAccess(user, group, membership) â†’ boolean`
  - `canPerformAction(user, group, membership, action) â†’ boolean`

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

- [ ] **Step 3: Run tests â€” expect FAIL**

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

- [ ] **Step 6: Run tests â€” expect PASS**

Run: `npm test`

Expected: all tests PASS

- [ ] **Step 7: Commit**

```bash
git add package.json src/features/groups/types.js src/features/groups/permissions.js src/features/groups/permissions.test.js
git commit -m "feat(groups): add types and RBAC permission helpers"
```

---


