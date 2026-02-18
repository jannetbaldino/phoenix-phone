import React, { useEffect } from "react";
import { PhoneProvider, usePhone } from "./state";
import PhoneShell from "../components/PhoneShell";
import { nuiCall, nuiClose } from "./nui";
import type { PhoneProfile } from "./types";

function Inner() {
  const phone = usePhone();

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d: any = e.data;
      if (!d || typeof d !== "object") return;

      if (d.type === "phone:setVisible") {
        phone.setVisible(!!d.visible);
        if (!d.visible) phone.resetHome();
      }

      if (d.type === "phone:peek") {
        phone.setPeeking(!!d.peek);
      }

      if (d.type === "phone:toast") {
        phone.pushToast(d.toast ?? {});
      }

      if (d.type === "phone:openApp") {
        phone.openApp(d.id, d.params);
      }
    };

    window.addEventListener("message", onMsg);

    fetch(
      `https://${(window as any).GetParentResourceName?.() ?? "nui"}/phone:ready`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      }
    ).catch(() => {});

    return () => window.removeEventListener("message", onMsg);
  }, [phone]);

  useEffect(() => {
    if (!phone.visible) return;

    (async () => {
      try {
        const profile = await nuiCall<PhoneProfile>("prp-phone:getProfile");
        phone.setProfile(profile);
      } catch (e: any) {
        phone.setProfile(null);
        phone.pushToast({ title: "Phone Error", body: String(e?.message ?? e) });
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
