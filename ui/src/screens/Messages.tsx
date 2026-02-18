import React, { useEffect, useMemo, useRef, useState } from "react";
import { nuiCall } from "../app/nui";
import type { Thread, Message, Contact } from "../app/types";
import { usePhone } from "../app/state";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThumbtack } from "@fortawesome/free-solid-svg-icons";

type View = "inbox" | "new" | "chat";

function formatTime(ts: number) {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Today -> time, Yesterday -> "Yesterday time", <7 days -> weekday, else -> short date
function formatThreadLabel(ts: number) {
  if (!ts) return "";
  const d = new Date(ts * 1000);

  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startYesterday = new Date(startToday.getTime() - 24 * 60 * 60 * 1000);

  if (d >= startToday) {
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  if (d >= startYesterday) {
    const t = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return `Yesterday ${t}`;
  }

  const diffDays = Math.floor(
    (startToday.getTime() - d.getTime()) / (24 * 60 * 60 * 1000)
  );

  if (diffDays < 7) {
    return d.toLocaleDateString([], { weekday: "short" });
  }

  return d.toLocaleDateString([], {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
  });
}

export default function Messages() {
  const phone = usePhone();

  const [view, setView] = useState<View>("inbox");

  const [threads, setThreads] = useState<Thread[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const [active, setActive] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const [to, setTo] = useState("");
  const [body, setBody] = useState("");

  const [search, setSearch] = useState("");

  // -------------------------
  // Pins (stored locally for now)
  // -------------------------
  const [pinned, setPinned] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("phoenix_phone_pins");
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("phoenix_phone_pins", JSON.stringify(pinned));
    } catch {}
  }, [pinned]);

  function isPinnedNumber(num: string) {
    return pinned.includes(num);
  }

  function togglePin(num: string) {
    setPinned((prev) =>
      prev.includes(num) ? prev.filter((x) => x !== num) : [num, ...prev]
    );
  }

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const navTop = phone.nav[phone.nav.length - 1] as any;
  const notifThreadId = (navTop?.params?.thread_id as number | undefined) ?? undefined;

  const contactName = (num: string) => {
    const c = contacts.find((c) => c.phone_number === num);
    return c ? c.name : num;
  };

  const contactsFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;

    return contacts.filter((c) => {
      const name = (c.name ?? "").toLowerCase();
      const num = (c.phone_number ?? "").toLowerCase();
      return name.includes(q) || num.includes(q);
    });
  }, [contacts, search]);

  // Pinned + Recents, sorted by latest
  const pinnedThreads = useMemo(() => {
    return (threads ?? [])
      .filter((t) => isPinnedNumber(t.other_number))
      .sort((a, b) => (b.last_at ?? 0) - (a.last_at ?? 0));
  }, [threads, pinned]);

  const recentThreads = useMemo(() => {
    return (threads ?? [])
      .filter((t) => !isPinnedNumber(t.other_number))
      .sort((a, b) => (b.last_at ?? 0) - (a.last_at ?? 0));
  }, [threads, pinned]);

  async function refreshThreads() {
    const data = await nuiCall<Thread[]>("prp-phone:getThreads");
    setThreads(data ?? []);
    return data ?? [];
  }

  async function refreshContacts() {
    const data = await nuiCall<Contact[]>("prp-phone:getContacts");
    setContacts(data ?? []);
  }

  function scrollToBottom() {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }

  async function openThread(t: Thread) {
    setActive(t);
    setView("chat");

    const msgs = await nuiCall<Message[]>("prp-phone:getThreadMessages", {
      thread_id: t.id,
      limit: 50,
    });

    const ordered = (msgs ?? []).slice().reverse();
    setMessages(ordered);

    await refreshThreads();
    setTimeout(scrollToBottom, 0);
  }

  async function openOrCreateThread(otherNumber: string) {
    const other = (otherNumber ?? "").trim();
    if (!other) return;

    const created = await nuiCall<any>("prp-phone:getOrCreateThread", {
      other_number: other,
    });

    const list = await refreshThreads();
    const found =
      list.find((t) => t.id === created?.id) || (created as Thread | undefined);

    if (found && found.id) {
      await openThread(found as Thread);
    }
  }

  function goInbox() {
    setView("inbox");
    setActive(null);
    setMessages([]);
    setSearch("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function goNewConversation() {
    setView("new");
    setSearch("");
    setTimeout(() => searchRef.current?.focus(), 50);
  }

  async function sendFromCompose() {
    if (!to.trim() || !body.trim()) return;

    const toNum = to.trim();
    const msgBody = body.trim();

    await nuiCall("prp-phone:sendMessage", {
      to_number: toNum,
      body: msgBody,
    });

    setBody("");

    const list = await refreshThreads();
    const found = list.find((t) => t.other_number === toNum);
    if (found) {
      await openThread(found);
    }
  }

  async function sendInThread() {
    if (!active || !body.trim()) return;

    const msgBody = body.trim();

    await nuiCall("prp-phone:sendMessage", {
      to_number: active.other_number,
      body: msgBody,
    });

    setBody("");
    await openThread(active);
  }

  function onComposerKeyDown(
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    fn: () => void
  ) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      fn();
    }
  }

  // initial load + refresh on tick (new notifications)
  useEffect(() => {
    refreshThreads();
    refreshContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone.tick]);

  // auto-open when clicked from notification
  useEffect(() => {
    if (!notifThreadId) return;

    (async () => {
      const list = await refreshThreads();
      const found = list.find((t) => t.id === notifThreadId);
      if (!found) return;

      await openThread(found);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifThreadId]);

  // -------------------------
  // CHAT VIEW
  // -------------------------
  if (view === "chat" && active) {
    const headerName = contactName(active.other_number);

    return (
      <div style={screen}>
        <div style={chatHeader}>
          <button type="button" style={backBtn} onClick={goInbox}>
            ←
          </button>

          <div style={chatHeaderMain}>
            <div style={avatarCircle}>
              {headerName?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {headerName}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                {active.other_number}
              </div>
            </div>
          </div>
        </div>

        <div ref={scrollRef} style={chatBody}>
          {messages.map((m) => (
            <div key={m.id} style={row(m.direction)}>
              {m.direction === "in" ? <div style={miniAvatar} /> : <div />}
              <div style={bubble(m.direction)}>
                {m.body}
                <div style={timeStyle}>{formatTime(m.sent_at)}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={composerWrap}>
          <textarea
            style={composerInput}
            placeholder="Message..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => onComposerKeyDown(e, sendInThread)}
          />
          <button type="button" style={sendBtn} onClick={sendInThread}>
            Send
          </button>
        </div>
      </div>
    );
  }

  // -------------------------
  // NEW CONVERSATION VIEW
  // -------------------------
  if (view === "new") {
    return (
      <div style={screen}>
        <div style={chatHeader}>
          <button type="button" style={backBtn} onClick={goInbox}>
            ←
          </button>

          <div style={{ fontWeight: 850 }}>New conversation</div>
        </div>

        <div style={newMessageCard}>
          <input
            ref={searchRef}
            style={searchInput}
            placeholder="Search contacts"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div style={hintRow}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              Or type a number and tap Start
            </div>
            <button
              type="button"
              style={startBtn}
              onClick={() => openOrCreateThread(search.replace(/\s+/g, ""))}
            >
              Start
            </button>
          </div>
        </div>

        {/* PINNED */}
        <div style={threadsCard}>
          <div style={label}>Pinned</div>

          <div style={listScroll}>
            {pinnedThreads.length === 0 && (
              <div style={{ color: "var(--muted)" }}>No pinned conversations</div>
            )}

            {pinnedThreads.map((t) => (
              <button
                type="button"
                key={`pinned-${t.id}`}
                style={threadRow((t.unread ?? 0) > 0, false)}
                onClick={() => openThread(t)}
              >
                <div style={threadAvatar} />

                <div style={threadLeft}>
                  <div style={threadName}>{contactName(t.other_number)}</div>
                  <div style={threadSnippet}>{t.last_message ?? ""}</div>
                </div>

                <div style={threadRight}>
                  <div style={threadTime}>{formatThreadLabel(t.last_at)}</div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {(t.unread ?? 0) > 0 && <div style={unreadPill}>{t.unread}</div>}

                    <button
                      type="button"
                      style={pinBtn(true)}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        togglePin(t.other_number);
                      }}
                      title="Unpin"
                      aria-label="Unpin"
                    >
                      <FontAwesomeIcon icon={faThumbtack} />
                    </button>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RECENTS */}
        <div style={threadsCard}>
          <div style={label}>Recents</div>

          <div style={listScroll}>
            {recentThreads.length === 0 && (
              <div style={{ color: "var(--muted)" }}>No recent conversations</div>
            )}

            {recentThreads.map((t) => (
              <button
                type="button"
                key={`recent-${t.id}`}
                style={threadRow((t.unread ?? 0) > 0, false)}
                onClick={() => openThread(t)}
              >
                <div style={threadAvatar} />

                <div style={threadLeft}>
                  <div style={threadName}>{contactName(t.other_number)}</div>
                  <div style={threadSnippet}>{t.last_message ?? ""}</div>
                </div>

                <div style={threadRight}>
                  <div style={threadTime}>{formatThreadLabel(t.last_at)}</div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {(t.unread ?? 0) > 0 && <div style={unreadPill}>{t.unread}</div>}

                    <button
                      type="button"
                      style={pinBtn(false)}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        togglePin(t.other_number);
                      }}
                      title="Pin"
                      aria-label="Pin"
                    >
                      <FontAwesomeIcon icon={faThumbtack} />
                    </button>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CONTACTS */}
        <div style={threadsCard}>
          <div style={label}>Contacts</div>

          <div style={listScroll}>
            {contactsFiltered.length === 0 && (
              <div style={{ color: "var(--muted)" }}>No matching contacts</div>
            )}

            {contactsFiltered.map((c) => (
              <button
                type="button"
                key={`contact-${c.phone_number}`}
                style={contactRow}
                onClick={() => openOrCreateThread(c.phone_number)}
              >
                <div style={threadAvatar} />

                <div style={threadLeft}>
                  <div style={threadName}>{c.name}</div>
                  <div style={threadSnippet}>{c.phone_number}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------
  // INBOX VIEW
  // -------------------------
  return (
    <div style={screen}>
      <div style={inboxHeader}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Messages</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            {threads.length} conversation{threads.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      <div style={newMessageCard}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            ref={inputRef}
            style={toInput}
            placeholder="To (phone #)"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <button type="button" style={miniSendBtn} onClick={sendFromCompose}>
            Send
          </button>
        </div>

        <textarea
          style={miniTextarea}
          placeholder="Message..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => onComposerKeyDown(e, sendFromCompose)}
        />
      </div>

      <div style={threadsCard}>
        <div style={label}>Threads</div>

        <div style={listScroll}>
          {threads.length === 0 && (
            <div style={{ color: "var(--muted)" }}>No conversations</div>
          )}

          {threads.map((t) => (
            <button
              type="button"
              key={t.id}
              style={threadRow((t.unread ?? 0) > 0, false)}
              onClick={() => openThread(t)}
            >
              <div style={threadAvatar} />
              <div style={threadLeft}>
                <div style={threadName}>{contactName(t.other_number)}</div>
                <div style={threadSnippet}>{t.last_message ?? ""}</div>
              </div>

              <div style={threadRight}>
                <div style={threadTime}>{formatThreadLabel(t.last_at)}</div>
                {(t.unread ?? 0) > 0 && <div style={unreadPill}>{t.unread}</div>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* FAB */}
      <button
        type="button"
        style={fab}
        onClick={goNewConversation}
        aria-label="New message"
        title="New message"
      >
        +
      </button>
    </div>
  );
}

/* ------------------ styles ------------------ */

const screen: React.CSSProperties = {
  position: "relative",
  height: "100%",
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const label: React.CSSProperties = {
  fontSize: 13,
  color: "var(--muted)",
  marginBottom: 8,
};

const inboxHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const newMessageCard: React.CSSProperties = {
  padding: 12,
  borderRadius: 18,
  border: "1px solid var(--border)",
  background: "var(--surface)",
};

const toInput: React.CSSProperties = {
  flex: 1,
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "rgba(0,0,0,0.25)",
  color: "var(--text)",
  padding: "8px 10px",
};

const miniTextarea: React.CSSProperties = {
  marginTop: 8,
  width: "100%",
  minHeight: 58,
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "rgba(0,0,0,0.25)",
  color: "var(--text)",
  padding: "8px 10px",
  resize: "none",
};

const miniSendBtn: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "var(--accentA)",
  color: "white",
  padding: "8px 10px",
  cursor: "pointer",
  fontWeight: 800,
};

const threadsCard: React.CSSProperties = {
  padding: 12,
  borderRadius: 18,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  display: "flex",
  flexDirection: "column",
  flex: "1 1 auto",
  minHeight: 0,
};

const listScroll: React.CSSProperties = {
  overflowY: "auto",
  flex: "1 1 auto",
  minHeight: 0,
  paddingRight: 4,
  overscrollBehavior: "contain",
  WebkitOverflowScrolling: "touch",
};

const threadRow = (unread: boolean, active: boolean): React.CSSProperties => ({
  width: "100%",
  textAlign: "left",
  padding: "10px 10px",
  borderRadius: 18,
  border: active
    ? "1px solid rgba(255,255,255,0.20)"
    : unread
    ? "1px solid rgba(255,255,255,0.14)"
    : "1px solid rgba(255,255,255,0.10)",
  background: active
    ? "var(--accentA)"
    : unread
    ? "var(--accentA)"
    : "rgba(255,255,255,0.04)",
  color: "var(--text)",
  marginBottom: 8,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
});

const contactRow: React.CSSProperties = {
  width: "100%",
  textAlign: "left",
  padding: "10px 10px",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
  color: "var(--text)",
  marginBottom: 8,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const threadAvatar: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.25)",
  flex: "0 0 auto",
};

const threadLeft: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  flex: "1 1 auto",
};

const threadName: React.CSSProperties = {
  fontWeight: 800,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const threadSnippet: React.CSSProperties = {
  fontSize: 12,
  color: "var(--muted)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  marginTop: 2,
};

const threadRight: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: 6,
  flex: "0 0 auto",
};

const threadTime: React.CSSProperties = {
  fontSize: 11,
  color: "var(--muted)",
};

const unreadPill: React.CSSProperties = {
  background: "var(--accent)",
  borderRadius: 999,
  padding: "2px 8px",
  fontSize: 11,
  fontWeight: 900,
  color: "white",
  border: "1px solid rgba(255,255,255,0.18)",
};

const fab: React.CSSProperties = {
  position: "absolute",
  right: 18,
  bottom: 18,
  width: 54,
  height: 54,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "var(--accent)",
  color: "white",
  fontSize: 28,
  lineHeight: "54px",
  cursor: "pointer",
  boxShadow: "0 16px 36px rgba(0,0,0,0.35)",
};

const chatHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "2px 0",
};

const backBtn: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "rgba(255,255,255,0.06)",
  color: "var(--text)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const chatHeaderMain: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  minWidth: 0,
};

const avatarCircle: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "var(--accentA)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 900,
  fontSize: 12,
  color: "white",
};

const chatBody: React.CSSProperties = {
  flex: "1 1 auto",
  minHeight: 0,
  overflowY: "auto",
  paddingRight: 4,
  overscrollBehavior: "contain",
  WebkitOverflowScrolling: "touch",
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const composerWrap: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "flex-end",
  paddingTop: 6,
};

const composerInput: React.CSSProperties = {
  flex: 1,
  borderRadius: 14,
  border: "1px solid var(--border)",
  background: "rgba(0,0,0,0.25)",
  color: "var(--text)",
  padding: "10px 10px",
  minHeight: 42,
  maxHeight: 110,
  resize: "none",
};

const sendBtn: React.CSSProperties = {
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "var(--accentA)",
  color: "white",
  padding: "10px 12px",
  cursor: "pointer",
  height: 42,
  fontWeight: 900,
};

const row = (dir: "in" | "out"): React.CSSProperties => ({
  display: "flex",
  alignItems: "flex-end",
  justifyContent: dir === "out" ? "flex-end" : "flex-start",
  gap: 8,
});

const miniAvatar: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.25)",
  flex: "0 0 auto",
};

const bubble = (dir: "in" | "out"): React.CSSProperties => ({
  maxWidth: "78%",
  padding: "10px 12px",
  borderRadius: 18,
  background: dir === "out" ? "var(--accentA)" : "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  position: "relative",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
  color: "white",
});

const timeStyle: React.CSSProperties = {
  fontSize: 10,
  color: "rgba(255,255,255,0.65)",
  marginTop: 4,
  textAlign: "right",
};

const searchInput: React.CSSProperties = {
  width: "100%",
  borderRadius: 14,
  border: "1px solid var(--border)",
  background: "rgba(0,0,0,0.25)",
  color: "var(--text)",
  padding: "10px 10px",
};

const hintRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: 10,
  gap: 10,
};

const startBtn: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "var(--accentA)",
  color: "white",
  padding: "8px 10px",
  cursor: "pointer",
  fontWeight: 900,
};

const pinBtn = (active: boolean): React.CSSProperties => ({
  width: 28,
  height: 24,
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.14)",
  background: active ? "var(--accentA)" : "rgba(255,255,255,0.06)",
  color: "white",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
  transform: active ? "rotate(-25deg)" : "none",
});
