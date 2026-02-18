import React, { useEffect, useMemo, useState } from "react";
import { usePhone } from "../app/state";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faHouse,
  faXmark,
  faSignal,
} from "@fortawesome/free-solid-svg-icons";

export default function TopBar() {
  const phone = usePhone();
  const [open, setOpen] = useState(false);

  // ---- time (updates every 10s, not constantly) ----
  const [clock, setClock] = useState(() => formatClock(new Date()));

  useEffect(() => {
    const t = window.setInterval(() => {
      // If you later want "true in-game time", swap this to a nuiCall that returns hours/minutes.
      setClock(formatClock(new Date()));
    }, 10_000);

    return () => window.clearInterval(t);
  }, []);

  const current = phone.nav[phone.nav.length - 1];

  const notifCount = phone.notifications?.length ?? 0;

  const title = useMemo(() => {
    if (current.id === "home") return "Phoenix";
    const s = String(current.id);
    return s.charAt(0).toUpperCase() + s.slice(1);
  }, [current.id]);

  function goHome() {
    setOpen(false);
    phone.resetHome();
  }

  function togglePanel() {
    setOpen((v) => !v);
  }

  function openFromNotif(n: any) {
    setOpen(false);

    const app = String(n?.app ?? "").toLowerCase();

    if (app === "messages") {
      if (n?.thread_id) phone.openApp("messages", { thread_id: n.thread_id });
      else phone.openApp("messages");
      return;
    }

    if (app === "settings") return phone.openApp("settings");
    if (app === "contacts") return phone.openApp("contacts");
    if (app === "banking") return phone.openApp("banking");
    if (app === "mail") return phone.openApp("mail");

    phone.resetHome();
  }

  return (
    <div style={bar}>
      {/* LEFT: Home */}
      <button
        type="button"
        style={iconBtn}
        onClick={goHome}
        title="Home"
        aria-label="Home"
      >
        <FontAwesomeIcon icon={faHouse} />
      </button>

      {/* CENTER: Title + time */}
      <div style={center}>
        <div style={titleStyle}>{title}</div>
        <div style={subStyle}>{clock}</div>
      </div>

      {/* RIGHT: signal + bell */}
      <div style={right}>
        <div style={signalWrap} title="Signal">
          {/* If faSignal doesn't exist in your FA build, replace this with <SignalBars /> below */}
          <FontAwesomeIcon icon={faSignal} />
        </div>

        <div style={{ position: "relative" }}>
          <button
            type="button"
            style={iconBtn}
            onClick={togglePanel}
            title="Notifications"
            aria-label="Notifications"
          >
            <FontAwesomeIcon icon={faBell} />
            {notifCount > 0 && (
              <div style={badge}>{notifCount > 99 ? "99+" : notifCount}</div>
            )}
          </button>

          {open && (
            <div style={panelWrap}>
              <div style={panelHeader}>
                <div style={{ fontWeight: 900, fontSize: 13 }}>
                  Notifications
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    style={clearBtn(notifCount === 0)}
                    onClick={() => phone.clearNotifications()}
                    disabled={notifCount === 0}
                    title="Clear all"
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    style={closeBtn}
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                    title="Close"
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </div>
              </div>

              <div style={panelList}>
                {notifCount === 0 ? (
                  <div style={emptyState}>No notifications yet</div>
                ) : (
                  phone.notifications.map((n) => (
                    <div key={n.id} style={notifRow}>
                      {/* main clickable area */}
                      <button
                        type="button"
                        style={notifMainBtn}
                        onClick={() => openFromNotif(n)}
                        title="Open"
                      >
                        <div style={notifTitle}>{n.title || "Notification"}</div>
                        <div style={notifBody}>{n.body || ""}</div>
                        <div style={notifMeta}>
                          {formatAgo(n.createdAt)} {n.app ? `• ${n.app}` : ""}
                        </div>
                      </button>

                      {/* dismiss */}
                      <button
                        type="button"
                        style={miniX}
                        onClick={() => phone.removeNotification(n.id)}
                        aria-label="Dismiss"
                        title="Dismiss"
                      >
                        <FontAwesomeIcon icon={faXmark} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatClock(d: Date) {
  // nice, stable HH:MM (12-hour)
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatAgo(ms: number) {
  const diff = Math.max(0, Date.now() - (ms || 0));
  const s = Math.floor(diff / 1000);
  if (s < 10) return "Just now";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h`;
}

/* ---------------- styles ---------------- */

const bar: React.CSSProperties = {
  height: 44,
  minHeight: 44,
  maxHeight: 44,
  padding: "0 10px",
  display: "flex",
  alignItems: "center",
  gap: 10,
  borderBottom: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.20)",
  flex: "0 0 auto", // lock size, prevents weird shifts
};

const center: React.CSSProperties = {
  flex: "1 1 auto",
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
};

const titleStyle: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 13,
  letterSpacing: 0.2,
  color: "var(--text)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const subStyle: React.CSSProperties = {
  marginTop: 2,
  fontSize: 11,
  fontWeight: 800,
  color: "var(--muted)",
};

const right: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const signalWrap: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  opacity: 0.95,
};

const iconBtn: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
};

const badge: React.CSSProperties = {
  position: "absolute",
  top: -6,
  right: -6,
  minWidth: 18,
  height: 18,
  padding: "0 6px",
  borderRadius: 999,
  background: "var(--accent)",
  border: "1px solid rgba(255,255,255,0.18)",
  color: "white",
  fontSize: 10,
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const panelWrap: React.CSSProperties = {
  position: "absolute",
  right: 0,
  top: 40,
  width: 280,
  maxHeight: 340,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(10,10,14,0.92)",
  boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
  overflow: "hidden",
  zIndex: 50,
};

const panelHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 10px",
  borderBottom: "1px solid rgba(255,255,255,0.10)",
};

const clearBtn = (disabled: boolean): React.CSSProperties => ({
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  padding: "6px 10px",
  fontWeight: 800,
  fontSize: 12,
  cursor: disabled ? "default" : "pointer",
  opacity: disabled ? 0.45 : 1,
});

const closeBtn: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const panelList: React.CSSProperties = {
  overflowY: "auto",
  maxHeight: 340 - 48,
  padding: 8,
  WebkitOverflowScrolling: "touch",
};

const emptyState: React.CSSProperties = {
  color: "var(--muted)",
  fontSize: 12,
  padding: 10,
};

const notifRow: React.CSSProperties = {
  width: "100%",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  color: "white",
  padding: 8,
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  marginBottom: 8,
};

const notifMainBtn: React.CSSProperties = {
  flex: "1 1 auto",
  minWidth: 0,
  textAlign: "left",
  background: "transparent",
  border: "none",
  color: "inherit",
  cursor: "pointer",
  padding: 2,
};

const notifTitle: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 12,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const notifBody: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.9,
  marginTop: 2,
  overflow: "hidden",
  display: "-webkit-box",
  WebkitLineClamp: 2 as any,
  WebkitBoxOrient: "vertical" as any,
};

const notifMeta: React.CSSProperties = {
  fontSize: 10,
  opacity: 0.6,
  marginTop: 6,
};

const miniX: React.CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
};
