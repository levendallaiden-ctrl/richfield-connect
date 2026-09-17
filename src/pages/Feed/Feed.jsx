import { Link } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import CreatePost from "../../components/CreatePost/CreatePost";
import Post from "../../components/Post/Post";
import styles from "./Feed.module.css";
import { getInitials } from "../../utils/getInitials";

const trendingTopics = [
  "#ReactJS",
  "#WebDev",
  "#StudyTips",
  "#ITFaculty",
  "#Richfield2026",
  "#Assignments",
];

function Feed() {
  const { user, posts, isHydrated } = useApp();

  if (!isHydrated) {
    return null;
  }

  if (!user) {
    return (
      <div className={styles.notLoggedIn}>
        <h2>Registration Required</h2>
        <p>You need to create a profile before accessing the Student Feed.</p>
        <Link to="/signup" className={styles.registerLink}>
          Create My Profile
        </Link>
      </div>
    );
  }

  const initial = getInitials(user.fullName);

  return (
    <div className={styles.feedLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarCard}>
          <div className={styles.sAvatar}>{initial}</div>
          <p className={styles.sName}>{user.fullName}</p>
          <p className={styles.sId}>No: {user.studentNumber}</p>
          <span className={styles.sCampus}>{user.campus}</span>
          <Link to="/profile" className={styles.sidebarBtn}>
            View Full Profile
          </Link>
        </div>

        <div className={styles.sidebarCard}>
          <h3>🔥 Trending Topics</h3>
          <div className={styles.trendingTags}>
            {trendingTopics.map((tag) => (
              <span key={tag} className={styles.trendingTag}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.sidebarCard}>
          <h3>🔗 Quick Links</h3>
          <Link to="/profile/edit" className={styles.sidebarBtnOutline}>
            Edit Profile
          </Link>
          <Link to="/people" className={styles.sidebarBtnOutline}>
            Browse People
          </Link>
          <Link to="/about" className={styles.sidebarBtnOutline}>
            About Platform
          </Link>
          <Link to="/" className={styles.sidebarBtnOutline}>
            Home
          </Link>
          {user.role === "admin" || user.isAdmin ? (
            <Link to="/admin" className={styles.sidebarBtnOutline}>
              Admin Dashboard
            </Link>
          ) : null}
        </div>
      </aside>

      <main className={styles.feedMain}>
        <div className={styles.feedHeader}>
          <h1>Student Feed</h1>
          {posts.length > 0 && (
            <span className={styles.postCount}>
              {posts.length} post{posts.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <CreatePost />

        {posts.length === 0 ? (
          <div className={styles.emptyFeed}>
            <div className={styles.emptyIcon}>📭</div>
            <h3>No posts yet</h3>
            <p>
              Be the first to share something with the Richfield Connect
              community!
            </p>
          </div>
        ) : (
          <div className={styles.postList}>
            {posts.map((post) => (
              <Post key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Feed;
