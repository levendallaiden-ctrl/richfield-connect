import { Link } from "react-router-dom";
import styles from "./Home.module.css";

const features = [
  {
    icon: "🤝",
    title: "Connect with Peers",
    description:
      "Find and follow fellow Richfield students across every campus and qualification.",
  },
  {
    icon: "💡",
    title: "Share Academic Ideas",
    description:
      "Post updates, projects, and insights with a community that values academic integrity.",
  },
  {
    icon: "📋",
    title: "Build Your Profile",
    description:
      "Create a professional academic profile that reflects your interests and achievements.",
  },
];

// Real Richfield figures (8 campuses, 30+ years operating) rather than invented stats
const stats = [
  { num: "8", label: "Campuses" },
  { num: "30+", label: "Years" },
  { num: "100%", label: "Secure" },
  { num: "24/7", label: "Access" },
];

function Home() {
  return (
    <div className={styles.home}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.heroBadge}>
            🎓 Richfield Graduate Institute of Technology
          </span>
          <h1 className={styles.heroHeading}>
            Your Academic Community,
            <br />
            <em>Connected</em>
          </h1>
          <p className={styles.heroText}>
            Richfield Connect is the secure, institution-focused platform where
            students collaborate, share ideas, and build meaningful academic
            networks.
          </p>
          <div className={styles.heroActions}>
            <Link to="/signup" className={`${styles.btn} ${styles.btnBlue}`}>
              Register Now
            </Link>
            <Link to="/about" className={`${styles.btn} ${styles.btnOutline}`}>
              Learn More
            </Link>
          </div>
        </div>

        <div className={styles.heroStats}>
          {stats.map((stat) => (
            <div key={stat.label} className={styles.heroStat}>
              <span className={styles.statNum}>{stat.num}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.eyebrow}>Why Richfield Connect</span>
          <h2>Everything you need to thrive academically</h2>
          <p>
            A purpose-built platform for the Richfield community — private,
            professional, and powerful.
          </p>
        </div>

        <div className={styles.featuresGrid}>
          {features.map((feature) => (
            <div key={feature.title} className={styles.card}>
              <div className={styles.featureIcon}>{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
