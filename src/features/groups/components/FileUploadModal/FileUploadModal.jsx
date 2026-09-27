import { useEffect, useRef, useState } from "react";
import styles from "./FileUploadModal.module.css";

const WARN_BYTES = 1_500_000;
const REJECT_BYTES = 2_500_000;

function formatSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * File picker + drag-and-drop dialog. Reads the file with FileReader (same
 * pattern as CreatePost) and hands the parent a plain attachment object:
 * `{ type, name, size, mimeType, dataUrl }`. The parent decides whether to
 * `postMessage` or `uploadSharedFile` with it, so this modal never touches
 * group state itself.
 */
function FileUploadModal({ open, onClose, onConfirm }) {
  // Fresh mount per open (returns null while closed), so the dialog state
  // below always starts clean — no reset effect needed.
  if (!open) return null;
  return <FileUploadDialog onClose={onClose} onConfirm={onConfirm} />;
}

function FileUploadDialog({ onClose, onConfirm }) {
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    function handleKey(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function handleFile(file) {
    setError("");
    setWarning("");
    if (!file) return;
    if (file.size > REJECT_BYTES) {
      setError(
        `“${file.name}” is too large (${formatSize(file.size)}). ` +
          "Files above 2.5 MB cannot be saved in browser storage.",
      );
      return;
    }
    if (file.size > WARN_BYTES) {
      setWarning("Large files may fail to save in browser storage.");
    }
    setFileName(file.name);
    setFileSize(file.size);
    setReading(true);

    const reader = new FileReader();
    reader.onload = () => {
      setReading(false);
      onConfirm({
        type: file.type.startsWith("image/") ? "image" : "document",
        name: file.name,
        size: file.size,
        mimeType: file.type,
        dataUrl: reader.result,
      });
      onClose();
    };
    reader.onerror = () => {
      setReading(false);
      setError(`Could not read “${file.name}”. Please try another file.`);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-file-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id="upload-file-title">Attach a file</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div
          className={dragging ? `${styles.dropzone} ${styles.dragging}` : styles.dropzone}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            handleFile(event.dataTransfer.files?.[0]);
          }}
        >
          <p className={styles.dropText}>
            Drag & drop a file here, or pick one below.
          </p>
          <label className={styles.pickButton}>
            Choose file
            <input
              ref={fileRef}
              type="file"
              hidden
              onChange={(event) => {
                handleFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
        </div>

        {fileName ? (
          <p className={styles.fileInfo}>
            {fileName} ({formatSize(fileSize)})
            {reading ? " — reading…" : ""}
          </p>
        ) : null}
        {warning ? <p className={styles.warning}>{warning}</p> : null}
        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default FileUploadModal;
