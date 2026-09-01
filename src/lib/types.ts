export type Language = "ar" | "fr";

export type Theme = "dark" | "light";

export type ActiveSession = {
  id: string;
  username: string;
  ip: string;
  mac: string;
  uptime: string;
  uptimeSeconds: number;
  bytesIn: number;
  bytesOut: number;
  rxRate: number;
  txRate: number;
  signal: number;
};

export type RouterConnection = {
  host: string;
  port: number;
  username: string;
  password: string;
  useHttps: boolean;
  mode: "rest" | "radius";
};

export type VoucherGenParams = {
  quantity: number;
  usernameLength: number;
  passwordLength: number;
  profile: string;
  timeLimitMinutes: number;
  dataLimitMb: number;
  price: number;
  ssid: string;
  mode: "hotspot" | "usermanager";
  expiryDays: number;
};

export type GeneratedScript = {
  id: string;
  title: string;
  description: string;
  language: string;
  body: string;
};

export type Toast = { id: number; type: "success" | "error" | "info"; message: string };
