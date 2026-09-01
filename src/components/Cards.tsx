import { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import { Printer, FileDown, Ticket } from "lucide-react";
import { useApp } from "../context";
import { supabase, type Voucher } from "../lib/supabase";
import jsPDF from "jspdf";

type LayoutType = "a4" | "thermal";

export function Cards() {
  const { t, lang, toast } = useApp();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [layout, setLayout] = useState<LayoutType>("a4");
  const [qrCache, setQrCache] = useState<Record<string, string>>({});
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const idsRaw = sessionStorage.getItem("tagog-print-ids");
    let q = supabase.from("vouchers").select("*").order("created_at", { ascending: false }).limit(20);
    if (idsRaw) {
      const ids = JSON.parse(idsRaw) as string[];
      q = supabase.from("vouchers").select("*").in("id", ids);
      sessionStorage.removeItem("tagog-print-ids");
    }
    const { data } = await q;
    const list = (data as Voucher[]) || [];
    setVouchers(list);
    // generate QR codes
    const cache: Record<string, string> = {};
    for (const v of list) {
      const payload = `WIFI:S:${v.ssid};T:WPA;P:${v.password};;`;
      try {
        cache[v.id] = await QRCode.toDataURL(payload, { width: 120, margin: 1 });
      } catch {
        // ignore
      }
    }
    setQrCache(cache);
  }

  async function handlePrint() {
    if (vouchers.length === 0) {
      toast("error", t("noCardsSelected"));
      return;
    }
    window.print();
  }

  async function handleExportPdf() {
    if (vouchers.length === 0) {
      toast("error", t("noCardsSelected"));
      return;
    }
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageW = 210;
    const pageH = 297;
    const margin = 10;
    const gap = 4;
    const cols = layout === "a4" ? 2 : 1;
    const cardW = (pageW - margin * 2 - gap * (cols - 1)) / cols;
    const cardH = 50;
    const rowsPerPage = Math.floor((pageH - margin * 2) / (cardH + gap));

    for (let i = 0; i < vouchers.length; i++) {
      const pageIndex = Math.floor(i / (rowsPerPage * cols));
      if (i > 0 && i % (rowsPerPage * cols) === 0) pdf.addPage();
      const v = vouchers[i];
      const idxOnPage = i % (rowsPerPage * cols);
      const col = idxOnPage % cols;
      const row = Math.floor(idxOnPage / cols);
      const x = margin + col * (cardW + gap);
      const y = margin + row * (cardH + gap);

      // card border
      pdf.setDrawColor(14, 165, 233);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(x, y, cardW, cardH, 3, 3, "S");

      // stamp
      pdf.setFillColor(14, 165, 233);
      pdf.setFontSize(7);
      pdf.setTextColor(255, 255, 255);
      pdf.text("TAGOG HOTSPOT", x + cardW - 42, y + 4);

      // header
      pdf.setTextColor(2, 132, 199);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text(v.ssid, x + cardW / 2, y + 10, { align: "center" });
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      pdf.text("TAGOG HOTSPOT", x + cardW / 2, y + 14, { align: "center" });

      // QR
      const qr = qrCache[v.id];
      if (qr) {
        pdf.addImage(qr, "PNG", x + 3, y + 17, 22, 22);
      }

      // info
      pdf.setFontSize(8);
      const infoX = x + 28;
      pdf.setFont("helvetica", "normal");
      pdf.text(`${t("user")}:`, infoX, y + 20);
      pdf.setFont("helvetica", "bold");
      pdf.text(v.username, infoX + 18, y + 20);
      pdf.setFont("helvetica", "normal");
      pdf.text(`${t("password")}:`, infoX, y + 25);
      pdf.setFont("helvetica", "bold");
      pdf.text(v.password, infoX + 18, y + 25);
      pdf.setFont("helvetica", "normal");
      pdf.text(`${t("profileLimit")}:`, infoX, y + 30);
      pdf.setFont("helvetica", "bold");
      pdf.text(v.profile, infoX + 22, y + 30);
      pdf.setFont("helvetica", "normal");
      pdf.text(`${t("cardPrice")}:`, infoX, y + 35);
      pdf.setFont("helvetica", "bold");
      pdf.text(String(v.price), infoX + 18, y + 35);

      // footer
      pdf.setFontSize(6);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(80, 80, 80);
      const footer = lang === "ar"
        ? "Pour la licence, contactez ce numero: +23670097750"
        : "Pour la licence, contactez ce numero: +23670097750";
      pdf.text(footer, x + cardW / 2, y + cardH - 3, { align: "center", maxWidth: cardW - 6 });
      pdf.setTextColor(0, 0, 0);
    }

    pdf.save("TAGOG-HOTSPOT-vouchers.pdf");
    toast("success", t("success"));
  }

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Printer size={24} style={{ color: "var(--primary)" }} /> {t("cardDesign")}
          </h2>
          <p>{t("voucherCards")}</p>
        </div>
        <div className="no-print" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select className="form-select" style={{ width: "auto" }} value={layout} onChange={(e) => setLayout(e.target.value as LayoutType)}>
            <option value="a4">{t("a4Grid")}</option>
            <option value="thermal">{t("thermal")}</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={handlePrint}>
            <Printer size={14} /> {t("print")}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportPdf}>
            <FileDown size={14} /> {t("exportPdf")}
          </button>
        </div>
      </div>

      {vouchers.length === 0 ? (
        <div className="empty-state no-print">
          <Ticket size={48} />
          <p>{t("selectVouchers")}</p>
        </div>
      ) : (
        <>
          <div className="no-print">
            <div className={`voucher-grid ${layout}`}>
              {vouchers.map((v) => (
                <VoucherPreview key={v.id} v={v} qr={qrCache[v.id]} lang={lang} t={t} />
              ))}
            </div>
          </div>

          {/* Print area */}
          <div className="print-area" ref={printRef}>
            <div className="print-sheet">
              <div className={`print-grid ${layout}`}>
                {vouchers.map((v) => (
                  <PrintCard key={v.id} v={v} qr={qrCache[v.id]} lang={lang} t={t} />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function VoucherPreview({
  v, qr, lang, t,
}: {
  v: Voucher;
  qr?: string;
  lang: "ar" | "fr";
  t: (k: never) => string;
}) {
  const footer = lang === "ar"
    ? "للترخيص اتواصل على هذا الرقم: 23670097750+"
    : "Pour la licence, contactez ce numéro: +23670097750";
  return (
    <div className="voucher-card" dir="ltr">
      <div className="vc-stamp">TAGOG HOTSPOT</div>
      <div className="vc-header">
        <div className="vc-ssid">{v.ssid}</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>TAGOG HOTSPOT</div>
      </div>
      <div className="vc-body">
        <div className="vc-qr">{qr && <img src={qr} alt="QR" />}</div>
        <div className="vc-info">
          <div className="row"><span className="label">{t("user" as never)}</span><span className="val">{v.username}</span></div>
          <div className="row"><span className="label">{t("password" as never)}</span><span className="val">{v.password}</span></div>
          <div className="row"><span className="label">{t("profileLimit" as never)}</span><span className="val">{v.profile}</span></div>
          <div className="row"><span className="label">{t("cardPrice" as never)}</span><span className="val">{v.price}</span></div>
        </div>
      </div>
      <div className="vc-footer">{footer}</div>
    </div>
  );
}

function PrintCard({
  v, qr, lang, t,
}: {
  v: Voucher;
  qr?: string;
  lang: "ar" | "fr";
  t: (k: never) => string;
}) {
  const footer = lang === "ar"
    ? "للترخيص اتواصل على هذا الرقم: 23670097750+"
    : "Pour la licence, contactez ce numéro: +23670097750";
  return (
    <div className="print-card" dir="ltr">
      <div className="pc-stamp">TAGOG HOTSPOT</div>
      <div className="pc-header">
        <div className="pc-ssid">{v.ssid}</div>
        <div className="pc-brand">TAGOG HOTSPOT</div>
      </div>
      <div className="pc-body">
        {qr && <img className="pc-qr" src={qr} alt="QR" />}
        <div className="pc-info">
          <div className="row"><span>{t("user" as never)}</span><span className="val">{v.username}</span></div>
          <div className="row"><span>{t("password" as never)}</span><span className="val">{v.password}</span></div>
          <div className="row"><span>{t("profileLimit" as never)}</span><span className="val">{v.profile}</span></div>
          <div className="row"><span>{t("cardPrice" as never)}</span><span className="val">{v.price}</span></div>
        </div>
      </div>
      <div className="pc-footer">{footer}</div>
    </div>
  );
}
