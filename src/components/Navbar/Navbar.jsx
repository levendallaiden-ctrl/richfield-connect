import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../context/ThemeContext";
import styles from "./Navbar.module.css";

const navItems = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  { to: "/feed", label: "Feed" },
  { to: "/people", label: "People" },
  { to: "/profile", label: "Profile" },
];

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useApp();
  const { theme, toggleTheme } = useTheme();

  function linkClass({ isActive }) {
    return isActive ? `${styles.link} ${styles.active}` : styles.link;
  }

  function ctaClass({ isActive }) {
    return isActive
      ? `${styles.link} ${styles.joinLink} ${styles.active}`
      : `${styles.link} ${styles.joinLink}`;
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.navInner}>
        <Link
          to="/"
          className={styles.navLogo}
          onClick={() => setIsOpen(false)}
        >
          <span className={styles.logoIcon}>R</span>
          Richfield Connect
        </Link>

        <div className={styles.navRight}>
          <ul
            className={
              isOpen ? `${styles.navLinks} ${styles.open}` : styles.navLinks
            }
          >
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={linkClass}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
            {user && (user.role === "admin" || user.isAdmin) && (
              <li>
                <NavLink
                  to="/admin"
                  className={linkClass}
                  onClick={() => setIsOpen(false)}
                >
                  Admin
                </NavLink>
              </li>
            )}
            <li>
              <NavLink
                to="/signin"
                className={styles.link}
                onClick={() => setIsOpen(false)}
              >
                Sign In
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/signup"
                className={ctaClass}
                onClick={() => setIsOpen(false)}
              >
                Join Now
              </NavLink>
            </li>
          </ul>

          <button
            className={styles.themeToggle}
            onClick={toggleTheme}
            aria-label={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          <button
            className={styles.hamburger}
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
