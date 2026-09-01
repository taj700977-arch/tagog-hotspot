import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});

export type Voucher = {
  id: string;
  username: string;
  password: string;
  profile: string;
  time_limit_minutes: number;
  data_limit_mb: number;
  price: number;
  status: "active" | "used" | "expired" | "purged";
  ssid: string;
  mode: "hotspot" | "usermanager";
  expires_at: string | null;
  used_at: string | null;
  created_at: string;
};

export type ConnectionProfile = {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  use_https: boolean;
  mode: "rest" | "radius";
  created_at: string;
};

export type NewVoucher = Omit<Voucher, "id" | "created_at" | "used_at">;
