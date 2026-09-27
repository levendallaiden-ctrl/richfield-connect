import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useApp } from "../../context/AppContext";
import {
  GROUP_ACTIONS,
  GROUP_ROLES,
  GROUP_TYPES,
  MEMBER_STATUS,
  PRIVACY,
} from "./types.js";
import {
  canPerformAction,
  getActiveMembership,
  hasGroupAccess,
  isPlatformAdmin,
} from "./permissions.js";
import { loadGroupsState, saveGroupsState } from "./groupsStorage.js";

const GroupsContext = createContext(null);

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

// crypto.randomUUID is only available in secure contexts, so keep a fallback
// rather than letting a missing id blow up an entire mutation.
function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `grp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function GroupsProvider({ children }) {
  const { user, accounts, showToast } = useApp();

  // One storage read on mount; every mutation below writes through the effect
  // at the bottom, so localStorage always mirrors React state.
  const [bootstrapped] = useState(loadGroupsState);
  const [groups, setGroups] = useState(bootstrapped.groups);
  const [memberships, setMemberships] = useState(bootstrapped.memberships);
  const [messages, setMessages] = useState(bootstrapped.messages);
  const [sharedFiles, setSharedFiles] = useState(bootstrapped.sharedFiles);
  const [isHydrated] = useState(true);

  useEffect(() => {
    saveGroupsState({ groups, memberships, messages, sharedFiles });
  }, [groups, memberships, messages, sharedFiles]);

  function findGroup(groupId) {
    return groups.find((group) => group.id === groupId) || null;
  }

  /** Any-status row (active, pending, or invited) for an email + group. */
  function findMembershipRow(groupId, email) {
    if (!groupId || !email) return null;
    return (
      memberships.find(
        (member) =>
          member.groupId === groupId &&
          normalizeEmail(member.userEmail) === normalizeEmail(email),
      ) || null
    );
  }

  function activeMembershipFor(groupId, email) {
    return getActiveMembership(memberships, groupId, email);
  }

  function countActiveAdmins(groupId) {
    return memberships.filter(
      (member) =>
        member.groupId === groupId &&
        member.status === MEMBER_STATUS.ACTIVE &&
        member.role === GROUP_ROLES.GROUP_ADMIN,
    ).length;
  }

  function deny(message) {
    showToast(message, "error");
    return null;
  }

  // Explorer/UI gating is cosmetic only — every mutation re-checks here first.
  function authorize(groupId, action, denialMessage) {
    if (!user) return deny("Sign in before you do that.");
    const group = findGroup(groupId);
    if (!group) return deny("Group not found.");
    const membership = activeMembershipFor(groupId, user.email);
    if (!canPerformAction(user, group, membership, action)) {
      return deny(denialMessage);
    }
    return { group, membership };
  }

  function createGroup({
    name,
    description = "",
    rules = "",
    type,
    privacy,
  } = {}) {
    if (!user) {
      showToast("Sign in before creating a group.", "error");
      return null;
    }

    const trimmedName = String(name || "").trim();
    if (!trimmedName) {
      showToast("Group name is required.", "error");
      return null;
    }

    const clashes = groups.some(
      (group) =>
        String(group.name || "").trim().toLowerCase() ===
        trimmedName.toLowerCase(),
    );
    if (clashes) {
      showToast("There is already a group with that name.", "error");
      return null;
    }

    const now = new Date().toISOString();
    const groupId = createId();

    setGroups((prev) => [
      {
        id: groupId,
        name: trimmedName,
        description: String(description || "").trim(),
        rules: String(rules || "").trim(),
        type: type || GROUP_TYPES.SOCIAL,
        privacy: privacy || PRIVACY.PUBLIC,
        createdBy: user.email,
        createdAt: now,
        updatedAt: now,
      },
      ...prev,
    ]);

    // The creator is always an active GROUP_ADMIN — see spec "Role model".
    setMemberships((prev) => [
      ...prev,
      {
        id: createId(),
        groupId,
        userEmail: user.email,
        role: GROUP_ROLES.GROUP_ADMIN,
        status: MEMBER_STATUS.ACTIVE,
        joinedAt: now,
      },
    ]);

    showToast("Group created.", "success");
    return groupId;
  }

  function updateGroup(groupId, patch = {}) {
    const auth = authorize(
      groupId,
      GROUP_ACTIONS.UPDATE_SETTINGS,
      "Only a group admin can change group settings.",
    );
    if (!auth) return false;

    const nextName =
      patch.name === undefined ? auth.group.name : String(patch.name).trim();
    if (!nextName) {
      showToast("Group name cannot be empty.", "error");
      return false;
    }

    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              name: nextName,
              description:
                patch.description === undefined
                  ? group.description
                  : String(patch.description).trim(),
              rules:
                patch.rules === undefined
                  ? group.rules
                  : String(patch.rules).trim(),
              type: patch.type || group.type,
              privacy: patch.privacy || group.privacy,
              updatedAt: new Date().toISOString(),
            }
          : group,
      ),
    );

    showToast("Group settings saved.", "success");
    return true;
  }

  function deleteGroup(groupId) {
    const auth = authorize(
      groupId,
      GROUP_ACTIONS.DELETE_GROUP,
      "Only a group admin can delete this group.",
    );
    if (!auth) return false;

    setGroups((prev) => prev.filter((group) => group.id !== groupId));
    setMemberships((prev) => prev.filter((member) => member.groupId !== groupId));
    setMessages((prev) => prev.filter((message) => message.groupId !== groupId));
    setSharedFiles((prev) => prev.filter((file) => file.groupId !== groupId));

    showToast("Group deleted.", "info");
    return true;
  }

  /**
   * Shared by join (public) and request (private): both create a membership row
   * for the signed-in user and differ only in the status it starts in.
   */
  function addOwnMembership(groupId, action, status) {
    if (!user) {
      showToast("Sign in to join a group.", "error");
      return false;
    }

    const group = findGroup(groupId);
    if (!group) {
      showToast("Group not found.", "error");
      return false;
    }

    const existing = findMembershipRow(groupId, user.email);
    if (existing) {
      showToast(
        existing.status === MEMBER_STATUS.ACTIVE
          ? "You are already a member of this group."
          : "Your request for this group is already pending.",
        "info",
      );
      return false;
    }

    if (isPlatformAdmin(user)) {
      showToast("Platform admins already reach every group.", "info");
      return false;
    }

    if (!canPerformAction(user, group, null, action)) {
      showToast(
        group.privacy === PRIVACY.PRIVATE
          ? "This group is private — ask an admin to invite you."
          : "This group is not open for joining.",
        "error",
      );
      return false;
    }

    setMemberships((prev) => [
      ...prev,
      {
        id: createId(),
        groupId,
        userEmail: user.email,
        role: GROUP_ROLES.GROUP_MEMBER,
        status,
        joinedAt:
          status === MEMBER_STATUS.ACTIVE ? new Date().toISOString() : null,
      },
    ]);

    showToast(
      status === MEMBER_STATUS.ACTIVE
        ? `Joined ${group.name}.`
        : `Request sent to the admins of ${group.name}.`,
      "success",
    );
    return true;
  }

  function joinPublicGroup(groupId) {
    return addOwnMembership(
      groupId,
      GROUP_ACTIONS.JOIN_PUBLIC,
      MEMBER_STATUS.ACTIVE,
    );
  }

  function requestToJoin(groupId) {
    return addOwnMembership(
      groupId,
      GROUP_ACTIONS.REQUEST_JOIN,
      MEMBER_STATUS.PENDING,
    );
  }

  function inviteMember(groupId, email) {
    const auth = authorize(
      groupId,
      GROUP_ACTIONS.INVITE_MEMBER,
      "Only a group admin can invite members.",
    );
    if (!auth) return false;

    const normalized = normalizeEmail(email);
    if (!normalized) {
      showToast("Enter an email address to invite.", "error");
      return false;
    }

    // Invites only make sense for people who already have an account, since
    // membership is keyed by email.
    const account = (accounts || []).find(
      (candidate) => normalizeEmail(candidate.email) === normalized,
    );
    if (!account) {
      showToast("No Richfield Connect account uses that email.", "error");
      return false;
    }

    if (findMembershipRow(groupId, account.email)) {
      showToast("That person is already a member or has an open invite.", "error");
      return false;
    }

    setMemberships((prev) => [
      ...prev,
      {
        id: createId(),
        groupId,
        userEmail: account.email,
        role: GROUP_ROLES.GROUP_MEMBER,
        status: MEMBER_STATUS.INVITED,
        joinedAt: null,
      },
    ]);

    showToast(`${account.fullName || account.email} invited.`, "success");
    return true;
  }

  // Covers both flows: an admin acting on a pending request, or the invitee
  // themselves acting on their own invited row.
  function respondToRequest(membershipId, accept) {
    if (!user) {
      showToast("Sign in before responding.", "error");
      return false;
    }

    const row = memberships.find((member) => member.id === membershipId);
    if (!row) {
      showToast("That request no longer exists.", "error");
      return false;
    }

    const group = findGroup(row.groupId);
    if (!group) {
      showToast("Group not found.", "error");
      return false;
    }

    const isInvitee = normalizeEmail(row.userEmail) === normalizeEmail(user.email);
    const canManage = canPerformAction(
      user,
      group,
      activeMembershipFor(row.groupId, user.email),
      GROUP_ACTIONS.MANAGE_MEMBERS,
    );

    if (!canManage && !(isInvitee && row.status === MEMBER_STATUS.INVITED)) {
      showToast("Only a group admin can respond to that request.", "error");
      return false;
    }

    if (accept) {
      setMemberships((prev) =>
        prev.map((member) =>
          member.id === membershipId
            ? {
                ...member,
                status: MEMBER_STATUS.ACTIVE,
                joinedAt: member.joinedAt || new Date().toISOString(),
              }
            : member,
        ),
      );
      showToast("Membership approved.", "success");
    } else {
      setMemberships((prev) =>
        prev.filter((member) => member.id !== membershipId),
      );
      showToast("Request declined.", "info");
    }

    return true;
  }

  // A group must never end up adminless: platform admins are the escape hatch.
  function isLastActiveAdmin(groupId, row) {
    return (
      row.role === GROUP_ROLES.GROUP_ADMIN &&
      !isPlatformAdmin(user) &&
      countActiveAdmins(groupId) <= 1
    );
  }

  function removeMember(membershipId) {
    const row = memberships.find((member) => member.id === membershipId);
    if (!row) {
      showToast("That member is no longer in this group.", "error");
      return false;
    }

    const auth = authorize(
      row.groupId,
      GROUP_ACTIONS.MANAGE_MEMBERS,
      "Only a group admin can remove members.",
    );
    if (!auth) return false;

    if (isLastActiveAdmin(row.groupId, row)) {
      showToast("A group needs at least one admin. Promote someone first.", "error");
      return false;
    }

    setMemberships((prev) => prev.filter((member) => member.id !== membershipId));
    showToast("Member removed.", "info");
    return true;
  }

  function changeMemberRole(membershipId, role) {
    if (!Object.values(GROUP_ROLES).includes(role)) {
      showToast("Unknown group role.", "error");
      return false;
    }

    const row = memberships.find((member) => member.id === membershipId);
    if (!row) {
      showToast("That member is no longer in this group.", "error");
      return false;
    }

    const auth = authorize(
      row.groupId,
      GROUP_ACTIONS.MANAGE_MEMBERS,
      "Only a group admin can change roles.",
    );
    if (!auth) return false;

    // Demoting the only remaining admin would leave the group unmanageable.
    if (role !== GROUP_ROLES.GROUP_ADMIN && isLastActiveAdmin(row.groupId, row)) {
      showToast("A group needs at least one admin. Promote someone first.", "error");
      return false;
    }

    setMemberships((prev) =>
      prev.map((member) =>
        member.id === membershipId ? { ...member, role } : member,
      ),
    );
    showToast("Role updated.", "success");
    return true;
  }

  function leaveGroup(groupId) {
    if (!user) {
      showToast("Sign in first.", "error");
      return false;
    }

    const row = memberships.find(
      (member) =>
        member.groupId === groupId &&
        normalizeEmail(member.userEmail) === normalizeEmail(user.email) &&
        member.status === MEMBER_STATUS.ACTIVE,
    );
    if (!row) {
      showToast("You are not a member of this group.", "error");
      return false;
    }

    if (isLastActiveAdmin(groupId, row)) {
      showToast(
        "You are the only admin — promote another member first, or delete the group.",
        "error",
      );
      return false;
    }

    setMemberships((prev) => prev.filter((member) => member.id !== row.id));
    showToast("You left the group.", "info");
    return true;
  }

  /** Authors keep control of their own content; group and platform admins moderate. */
  function canModerateContent(groupId, authorEmail) {
    if (!user) return false;
    const group = findGroup(groupId);
    if (!group) return false;
    if (normalizeEmail(authorEmail) === normalizeEmail(user.email)) return true;
    return canPerformAction(
      user,
      group,
      activeMembershipFor(groupId, user.email),
      GROUP_ACTIONS.MANAGE_MEMBERS,
    );
  }

  function postMessage(groupId, content, attachment = null) {
    const auth = authorize(
      groupId,
      GROUP_ACTIONS.POST_MESSAGE,
      "Only members can post in this group.",
    );
    if (!auth) return null;

    const text = String(content || "").trim();
    if (!text && !attachment) {
      showToast("Write something or attach a file first.", "error");
      return null;
    }

    const now = new Date().toISOString();
    // The Files tab mirrors every attachment, so the mirror row's id is kept
    // on the message too: `deleteSharedFile` uses it to clear the Discussion
    // badge when the file is removed from the Files tab.
    const sharedFileId = attachment ? createId() : null;
    const message = {
      id: createId(),
      groupId,
      authorEmail: user.email,
      authorName: user.fullName || user.email,
      content: text,
      attachment: attachment ? { ...attachment, fileId: sharedFileId } : null,
      createdAt: now,
    };

    // Newest first, matching how AppContext.addPost orders the Feed.
    setMessages((prev) => [message, ...prev]);

    // A message attachment doubles up as a shared file so the Files tab shows
    // everything the group has ever shared in one place.
    if (attachment) {
      setSharedFiles((prev) => [
        {
          id: sharedFileId,
          groupId,
          uploadedBy: user.email,
          createdAt: now,
          messageId: message.id,
          type: attachment.type,
          name: attachment.name,
          size: attachment.size,
          mimeType: attachment.mimeType,
          dataUrl: attachment.dataUrl,
        },
        ...prev,
      ]);
    }

    showToast("Message posted.", "success");
    return message.id;
  }

  function uploadSharedFile(groupId, attachment) {
    const auth = authorize(
      groupId,
      GROUP_ACTIONS.UPLOAD_FILE,
      "Only members can share files here.",
    );
    if (!auth) return false;

    if (!attachment || !attachment.dataUrl) {
      showToast("Choose a file to upload first.", "error");
      return false;
    }

    setSharedFiles((prev) => [
      {
        id: createId(),
        groupId,
        uploadedBy: user.email,
        createdAt: new Date().toISOString(),
        type: attachment.type,
        name: attachment.name,
        size: attachment.size,
        mimeType: attachment.mimeType,
        dataUrl: attachment.dataUrl,
      },
      ...prev,
    ]);

    showToast("File shared.", "success");
    return true;
  }

  function deleteMessage(messageId) {
    const message = messages.find((entry) => entry.id === messageId);
    if (!message) return false;

    if (!canModerateContent(message.groupId, message.authorEmail)) {
      showToast("You can only delete your own messages.", "error");
      return false;
    }

    setMessages((prev) => prev.filter((entry) => entry.id !== messageId));
    // Drop the mirrored Files entry too — otherwise deleting the post would
    // silently leave its attachment behind in the Files tab.
    setSharedFiles((prev) => prev.filter((file) => file.messageId !== messageId));
    showToast("Message deleted.", "info");
    return true;
  }

  function deleteSharedFile(fileId) {
    const file = sharedFiles.find((entry) => entry.id === fileId);
    if (!file) return false;

    if (!canModerateContent(file.groupId, file.uploadedBy)) {
      showToast("Only the uploader or a group admin can remove that file.", "error");
      return false;
    }

    setSharedFiles((prev) => prev.filter((entry) => entry.id !== fileId));
    // Un-mirror the attachment badge on the message that carried this file.
    setMessages((prev) =>
      prev.map((message) =>
        message.attachment &&
        message.attachment.fileId === fileId &&
        message.groupId === file.groupId
          ? { ...message, attachment: null }
          : message,
      ),
    );

    showToast("File removed.", "info");
    return true;
  }

  // The value intentionally rebuilds when any state slice changes: the
  // mutation functions below are plain closures re-created each render, so
  // consumers must see a fresh object whenever the underlying data changes.
  const value = useMemo(
    () => ({
      groups,
      memberships,
      messages,
      sharedFiles,
      isHydrated,
      user,
      accounts,
      createGroup,
      updateGroup,
      deleteGroup,
      joinPublicGroup,
      requestToJoin,
      inviteMember,
      respondToRequest,
      removeMember,
      changeMemberRole,
      leaveGroup,
      postMessage,
      uploadSharedFile,
      deleteMessage,
      deleteSharedFile,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      groups,
      memberships,
      messages,
      sharedFiles,
      isHydrated,
      user,
      accounts,
    ],
  );

  return <GroupsContext.Provider value={value}>{children}</GroupsContext.Provider>;
}

/** Access the whole groups workspace (state + mutations). */
function useGroups() {
  const context = useContext(GroupsContext);
  if (!context) {
    throw new Error("useGroups must be used within a GroupsProvider");
  }
  return context;
}

/**
 * Per-group permission decisions for the signed-in user, so components never
 * re-derive roles themselves. Every flag calls the same `canPerformAction`
 * the mutations call, so the UI can never claim more than the store allows.
 */
function useGroupPermissions(groupId) {
  const { groups, memberships, user } = useGroups();

  const group = useMemo(
    () => groups.find((entry) => entry.id === groupId) || null,
    [groups, groupId],
  );

  // Active membership only: pending/invited rows must not grant access.
  const membership = useMemo(
    () => getActiveMembership(memberships, groupId, user?.email),
    [memberships, groupId, user],
  );

  // The active row above misses pending/invited requests, which the Explorer
  // ("Pending…" label) and the workspace "Accept invite" CTA both need to see.
  const requestRow = useMemo(() => {
    if (!user?.email) return null;
    const email = normalizeEmail(user.email);
    return (
      memberships.find(
        (member) =>
          member.groupId === groupId &&
          normalizeEmail(member.userEmail) === email,
      ) || null
    );
  }, [memberships, groupId, user]);

  const can = useCallback(
    (action) => canPerformAction(user, group, membership, action),
    [user, group, membership],
  );

  return {
    group,
    membership,
    requestRow,
    requestStatus: requestRow?.status || null,
    isMember: Boolean(membership),
    isGroupAdmin: membership?.role === GROUP_ROLES.GROUP_ADMIN,
    isPlatformAdmin: isPlatformAdmin(user),
    canViewContent: hasGroupAccess(user, group, membership),
    canPost: can(GROUP_ACTIONS.POST_MESSAGE),
    canUpload: can(GROUP_ACTIONS.UPLOAD_FILE),
    canManageMembers: can(GROUP_ACTIONS.MANAGE_MEMBERS),
    canManageSettings: can(GROUP_ACTIONS.UPDATE_SETTINGS),
    canDeleteGroup: can(GROUP_ACTIONS.DELETE_GROUP),
    canJoinPublic: can(GROUP_ACTIONS.JOIN_PUBLIC),
    canRequestJoin: can(GROUP_ACTIONS.REQUEST_JOIN),
    can,
  };
}

// The provider and its custom hooks intentionally share this module.
export default GroupsProvider;
// eslint-disable-next-line react-refresh/only-export-components
export { GroupsProvider, useGroups, useGroupPermissions };