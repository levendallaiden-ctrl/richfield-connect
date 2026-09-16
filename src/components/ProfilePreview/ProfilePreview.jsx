import styles from "./ProfilePreview.module.css";
import { getInitials } from "../../utils/getInitials";

function ProfilePreview({ fullName, studentNumber, campus, bio, interests }) {
  const initial = getInitials(fullName);

  return (
    <div className={styles.previewSticky}>
      <p className={styles.previewLabel}>👁 Live Preview</p>

      <aside className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.headerLabel}>Student Profile</span>
          <h3>Richfield Connect</h3>
          <div className={styles.avatarWrap}>
            <div className={styles.avatar}>{initial}</div>
          </div>
        </div>

        <div className={styles.body}>
          <p className={styles.name}>{fullName || "Your Name"}</p>
          <p className={styles.studentId}>
            {studentNumber
              ? `Student No: ${studentNumber}`
              : "Richfield Connect"}
          </p>
          {campus && <span className={styles.campusTag}>{campus}</span>}
          <p className={styles.bio}>
            {bio || "Your bio will appear here as you type..."}
          </p>

          <div className={styles.tags}>
            {interests.length > 0 ? (
              interests.map((interest) => (
                <span key={interest} className={styles.tag}>
                  {interest}
                </span>
              ))
            ) : (
              <span className={styles.tagPlaceholder}>
                No interests selected yet
              </span>
            )}
          </div>
        </div>

        <div className={styles.footer}>Live Preview — Updates as you type</div>
      </aside>
    </div>
  );
}

export default ProfilePreview;
