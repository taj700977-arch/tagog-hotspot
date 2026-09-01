import { useState, useEffect } from "react";
import { Phone, Loader2, Save, Trash2 } from "lucide-react";
import { useApp } from "../context";
import { Logo } from "./Common";
import { routerOs } from "../lib/routeros";
import { supabase, type ConnectionProfile } from "../lib/supabase";
import type { RouterConnection } from "../lib/types";

export function Login({ onConnected }: { onConnected: () => void }) {
  const { t, toast } = useApp();
  const [host, setHost] = useState("");
  const [port, setPort] = useState("443");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [useHttps, setUseHttps] = useState(true);
  const [mode, setMode] = useState<"rest" | "radius">("rest");
  const [connecting, setConnecting] = useState(false);
  const [profiles, setProfiles] = useState<ConnectionProfile[]>([]);
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    loadProfiles();
  }, []);

  async function loadProfiles() {
    const { data } = await supabase.from("connection_profiles").select("*").order("created_at", { ascending: false });
    if (data) setProfiles(data as ConnectionProfile[]);
  }

  async function handleConnect() {
    if (!host.trim()) {
      toast("error", t("connectionError"));
      return;
    }
    setConnecting(true);
    const conn: RouterConnection = {
      host: host.trim(),
      port: parseInt(port, 10) || 443,
      username: username.trim(),
      password,
      useHttps,
      mode,
    };
    const result = await routerOs.connect(conn);
    setConnecting(false);
    if (result.ok) {
      if (result.demo) toast("info", t("demoNote"));
      else toast("success", t("success"));
      onConnected();
    } else {
      toast("error", t("connectionError"));
    }
  }

  async function handleSaveProfile() {
    if (!profileName.trim() || !host.trim()) {
      toast("error", t("profileName"));
      return;
    }
    const { error } = await supabase.from("connection_profiles").insert({
      name: profileName.trim(),
      host: host.trim(),
      port: parseInt(port, 10) || 443,
      username: username.trim(),
      password,
      use_https: useHttps,
      mode,
    });
    if (error) toast("error", t("error"));
    else {
      toast("success", t("save"));
      setProfileName("");
      loadProfiles();
    }
  }

  function loadProfile(p: ConnectionProfile) {
    setHost(p.host);
    setPort(String(p.port));
    setUsername(p.username);
    setPassword(p.password);
    setUseHttps(p.use_https);
    setMode(p.mode as "rest" | "radius");
  }

  async function deleteProfile(id: string) {
    await supabase.from("connection_profiles").delete().eq("id", id);
    loadProfiles();
  }

  return (
    <div className="login-page">
      <div className="login-card card">
        <div className="login-logo">
          <Logo size={64} />
          <h1>{t("appName")}</h1>
          <p>{t("tagline")}</p>
        </div>

        <div className="demo-banner">{t("demoNote")}</div>

        <div className="form-group">
          <label className="form-label">{t("connectionMode")}</label>
          <select className="form-select" value={mode} onChange={(e) => setMode(e.target.value as "rest" | "radius")}>
            <option value="rest">{t("restApi")}</option>
            <option value="radius">{t("radius")}</option>
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t("routerHost")}</label>
            <input className="form-input" value={host} onChange={(e) => setHost(e.target.value)} placeholder="192.168.88.1" dir="ltr" />
          </div>
          <div className="form-group">
            <label className="form-label">{t("port")}</label>
            <input className="form-input" value={port} onChange={(e) => setPort(e.target.value)} dir="ltr" inputMode="numeric" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t("username")}</label>
            <input className="form-input" value={username} onChange={(e) => setUsername(e.target.value)} dir="ltr" />
          </div>
          <div className="form-group">
            <label className="form-label">{t("password")}</label>
            <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" />
          </div>
        </div>

        <div className="form-group" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <label className="form-label" style={{ margin: 0 }}>{t("useHttps")}</label>
          <div className={`toggle ${useHttps ? "on" : ""}`} onClick={() => setUseHttps(!useHttps)}>
            <div className="toggle-knob" />
          </div>
        </div>

        <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleConnect} disabled={connecting}>
          {connecting ? <><Loader2 size={18} className="spin" /> {t("connecting")}</> : t("connect")}
        </button>

        <div style={{ height: 1, background: "var(--border)", margin: "20px 0" }} />

        <div className="form-group">
          <label className="form-label">{t("saveProfile")}</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="form-input" value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder={t("profileName")} />
            <button className="btn btn-secondary btn-sm" onClick={handleSaveProfile}>
              <Save size={16} /> {t("save")}
            </button>
          </div>
        </div>

        {profiles.length > 0 && (
          <div>
            <label className="form-label">{t("savedProfiles")}</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {profiles.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--bg-elev-2)", borderRadius: 8 }}>
                  <button className="btn-ghost" style={{ flex: 1, textAlign: "start", fontWeight: 600, fontSize: 13 }} onClick={() => loadProfile(p)}>
                    {p.name} <span style={{ color: "var(--text-dim)" }}>({p.host})</span>
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => deleteProfile(p.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{t("licensingNotice")}</div>
          <a href="tel:+23670097750" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700, color: "var(--success)" }}>
            <Phone size={16} /> {t("supportPhone")}
          </a>
        </div>
      </div>
    </div>
  );
}
