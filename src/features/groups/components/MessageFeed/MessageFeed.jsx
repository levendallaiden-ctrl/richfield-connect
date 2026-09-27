import { useMemo, useState } from "react";
import { useGroups, useGroupPermissions } from "../../GroupsContext";
import FileUploadModal from "../FileUploadModal/FileUploadModal";
import styles from "./MessageFeed.module.css";

function formatWhen(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

/**
 * Discussion tab: newest-first message list plus a composer. Delete buttons
 * render for the author's own messages and for admins, but `deleteMessage`
 * in the context layer makes the final call.
 */
function MessageFeed({ groupId }) {
  const { messages, postMessage, deleteMessage } = useGroups();
  const { canPost, isGroupAdmin, isPlatformAdmin } =
    useGroupPermissions(groupId);
  const [content, setContent] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const feed = useMemo(
    () =>
      messages
        .filter((message) => message.groupId === groupId)
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [messages, groupId],
  );

  function handleSubmit(event) {
    event.preventDefault();
    if (!content.trim() && !attachment) return;
    const ok = postMessage(groupId, content.trim(), attachment);
    if (ok) {
      setContent("");
      setAttachment(null);
    }
  }

  return (
    <div className={styles.feed}>
      <form onSubmit={handleSubmit} className={styles.composer}>
        <textarea
          className={styles.textarea}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={
            canPost
              ? "Share an update with the group…"
              : "Only members can post here."
          }
          rows={3}
          disabled={!canPost}
        />
        {attachment ? (
          <div className={styles.attachmentPreview}>
            <span>
              📎 {attachment.name}
            </span>
            <button
              type="button"
              className={styles.removeAttachment}
              onClick={() => setAttachment(null)}
              aria-label={`Remove ${attachment.name}`}
            >
              ×
            </button>
          </div>
        ) : null}
        <div className={styles.composerActions}>
          <button
            type="button"
            className={styles.attachButton}
            onClick={() => setUploadOpen(true)}
            disabled={!canPost}
          >
            Attach
          </button>
          <button
            type="submit"
            className={styles.postButton}
            disabled={!canPost || (!content.trim() && !attachment)}
          >
            Post
          </button>
        </div>
      </form>

      {feed.length === 0 ? (
        <p className={styles.empty}>No messages yet. Start the discussion.</p>
      ) : (
        <ul className={styles.list}>
          {feed.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              canDeleteAny={isGroupAdmin || isPlatformAdmin}
              onDelete={() => deleteMessage(message.id)}
            />
          ))}
        </ul>
      )}

      <FileUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onConfirm={setAttachment}
      />
    </div>
  );
}

function MessageItem({ message, canDeleteAny, onDelete }) {
  const { user } = useGroups();
  const own = user && message.authorEmail === user.email;

  return (
    <li className={styles.item}>
      <div className={styles.itemHeader}>
        <span className={styles.author}>{message.authorName}</span>
        <span className={styles.when}>{formatWhen(message.createdAt)}</span>
      </div>
      {message.content ? (
        <p className={styles.content}>{message.content}</p>
      ) : null}
      {message.attachment ? (
        <div className={styles.attachment}>
          {message.attachment.type === "image" ? (
            <a
              href={message.attachment.dataUrl}
              target="_blank"
              rel="noreferrer"
            >
              <img
                className={styles.image}
                src={message.attachment.dataUrl}
                alt={message.attachment.name}
              />
            </a>
          ) : (
            <a
              className={styles.fileLink}
              href={message.attachment.dataUrl}
              download={message.attachment.name}
              target="_blank"
              rel="noreferrer"
            >
              📎 {message.attachment.name}
            </a>
          )}
        </div>
      ) : null}
      {own || canDeleteAny ? (
        <div className={styles.itemActions}>
          <button
            type="button"
            className={styles.deleteButton}
            onClick={() => {
              if (window.confirm("Delete this message?")) onDelete();
            }}
          >
            Delete
          </button>
        </div>
      ) : null}
    </li>
  );
}

export default MessageFeed;
