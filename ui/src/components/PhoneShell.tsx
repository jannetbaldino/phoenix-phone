import React, { useMemo } from "react";
import { usePhone } from "../app/state";
import TopBar from "./TopBar";
import Toasts from "./Toasts";
import Home from "../screens/Home";
import Settings from "../screens/Settings";
import Contacts from "../screens/Contacts";
import Messages from "../screens/Messages";
import Banking from "../screens/Banking";
import Mail from "../screens/Mail";

export default function PhoneShell() {
  const phone = usePhone();
  const current = phone.nav[phone.nav.length - 1];

  const Screen = useMemo(() => {
    switch (current.id) {
      case "settings": return <Settings />;
      case "contacts": return <Contacts />;
      case "messages": return <Messages />;
      case "banking": return <Banking />;
      case "mail": return <Mail />;
      default: return <Home />;
    }
  }, [current.id]);

  // Visible: full phone. Peeking: partial phone + toasts only.
  const shouldRender = phone.visible || phone.peeking;
  if (!shouldRender) return null;

  return (
    <div style={wrapStyle(phone.visible, phone.peeking)}>
      <div style={phoneStyle(phone.visible, phone.peeking)}>
        <TopBar />
        <div style={contentStyle}>
          {phone.visible ? Screen : null}
        </div>
        <Toasts />
      </div>
    </div>
  );
}

function wrapStyle(visible: boolean, peeking: boolean): React.CSSProperties {
  return {
    position: "absolute",
    inset: 0,
    pointerEvents: visible ? "auto" : "none",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingBottom: 24
  };
}

function phoneStyle(visible: boolean, peeking: boolean): React.CSSProperties {
  const baseY = visible ? 0 : (peeking ? 120 : 520);

  return {
    width: 320,
    height: 640,
    borderRadius: 28,
    background: "var(--bg)",
    border: "1px solid var(--border)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
    overflow: "hidden",
    transform: `translateY(${baseY}px)`,
    transition: "transform 220ms ease"
  };
}

const contentStyle: React.CSSProperties = {
  height: "calc(100% - 44px)",
  padding: 12
};
