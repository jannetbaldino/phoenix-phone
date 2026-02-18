import React, { useEffect, useMemo, useState } from "react";
import { usePhone } from "../app/state";
import { nuiCall } from "../app/nui";
import type { Thread } from "../app/types";

function Icon({
  label,
  onClick,
  badge,
}: {
  label: string;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button type="button" onClick={onClick} style={icon}>
      {badge !== undefined && badge > 0 ? (
        <div style={badgeStyle}>{badge > 99 ? "99+" : badge}</div>
      ) : null}
      <div style={{ fontSize: 12, color: "var(--text)" }}>{label}</div>
    </button>
  );
}

export default function Home() {
  const phone = usePhone();
  const [threads, setThreads] = useState<Thread[]>([]);

  useEffect(() => {
    nuiCall<Thread[]>("prp-phone:getThreads")
      .then((t) => setThreads(t ?? []))
      .catch(() => setThreads([]));
  }, [phone.tick]);

  const unreadTotal = useMemo(() => {
    return (threads ?? []).reduce((sum, t) => sum + (t.unread ?? 0), 0);
  }, [threads]);

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 650 }}>Phone</div>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>
          {phone.profile?.phone_number ?? "Loading..."}
        </div>
      </div>

      <div style={grid}>
        <Icon label="Settings" onClick={() => phone.push({ id: "settings" })} />
        <Icon
          label="Messages"
          badge={unreadTotal}
          onClick={() => phone.push({ id: "messages" })}
        />
        <Icon label="Contacts" onClick={() => phone.push({ id: "contacts" })} />
        <Icon label="Mail" onClick={() => phone.push({ id: "mail" })} />
        <Icon label="Banking" onClick={() => phone.push({ id: "banking" })} />
      </div>

      <div style={panel}>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>Tip</div>
        <div style={{ fontSize: 14 }}>
          Use <b>F1</b> to open/close. Notifications will “peek” when closed.
        </div>
      </div>
    </div>
  );
}

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 10,
};

const icon: React.CSSProperties = {
  position: "relative",
  height: 86,
  borderRadius: 18,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const badgeStyle: React.CSSProperties = {
  position: "absolute",
  top: 10,
  right: 10,
  minWidth: 18,
  height: 18,
  padding: "0 6px",
  borderRadius: 999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 11,
  fontWeight: 700,
  background: "rgba(120,160,255,0.95)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.25)",
};

const panel: React.CSSProperties = {
  marginTop: 12,
  padding: 12,
  borderRadius: 18,
  border: "1px solid var(--border)",
  background: "var(--surface)",
};
