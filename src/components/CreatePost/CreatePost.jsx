import { useState } from "react";
import { useApp } from "../../context/AppContext";
import styles from "./CreatePost.module.css";

function CreatePost() {
  const { addPost, showToast } = useApp();
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  function handleChange(e) {
    setContent(e.target.value);
    if (error && e.target.value.trim()) {
      setError("");
    }
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!content.trim()) {
      setError("Post cannot be empty.");
      return;
    }

    addPost(content.trim());
    setContent("");
    setError("");
    showToast("Post shared with the community!", "success");
  }

  return (
    <form onSubmit={handleSubmit} className={styles.createPost}>
      <textarea
        value={content}
        onChange={handleChange}
        placeholder="Share something with the Richfield community..."
        rows="3"
        className={
          error ? `${styles.textarea} ${styles.textareaError}` : styles.textarea
        }
      />
      {error && <span className={styles.errorMsg}>{error}</span>}
      <button type="submit" className={styles.postButton}>
        Post
      </button>
    </form>
  );
}

export default CreatePost;
