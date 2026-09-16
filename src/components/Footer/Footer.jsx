import { Link } from "react-router-dom";
import styles from "./Footer.module.css";

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerTop}>
          <div className={styles.brandBlock}>
            <Link to="/" className={styles.brandName}>
              Richfield Connect
            </Link>
            <p className={styles.institution}>
              A shared space for the Richfield community.
            </p>
          </div>

          <nav className={styles.footerLinks} aria-label="Footer navigation">
            <Link to="/" className={styles.footerLink}>
              Home
            </Link>
            <Link to="/about" className={styles.footerLink}>
              About
            </Link>
            <Link to="/feed" className={styles.footerLink}>
              Feed
            </Link>
          </nav>
        </div>

        <div className={styles.footerBottom}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} Richfield Graduate Institute of Technology
          </p>
          <span className={styles.footerNote}>Built for connection and collaboration</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
