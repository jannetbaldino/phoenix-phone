import React, { useEffect, useState } from "react";
import { usePhone } from "../app/state";
import { nuiCall } from "../app/nui";
import type { PhoneSettings } from "../app/types";

export default function Settings() {
  const phone = usePhone();
  const [settings, setSettings] = useState<PhoneSettings | null>(phone.profile?.settings ?? null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSettings(phone.profile?.settings ?? null);
  }, [phone.profile?.settings]);

  async function save(next: PhoneSettings) {
    setSaving(true);
    try {
      await nuiCall("prp-phone:saveSettings", next);
      phone.setProfile(phone.profile ? { ...phone.profile, settings: next } : phone.profile);
      setSettings(next);
    } finally {
      setSaving(false);
    }
  }

  if (!settings) return <div>Loading...</div>;

  return (
    <div style={wrap}>
      <h3 style={title}>Settings</h3>

      <Row label="Theme">
        <select
          value={settings.theme}
          onChange={(e) => save({ ...settings, theme: e.target.value as any })}
          style={input}
          disabled={saving}
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </Row>

      <Row label="Notifications">
        <input
          type="checkbox"
          checked={settings.notifications}
          onChange={(e) => save({ ...settings, notifications: e.target.checked })}
          disabled={saving}
        />
      </Row>

      <Row label="Vibrate">
        <input
          type="checkbox"
          checked={settings.vibrate}
          onChange={(e) => save({ ...settings, vibrate: e.target.checked })}
          disabled={saving}
        />
      </Row>

      <Row label="Ringtone">
        <input
          value={settings.ringtone}
          onChange={(e) => setSettings({ ...settings, ringtone: e.target.value })}
          onBlur={() => save(settings)}
          style={input}
          disabled={saving}
        />
      </Row>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={row}>
      <div style={{ color: "var(--muted)", fontSize: 13 }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

const wrap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 10 };
const title: React.CSSProperties = { margin: "4px 0 6px 0" };
const row: React.CSSProperties = {
  padding: 12,
  borderRadius: 18,
  border: "1px solid var(--border)",
  background: "rgba(255,255,255,0.05)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between"
};
const input: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "rgba(0,0,0,0.25)",
  color: "var(--text)",
  padding: "8px 10px"
};
