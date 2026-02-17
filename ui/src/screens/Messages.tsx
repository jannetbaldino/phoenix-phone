import React, { useEffect, useRef, useState } from "react";
import { nuiCall } from "../app/nui";
import type { Thread, Message, Contact } from "../app/types";

function formatTime(ts: number) {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Messages() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [active, setActive] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [to, setTo] = useState("");
  const [body, setBody] = useState("");

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const contactName = (num: string) => {
    const c = contacts.find(c => c.phone_number === num);
    return c ? c.name : num;
  };

  async function refreshThreads() {
    const data = await nuiCall<Thread[]>("prp-phone:getThreads");
    setThreads(data ?? []);
  }

  async function refreshContacts() {
    const data = await nuiCall<Contact[]>("prp-phone:getContacts");
    setContacts(data ?? []);
  }

  async function openThread(t: Thread) {
    setActive(t);
    const msgs = await nuiCall<Message[]>("prp-phone:getThreadMessages", {
      thread_id: t.id,
      limit: 50
    });
    const ordered = (msgs ?? []).slice().reverse();
    setMessages(ordered);

    setTimeout(() => {
      scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
    }, 50);

    await refreshThreads();
  }

  useEffect(() => {
    refreshThreads();
    refreshContacts();
  }, []);

  async function send() {
    if (!to.trim() || !body.trim()) return;

    await nuiCall("prp-phone:sendMessage", {
      to_number: to,
      body
    });

    setBody("");

    await refreshThreads();

    if (active) {
      await openThread(active);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <h3 style={{ margin: "4px 0" }}>Messages</h3>

      <div style={card}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            style={input}
            placeholder="To (phone #)"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <button style={btn} onClick={send}>Send</button>
        </div>

        <textarea
          style={textarea}
          placeholder="Message..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <div style={card}>
          <div style={label}>Threads</div>

          {threads.length === 0 && (
            <div style={{ color: "var(--muted)" }}>No conversations</div>
          )}

          {threads.map(t => (
            <button
              key={t.id}
              style={threadBtn(active?.id === t.id, (t.unread ?? 0) > 0)}
              onClick={() => openThread(t)}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>{contactName(t.other_number)}</div>
                {t.unread > 0 && (
                  <div style={unreadBadge}>{t.unread}</div>
                )}
              </div>

              <div style={threadPreview}>
                {t.last_message ?? ""}
              </div>
            </button>
          ))}
        </div>

        {active && (
          <div style={card}>
            <div style={label}>
              {contactName(active.other_number)}
            </div>

            <div ref={scrollRef} style={messagesWrap}>
              {messages.map(m => (
                <div key={m.id} style={bubbleWrap(m.direction)}>
                  <div style={bubble(m.direction)}>
                    {m.body}
                    <div style={timeStyle}>
                      {formatTime(m.sent_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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

const label: React.CSSProperties = {
  fontSize: 13,
  color: "var(--muted)",
  marginBottom: 8
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

const threadBtn = (active: boolean, unread: boolean): React.CSSProperties => ({
  width: "100%",
  textAlign: "left",
  padding: 10,
  borderRadius: 14,
  border: unread ? "1px solid rgba(120,160,255,0.55)" : "1px solid var(--border)",
  background: active
    ? "rgba(120,160,255,0.15)"
    : unread
      ? "rgba(120,160,255,0.08)"
      : "rgba(255,255,255,0.04)",
  color: "var(--text)",
  marginBottom: 8,
  cursor: "pointer"
});

const threadPreview: React.CSSProperties = {
  fontSize: 12,
  color: "var(--muted)",
  marginTop: 2
};

const unreadBadge: React.CSSProperties = {
  background: "#4f8cff",
  borderRadius: 12,
  padding: "2px 6px",
  fontSize: 11,
  fontWeight: 600
};

const messagesWrap: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  maxHeight: 260,
  overflowY: "auto"
};

const bubbleWrap = (dir: "in" | "out"): React.CSSProperties => ({
  display: "flex",
  justifyContent: dir === "out" ? "flex-end" : "flex-start"
});

const bubble = (dir: "in" | "out"): React.CSSProperties => ({
  maxWidth: "75%",
  padding: "8px 10px",
  borderRadius: 14,
  background: dir === "out"
    ? "rgba(120,160,255,0.2)"
    : "rgba(0,0,0,0.3)",
  border: "1px solid rgba(255,255,255,0.1)",
  position: "relative"
});

const timeStyle: React.CSSProperties = {
  fontSize: 10,
  color: "var(--muted)",
  marginTop: 2,
  textAlign: "right"
};
