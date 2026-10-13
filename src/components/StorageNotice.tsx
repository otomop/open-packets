import { useStorageStatus } from "@/lib/store";

/** Isolated subscription: pending saves must not re-render the page being studied. */
export default function StorageNotice() {
  const status = useStorageStatus();
  if (status.state !== "error") return null;
  return <div className="notice" role="alert">{status.message} <a href="#/settings">Open progress settings</a></div>;
}
