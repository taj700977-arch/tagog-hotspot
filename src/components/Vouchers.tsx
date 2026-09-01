import { useEffect, useState, useCallback } from "react";
import { Ticket, Trash2, Printer, Search, Filter } from "lucide-react";
import { useApp } from "../context";
import { supabase, type Voucher } from "../lib/supabase";

export function Vouchers({ goToCards }: { goToCards: () => void }) {
  const { t, toast } = useApp();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("vouchers").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setVouchers((data as Voucher[]) || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  // auto-mark expired
  useEffect(() => {
    const now = new Date().toISOString();
    const expired = vouchers.filter((v) => v.status === "active" && v.expires_at && v.expires_at < now);
    if (expired.length > 0) {
      supabase.from("vouchers").update({ status: "expired" }).in("id", expired.map((v) => v.id)).then(() => load());
    }
  }, [vouchers, load]);

  const filtered = vouchers.filter(
    (v) =>
      v.username.toLowerCase().includes(search.toLowerCase()) ||
      v.password.toLowerCase().includes(search.toLowerCase())
  );

  function toggleSelect(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function selectAll() {
    setSelected((s) => {
      if (s.size === filtered.length) return new Set();
      return new Set(filtered.map((v) => v.id));
    });
  }

  async function purgeExpired() {
    if (!confirm(t("confirmPurge"))) return;
    const { error } = await supabase.from("vouchers").update({ status: "purged" }).eq("status", "expired");
    if (error) toast("error", t("error"));
    else {
      toast("success", t("success"));
      load();
    }
  }

  async function purgeUsed() {
    const { error } = await supabase.from("vouchers").update({ status: "purged" }).eq("status", "used");
    if (error) toast("error", t("error"));
    else {
      toast("success", t("success"));
      load();
    }
  }

  async function deleteAll() {
    if (!confirm(t("confirmDeleteAll"))) return;
    const { error } = await supabase.from("vouchers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) toast("error", t("error"));
    else {
      toast("success", t("success"));
      load();
    }
  }

  async function deleteOne(id: string) {
    await supabase.from("vouchers").delete().eq("id", id);
    load();
  }

  function printSelected() {
    if (selected.size === 0) {
      toast("error", t("noCardsSelected"));
      return;
    }
    const ids = Array.from(selected);
    sessionStorage.setItem("tagog-print-ids", JSON.stringify(ids));
    goToCards();
  }

  const statusOptions = ["all", "active", "used", "expired", "purged"];

  return (
    <div>
      <div className="page-header">
        <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Ticket size={24} style={{ color: "var(--primary)" }} /> {t("voucherManagement")}
        </h2>
        <p>{vouchers.length} {t("total")}</p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ position: "absolute", top: 12, insetInlineStart: 12, color: "var(--text-dim)" }} />
            <input className="form-input" style={{ paddingInlineStart: 36 }} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("search")} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Filter size={16} style={{ color: "var(--text-muted)" }} />
            <select className="form-select" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: "auto" }}>
              {statusOptions.map((s) => (
                <option key={s} value={s}>{t(s as never)}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={purgeExpired}><Trash2 size={14} /> {t("purgeExpired")}</button>
          <button className="btn btn-secondary btn-sm" onClick={purgeUsed}><Trash2 size={14} /> {t("purgeUsed")}</button>
          <button className="btn btn-danger btn-sm" onClick={deleteAll}><Trash2 size={14} /> {t("deleteAll")}</button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><p>{t("loading")}</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Ticket size={48} />
          <p>{t("noVouchers")}</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
            <button className="btn btn-ghost btn-sm" onClick={selectAll}>
              <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} readOnly style={{ marginRight: 6 }} />
              {t("selectAll")}
            </button>
            <button className="btn btn-primary btn-sm" onClick={printSelected}>
              <Printer size={14} /> {t("printSelected")} ({selected.size})
            </button>
          </div>
          <div className="table-wrap" style={{ border: "none", borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th className="checkbox-cell"></th>
                  <th>{t("user")}</th>
                  <th>{t("password")}</th>
                  <th>{t("profileLimit")}</th>
                  <th>{t("cardPrice")}</th>
                  <th>{t("ssid")}</th>
                  <th>{t("filterStatus")}</th>
                  <th>{t("createdAt")}</th>
                  <th>{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v.id}>
                    <td className="checkbox-cell">
                      <input type="checkbox" checked={selected.has(v.id)} onChange={() => toggleSelect(v.id)} />
                    </td>
                    <td style={{ fontWeight: 700, fontFamily: "monospace" }} dir="ltr">{v.username}</td>
                    <td style={{ fontFamily: "monospace" }} dir="ltr">{v.password}</td>
                    <td dir="ltr">{v.profile}</td>
                    <td dir="ltr">{v.price}</td>
                    <td dir="ltr">{v.ssid}</td>
                    <td><span className={`badge ${v.status}`}>{t(v.status as never)}</span></td>
                    <td dir="ltr" style={{ fontSize: 11, color: "var(--text-muted)" }}>{new Date(v.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => deleteOne(v.id)}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
