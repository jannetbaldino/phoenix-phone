import React, { createContext, useContext, useMemo, useState } from "react";
import type { ToastPayload, PhoneProfile } from "./types";

type AppId = "home" | "settings" | "contacts" | "messages" | "banking" | "mail";

type NavEntry =
  | { id: "home" }
  | { id: "settings" }
  | { id: "contacts" }
  | { id: "messages" }
  | { id: "banking" }
  | { id: "mail" };

type PhoneState = {
  visible: boolean;
  peeking: boolean;
  nav: NavEntry[];
  profile: PhoneProfile | null;
  toasts: ToastPayload[];
  setVisible(v: boolean): void;
  setPeeking(v: boolean): void;
  push(e: NavEntry): void;
  pop(): void;
  resetHome(): void;
  setProfile(p: PhoneProfile | null): void;
  addToast(t: ToastPayload): void;
  removeToast(idx: number): void;
};

const Ctx = createContext<PhoneState | null>(null);

export function PhoneProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [peeking, setPeeking] = useState(false);
  const [nav, setNav] = useState<NavEntry[]>([{ id: "home" }]);
  const [profile, setProfile] = useState<PhoneProfile | null>(null);
  const [toasts, setToasts] = useState<ToastPayload[]>([]);

  const api = useMemo<PhoneState>(() => {
    return {
      visible,
      peeking,
      nav,
      profile,
      toasts,
      setVisible,
      setPeeking,
      push: (e) => setNav((s) => [...s, e]),
      pop: () => setNav((s) => (s.length > 1 ? s.slice(0, -1) : s)),
      resetHome: () => setNav([{ id: "home" }]),
      setProfile,
      addToast: (t) => {
        setToasts((s) => {
          const next = [t, ...s].slice(0, 3);
          return next;
        });
      },
      removeToast: (idx) => setToasts((s) => s.filter((_, i) => i !== idx))
    };
  }, [visible, peeking, nav, profile, toasts]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function usePhone() {
  const v = useContext(Ctx);
  if (!v) throw new Error("PhoneProvider missing");
  return v;
}

export type { AppId, NavEntry };
