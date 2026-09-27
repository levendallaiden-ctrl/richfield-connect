import { useMemo, useState } from "react";
import { useApp } from "../../../../context/AppContext";
import { useGroups, useGroupPermissions } from "../../GroupsContext";
import { GROUP_ROLES, MEMBER_STATUS } from "../../types";
import styles from "./MemberManagementPanel.module.css";

function displayName(accounts, email) {
  const account = accounts.find(
    (entry) =>
      String(entry.email || "").trim().toLowerCase() ===
      String(email || "").trim().toLowerCase(),
  );
  return account?.fullName || email;
}

function RoleBadge({ role }) {
  const admin = role === GROUP_ROLES.GROUP_ADMIN;
  return (
    <span className={admin ? styles.adminBadge : styles.memberBadge}>
      {admin ? "Admin" : "Member"}
    </span>
  );
}

/**
 * Members tab. Everyone sees the active roster; only managers see requests,
 * invites, and the invite form. Destructive actions stay in the context
 * layer (last-admin guard, toasts) — this panel only calls the mutations
 * and lets them report failure.
 */
function MemberManagementPanel({ groupId }) {
  const {
    memberships,
    inviteMember,
    respondToRequest,
    removeMember,
    changeMemberRole,
  } = useGroups();
  const { canManageMembers } = useGroupPermissions(groupId);
  const { accounts } = useApp();
  const [email, setEmail] = useState("");

  const active = useMemo(
    () =>
      memberships.filter(
        (member) =>
          member.groupId === groupId &&
          member.status === MEMBER_STATUS.ACTIVE,
      ),
    [memberships, groupId],
  );
  const pending = useMemo(
    () =>
      memberships.filter(
        (member) =>
          member.groupId === groupId &&
          member.status === MEMBER_STATUS.PENDING,
      ),
    [memberships, groupId],
  );
  const invited = useMemo(
    () =>
      memberships.filter(
        (member) =>
          member.groupId === groupId &&
          member.status === MEMBER_STATUS.INVITED,
      ),
    [memberships, groupId],
  );

  function handleInvite(event) {
    event.preventDefault();
    if (!email.trim()) return;
    const ok = inviteMember(groupId, email.trim());
    if (ok) setEmail("");
  }

  return (
    <div className={styles.panel}>
      <section>
        <h3 className={styles.sectionTitle}>Members ({active.length})</h3>
        {active.length === 0 ? (
          <p className={styles.empty}>No active members.</p>
        ) : (
          <ul className={styles.list}>
            {active.map((member) => (
              <li key={member.id} className={styles.row}>
                <div className={styles.identity}>
                  <span className={styles.name}>
                    {displayName(accounts, member.userEmail)}
                  </span>
                  <span className={styles.email}>{member.userEmail}</span>
                </div>
                <div className={styles.rowActions}>
                  <RoleBadge role={member.role} />
                  {canManageMembers ? (
                    <>
                      <button
                        type="button"
                        className={styles.smallButton}
                        onClick={() =>
                          changeMemberRole(
                            member.id,
                            member.role === GROUP_ROLES.GROUP_ADMIN
                              ? GROUP_ROLES.GROUP_MEMBER
                              : GROUP_ROLES.GROUP_ADMIN,
                          )
                        }
                      >
                        {member.role === GROUP_ROLES.GROUP_ADMIN
                          ? "Demote"
                          : "Promote"}
                      </button>
                      <button
                        type="button"
                        className={styles.dangerButton}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Remove ${member.userEmail} from this group?`,
                            )
                          ) {
                            removeMember(member.id);
                          }
                        }}
                      >
                        Remove
                      </button>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canManageMembers ? (
        <>
          <section>
            <h3 className={styles.sectionTitle}>
              Join requests ({pending.length})
            </h3>
            {pending.length === 0 ? (
              <p className={styles.empty}>No pending requests.</p>
            ) : (
              <ul className={styles.list}>
                {pending.map((member) => (
                  <li key={member.id} className={styles.row}>
                    <div className={styles.identity}>
                      <span className={styles.name}>
                        {displayName(accounts, member.userEmail)}
                      </span>
                      <span className={styles.email}>{member.userEmail}</span>
                    </div>
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className={styles.smallButton}
                        onClick={() => respondToRequest(member.id, true)}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className={styles.dangerButton}
                        onClick={() => respondToRequest(member.id, false)}
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className={styles.sectionTitle}>Invited ({invited.length})</h3>
            {invited.length === 0 ? (
              <p className={styles.empty}>No outstanding invites.</p>
            ) : (
              <ul className={styles.list}>
                {invited.map((member) => (
                  <li key={member.id} className={styles.row}>
                    <div className={styles.identity}>
                      <span className={styles.name}>
                        {displayName(accounts, member.userEmail)}
                      </span>
                      <span className={styles.email}>Invite pending</span>
                    </div>
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className={styles.dangerButton}
                        onClick={() => respondToRequest(member.id, false)}
                      >
                        Cancel invite
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className={styles.sectionTitle}>Invite by email</h3>
            <form onSubmit={handleInvite} className={styles.inviteForm}>
              <input
                className={styles.inviteInput}
                type="email"
                placeholder="teammate@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-label="Email to invite"
              />
              <button type="submit" className={styles.inviteButton}>
                Send invite
              </button>
            </form>
          </section>
        </>
      ) : null}
    </div>
  );
}

export default MemberManagementPanel;

