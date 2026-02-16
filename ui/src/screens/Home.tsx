import React from "react";
import { usePhone } from "../app/state";

function Icon({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={icon}>
      <div style={{ fontSize: 12, color: "var(--text)" }}>{label}</div>
    </button>
  );
}

export default function Home() {
  const phone = usePhone();

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
        <Icon label="Messages" onClick={() => phone.push({ id: "messages" })} />
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
  gap: 10
};

const icon: React.CSSProperties = {
  height: 86,
  borderRadius: 18,
  border: "1px solid var(--border)",
  background: "rgba(255,255,255,0.06)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};

const panel: React.CSSProperties = {
  marginTop: 12,
  padding: 12,
  borderRadius: 18,
  border: "1px solid var(--border)",
  background: "rgba(255,255,255,0.05)"
};
