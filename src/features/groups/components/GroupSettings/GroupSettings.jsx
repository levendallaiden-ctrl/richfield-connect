import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGroups, useGroupPermissions } from "../../GroupsContext";
import { GROUP_TYPES, PRIVACY } from "../../types";
import styles from "./GroupSettings.module.css";

/**
 * Settings tab. The parent only mounts this when `canManageSettings` is
 * true, but the mutations re-check permissions anyway. Delete cascades
 * to memberships/messages/files in the context layer.
 *
 * The draft is seeded with lazy `useState` initialisers rather than an
 * effect: an effect that calls setState on every `group` change would mean
 * cascading renders (and the lint config rejects it). The parent keys this
 * component by group id so navigating between groups starts from a fresh
 * draft instead.
 */
function GroupSettings({ groupId }) {
  const { updateGroup, deleteGroup } = useGroups();
  const { group, canManageSettings, canDeleteGroup } =
    useGroupPermissions(groupId);
  const navigate = useNavigate();

  const [name, setName] = useState(() => group?.name || "");
  const [description, setDescription] = useState(
    () => group?.description || "",
  );
  const [rules, setRules] = useState(() => group?.rules || "");
  const [type, setType] = useState(() => group?.type || GROUP_TYPES.SOCIAL);
  const [privacy, setPrivacy] = useState(
    () => group?.privacy || PRIVACY.PUBLIC,
  );

  if (!group) return null;
  if (!canManageSettings) return null;

  function handleSave(event) {
    event.preventDefault();
    updateGroup(groupId, { name, description, rules, type, privacy });
  }

  function handleDelete() {
    if (!window.confirm(`Delete “${group.name}”? This cannot be undone.`)) {
      return;
    }
    const ok = deleteGroup(groupId);
    if (ok) navigate("/groups");
  }

  return (
    <form onSubmit={handleSave} className={styles.form}>
      <label className={styles.field}>
        <span className={styles.label}>Group name *</span>
        <input
          className={styles.input}
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
          required
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Description</span>
        <textarea
          className={styles.textarea}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          maxLength={500}
        />
      </label>
      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>Type</span>
          <select
            className={styles.select}
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            <option value={GROUP_TYPES.SOCIAL}>Social</option>
            <option value={GROUP_TYPES.PROJECT}>Project</option>
            <option value={GROUP_TYPES.STUDY}>Study</option>
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Privacy</span>
          <select
            className={styles.select}
            value={privacy}
            onChange={(event) => setPrivacy(event.target.value)}
          >
            <option value={PRIVACY.PUBLIC}>Public</option>
            <option value={PRIVACY.PRIVATE}>Private</option>
          </select>
        </label>
      </div>
      <label className={styles.field}>
        <span className={styles.label}>Group rules</span>
        <textarea
          className={styles.textarea}
          value={rules}
          onChange={(event) => setRules(event.target.value)}
          rows={3}
          maxLength={1000}
        />
      </label>
      <div className={styles.actions}>
        {canDeleteGroup ? (
          <button
            type="button"
            className={styles.deleteButton}
            onClick={handleDelete}
          >
            Delete group
          </button>
        ) : null}
        <button type="submit" className={styles.saveButton}>
          Save changes
        </button>
      </div>
    </form>
  );
}

export default GroupSettings;
