import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { getInitials } from "../../utils/getInitials";
import styles from "./People.module.css";

function isAdmin(account) {
  return account.role === "admin" || account.isAdmin;
}

function People() {
  const { accounts } = useApp();
  const [query, setQuery] = useState("");

  const filteredAccounts = accounts.filter((account) => {
    const searchText = query.trim().toLowerCase();
    return (
      !searchText ||
      account.fullName.toLowerCase().includes(searchText) ||
      account.email.toLowerCase().includes(searchText) ||
      account.campus.toLowerCase().includes(searchText)
    );
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Community directory</p>
          <h1>Meet the Richfield community</h1>
          <p className={styles.intro}>
            Browse profiles, discover shared interests, and connect with people
            across our campuses.
          </p>
        </div>
        <div className={styles.count}>{accounts.length} members</div>
      </header>

      <label className={styles.searchLabel} htmlFor="people-search">
        Search people
      </label>
      <input
        id="people-search"
        className={styles.search}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by name, email, or campus"
      />

      {filteredAccounts.length === 0 ? (
        <div className={styles.emptyState}>
          <h2>No people found</h2>
          <p>Try a different name, email address, or campus.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredAccounts.map((account) => (
            <article className={styles.card} key={account.email}>
              <div className={styles.cardTop}>
                <div className={styles.avatar}>{getInitials(account.fullName)}</div>
                <div>
                  <h2>{account.fullName}</h2>
                  <p>{account.campus}</p>
                </div>
                {isAdmin(account) && <span className={styles.badge}>Admin</span>}
              </div>
              <p className={styles.bio}>{account.bio}</p>
              <div className={styles.tags}>
                {(account.interests || []).slice(0, 3).map((interest) => (
                  <span key={interest}>{interest}</span>
                ))}
              </div>
              <Link
                to={`/profile/${encodeURIComponent(account.email)}`}
                className={styles.viewButton}
              >
                View profile
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default People;
