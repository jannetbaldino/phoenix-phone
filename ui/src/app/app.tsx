import React, { useEffect } from "react";
import { PhoneProvider, usePhone } from "./state";
import PhoneShell from "../components/PhoneShell";
import { nuiCall, nuiClose } from "./nui";
import type { PhoneProfile, ToastPayload } from "./types";

function Inner() {
  const phone = usePhone();

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data;
      if (!d || typeof d !== "object") return;

      if (d.type === "phone:setVisible") {
        phone.setVisible(!!d.visible);
        if (!d.visible) phone.resetHome();
      }

      if (d.type === "phone:peek") {
        phone.setPeeking(!!d.peek);
      }

      if (d.type === "phone:toast") {
        phone.addToast((d.toast ?? {}) as ToastPayload);
      }
    };

    window.addEventListener("message", onMsg);
    // Tell client we're ready (optional)
    fetch(`https://${(window as any).GetParentResourceName?.() ?? "nui"}/phone:ready`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}"
    }).catch(() => {});

    return () => window.removeEventListener("message", onMsg);
  }, [phone]);

  useEffect(() => {
    if (!phone.visible) return;

    // Load profile when phone opens
    (async () => {
      try {
        const profile = await nuiCall<PhoneProfile>("prp-phone:getProfile");
        phone.setProfile(profile);
      } catch (e: any) {
        phone.setProfile(null);
        phone.addToast({ title: "Phone Error", body: String(e?.message ?? e) });
      }

    })();
  }, [phone.visible]);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape" && phone.visible) {
        nuiClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phone.visible]);

  return <PhoneShell />;
}

export default function App() {
  return (
    <PhoneProvider>
      <Inner />
    </PhoneProvider>
  );
}
