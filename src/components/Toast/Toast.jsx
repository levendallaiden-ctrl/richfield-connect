import { useEffect, useState } from "react";
import { useApp } from "../../context/AppContext";
import styles from "./Toast.module.css";

const icons = { success: "✅", error: "❌", info: "ℹ️" };

function toastClass(type, leaving) {
  const typeClass =
    {
      success: styles.toastSuccess,
      error: styles.toastError,
      info: styles.toastInfo,
    }[type] || styles.toastInfo;

  return leaving
    ? `${styles.toast} ${typeClass} ${styles.leaving}`
    : `${styles.toast} ${typeClass}`;
}

function ToastMessage({ toast, clearToast }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const startLeave = setTimeout(() => setLeaving(true), 3200);
    const remove = setTimeout(() => clearToast(), 3600);

    return () => {
      clearTimeout(startLeave);
      clearTimeout(remove);
    };
  }, [toast, clearToast]);

  return (
    <div className={toastClass(toast.type, leaving)}>
      <span className={styles.icon}>{icons[toast.type] || icons.info}</span>
      <span className={styles.message}>{toast.message}</span>
    </div>
  );
}

function Toast() {
  const { toast, clearToast } = useApp();

  if (!toast) return null;

  return <ToastMessage key={toast.id} toast={toast} clearToast={clearToast} />;
}

export default Toast;
