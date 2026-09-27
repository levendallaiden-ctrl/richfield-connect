import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGroups } from "../../GroupsContext";
import { GROUP_TYPES, PRIVACY, TYPE_DEFAULTS } from "../../types";
import styles from "./CreateGroupModal.module.css";

const TYPE_OPTIONS = [
  { value: GROUP_TYPES.SOCIAL, label: "Social" },
  { value: GROUP_TYPES.PROJECT, label: "Project" },
  { value: GROUP_TYPES.STUDY, label: "Study" },
];

function defaultsFor(type) {
  return TYPE_DEFAULTS[type] || TYPE_DEFAULTS[GROUP_TYPES.SOCIAL];
}

/**
 * Controlled create-group dialog. On submit it delegates to
 * `createGroup(...)`, closes itself, and routes to the new workspace —
 * `createGroup` returns the new id (or null when it toasts a rejection).
 */
function CreateGroupModal({ open, onClose }) {
  const { createGroup } = useGroups();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState(GROUP_TYPES.SOCIAL);
  const [privacy, setPrivacy] = useState(
    defaultsFor(GROUP_TYPES.SOCIAL).privacy,
  );
  const [rules, setRules] = useState(defaultsFor(GROUP_TYPES.SOCIAL).rules);
  const [submitting, setSubmitting] = useState(false);

  // Fresh mount per open (parent renders only when `open`) means the
  // initial state above is already a clean form — no reset effect needed.
  useEffect(() => {
    function handleKey(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Simpler v1 per plan: changing the type re-applies that type's soft
  // defaults (documented in the UI under the type select).
  function handleTypeChange(nextType) {
    setType(nextType);
    const defaults = defaultsFor(nextType);
    setPrivacy(defaults.privacy);
    setRules(defaults.rules);
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    const groupId = createGroup({ name, description, rules, type, privacy });
    setSubmitting(false);
    if (!groupId) return; // createGroup already toasted the reason
    onClose();
    navigate(`/groups/${groupId}`);
  }

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-group-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id="create-group-title">Create a group</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.field}>
            <span className={styles.label}>Group name *</span>
            <input
              className={styles.input}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Weekend Hikers"
              maxLength={80}
              required
              autoFocus
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Description</span>
            <textarea
              className={styles.textarea}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What is this group about?"
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
                onChange={(event) => handleTypeChange(event.target.value)}
              >
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className={styles.hint}>
                Defaults update when the type changes.
              </span>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Privacy</span>
              <select
                className={styles.select}
                value={privacy}
                onChange={(event) => setPrivacy(event.target.value)}
              >
                <option value={PRIVACY.PUBLIC}>Public — anyone can join</option>
                <option value={PRIVACY.PRIVATE}>
                  Private — approval required
                </option>
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
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={submitting || !name.trim()}
            >
              {submitting ? "Creating…" : "Create group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateGroupModal;
