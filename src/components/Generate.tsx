import { useState } from "react";
import { Ticket, Plus, Loader2 } from "lucide-react";
import { useApp } from "../context";
import { routerOs, generateUsername, generatePassword } from "../lib/routeros";
import { supabase, type NewVoucher } from "../lib/supabase";
import type { VoucherGenParams } from "../lib/types";

export function Generate({ onDone }: { onDone: () => void }) {
  const { t, toast } = useApp();
  const [params, setParams] = useState<VoucherGenParams>({
    quantity: 10,
    usernameLength: 6,
    passwordLength: 8,
    profile: "default",
    timeLimitMinutes: 60,
    dataLimitMb: 0,
    price: 500,
    ssid: "TAGOG-HOTSPOT",
    mode: "hotspot",
    expiryDays: 30,
  });
  const [generating, setGenerating] = useState(false);

  function update<K extends keyof VoucherGenParams>(key: K, value: VoucherGenParams[K]) {
    setParams((p) => ({ ...p, [key]: value }));
  }

  async function handleGenerate() {
    if (params.quantity < 1 || params.quantity > 500) {
      toast("error", t("error"));
      return;
    }
    setGenerating(true);
    const now = new Date();
    const expiresAt = params.expiryDays > 0
      ? new Date(now.getTime() + params.expiryDays * 86400000).toISOString()
      : null;

    const vouchers: NewVoucher[] = Array.from({ length: params.quantity }, () => ({
      username: generateUsername(params.usernameLength),
      password: generatePassword(params.passwordLength),
      profile: params.profile,
      time_limit_minutes: params.timeLimitMinutes,
      data_limit_mb: params.dataLimitMb,
      price: params.price,
      status: "active",
      ssid: params.ssid,
      mode: params.mode,
      expires_at: expiresAt,
    }));

    // Push to router (best-effort; simulation mode returns true)
    for (const v of vouchers) {
      if (params.mode === "hotspot") {
        routerOs.createHotspotUser(v.username, v.password, v.profile);
      } else {
        routerOs.createUmUser(v.username, v.password, v.profile);
      }
    }

    const { error } = await supabase.from("vouchers").insert(vouchers);
    setGenerating(false);
    if (error) {
      toast("error", t("error"));
    } else {
      toast("success", `${t("generatedSuccess")} (${vouchers.length})`);
      onDone();
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Plus size={24} style={{ color: "var(--primary)" }} /> {t("generateVouchers")}
        </h2>
        <p>{t("generateVouchers")}</p>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t("generateMode")}</label>
            <select className="form-select" value={params.mode} onChange={(e) => update("mode", e.target.value as "hotspot" | "usermanager")}>
              <option value="hotspot">{t("hotspot")}</option>
              <option value="usermanager">{t("usermanager")}</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{t("quantity")}</label>
            <input className="form-input" type="number" min={1} max={500} value={params.quantity} onChange={(e) => update("quantity", parseInt(e.target.value, 10) || 1)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t("usernameLength")}</label>
            <input className="form-input" type="number" min={3} max={20} value={params.usernameLength} onChange={(e) => update("usernameLength", parseInt(e.target.value, 10) || 6)} />
          </div>
          <div className="form-group">
            <label className="form-label">{t("passwordLength")}</label>
            <input className="form-input" type="number" min={4} max={20} value={params.passwordLength} onChange={(e) => update("passwordLength", parseInt(e.target.value, 10) || 8)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t("profileLimit")}</label>
            <input className="form-input" value={params.profile} onChange={(e) => update("profile", e.target.value)} placeholder={t("defaultProfile")} />
          </div>
          <div className="form-group">
            <label className="form-label">{t("ssid")}</label>
            <input className="form-input" value={params.ssid} onChange={(e) => update("ssid", e.target.value)} dir="ltr" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t("timeLimit")} ({t("minutes")})</label>
            <input className="form-input" type="number" min={0} value={params.timeLimitMinutes} onChange={(e) => update("timeLimitMinutes", parseInt(e.target.value, 10) || 0)} />
          </div>
          <div className="form-group">
            <label className="form-label">{t("dataLimit")} ({t("mb")})</label>
            <input className="form-input" type="number" min={0} value={params.dataLimitMb} onChange={(e) => update("dataLimitMb", parseInt(e.target.value, 10) || 0)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t("cardPrice")}</label>
            <input className="form-input" type="number" min={0} value={params.price} onChange={(e) => update("price", parseFloat(e.target.value) || 0)} />
          </div>
          <div className="form-group">
            <label className="form-label">{t("expiryDays")} ({t("days")})</label>
            <input className="form-input" type="number" min={0} value={params.expiryDays} onChange={(e) => update("expiryDays", parseInt(e.target.value, 10) || 0)} />
          </div>
        </div>

        <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleGenerate} disabled={generating}>
          {generating ? <><Loader2 size={18} className="spin" /> {t("generating")}</> : <><Ticket size={18} /> {t("generateBtn")}</>}
        </button>
      </div>
    </div>
  );
}
