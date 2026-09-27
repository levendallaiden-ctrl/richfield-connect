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
  return Boolean(
    membership &&
      membership.status === MEMBER_STATUS.ACTIVE &&
      membership.role === GROUP_ROLES.GROUP_ADMIN,
  );
}

function isActiveMember(membership) {
  return Boolean(
    membership && membership.status === MEMBER_STATUS.ACTIVE,
  );
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
