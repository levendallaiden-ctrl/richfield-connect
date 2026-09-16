import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import styles from "../SignUpForm/SignUpForm.module.css";

const devAdminUser = {
  fullName: "Richfield Admin",
  studentNumber: "000000",
  campus: "Cape Town Campus",
  email: "admin@richfield.dev",
  password: "admin123",
  interests: ["Programming", "Cybersecurity"],
  bio: "Development admin account used for testing the staff dashboard.",
  isAdmin: true,
  role: "admin",
  joinedDate: new Date().toISOString(),
};

function SignInForm() {
  const navigate = useNavigate();
  const { signIn, showToast, registerUser } = useApp();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const showDevShortcut =
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).has("devadmin");

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!formData.email.trim() || !formData.password) {
      setError("Please enter both email and password.");
      return;
    }

    const success = signIn(formData.email, formData.password);

    if (!success) {
      setError("Invalid email or password.");
      return;
    }

    showToast("Signed in successfully.", "success");
    navigate("/profile");
  }

  function handleDevAdminLogin() {
    if (!import.meta.env.DEV) return;
    registerUser(devAdminUser);
    showToast("Development admin shortcut activated.", "success");
    navigate("/profile");
  }

  return (
    <div className={styles.signupPage}>
      <div className={styles.grid}>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <h1>Sign In</h1>

          <div className={styles.fieldGroup}>
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={styles.input}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className={styles.input}
            />
          </div>

          {error && <span className={styles.errorMsg}>{error}</span>}

          <div className={styles.authMeta}>
            <Link to="/reset-password">
              Forgot password?
            </Link>
          </div>

          <button type="submit" className={`${styles.submitButton} ${styles.authSubmit}`}>
            Sign In
          </button>

          {showDevShortcut && (
            <button
              type="button"
              className={styles.submitButton}
              onClick={handleDevAdminLogin}
              style={{ marginTop: "0.75rem", background: "#7a5400" }}
            >
              DEV: Admin shortcut
            </button>
          )}

          <p style={{ marginTop: "1rem", textAlign: "center", color: "var(--richfield-mid-grey)" }}>
            Don&apos;t have an account?{" "}
            <Link to="/signup">Create one</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default SignInForm;
