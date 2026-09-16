import { Link } from "react-router-dom";
import styles from "./NotFound.module.css";

function NotFound() {
  return (
    <div className={styles.notFound}>
      <h1 className={styles.code}>404</h1>
      <h2>Page Not Found</h2>
      <p>The page you're looking for doesn't exist, or may have been moved.</p>
      <Link to="/" className={styles.homeLink}>
        Back to Home
      </Link>
    </div>
  );
}

export default NotFound;
