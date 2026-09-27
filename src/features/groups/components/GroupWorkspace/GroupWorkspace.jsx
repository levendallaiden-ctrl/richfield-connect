import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useGroups, useGroupPermissions } from "../../GroupsContext";
import { MEMBER_STATUS, PRIVACY } from "../../types";
import GroupSettings from "../GroupSettings/GroupSettings";
import MemberManagementPanel from "../MemberManagementPanel/MemberManagementPanel";
import MessageFeed from "../MessageFeed/MessageFeed";
import SharedFilesPanel from "../SharedFilesPanel/SharedFilesPanel";
import styles from "./GroupWorkspace.module.css";

const TABS = ["discussion", "files", "members"];

/**
 * Full workspace for one group. Locked (non-member) visitors see the group
 * card with Join / Request / Accept-invite CTAs; members and platform
 * admins get the tabbed discussion/files/members/settings workspace.
 */
function GroupWorkspace({ groupId }) {
  const {
    memberships,
    joinPublicGroup,
    requestToJoin,
    respondToRequest,
    leaveGroup,
  } = useGroups();
  const {
    group,
    membership,
    requestRow,
    canViewContent,
    canManageSettings,
    canJoinPublic,
    canRequestJoin,
    isPlatformAdmin,
    isGroupAdmin,
  } = useGroupPermissions(groupId);
  const [tab, setTab] = useState("discussion");

  const memberCount = useMemo(
    () =>
      memberships.filter(
        (member) =>
          member.groupId === groupId &&
          member.status === MEMBER_STATUS.ACTIVE,
      ).length,
    [memberships, groupId],
  );

  if (!group) {
    return (
      <section className={styles.page}>
        <p className={styles.status}>Group not found.</p>
        <Link className={styles.backLink} to="/groups">
          Back to groups
        </Link>
      </section>
    );
  }

  if (!canViewContent) {
    return (
      <LockedPanel
        group={group}
        requestRow={requestRow}
        canJoinPublic={canJoinPublic}
        canRequestJoin={canRequestJoin}
        onJoin={() => joinPublicGroup(groupId)}
        onRequest={() => requestToJoin(groupId)}
        onAcceptInvite={() => respondToRequest(requestRow.id, true)}
      />
    );
  }

  const tabs = canManageSettings ? [...TABS, "settings"] : TABS;

  return (
    <section className={styles.page}>
      <Link className={styles.backLink} to="/groups">
        ← Back to groups
      </Link>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{group.name}</h1>
          <p className={styles.meta}>
            {group.type} · {group.privacy === PRIVACY.PRIVATE ? "Private" : "Public"} ·{" "}
            {memberCount} {memberCount === 1 ? "member" : "members"}
            {isPlatformAdmin && !membership ? " · viewing as platform admin" : ""}
          </p>
          {group.description ? (
            <p className={styles.description}>{group.description}</p>
          ) : null}
        </div>
        {membership && !isGroupAdmin && !isPlatformAdmin ? (
          <button
            type="button"
            className={styles.leaveButton}
            onClick={() => leaveGroup(groupId)}
          >
            Leave group
          </button>
        ) : null}
      </header>

      <nav className={styles.tabs} aria-label="Group sections">
        {tabs.map((name) => (
          <button
            key={name}
            type="button"
            className={tab === name ? `${styles.tab} ${styles.activeTab}` : styles.tab}
            onClick={() => setTab(name)}
            aria-pressed={tab === name}
          >
            {name[0].toUpperCase() + name.slice(1)}
          </button>
        ))}
      </nav>

      <div className={styles.tabPanel}>
        {tab === "discussion" ? <MessageFeed groupId={groupId} /> : null}
        {tab === "files" ? <SharedFilesPanel groupId={groupId} /> : null}
        {tab === "members" ? <MemberManagementPanel groupId={groupId} /> : null}
        {tab === "settings" && canManageSettings ? (
          // keyed by group so GroupSettings' lazily-seeded draft is rebuilt
          // when the workspace switches to a different group
          <GroupSettings key={group.id} groupId={groupId} />
        ) : null}
      </div>
    </section>
  );
}


/**
 * Non-member view: group card with Join / Request / Accept-invite CTAs.
 * Platform admins never land here (`canViewContent` is true for them), so
 * every branch below is a signed-in non-member or a pending invitee.
 */
function LockedPanel({
  group,
  requestRow,
  canJoinPublic,
  canRequestJoin,
  onJoin,
  onRequest,
  onAcceptInvite,
}) {
  const status = requestRow?.status || null;

  let action = null;
  if (status === MEMBER_STATUS.INVITED) {
    action = (
      <button
        type="button"
        className={styles.primaryButton}
        onClick={onAcceptInvite}
      >
        Accept invite
      </button>
    );
  } else if (status === MEMBER_STATUS.PENDING) {
    action = <span className={styles.pendingLabel}>Request pending…</span>;
  } else if (canJoinPublic) {
    action = (
      <button type="button" className={styles.primaryButton} onClick={onJoin}>
        Join group
      </button>
    );
  } else if (canRequestJoin) {
    action = (
      <button
        type="button"
        className={styles.primaryButton}
        onClick={onRequest}
      >
        Request to join
      </button>
    );
  }

  return (
    <section className={styles.page}>
      <Link className={styles.backLink} to="/groups">
        ← Back to groups
      </Link>
      <div className={styles.lockedCard}>
        <h1 className={styles.title}>{group.name}</h1>
        <p className={styles.meta}>
          {group.type} · {group.privacy === PRIVACY.PRIVATE ? "Private" : "Public"}
        </p>
        {group.description ? (
          <p className={styles.description}>{group.description}</p>
        ) : null}
        <p className={styles.lockedNote}>
          {group.privacy === PRIVACY.PRIVATE
            ? "This is a private group. Only members can see the discussion."
            : "Join this group to see the discussion."}
        </p>
        {action}
      </div>
    </section>
  );
}

export default GroupWorkspace;
