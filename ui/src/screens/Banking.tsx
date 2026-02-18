import React, { useEffect, useState } from "react";
import { nuiCall } from "../app/nui";
import type { BankData } from "../app/types";

export default function Banking() {
  const [bank, setBank] = useState<BankData | null>(null);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState("");

  async function refresh() {
    const data = await nuiCall<BankData>("prp-phone:getBank");
    setBank(data);
  }

  useEffect(() => {
    refresh().catch(() => {});
  }, []);

  async function transfer() {
    if (!to.trim() || amount <= 0) return;
    await nuiCall("prp-phone:bankTransfer", { to_phone: to, amount, note });
    setTo(""); setAmount(0); setNote("");
    await refresh();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <h3 style={{ margin: "4px 0" }}>Banking</h3>

      <div style={card}>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>Balance</div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>${bank?.balance ?? 0}</div>
      </div>

      <div style={card}>
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>Transfer</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={input} placeholder="To phone #" value={to} onChange={(e) => setTo(e.target.value)} />
          <input
            style={input}
            placeholder="Amount"
            type="number"
            value={amount || ""}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </div>
        <input style={{ ...input, marginTop: 8 }} placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} />
        <button style={{ ...btn, marginTop: 8 }} onClick={transfer}>Send</button>
      </div>

      <div style={card}>
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>Transactions</div>
        {(bank?.transactions ?? []).length === 0 ? (
          <div style={{ color: "var(--muted)" }}>No transactions yet</div>
        ) : (
          (bank?.transactions ?? []).map((t) => (
            <div key={t.id} style={tx}>
              <div>
                <div style={{ fontSize: 14 }}>{t.kind}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{t.note ?? ""}</div>
              </div>
              <div style={{ fontWeight: 650 }}>{t.amount}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  padding: 12,
  borderRadius: 18,
  border: "1px solid var(--border)",
  background: "var(--surface)"
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

const tx: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 0",
  borderTop: "1px solid rgba(255,255,255,0.08)"
};
