import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useGroups, useGroupPermissions } from "../../GroupsContext";
import { GROUP_TYPES, MEMBER_STATUS, PRIVACY } from "../../types";
import CreateGroupModal from "../CreateGroupModal/CreateGroupModal";
import styles from "./GroupExplorer.module.css";

const TYPE_LABELS = {
  [GROUP_TYPES.SOCIAL]: "Social",
  [GROUP_TYPES.PROJECT]: "Project",
  [GROUP_TYPES.STUDY]: "Study",
};

function memberCount(memberships, groupId) {
  return memberships.filter(
    (member) =>
      member.groupId === groupId && member.status === MEMBER_STATUS.ACTIVE,
  ).length;
}

function GroupCard({ group }) {
  const {
    canViewContent,
    isMember,
    isPlatformAdmin,
    canJoinPublic,
    canRequestJoin,
    requestStatus,
  } = useGroupPermissions(group.id);
  const { memberships, joinPublicGroup, requestToJoin } = useGroups();

  const count = useMemo(
    () => memberCount(memberships, group.id),
    [memberships, group.id],
  );

  // The card only decides *which* CTA the user may see — confirmations and
  // toasts live in the context layer.
  let action = null;
  if (canViewContent || isMember || isPlatformAdmin) {
    action = (
      <Link className={styles.openLink} to={`/groups/${group.id}`}>
        Open
      </Link>
    );
  } else if (canJoinPublic) {
    action = (
      <button
        type="button"
        className={styles.joinButton}
        onClick={() => joinPublicGroup(group.id)}
      >
        Join
      </button>
    );
  } else if (canRequestJoin) {
    action =
      requestStatus === MEMBER_STATUS.PENDING ||
      requestStatus === MEMBER_STATUS.INVITED ? (
        <span className={styles.pendingLabel}>Pending…</span>
      ) : (
        <button
          type="button"
          className={styles.requestButton}
          onClick={() => requestToJoin(group.id)}
        >
          Request
        </button>
      );
  }

  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardName}>{group.name}</h3>
        <div className={styles.badges}>
          <span className={styles.typeBadge}>
            {TYPE_LABELS[group.type] || group.type}
          </span>
          <span
            className={
              group.privacy === PRIVACY.PRIVATE
                ? styles.privateBadge
                : styles.publicBadge
            }
          >
            {group.privacy === PRIVACY.PRIVATE ? "Private" : "Public"}
          </span>
        </div>
      </div>
      {group.description ? (
        <p className={styles.cardDescription}>{group.description}</p>
      ) : null}
      <div className={styles.cardFooter}>
        <span className={styles.memberCount}>
          {count} {count === 1 ? "member" : "members"}
        </span>
        {action}
      </div>
    </article>
  );
}

/**
 * Searchable, filterable directory of every group. GroupCard handles the
 * per-row permission CTAs so this component stays a pure filter + list.
 */
function GroupExplorer() {
  const { groups, isHydrated } = useGroups();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [privacyFilter, setPrivacyFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return groups.filter((group) => {
      if (typeFilter !== "all" && group.type !== typeFilter) return false;
      if (privacyFilter !== "all" && group.privacy !== privacyFilter) {
        return false;
      }
      if (!needle) return true;
      const haystack =
        `${group.name || ""} ${group.description || ""}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [groups, query, typeFilter, privacyFilter]);

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Community</p>
          <h1 className={styles.title}>Groups</h1>
          <p className={styles.subtitle}>
            Find your people, share files, and keep the discussion going.
          </p>
        </div>
        <button
          type="button"
          className={styles.createButton}
          onClick={() => setCreateOpen(true)}
        >
          Create group
        </button>
      </div>

      <div className={styles.filters}>
        <input
          className={styles.search}
          type="search"
          placeholder="Search groups…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search groups"
        />
        <select
          className={styles.select}
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          aria-label="Filter by type"
        >
          <option value="all">All types</option>
          <option value={GROUP_TYPES.SOCIAL}>Social</option>
          <option value={GROUP_TYPES.PROJECT}>Project</option>
          <option value={GROUP_TYPES.STUDY}>Study</option>
        </select>
        <select
          className={styles.select}
          value={privacyFilter}
          onChange={(event) => setPrivacyFilter(event.target.value)}
          aria-label="Filter by privacy"
        >
          <option value="all">Public + private</option>
          <option value={PRIVACY.PUBLIC}>Public</option>
          <option value={PRIVACY.PRIVATE}>Private</option>
        </select>
      </div>

      {!isHydrated ? (
        <p className={styles.status}>Loading groups…</p>
      ) : filtered.length === 0 ? (
        <p className={styles.status}>
          No groups yet. Create one to get started.
        </p>
      ) : (
        <div className={styles.grid}>
          {filtered.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}

      <CreateGroupModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </section>
  );
}

export default GroupExplorer;