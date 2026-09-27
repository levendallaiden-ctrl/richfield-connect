export const GROUPS_KEY = "richfieldConnectGroups";
export const MEMBERSHIPS_KEY = "richfieldConnectGroupMemberships";
export const MESSAGES_KEY = "richfieldConnectGroupMessages";
export const FILES_KEY = "richfieldConnectGroupFiles";

/**
 * Reads a JSON array out of localStorage. Anything that is not a usable array
 * (missing key, corrupt JSON, a stored object) comes back as an empty list so
 * the Groups module can never crash on hand-edited storage.
 *
 * @param {string} key
 * @returns {Array<object>}
 */
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

/**
 * @param {string} key
 * @param {Array<object>} list
 */
export function writeList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

/**
 * @returns {{ groups: Array<object>, memberships: Array<object>, messages: Array<object>, sharedFiles: Array<object> }}
 */
export function loadGroupsState() {
  return {
    groups: readList(GROUPS_KEY),
    memberships: readList(MEMBERSHIPS_KEY),
    messages: readList(MESSAGES_KEY),
    sharedFiles: readList(FILES_KEY),
  };
}

/**
 * @param {{ groups?: Array<object>, memberships?: Array<object>, messages?: Array<object>, sharedFiles?: Array<object> }} state
 */
export function saveGroupsState(state) {
  writeList(GROUPS_KEY, state.groups || []);
  writeList(MEMBERSHIPS_KEY, state.memberships || []);
  writeList(MESSAGES_KEY, state.messages || []);
  writeList(FILES_KEY, state.sharedFiles || []);
}
