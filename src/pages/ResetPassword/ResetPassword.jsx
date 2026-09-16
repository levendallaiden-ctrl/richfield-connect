import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import styles from "../SignUpForm/SignUpForm.module.css";

function ResetPassword() {
  const navigate = useNavigate();
  const { resetPassword, showToast } = useApp();
  const [formData, setFormData] = useState({
    email: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!formData.email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!formData.newPassword || formData.newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const success = resetPassword(formData.email, formData.newPassword);

    if (!success) {
      setError("No saved account was found for that email.");
      return;
    }

    showToast("Password updated successfully.", "success");
    navigate("/signin");
  }

  return (
    <div className={styles.signupPage}>
      <div className={styles.grid}>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <h1>Reset Password</h1>

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
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleChange}
              className={styles.input}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={styles.input}
            />
          </div>

          {error && <span className={styles.errorMsg}>{error}</span>}

          <button type="submit" className={styles.submitButton}>
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
