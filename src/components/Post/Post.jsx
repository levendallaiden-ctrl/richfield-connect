import { useState } from "react";
import { useApp } from "../../context/AppContext";
import styles from "./Post.module.css";

function Post({ post }) {
  const { user, toggleLike, deletePost, addComment, deleteComment, showToast } =
    useApp();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");

  // Same fallback as in addComment — protects against posts saved before
  // this feature existed, which have no comments array in localStorage.
  const comments = post.comments || [];
  const isAdmin = user && (user.role === "admin" || user.isAdmin);
  const canDeletePost = Boolean(
    user && (isAdmin || post.username === user.fullName),
  );

  function handleDelete() {
    if (!canDeletePost) {
      showToast("Only the post owner or an admin can delete this post.", "error");
      return;
    }

    const confirmed = window.confirm(
      "Delete this post? This cannot be undone.",
    );
    if (confirmed) {
      deletePost(post.id);
    }
  }

  function handleCommentSubmit(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(post.id, commentText.trim());
    setCommentText("");
  }

  function handleCommentDelete(commentId) {
    const confirmed = window.confirm("Delete this comment?");
    if (confirmed) {
      deleteComment(post.id, commentId);
    }
  }

  return (
    <div className={styles.post}>
      <div className={styles.header}>
        <span className={styles.username}>{post.username}</span>
        <span className={styles.timestamp}>{post.timestamp}</span>
      </div>

      <p className={styles.content}>{post.content}</p>

      {post.attachment?.type === "image" && (
        <img
          className={styles.postImage}
          src={post.attachment.dataUrl}
          alt={post.attachment.name}
        />
      )}

      {post.attachment?.type === "file" && (
        <a
          className={styles.fileAttachment}
          href={post.attachment.dataUrl}
          download={post.attachment.name}
        >
          📎 {post.attachment.name}
        </a>
      )}

      <div className={styles.actions}>
        <button
          onClick={() => toggleLike(post.id)}
          className={
            post.liked
              ? `${styles.likeButton} ${styles.liked}`
              : styles.likeButton
          }
        >
          {post.liked ? "♥" : "♡"} {post.likes}
        </button>

        <button
          onClick={() => setCommentsOpen((prev) => !prev)}
          className={styles.commentToggle}
        >
          💬 {comments.length} comment{comments.length !== 1 ? "s" : ""}
        </button>

        {canDeletePost && (
          <button onClick={handleDelete} className={styles.deleteButton}>
            Delete
          </button>
        )}
      </div>

      {/* Same CSS-only accordion trick as Profile's collapsible sections,
          duplicated here rather than shared — worth extracting into one
          reusable component if a third place ever needs this pattern. */}
      <div
        className={
          commentsOpen
            ? styles.commentsSection
            : `${styles.commentsSection} ${styles.collapsed}`
        }
      >
        <div className={styles.commentsInner}>
          {comments.length > 0 && (
            <ul className={styles.commentList}>
              {comments.map((comment) => {
                const isOwnComment = user && comment.username === user.fullName;
                const canDeleteComment = Boolean(isAdmin || isOwnComment);

                return (
                  <li key={comment.id} className={styles.comment}>
                    <div className={styles.commentMain}>
                      <span className={styles.commentUsername}>
                        {comment.username}
                      </span>
                      <span className={styles.commentText}>{comment.content}</span>
                    </div>

                    <div className={styles.commentMetaRow}>
                      <span className={styles.commentTimestamp}>
                        {comment.timestamp}
                      </span>

                      {canDeleteComment && (
                        <button
                          type="button"
                          className={styles.commentDelete}
                          onClick={() => handleCommentDelete(comment.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <form onSubmit={handleCommentSubmit} className={styles.commentForm}>
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className={styles.commentInput}
            />
            <button type="submit" className={styles.commentSubmit}>
              Reply
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Post;
