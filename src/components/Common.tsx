import { Wifi, Phone, Info, X } from "lucide-react";
import { useApp } from "../context";

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="14" fill="#0ea5e9" />
      <path d="M32 14a18 18 0 0 0-18 18h6a12 12 0 0 1 12-12 12 12 0 0 1 12 12h6a18 18 0 0 0-18-18z" fill="#fff" />
      <circle cx="32" cy="40" r="7" fill="#fff" />
      <rect x="20" y="48" width="24" height="4" rx="2" fill="#fff" opacity="0.85" />
    </svg>
  );
}

export function LicensingFooter() {
  const { t } = useApp();
  return (
    <div className="app-footer">
      <div className="licence">{t("licensingNotice")}</div>
      <div style={{ marginTop: 4 }}>
        <span>{t("appName")} — {t("tagline")}</span>
      </div>
    </div>
  );
}

export function InfoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useApp();
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Info size={20} /> {t("about")}
          </h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <p style={{ marginBottom: 16, color: "var(--text-muted)", fontSize: 14 }}>{t("aboutText")}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, background: "var(--bg-elev-2)", borderRadius: 8 }}>
              <Wifi size={20} style={{ color: "var(--primary)" }} />
              <span style={{ fontWeight: 700 }}>TAGOG HOTSPOT</span>
            </div>
            <a
              href="tel:+23670097750"
              style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, background: "var(--bg-elev-2)", borderRadius: 8, fontWeight: 600 }}
            >
              <Phone size={20} style={{ color: "var(--success)" }} /> {t("supportPhone")}
            </a>
            <div style={{ padding: 12, background: "var(--primary-soft)", borderRadius: 8, fontWeight: 700, fontSize: 13, color: "var(--primary)" }}>
              {t("licensingNotice")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
