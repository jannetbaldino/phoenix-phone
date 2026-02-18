import React, { createContext, useContext, useMemo, useState } from "react";
import type { PhoneProfile } from "./types";

export type AppId = "home" | "settings" | "contacts" | "messages" | "banking" | "mail";

export type NavEntry =
  | { id: "home"; params?: any }
  | { id: "settings"; params?: any }
  | { id: "contacts"; params?: any }
  | { id: "messages"; params?: any }
  | { id: "banking"; params?: any }
  | { id: "mail"; params?: any };

export type PhoneToast = {
  id: string;
  title?: string;
  body?: string;

  // routing hints
  app?: string; // "messages" etc
  from?: string;
  thread_id?: number;

  createdAt: number;
};

export type PhoneSettings = {
  theme: "dark" | "light";
  accent: string;

  // UI opacity helpers
  solidUi: boolean;

  // wallpapers (CSS preset key)
  wallpaper: string;

  // notifications
  notifSound: boolean;
  notifPeek: boolean;
};

const SETTINGS_KEY = "phoenix_phone_settings_v1";

function loadSettings(): PhoneSettings {
  const defaults: PhoneSettings = {
    theme: "dark",
    accent: "#78a0ff",
    solidUi: true,
    wallpaper: "midnight",
    notifSound: false,
    notifPeek: true,
  };

  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return { ...defaults, ...(parsed || {}) };
  } catch {
    return defaults;
  }
}

function saveSettings(s: PhoneSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {}
}

type PhoneState = {
  visible: boolean;
  peeking: boolean;
  nav: NavEntry[];
  profile: PhoneProfile | null;

  // transient toasts (fade away)
  toasts: PhoneToast[];
  pushToast(t: Partial<PhoneToast>): void;
  removeToast(id: string): void;

  // notification center (persistent history)
  notifications: PhoneToast[];
  clearNotifications(): void;
  removeNotification(id: string): void;

  // refresh bump
  tick: number;
  bumpTick(): void;

  // settings
  settings: PhoneSettings;
  setSettings(next: Partial<PhoneSettings>): void;

  // nav
  setVisible(v: boolean): void;
  setPeeking(v: boolean): void;
  push(e: NavEntry): void;
  pop(): void;
  resetHome(): void;
  openApp(id: AppId, params?: any): void;

  // profile
  setProfile(p: PhoneProfile | null): void;
};

const Ctx = createContext<PhoneState | null>(null);

export function PhoneProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [peeking, setPeeking] = useState(false);
  const [nav, setNav] = useState<NavEntry[]>([{ id: "home" }]);
  const [profile, setProfile] = useState<PhoneProfile | null>(null);

  const [toasts, setToasts] = useState<PhoneToast[]>([]);
  const [notifications, setNotifications] = useState<PhoneToast[]>([]);
  const [tick, setTick] = useState(0);

  const [settings, _setSettings] = useState<PhoneSettings>(() => loadSettings());

  const setSettings = (next: Partial<PhoneSettings>) => {
    _setSettings((prev) => {
      const merged = { ...prev, ...next };
      saveSettings(merged);
      return merged;
    });
  };

  const bumpTick = () => setTick((n) => n + 1);

  const openApp = (id: AppId, params?: any) => {
    setNav((s) => [...s, { id, params } as NavEntry]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((x) => x.id !== id));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const pushToast = (t: Partial<PhoneToast>) => {
    const toast: PhoneToast = {
      id:
        (crypto?.randomUUID?.() ??
          String(Date.now()) + Math.random().toString(16).slice(2)),
      title: t.title ?? "",
      body: t.body ?? "",
      app: t.app ?? "",
      from: t.from,
      thread_id: t.thread_id,
      createdAt: Date.now(),
    };

    // 1) persistent history (notification center)
    setNotifications((prev) => [toast, ...prev].slice(0, 60));

    // 2) transient toast stack
    setToasts((prev) => [toast, ...prev].slice(0, 3));
    bumpTick();

    // auto-remove toast bubble only (not the notification center entry)
    window.setTimeout(() => {
      removeToast(toast.id);
    }, 3500);
  };

  const api = useMemo<PhoneState>(() => {
    return {
      visible,
      peeking,
      nav,
      profile,
      toasts,
      notifications,
      tick,
      settings,

      setVisible,
      setPeeking,

      push: (e) => setNav((s) => [...s, e]),
      pop: () => setNav((s) => (s.length > 1 ? s.slice(0, -1) : s)),
      resetHome: () => setNav([{ id: "home" }]),
      openApp,

      setProfile,

      pushToast,
      removeToast,

      clearNotifications,
      removeNotification,

      bumpTick,

      setSettings,
    };
  }, [visible, peeking, nav, profile, toasts, notifications, tick, settings]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function usePhone() {
  const v = useContext(Ctx);
  if (!v) throw new Error("PhoneProvider missing");
  return v;
}
