import { useEffect, useState, useCallback } from "react";
import { Users, Activity, ArrowDown, ArrowUp, RefreshCw, Wifi, Zap, UserX } from "lucide-react";
import { useApp } from "../context";
import { routerOs, formatBytes, formatRate } from "../lib/routeros";
import type { ActiveSession } from "../lib/types";

export function Dashboard() {
  const { t, toast } = useApp();
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await routerOs.getActiveSessions();
    setSessions(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, tick]);

  useEffect(() => {
    if (!autoRefresh) return;
    const h = setInterval(() => setTick((x) => x + 1), 3000);
    return () => clearInterval(h);
  }, [autoRefresh]);

  const totalDownload = sessions.reduce((s, x) => s + x.bytesIn, 0);
  const totalUpload = sessions.reduce((s, x) => s + x.bytesOut, 0);
  const totalRxRate = sessions.reduce((s, x) => s + x.rxRate, 0);
  const totalTxRate = sessions.reduce((s, x) => s + x.txRate, 0);

  async function kick(id: string) {
    if (!confirm(t("confirmKick"))) return;
    const ok = await routerOs.kickSession(id);
    if (ok) {
      setSessions((s) => s.filter((x) => x.id !== id));
      toast("success", t("success"));
    } else {
      toast("error", t("error"));
    }
  }

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Activity size={24} style={{ color: "var(--primary)" }} /> {t("dashboard")}
          </h2>
          <p>{t("liveRealtime")}</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setAutoRefresh((v) => !v)}>
            <RefreshCw size={14} className={autoRefresh ? "spin" : ""} style={{ animationDuration: "2s" }} />
            {t("autoRefresh")}
          </button>
          <button className="btn btn-primary btn-sm" onClick={refresh}>
            <RefreshCw size={14} className={loading ? "spin" : ""} /> {t("refresh")}
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><Users size={24} /></div>
          <div>
            <div className="stat-value">{sessions.length}</div>
            <div className="stat-label">{t("onlineUsers")}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Activity size={24} /></div>
          <div>
            <div className="stat-value">{formatRate(totalRxRate + totalTxRate)}</div>
            <div className="stat-label">{t("bandwidthUsage")}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><ArrowDown size={24} /></div>
          <div>
            <div className="stat-value">{formatBytes(totalDownload)}</div>
            <div className="stat-label">{t("totalDownload")}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><ArrowUp size={24} /></div>
          <div>
            <div className="stat-value">{formatBytes(totalUpload)}</div>
            <div className="stat-label">{t("totalUpload")}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <Wifi size={18} style={{ color: "var(--primary)" }} /> {t("activeSessions")} ({sessions.length})
        </div>
        {sessions.length === 0 ? (
          <div className="empty-state">
            <UserX size={48} />
            <p>{t("noActiveUsers")}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t("user")}</th>
                  <th>{t("ipAddress")}</th>
                  <th>{t("macAddress")}</th>
                  <th>{t("uptime")}</th>
                  <th>{t("bytesIn")}</th>
                  <th>{t("bytesOut")}</th>
                  <th>{t("signal")}</th>
                  <th>{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 700 }}>{s.username}</td>
                    <td dir="ltr">{s.ip}</td>
                    <td dir="ltr" style={{ fontFamily: "monospace", fontSize: 12 }}>{s.mac}</td>
                    <td dir="ltr">{s.uptime}</td>
                    <td dir="ltr">{formatBytes(s.bytesIn)} <span style={{ color: "var(--text-dim)", fontSize: 11 }}>({formatRate(s.rxRate)})</span></td>
                    <td dir="ltr">{formatBytes(s.bytesOut)} <span style={{ color: "var(--text-dim)", fontSize: 11 }}>({formatRate(s.txRate)})</span></td>
                    <td dir="ltr">
                      <SignalBadge value={s.signal} />
                    </td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => kick(s.id)}>
                        <UserX size={14} /> {t("kick")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SignalBadge({ value }: { value: number }) {
  const color = value > -60 ? "var(--success)" : value > -75 ? "var(--warning)" : "var(--error)";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700, color }}>
      <Zap size={12} /> {value} dBm
    </span>
  );
}
