import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import ProfilePreview from "../../components/ProfilePreview/ProfilePreview";
import styles from "./SignUpForm.module.css";

const campusOptions = [
  "Durban Campus",
  "Cape Town Campus",
  "Bryanston Campus",
  "Centurion Campus",
];
const interestOptions = [
  "Programming",
  "Design",
  "Data Science",
  "Networking",
  "Cybersecurity",
];
const ADMIN_ACCESS_CODE = "RICHFIELD-ADMIN-2026";

function validate(data) {
  const newErrors = {};

  if (!data.fullName.trim()) {
    newErrors.fullName = "Full name is required.";
  }

  if (!data.studentNumber.trim()) {
    newErrors.studentNumber = "Student number is required.";
  } else if (!/^\d+$/.test(data.studentNumber)) {
    newErrors.studentNumber = "Student number must contain numbers only.";
  } else if (data.studentNumber.length < 6) {
    newErrors.studentNumber = "Student number must be at least 6 digits.";
  }

  if (!data.campus) {
    newErrors.campus = "Please select a campus.";
  }

  if (!data.email.trim()) {
    newErrors.email = "Email address is required.";
  } else if (!data.email.includes("@") || !data.email.includes(".")) {
    newErrors.email = "Please enter a valid email address.";
  }

  if (!data.password) {
    newErrors.password = "Password is required.";
  } else if (data.password.length < 8) {
    newErrors.password = "Password must be at least 8 characters.";
  }

  if (!data.confirmPassword) {
    newErrors.confirmPassword = "Please confirm your password.";
  } else if (data.confirmPassword !== data.password) {
    newErrors.confirmPassword = "Passwords do not match.";
  }

  if (data.interests.length === 0) {
    newErrors.interests = "Select at least one interest.";
  }

  if (!data.bio.trim()) {
    newErrors.bio = "Bio is required.";
  } else if (data.bio.trim().length < 20) {
    newErrors.bio = "Bio must be at least 20 characters.";
  }

  if (!data.termsAccepted) {
    newErrors.termsAccepted = "You must accept the Terms and Conditions.";
  }

  if (data.isAdmin && (!data.adminCode || data.adminCode.trim() !== ADMIN_ACCESS_CODE)) {
    newErrors.adminCode = "Valid admin access code is required.";
  }

  return newErrors;
}

// Builds the form's starting values — empty for a new registration,
// or pre-filled from the existing profile when editing one.
function buildFormData(user) {
  if (!user) {
    return {
      fullName: "",
      studentNumber: "",
      campus: "",
      email: "",
      password: "",
      confirmPassword: "",
      interests: [],
      bio: "",
      termsAccepted: false,
      isAdmin: false,
      adminCode: "",
    };
  }
  return {
    fullName: user.fullName,
    studentNumber: user.studentNumber,
    campus: user.campus,
    email: user.email,
    password: user.password || "",
    confirmPassword: user.password || "",
    interests: user.interests,
    bio: user.bio,
    termsAccepted: true,
    isAdmin: Boolean(user.role === "admin" || user.isAdmin),
    adminCode: "",
  };
}

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: "", color: "transparent", width: "0%" },
    { label: "Weak", color: "#c0392b", width: "30%" },
    { label: "Fair", color: "#e67e22", width: "55%" },
    { label: "Good", color: "#2980b9", width: "75%" },
    { label: "Strong", color: "#27ae60", width: "100%" },
  ];

  return password.length > 0 ? levels[score] : levels[0];
}

