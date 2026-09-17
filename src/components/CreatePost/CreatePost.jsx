import { useState } from "react";
import { useApp } from "../../context/AppContext";
import styles from "./CreatePost.module.css";

function CreatePost() {
  const { addPost, showToast } = useApp();
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [attachment, setAttachment] = useState(null);

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

    addPost(content.trim(), attachment);
    setContent("");
    setAttachment(null);
    setError("");
    showToast("Post shared with the community!", "success");
  }

  function handleFileChange(e, type) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        type,
        name: file.name,
        size: file.size,
        mimeType: file.type,
        dataUrl: reader.result,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
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
      {attachment && (
        <div className={styles.attachmentPreview}>
          {attachment.type === "image" ? (
            <img src={attachment.dataUrl} alt={attachment.name} />
          ) : (
            <span>📎 {attachment.name}</span>
          )}
          <button
            type="button"
            className={styles.removeAttachment}
            onClick={() => setAttachment(null)}
            aria-label={`Remove ${attachment.name}`}
          >
            ×
          </button>
        </div>
      )}
      {error && <span className={styles.errorMsg}>{error}</span>}
      <div className={styles.attachmentActions}>
        <label className={styles.attachmentButton}>
          📷 Photo
          <input
            type="file"
            accept="image/*"
            onChange={(event) => handleFileChange(event, "image")}
          />
        </label>
        <label className={styles.attachmentButton}>
          📎 File
          <input
            type="file"
            onChange={(event) => handleFileChange(event, "file")}
          />
        </label>
        <button type="submit" className={styles.postButton}>
          Post
        </button>
      </div>
    </form>
  );
}

export default CreatePost;
