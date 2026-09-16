import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Navigate } from "react-router-dom";

function Admin() {
  const { user, accounts, deleteAccountByEmail } = useApp();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  if (!user || (user.role !== "admin" && !user.isAdmin)) {
    return <Navigate to="/signin" replace />;
  }

  const filteredAccounts = accounts.filter((account) => {
    const matchQuery =
      !query ||
      account.fullName.toLowerCase().includes(query.toLowerCase()) ||
      account.email.toLowerCase().includes(query.toLowerCase());

    const matchRole =
      roleFilter === "all" ||
      (roleFilter === "admin" && (account.role === "admin" || account.isAdmin)) ||
      (roleFilter === "user" && !(account.role === "admin" || account.isAdmin));

    return matchQuery && matchRole;
  });

  function handleDeleteAccount(email) {
    const confirmed = window.confirm(
      `Delete the account for ${email}? This action cannot be undone.`,
    );

    if (confirmed) {
      deleteAccountByEmail(email);
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: "3rem auto", padding: "0 1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <div>
          <p style={{ margin: 0, color: "var(--richfield-blue)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.72rem" }}>
            Staff Console
          </p>
          <h1 style={{ margin: "0.35rem 0 0" }}>Admin Dashboard</h1>
        </div>
        <div style={{ background: "rgba(0,48,135,0.08)", color: "var(--richfield-blue)", borderRadius: 999, padding: "0.5rem 0.9rem", fontWeight: 700 }}>
          {user.fullName}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--richfield-light-grey)", borderRadius: 16, padding: "1rem 1.2rem", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ color: "var(--richfield-mid-grey)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Accounts</div>
          <div style={{ fontSize: "2rem", fontWeight: 800, marginTop: "0.5rem" }}>{accounts.length}</div>
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--richfield-light-grey)", borderRadius: 16, padding: "1rem 1.2rem", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ color: "var(--richfield-mid-grey)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Admins</div>
          <div style={{ fontSize: "2rem", fontWeight: 800, marginTop: "0.5rem" }}>{accounts.filter((account) => account.role === "admin" || account.isAdmin).length}</div>
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--richfield-light-grey)", borderRadius: 16, padding: "1rem 1.2rem", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ color: "var(--richfield-mid-grey)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Users</div>
          <div style={{ fontSize: "2rem", fontWeight: 800, marginTop: "0.5rem" }}>{accounts.filter((account) => account.role !== "admin" && !account.isAdmin).length}</div>
        </div>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--richfield-light-grey)", borderRadius: 16, padding: "1rem 1.2rem", boxShadow: "var(--shadow-sm)", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or email"
            style={{ flex: "1 1 220px", minWidth: 180, padding: "0.7rem 0.9rem", borderRadius: 10, border: "1px solid #dfe3e8" }}
          />
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            style={{ padding: "0.7rem 0.9rem", borderRadius: 10, border: "1px solid #dfe3e8" }}
          >
            <option value="all">All roles</option>
            <option value="admin">Admins</option>
            <option value="user">Users</option>
          </select>
        </div>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--richfield-light-grey)", borderRadius: 16, padding: "1rem 1.2rem", boxShadow: "var(--shadow-sm)" }}>
        <h2 style={{ marginTop: 0 }}>Saved Accounts</h2>

        {filteredAccounts.length === 0 ? (
          <p style={{ color: "var(--richfield-mid-grey)" }}>No saved accounts match the current filters.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {filteredAccounts.map((account) => (
              <li
                key={account.email}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem",
                  border: "1px solid #dfe3e8",
                  borderRadius: 12,
                  padding: "0.9rem 1rem",
                  marginBottom: "0.75rem",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <strong>{account.fullName}</strong>
                  <div style={{ color: "var(--richfield-mid-grey)" }}>{account.email}</div>
                  <small style={{ color: "var(--richfield-blue)", fontWeight: 700 }}>
                    {account.role === "admin" || account.isAdmin ? "Admin" : "User"}
                  </small>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteAccount(account.email)}
                  style={{
                    background: "rgba(192, 57, 43, 0.08)",
                    color: "#a93226",
                    border: "1px solid rgba(192, 57, 43, 0.4)",
                    borderRadius: 999,
                    padding: "0.45rem 0.8rem",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Delete Account
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Admin;