function SignUpForm() {
  const navigate = useNavigate();
  const { registerUser, showToast, user } = useApp();
  const isEditing = Boolean(user);

  const [formData, setFormData] = useState(() => buildFormData(user));
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);

    if (errors[name]) {
      const fieldErrors = validate(updated);
      setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] || "" }));
    }
  }

  function handleBlur(e) {
    const { name } = e.target;
    const fieldErrors = validate(formData);
    setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] || "" }));
  }

  function handleInterestChange(e) {
    const { value, checked } = e.target;
    const updatedInterests = checked
      ? [...formData.interests, value]
      : formData.interests.filter((item) => item !== value);

    const updated = { ...formData, interests: updatedInterests };
    setFormData(updated);

    if (errors.interests) {
      const fieldErrors = validate(updated);
      setErrors((prev) => ({
        ...prev,
        interests: fieldErrors.interests || "",
      }));
    }
  }

  function handleTermsChange(e) {
    const updated = { ...formData, termsAccepted: e.target.checked };
    setFormData(updated);

    if (errors.termsAccepted) {
      const fieldErrors = validate(updated);
      setErrors((prev) => ({
        ...prev,
        termsAccepted: fieldErrors.termsAccepted || "",
      }));
    }
  }

  function handleAdminToggle(e) {
    setFormData((prev) => ({
      ...prev,
      isAdmin: e.target.checked,
      adminCode: e.target.checked ? prev.adminCode : "",
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    const newErrors = validate(formData);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    const nextPassword =
      formData.password || (user && user.password ? user.password : "");
    const isAdminAccount =
      formData.isAdmin && formData.adminCode.trim() === ADMIN_ACCESS_CODE;

    registerUser({
      fullName: formData.fullName,
      studentNumber: formData.studentNumber,
      campus: formData.campus,
      email: formData.email,
      password: nextPassword,
      interests: formData.interests,
      bio: formData.bio,
      isAdmin: isAdminAccount,
      role: isAdminAccount ? "admin" : "user",
    });

    showToast(
      isEditing
        ? "Profile updated successfully!"
        : "Profile created! Welcome to Richfield Connect.",
      "success",
    );

    navigate("/profile");
  }

  const fieldClass = (field) =>
    errors[field] ? `${styles.input} ${styles.inputError}` : styles.input;

  const strength = getPasswordStrength(formData.password);

  return (
    <div className={styles.signupPage}>
      <div className={styles.grid}>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <h1>
            {isEditing
              ? "Edit Your Profile"
              : "Create Your Richfield Connect Profile"}
          </h1>
          {!isEditing && (
            <p style={{ margin: "-0.5rem 0 1.25rem", color: "var(--richfield-mid-grey)" }}>
              Register to join the student community and access your profile.
            </p>
          )}

          <div className={styles.fieldGroup}>
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              className={fieldClass("fullName")}
            />
            {errors.fullName && (
              <span className={styles.errorMsg}>{errors.fullName}</span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="studentNumber">Student Number</label>
            <input
              id="studentNumber"
              name="studentNumber"
              type="text"
              inputMode="numeric"
              value={formData.studentNumber}
              onChange={handleChange}
              onBlur={handleBlur}
              className={fieldClass("studentNumber")}
            />
            {errors.studentNumber && (
              <span className={styles.errorMsg}>{errors.studentNumber}</span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="campus">Campus</label>
            <select
              id="campus"
              name="campus"
              value={formData.campus}
              onChange={handleChange}
              onBlur={handleBlur}
              className={fieldClass("campus")}
            >
              <option value="">-- Select a campus --</option>
              {campusOptions.map((campus) => (
                <option key={campus} value={campus}>
                  {campus}
                </option>
              ))}
            </select>
            {errors.campus && (
              <span className={styles.errorMsg}>{errors.campus}</span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={fieldClass("email")}
            />
            {errors.email && (
              <span className={styles.errorMsg}>{errors.email}</span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              className={fieldClass("password")}
            />
            {formData.password && (
              <div className={styles.passwordStrength}>
                <div className={styles.strengthBar}>
                  <div
                    className={styles.strengthFill}
                    style={{
                      width: strength.width,
                      backgroundColor: strength.color,
                    }}
                  ></div>
                </div>
                <span
                  className={styles.strengthText}
                  style={{ color: strength.color }}
                >
                  {strength.label}
                </span>
              </div>
            )}
            {errors.password && (
              <span className={styles.errorMsg}>{errors.password}</span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              className={fieldClass("confirmPassword")}
            />
            {errors.confirmPassword && (
              <span className={styles.errorMsg}>{errors.confirmPassword}</span>
            )}
          </div>

          <fieldset className={styles.fieldGroup}>
            <legend>Interests</legend>
            {interestOptions.map((interest) => (
              <label key={interest} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  value={interest}
                  checked={formData.interests.includes(interest)}
                  onChange={handleInterestChange}
                />
                {interest}
              </label>
            ))}
            {errors.interests && (
              <span className={styles.errorMsg}>{errors.interests}</span>
            )}
          </fieldset>

          <div className={styles.fieldGroup}>
            <label htmlFor="bio">Short Bio</label>
            <textarea
              id="bio"
              name="bio"
              rows="4"
              value={formData.bio}
              onChange={handleChange}
              onBlur={handleBlur}
              className={fieldClass("bio")}
            />
            <span className={styles.charCount}>
              {formData.bio.trim().length}/20 characters minimum
            </span>
            {errors.bio && (
              <span className={styles.errorMsg}>{errors.bio}</span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.termsAccepted}
                onChange={handleTermsChange}
              />
              I accept the Terms and Conditions
            </label>
            {errors.termsAccepted && (
              <span className={styles.errorMsg}>{errors.termsAccepted}</span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.isAdmin}
                onChange={handleAdminToggle}
              />
              Register as an admin
            </label>

            {formData.isAdmin && (
              <div className={styles.fieldGroup}>
                <label htmlFor="adminCode">Admin Access Code</label>
                <input
                  id="adminCode"
                  name="adminCode"
                  type="password"
                  value={formData.adminCode}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      adminCode: e.target.value,
                    }))
                  }
                  className={fieldClass("adminCode")}
                  placeholder="Enter admin code"
                />
                {errors.adminCode && (
                  <span className={styles.errorMsg}>{errors.adminCode}</span>
                )}
              </div>
            )}
          </div>

          <button type="submit" className={styles.submitButton}>
            {isEditing ? "Save Changes" : "Register"}
          </button>

          {!isEditing && (
            <p style={{ marginTop: "1rem", textAlign: "center", color: "var(--richfield-mid-grey)" }}>
              Already have an account? <Link to="/signin" style={{ color: "var(--richfield-blue)", fontWeight: 600 }}>Sign in</Link>
            </p>
          )}
        </form>

        <ProfilePreview
          fullName={formData.fullName}
          studentNumber={formData.studentNumber}
          campus={formData.campus}
          bio={formData.bio}
          interests={formData.interests}
        />
      </div>
    </div>
  );
}

export default SignUpForm;
