import React, { useEffect, useState } from "react";
import { nuiCall } from "../app/nui";
import type { Contact } from "../app/types";

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  async function refresh() {
    const data = await nuiCall<Contact[]>("prp-phone:getContacts");
    setContacts(data ?? []);
  }

  useEffect(() => {
    refresh().catch(() => {});
  }, []);

  async function add() {
    if (!name.trim() || !phone.trim()) return;
    await nuiCall("prp-phone:addContact", { name, phone_number: phone, notes: "" });
    setName(""); setPhone("");
    await refresh();
  }

  async function del(id: number) {
    await nuiCall("prp-phone:deleteContact", { id });
    await refresh();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <h3 style={{ margin: "4px 0" }}>Contacts</h3>

      <div style={card}>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={input} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input style={input} placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <button style={btn} onClick={add}>Add</button>
      </div>

      {contacts.map((c) => (
        <div key={c.id} style={card}>
          <div>
            <div style={{ fontSize: 14 }}>{c.name}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{c.phone_number}</div>
          </div>
          <button style={btn} onClick={() => del(c.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

const card: React.CSSProperties = {
  padding: 12,
  borderRadius: 18,
  border: "1px solid var(--border)",
  background: "rgba(255,255,255,0.05)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10
};

const input: React.CSSProperties = {
  flex: 1,
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "rgba(0,0,0,0.25)",
  color: "var(--text)",
  padding: "8px 10px"
};

const btn: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "rgba(255,255,255,0.06)",
  color: "var(--text)",
  padding: "8px 10px",
  cursor: "pointer"
};
