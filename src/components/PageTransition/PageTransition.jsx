import styles from "./PageTransition.module.css";

// Wraps whichever page is currently routed. Because it remounts fresh on
// every navigation (see the key={} in App.jsx), this animation replays
// every time — no animation library, just CSS + a remount.
function PageTransition({ children }) {
  return <div className={styles.pageTransition}>{children}</div>;
}

export default PageTransition;
