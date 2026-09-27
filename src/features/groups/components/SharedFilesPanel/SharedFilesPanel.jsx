import { useMemo, useState } from "react";
import { useGroups, useGroupPermissions } from "../../GroupsContext";
import FileUploadModal from "../FileUploadModal/FileUploadModal";
import styles from "./SharedFilesPanel.module.css";

function formatSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatWhen(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

/**
 * Files tab: newest-first list of everything shared in the group, including
 * attachments posted via the discussion tab (`postMessage` mirrors those
 * into `sharedFiles` with a `messageId`). Delete buttons render for the
 * uploader and for admins, but `deleteSharedFile` makes the final call.
 */
function SharedFilesPanel({ groupId }) {
  const { sharedFiles, uploadSharedFile, deleteSharedFile, user } = useGroups();
  const { canUpload, isGroupAdmin, isPlatformAdmin } =
    useGroupPermissions(groupId);
  const [uploadOpen, setUploadOpen] = useState(false);

  const files = useMemo(
    () =>
      sharedFiles
        .filter((file) => file.groupId === groupId)
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [sharedFiles, groupId],
  );

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <p className={styles.count}>
          {files.length === 0
            ? "No files"
            : `${files.length} ${files.length === 1 ? "file" : "files"}`}
        </p>
        {canUpload ? (
          <button
            type="button"
            className={styles.uploadButton}
            onClick={() => setUploadOpen(true)}
          >
            Upload file
          </button>
        ) : null}
      </div>

      {files.length === 0 ? (
        <p className={styles.empty}>No shared files yet.</p>
      ) : (
        <ul className={styles.list}>
          {files.map((file) => {
            const own = user && file.uploadedBy === user.email;
            const canDelete = own || isGroupAdmin || isPlatformAdmin;
            return (
              <li key={file.id} className={styles.item}>
                <div className={styles.info}>
                  <a
                    className={styles.name}
                    href={file.dataUrl}
                    download={file.name}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {file.type === "image" ? "🖼️ " : "📎 "}
                    {file.name}
                  </a>
                  <span className={styles.meta}>
                    {formatSize(file.size)} · {file.uploadedBy} ·{" "}
                    {formatWhen(file.createdAt)}
                  </span>
                </div>
                {canDelete ? (
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() => {
                      if (window.confirm(`Delete “${file.name}”?`)) {
                        deleteSharedFile(file.id);
                      }
                    }}
                  >
                    Delete
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <FileUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onConfirm={(attachment) => uploadSharedFile(groupId, attachment)}
      />
    </div>
  );
}

export default SharedFilesPanel;
