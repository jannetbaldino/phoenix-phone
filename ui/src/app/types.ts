export type PhoneProfile = {
  citizenid: string;
  phone_number: string;
  settings: PhoneSettings;
};

export type PhoneSettings = {
  theme: "dark" | "light";
  notifications: boolean;
  ringtone: string;
  vibrate: boolean;
};

export type Contact = {
  id: number;
  name: string;
  phone_number: string;
  notes?: string | null;
};

export type Thread = {
  id: number;
  other_number: string;
  last_message: string | null;
  last_at: number;
};

export type Message = {
  id: number;
  direction: "in" | "out";
  body: string;
  sent_at: number;
};

export type BankData = {
  balance: number;
  transactions: Array<{
    id: number;
    kind: string;
    amount: number;
    note: string | null;
    created_at: number;
  }>;
};

export type ToastPayload = {
  title?: string;
  body?: string;
  app?: string;
  from?: string;
};
