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
