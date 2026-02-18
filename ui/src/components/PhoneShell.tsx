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

type WallpaperDef = { key: string; label: string; css: string };

const WALLPAPERS: WallpaperDef[] = [
  {
    key: "midnight",
    label: "Midnight",
    css: "radial-gradient(1200px 800px at 20% 10%, rgba(120,160,255,0.35), transparent 55%), radial-gradient(900px 700px at 80% 30%, rgba(255,107,179,0.22), transparent 60%), linear-gradient(180deg, #0b0c12 0%, #0f1220 50%, #0a0b11 100%)",
  },
  {
    key: "aurora",
    label: "Aurora",
    css: "radial-gradient(900px 650px at 20% 20%, rgba(125,255,178,0.28), transparent 60%), radial-gradient(900px 650px at 80% 30%, rgba(120,160,255,0.28), transparent 60%), radial-gradient(900px 650px at 50% 90%, rgba(179,136,255,0.20), transparent 60%), linear-gradient(180deg, #081016 0%, #0b1220 60%, #070b12 100%)",
  },
  {
    key: "sunset",
    label: "Sunset",
    css: "radial-gradient(900px 650px at 20% 20%, rgba(255,209,102,0.32), transparent 60%), radial-gradient(900px 650px at 80% 25%, rgba(255,107,107,0.26), transparent 60%), radial-gradient(900px 650px at 60% 85%, rgba(255,107,179,0.20), transparent 60%), linear-gradient(180deg, #140a12 0%, #101028 55%, #070710 100%)",
  },
  {
    key: "steel",
    label: "Steel",
    css: "radial-gradient(800px 520px at 30% 20%, rgba(255,255,255,0.10), transparent 60%), radial-gradient(800px 520px at 70% 60%, rgba(255,255,255,0.06), transparent 60%), linear-gradient(180deg, #0d0f14 0%, #0b0c10 100%)",
  },
  {
    key: "rose",
    label: "Rose",
    css: "radial-gradient(950px 700px at 30% 20%, rgba(255,107,179,0.32), transparent 60%), radial-gradient(900px 650px at 70% 40%, rgba(179,136,255,0.22), transparent 60%), linear-gradient(180deg, #0d0812 0%, #120a18 60%, #09070d 100%)",
  },
  {
    key: "mint",
    label: "Mint",
    css: "radial-gradient(950px 700px at 30% 20%, rgba(125,255,178,0.30), transparent 60%), radial-gradient(900px 650px at 70% 40%, rgba(120,160,255,0.18), transparent 60%), linear-gradient(180deg, #071014 0%, #07121a 60%, #050b10 100%)",
  },
];

function getWallpaperCss(key: string) {
  return WALLPAPERS.find((w) => w.key === key)?.css ?? WALLPAPERS[0].css;
}

const TOP_BAR_HEIGHT = 44;

export default function PhoneShell() {
  const phone = usePhone();
  const current = phone.nav[phone.nav.length - 1];

  const Screen = useMemo(() => {
    switch (current.id) {
      case "settings":
        return <Settings />;
      case "contacts":
        return <Contacts />;
      case "messages":
        return <Messages />;
      case "banking":
        return <Banking />;
      case "mail":
        return <Mail />;
      default:
        return <Home />;
    }
  }, [current.id]);

  const shouldRender = phone.visible || phone.peeking;
  if (!shouldRender) return null;

  const vars: React.CSSProperties = buildThemeVars(phone.settings);
  const wallpaper = getWallpaperCss(phone.settings.wallpaper);

  return (
    <div style={wrapStyle(phone.visible)}>
      <div style={{ ...phoneStyle(phone.visible, phone.peeking, phone.settings), ...vars }}>
        {/* Wallpaper layer (bottom) */}
        <div style={wallpaperLayer(wallpaper)} />

        {/* Dark overlay */}
        <div style={wallpaperOverlay(phone.settings.theme)} />

        {/* Top bar (locked) */}
        <div style={topBarWrap}>
          <TopBar />
        </div>

        {/* App content (always starts below TopBar) */}
        <div style={contentStyle}>{phone.visible ? Screen : null}</div>

        {/* Toasts (absolute overlay inside phone) */}
        <Toasts />
      </div>
    </div>
  );
}

function wrapStyle(visible: boolean): React.CSSProperties {
  return {
    position: "absolute",
    inset: 0,
    pointerEvents: visible ? "auto" : "none",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingBottom: 24,
  };
}

function phoneStyle(
  visible: boolean,
  peeking: boolean,
  settings: { solidUi: boolean }
): React.CSSProperties {
  const baseY = visible ? 0 : peeking ? 120 : 520;

  const baseBg = settings.solidUi
    ? "rgba(16,16,20,0.92)"
    : "rgba(16,16,20,0.80)";

  return {
    width: 320,
    height: 640,
    borderRadius: 28,
    background: baseBg,
    border: "1px solid var(--border)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
    overflow: "hidden",
    transform: `translateY(${baseY}px)`,
    transition: "transform 220ms ease",
    position: "relative",
    display: "flex",
    flexDirection: "column",
  };
}

function wallpaperLayer(wallpaperCss: string): React.CSSProperties {
  return {
    position: "absolute",
    inset: 0,
    backgroundImage: wallpaperCss,
    backgroundSize: "cover",
    backgroundPosition: "center",
    opacity: 1,
    pointerEvents: "none",
    zIndex: 0,
  };
}

function wallpaperOverlay(theme: "dark" | "light"): React.CSSProperties {
  const alpha = theme === "light" ? 0.35 : 0.22;

  return {
    position: "absolute",
    inset: 0,
    background: `rgba(0,0,0,${alpha})`,
    pointerEvents: "none",
    zIndex: 1,
  };
}

/** hex "#RRGGBB" -> "rgba(r,g,b,a)" (safe for FiveM NUI) */
function hexToRgba(hex: string, a: number) {
  const h = (hex || "").trim().replace("#", "");
  if (h.length !== 6) return `rgba(120,160,255,${a})`;

  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);

  if ([r, g, b].some((n) => Number.isNaN(n))) return `rgba(120,160,255,${a})`;
  return `rgba(${r},${g},${b},${a})`;
}

function buildThemeVars(settings: any): React.CSSProperties {
  const isLight = settings.theme === "light";
  const accent = settings.accent || "#78a0ff";

  const accentA = hexToRgba(accent, 0.35);

  return {
    ["--accent" as any]: accent,
    ["--accentA" as any]: accentA,

    ["--text" as any]: isLight
      ? "rgba(10,10,12,0.92)"
      : "rgba(255,255,255,0.92)",
    ["--muted" as any]: isLight
      ? "rgba(10,10,12,0.55)"
      : "rgba(255,255,255,0.55)",
    ["--border" as any]: isLight
      ? "rgba(0,0,0,0.18)"
      : "rgba(255,255,255,0.14)",

    ["--surface" as any]:
      settings.solidUi
        ? isLight
          ? "rgba(255,255,255,0.92)"
          : "rgba(255,255,255,0.10)"
        : isLight
        ? "rgba(255,255,255,0.78)"
        : "rgba(255,255,255,0.06)",

    ["--bg" as any]: isLight ? "rgba(245,245,248,0.95)" : "rgba(14,14,18,0.95)",
  };
}

const topBarWrap: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: TOP_BAR_HEIGHT,
  zIndex: 4,
};

const contentStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 2,

  flex: "1 1 auto",
  minHeight: 0,

  padding: 12,
  paddingTop: TOP_BAR_HEIGHT + 12, // reserve space for TopBar

  overflow: "hidden", // child screens scroll internally
};
