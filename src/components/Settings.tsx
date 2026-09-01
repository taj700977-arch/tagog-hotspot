import { Settings as SettingsIcon, Sun, Moon, Globe, LogOut } from "lucide-react";
import { useApp } from "../context";
import { routerOs } from "../lib/routeros";

export function Settings({ onDisconnect }: { onDisconnect: () => void }) {
  const { t, lang, setLang, theme, setTheme } = useApp();
  const conn = routerOs.getConnection();

  return (
    <div>
      <div className="page-header">
        <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <SettingsIcon size={24} style={{ color: "var(--primary)" }} /> {t("settingsTitle")}
        </h2>
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        <div className="form-group">
          <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Globe size={16} /> {t("language")}
          </label>
          <div className="lang-toggle" style={{ width: "fit-content" }}>
            <button className={`lang-btn ${lang === "ar" ? "active" : ""}`} onClick={() => setLang("ar")}>{t("arabic")}</button>
            <button className={`lang-btn ${lang === "fr" ? "active" : ""}`} onClick={() => setLang("fr")}>{t("french")}</button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />} {t("theme")}
          </label>
          <div className="lang-toggle" style={{ width: "fit-content" }}>
            <button className={`lang-btn ${theme === "dark" ? "active" : ""}`} onClick={() => setTheme("dark")}>{t("darkMode")}</button>
            <button className={`lang-btn ${theme === "light" ? "active" : ""}`} onClick={() => setTheme("light")}>{t("lightMode")}</button>
          </div>
        </div>

        {conn && (
          <div className="form-group">
            <label className="form-label">{t("connectedTo")}</label>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, background: "var(--bg-elev-2)", borderRadius: 8 }}>
              <span style={{ fontWeight: 600 }} dir="ltr">{conn.host}:{conn.port}</span>
              <button className="btn btn-danger btn-sm" onClick={onDisconnect}>
                <LogOut size={14} /> {t("disconnectRouter")}
              </button>
            </div>
          </div>
        )}

        <div style={{ marginTop: 24, padding: 16, background: "var(--primary-soft)", borderRadius: 8, textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--primary)", marginBottom: 4 }}>TAGOG HOTSPOT</div>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{t("licensingNotice")}</div>
        </div>
      </div>
    </div>
  );
}
