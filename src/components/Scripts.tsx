import { useState } from "react";
import { Terminal, Copy, Check } from "lucide-react";
import { useApp } from "../context";
import { scriptTemplates, generateScript } from "../lib/scripts";
import type { GeneratedScript } from "../lib/types";

export function Scripts() {
  const { t, toast } = useApp();
  const [activeId, setActiveId] = useState<string>(scriptTemplates[0].id);
  const [scriptBody, setScriptBody] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [opts, setOpts] = useState({ profile: "default", timeLimitMinutes: 60, dataLimitMb: 0, ssid: "TAGOG-HOTSPOT" });

  function handleGenerate(id: string) {
    setActiveId(id);
    setScriptBody(generateScript(id, opts));
  }

  async function copyScript() {
    if (!scriptBody) return;
    try {
      await navigator.clipboard.writeText(scriptBody);
      setCopied(true);
      toast("success", t("copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("error", t("error"));
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Terminal size={24} style={{ color: "var(--primary)" }} /> {t("scriptGenerator")}
        </h2>
        <p>{t("scriptsDesc")}</p>
      </div>

      <div className="scripts-layout">
        <div className="card">
          <div className="card-title">{t("scripts")}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {scriptTemplates.map((s: Omit<GeneratedScript, "body">) => (
              <button
                key={s.id}
                className={`nav-item ${activeId === s.id ? "active" : ""}`}
                style={{ width: "100%" }}
                onClick={() => handleGenerate(s.id)}
              >
                <Terminal size={18} />
                <span>{t(s.title as never)}</span>
              </button>
            ))}
          </div>

          <div style={{ height: 1, background: "var(--border)", margin: "16px 0" }} />

          <div className="form-group">
            <label className="form-label">{t("profileLimit")}</label>
            <input className="form-input" value={opts.profile} onChange={(e) => setOpts((p) => ({ ...p, profile: e.target.value }))} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t("timeLimit")} ({t("minutes")})</label>
              <input className="form-input" type="number" value={opts.timeLimitMinutes} onChange={(e) => setOpts((p) => ({ ...p, timeLimitMinutes: parseInt(e.target.value, 10) || 0 }))} />
            </div>
            <div className="form-group">
              <label className="form-label">{t("dataLimit")} ({t("mb")})</label>
              <input className="form-input" type="number" value={opts.dataLimitMb} onChange={(e) => setOpts((p) => ({ ...p, dataLimitMb: parseInt(e.target.value, 10) || 0 }))} />
            </div>
          </div>
          <button className="btn btn-primary btn-sm" style={{ width: "100%" }} onClick={() => handleGenerate(activeId)}>
            {t("generateScript")}
          </button>
        </div>

        <div className="card">
          <div className="card-title" style={{ justifyContent: "space-between" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Terminal size={18} /> {t(scriptTemplates.find((s) => s.id === activeId)?.title as never)}
            </span>
            {scriptBody && (
              <button className="btn btn-secondary btn-sm" onClick={copyScript}>
                {copied ? <><Check size={14} /> {t("copied")}</> : <><Copy size={14} /> {t("copyScript")}</>}
              </button>
            )}
          </div>
          {scriptBody ? (
            <>
              <div className="code-block">{scriptBody}</div>
              <p style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>{t("pasteHint")}</p>
            </>
          ) : (
            <div className="empty-state">
              <Terminal size={48} />
              <p>{t("generateScript")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
