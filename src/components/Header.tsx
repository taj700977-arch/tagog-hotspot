import { useState } from "react";
import {
  Menu, Moon, Sun, Info, LogOut, LayoutDashboard, Ticket, Plus,
  Printer, Terminal, Settings as SettingsIcon,
} from "lucide-react";
import { useApp } from "../context";
import { Logo, InfoModal } from "./Common";
import { routerOs } from "../lib/routeros";

type View = "dashboard" | "generate" | "vouchers" | "cards" | "scripts" | "settings";

export function Header({
  view, setView, onMenuToggle, connected, demo, onDisconnect,
}: {
  view: View;
  setView: (v: View) => void;
  onMenuToggle: () => void;
  connected: boolean;
  demo: boolean;
  onDisconnect: () => void;
}) {
  const { t, lang, toggleLang, theme, toggleTheme } = useApp();
  const [infoOpen, setInfoOpen] = useState(false);
  const conn = routerOs.getConnection();

  const nav: { id: View; icon: typeof Wifi; label: string }[] = [
    { id: "dashboard", icon: LayoutDashboard, label: t("dashboard") },
    { id: "generate", icon: Plus, label: t("generate") },
    { id: "vouchers", icon: Ticket, label: t("vouchers") },
    { id: "cards", icon: Printer, label: t("voucherCards") },
    { id: "scripts", icon: Terminal, label: t("scripts") },
    { id: "settings", icon: SettingsIcon, label: t("settings") },
  ];

  return (
    <>
      <header className="app-header">
        <button className="header-btn mobile-menu-btn" onClick={onMenuToggle}>
          <Menu size={22} />
        </button>
        <div className="header-logo">
          <Logo size={32} />
          <span className="full">{t("appName")}</span>
        </div>
        <div className="header-spacer" />
        {connected && (
          <div className={`connection-badge ${demo ? "demo" : "online"}`}>
            <span className="connection-dot" />
            <span className="badge-text">{demo ? t("demoMode") : `${t("connectedTo")} ${conn?.host}`}</span>
          </div>
        )}
        <div className="lang-toggle">
          <button className={`lang-btn ${lang === "ar" ? "active" : ""}`} onClick={() => lang !== "ar" && toggleLang()}>ع</button>
          <button className={`lang-btn ${lang === "fr" ? "active" : ""}`} onClick={() => lang !== "fr" && toggleLang()}>FR</button>
        </div>
        <button className="header-btn" onClick={toggleTheme} title={theme === "dark" ? t("lightMode") : t("darkMode")}>
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button className="header-btn" onClick={() => setInfoOpen(true)} title={t("about")}>
          <Info size={20} />
        </button>
        {connected && (
          <button className="header-btn" onClick={onDisconnect} title={t("disconnectRouter")}>
            <LogOut size={20} />
          </button>
        )}
      </header>
      <div className="main-content">
        <aside className="sidebar open" id="sidebar">
          {nav.map((n) => (
            <button key={n.id} className={`nav-item ${view === n.id ? "active" : ""}`} onClick={() => setView(n.id)}>
              <n.icon size={20} />
              <span>{n.label}</span>
            </button>
          ))}
          <div className="sidebar-footer">
            <div style={{ fontWeight: 700, marginBottom: 4 }}>TAGOG HOTSPOT</div>
            <div>{t("licensingNotice")}</div>
          </div>
        </aside>
        <div className="overlay" onClick={onMenuToggle} />
      </div>
      <InfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
    </>
  );
}

import { Wifi } from "lucide-react";
export type { View };
