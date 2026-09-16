import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import styles from "./Profile.module.css";
import { getInitials } from "../../utils/getInitials";

function seededNumber(seed, min, max) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 1000;
  }
  return min + (hash % (max - min + 1));
}

function Profile() {
  const { email } = useParams();
  const [bioOpen, setBioOpen] = useState(true);
  const [interestsOpen, setInterestsOpen] = useState(true);
  const {
    user,
    accounts,
    posts,
    isHydrated,
    signOut,
    clearSavedAccount,
    showToast,
  } = useApp();
  const navigate = useNavigate();
  const viewedUser = email
    ? accounts.find(
        (account) =>
          String(account.email).toLowerCase() === decodeURIComponent(email).toLowerCase(),
      )
    : user;
  const isOwnProfile = Boolean(
    user && viewedUser && user.email.toLowerCase() === viewedUser.email.toLowerCase(),
  );

  function handleSignOut() {
    const confirmed = window.confirm(
      "Sign out only? This keeps your profile saved on this device so you can sign back in later. Use 'Clear saved account' to permanently delete it.",
    );
    if (confirmed) {
      signOut();
      showToast("Signed out successfully.", "info");
      navigate("/signin");
    }
  }

  function handleClearSavedAccount() {
    const confirmed = window.confirm(
      "Clear saved account? This permanently removes your profile from this device and you will need to register again.",
    );
    if (confirmed) {
      clearSavedAccount();
      showToast("Saved account cleared from this device.", "warning");
      navigate("/signin");
    }
  }

  if (!isHydrated) {
    return null; // hydration takes a fraction of a second — nothing to show yet
  }

  if (!viewedUser) {
    return (
      <div className={styles.notLoggedIn}>
        <div className={styles.bigIcon}>🔎</div>
        <h2>Profile Not Found</h2>
        <p>This account may have been removed or is not available.</p>
        <Link to="/people" className={styles.registerLink}>
          Browse People
        </Link>
      </div>
    );
  }

  const postCount = posts.filter(
    (post) => post.username === viewedUser.fullName,
  ).length;
  const connections = seededNumber(viewedUser.studentNumber + "c", 8, 60);
  const groups = seededNumber(viewedUser.studentNumber + "g", 1, 8);

  const initial = getInitials(viewedUser.fullName);

  const joined = viewedUser.joinedDate
    ? new Date(viewedUser.joinedDate).toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Today";
  const isAdmin = Boolean(viewedUser.role === "admin" || viewedUser.isAdmin);

  function toggleSection(setter) {
    setter((prev) => !prev);
  }

  return (
    <div className={styles.profileLayout}>
      <div className={styles.cover}></div>

      <div className={styles.card}>
        <div className={styles.avatarArea}>
          <div className={styles.avatarBlock}>
            <div className={styles.avatar}>{initial}</div>
            <div className={styles.meta}>
              <div className={styles.nameRow}>
                <h1>{viewedUser.fullName}</h1>
                {isAdmin && <span className={styles.adminBadge}>Admin</span>}
              </div>
              <p className={styles.studentId}>
                Student No: {viewedUser.studentNumber}
              </p>
              <span className={styles.campusBadge}>{viewedUser.campus}</span>
            </div>
          </div>
          {isOwnProfile ? (
            <div className={styles.actions}>
              <Link to="/signup" className={styles.editButton}>
                ✏️ Edit Profile
              </Link>
              <Link to="/feed" className={styles.feedButton}>
                📢 Go to Feed
              </Link>
              <button onClick={handleSignOut} className={styles.signOutButton}>
                Sign Out
              </button>
              <button
                onClick={handleClearSavedAccount}
                className={styles.signOutButton}
                style={{ background: "#c0392b" }}
              >
                Clear saved account
              </button>
            </div>
          ) : (
            <Link to="/people" className={styles.feedButton}>
              ← Browse People
            </Link>
          )}
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <span className={styles.statNum}>{postCount}</span>
            <span className={styles.statLbl}>Posts</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNum}>{connections}</span>
            <span className={styles.statLbl}>Connections</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNum}>{groups}</span>
            <span className={styles.statLbl}>Groups</span>
          </div>
        </div>

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>📧 Email Address</div>
            <div className={styles.infoValue}>{viewedUser.email}</div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>🎓 Campus</div>
            <div className={styles.infoValue}>{viewedUser.campus}</div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>🔖 Student Number</div>
            <div className={styles.infoValue}>{viewedUser.studentNumber}</div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>📅 Member Since</div>
            <div className={styles.infoValue}>{joined}</div>
          </div>
        </div>

        <div className={styles.section}>
          <div
            className={styles.sectionHeader}
            onClick={() => toggleSection(setBioOpen)}
            role="button"
            tabIndex={0}
            aria-expanded={bioOpen}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") toggleSection(setBioOpen);
            }}
          >
            <h3>📝 About Me</h3>
            <span
              className={
                bioOpen
                  ? styles.toggleIcon
                  : `${styles.toggleIcon} ${styles.collapsed}`
              }
            >
              ▼
            </span>
          </div>
          <div
            className={
              bioOpen
                ? styles.sectionContent
                : `${styles.sectionContent} ${styles.collapsed}`
            }
          >
            <div className={styles.sectionContentInner}>
              <p className={styles.bioText}>{viewedUser.bio}</p>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div
            className={styles.sectionHeader}
            onClick={() => toggleSection(setInterestsOpen)}
            role="button"
            tabIndex={0}
            aria-expanded={interestsOpen}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                toggleSection(setInterestsOpen);
            }}
          >
            <h3>🏷️ Interests</h3>
            <span
              className={
                interestsOpen
                  ? styles.toggleIcon
                  : `${styles.toggleIcon} ${styles.collapsed}`
              }
            >
              ▼
            </span>
          </div>
          <div
            className={
              interestsOpen
                ? styles.sectionContent
                : `${styles.sectionContent} ${styles.collapsed}`
            }
          >
            <div className={styles.sectionContentInner}>
              <div className={styles.tags}>
                {viewedUser.interests.map((interest) => (
                  <span key={interest} className={styles.tag}>
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
