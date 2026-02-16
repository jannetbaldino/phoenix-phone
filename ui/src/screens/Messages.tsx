import React, { useEffect, useState } from "react";
import { nuiCall } from "../app/nui";
import type { Thread, Message } from "../app/types";

export default function Messages() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [active, setActive] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [to, setTo] = useState("");
  const [body, setBody] = useState("");

  async function refreshThreads() {
    const data = await nuiCall<Thread[]>("prp-phone:getThreads");
    setThreads(data ?? []);
  }

  async function openThread(t: Thread) {
    setActive(t);
    const msgs = await nuiCall<Message[]>("prp-phone:getThreadMessages", { thread_id: t.id, limit: 50 });
    setMessages((msgs ?? []).slice().reverse());
  }

  useEffect(() => {
    refreshThreads().catch(() => {});
  }, []);

  async function send() {
    if (!to.trim() || !body.trim()) return;
    await nuiCall("prp-phone:sendMessage", { to_number: to, body });
    setBody("");
    await refreshThreads();
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
      <h3 style={{ margin: "4px 0" }}>Messages</h3>

      <div style={card}>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={input} placeholder="To (phone #)" value={to} onChange={(e) => setTo(e.target.value)} />
          <button style={btn} onClick={send}>Send</button>
        </div>
        <textarea style={textarea} placeholder="Message..." value={body} onChange={(e) => setBody(e.target.value)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
        <div style={card}>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>Threads</div>
          {threads.length === 0 ? (
            <div style={{ color: "var(--muted)" }}>No messages yet</div>
          ) : (
            threads.map((t) => (
              <button key={t.id} style={threadBtn(active?.id === t.id)} onClick={() => openThread(t)}>
                <div style={{ fontSize: 14 }}>{t.other_number}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{t.last_message ?? ""}</div>
              </button>
            ))
          )}
        </div>

        {active ? (
          <div style={card}>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>
              Conversation: {active.other_number}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflow: "auto" }}>
              {messages.map((m) => (
                <div key={m.id} style={bubble(m.direction)}>
                  {m.body}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  padding: 12,
  borderRadius: 18,
  border: "1px solid var(--border)",
  background: "rgba(255,255,255,0.05)"
};

const input: React.CSSProperties = {
  flex: 1,
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "rgba(0,0,0,0.25)",
  color: "var(--text)",
  padding: "8px 10px"
};

const textarea: React.CSSProperties = {
  marginTop: 8,
  width: "100%",
  minHeight: 70,
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "rgba(0,0,0,0.25)",
  color: "var(--text)",
  padding: "8px 10px",
  resize: "none"
};

const btn: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "rgba(255,255,255,0.06)",
  color: "var(--text)",
  padding: "8px 10px",
  cursor: "pointer"
};

const threadBtn = (active: boolean): React.CSSProperties => ({
  width: "100%",
  textAlign: "left",
  padding: "10px 10px",
  borderRadius: 14,
  border: "1px solid var(--border)",
  background: active ? "rgba(120,160,255,0.14)" : "rgba(255,255,255,0.04)",
  color: "var(--text)",
  cursor: "pointer",
  marginBottom: 8
});

const bubble = (dir: "in" | "out"): React.CSSProperties => ({
  alignSelf: dir === "out" ? "flex-end" : "flex-start",
  maxWidth: "80%",
  padding: "8px 10px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: dir === "out" ? "rgba(120,160,255,0.18)" : "rgba(0,0,0,0.25)"
});
