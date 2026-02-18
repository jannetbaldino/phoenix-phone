import React, { useEffect, useState } from "react";
import { nuiCall } from "../app/nui";

export default function Mail() {
  const [mail, setMail] = useState<any[]>([]);

  useEffect(() => {
    nuiCall<any[]>("prp-phone:getMail").then(setMail).catch(() => setMail([]));
  }, []);

  return (
    <div style={card}>
      <h3 style={{ margin: "4px 0 10px 0" }}>Mail</h3>
      {mail.length === 0 ? (
        <div style={{ color: "var(--muted)" }}>No mail yet (placeholder)</div>
      ) : (
        mail.map((m, idx) => <div key={idx}>{JSON.stringify(m)}</div>)
      )}
    </div>
  );
}

const card: React.CSSProperties = {
  padding: 12,
  borderRadius: 18,
  border: "1px solid var(--border)",
  background: "var(--surface)"
};
