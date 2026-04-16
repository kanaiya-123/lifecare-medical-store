import jsPDF from "jspdf";
import type { Supplier, SupplierBill } from "../backend";

const BLUE: [number, number, number] = [21, 101, 192];
const DARK: [number, number, number] = [26, 26, 26];

function dashedLine(
  doc: jsPDF,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len;
  const uy = dy / len;
  let d = 0;
  let drawing = true;
  const dashLen = 2;
  const gapLen = 1.5;
  while (d < len) {
    const segLen = Math.min(drawing ? dashLen : gapLen, len - d);
    if (drawing) {
      doc.line(
        x1 + ux * d,
        y1 + uy * d,
        x1 + ux * (d + segLen),
        y1 + uy * (d + segLen),
      );
    }
    d += segLen;
    drawing = !drawing;
  }
}

export function generateSupplierBillPdf(
  bill: SupplierBill,
  supplier: Supplier,
): void {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });
  const pw = doc.internal.pageSize.getWidth(); // 297mm landscape
  const ph = doc.internal.pageSize.getHeight(); // 210mm
  const ml = 10;
  const mr = 10;
  const rw = pw - ml - mr;
  let y = 12;

  function hline(
    yy: number,
    color: [number, number, number] = [200, 200, 200],
  ) {
    doc.setDrawColor(...color);
    doc.line(ml, yy, pw - mr, yy);
  }

  function fillRect(
    x: number,
    yy: number,
    w: number,
    h: number,
    rgb: [number, number, number],
  ) {
    doc.setFillColor(...rgb);
    doc.rect(x, yy, w, h, "F");
  }

  // ── STORE HEADER ──────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...DARK);
  doc.text("LIFE CARE MEDICAL & GENERAL STORE", pw / 2, y, { align: "center" });
  y += 5.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text("Shop No 5 Burj Mastana, New Vavol, Gandhinagar", pw / 2, y, {
    align: "center",
  });
  y += 4.5;
  doc.text("Ph: 6351499478", pw / 2, y, { align: "center" });
  y += 4;

  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.8);
  doc.line(ml, y, pw - mr, y);
  doc.setLineWidth(0.2);
  y += 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BLUE);
  doc.text("Purchase Bill (GST Invoice)", pw / 2, y, { align: "center" });
  y += 2.5;
  hline(y, BLUE);
  y += 5;

  // ── SUPPLIER INFO + INVOICE DETAILS ──────────────────────────────────────
  const midX = pw / 2 + 4;
  const secTopY = y;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...BLUE);
  doc.text("SUPPLIER", ml, y);
  y += 4.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text(supplier.name, ml, y);
  y += 4.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(70, 70, 70);
  doc.text(`Mobile: ${supplier.mobile}`, ml, y);
  y += 4;
  if (supplier.email) {
    doc.text(`Email: ${supplier.email}`, ml, y);
    y += 4;
  }
  if (supplier.gstNo) {
    doc.text(`GST No: ${supplier.gstNo}`, ml, y);
    y += 4;
  }
  if (supplier.address) {
    doc.text(supplier.address, ml, y);
    y += 4;
  }

  // Right: Invoice Details
  const d = new Date(Number(bill.date));
  const ds = `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;

  let ry = secTopY;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...BLUE);
  doc.text("INVOICE DETAILS", pw - mr, ry, { align: "right" });
  ry += 4.5;

  const invoiceRows: Array<[string, string]> = [
    ["Invoice No:", bill.invoiceNo],
    ["Date:", ds],
    ...(bill.challanNo
      ? [["Challan No:", bill.challanNo] as [string, string]]
      : []),
    ...(bill.salesMan
      ? [["Sales Man:", bill.salesMan] as [string, string]]
      : []),
    ...(bill.transport
      ? [["Transport:", bill.transport] as [string, string]]
      : []),
    ...(bill.lrNo ? [["L.R.No:", bill.lrNo] as [string, string]] : []),
  ];

  doc.setFontSize(8.5);
  for (const [label, val] of invoiceRows) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(label, midX + 20, ry);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text(val, pw - mr, ry, { align: "right" });
    ry += 4.5;
  }

  y = Math.max(y, ry) + 3;
  hline(y, [200, 200, 200]);
  y += 3;

  // ── ITEMS TABLE ───────────────────────────────────────────────────────────
  // Columns: Sn | Item Name | HSN | Pack | Mfg | M.R.P. | Batch No. | Exp.Dt | Qty | Free | Rate | Disc% | N.Amt | Gst% | Amount
  type ColKey =
    | "sn"
    | "name"
    | "hsn"
    | "pack"
    | "mfg"
    | "mrp"
    | "batch"
    | "exp"
    | "qty"
    | "free"
    | "rate"
    | "disc"
    | "namt"
    | "gst"
    | "amt";
  const cols: Record<
    ColKey,
    { x: number; w: number; align: "left" | "center" | "right"; label: string }
  > = {
    sn: { x: ml, w: 7, align: "left", label: "Sn" },
    name: { x: ml + 7, w: 38, align: "left", label: "Item Name" },
    hsn: { x: ml + 45, w: 16, align: "center", label: "HSN" },
    pack: { x: ml + 61, w: 13, align: "center", label: "Pack" },
    mfg: { x: ml + 74, w: 18, align: "center", label: "Mfg" },
    mrp: { x: ml + 92, w: 16, align: "right", label: "M.R.P." },
    batch: { x: ml + 108, w: 18, align: "center", label: "Batch No." },
    exp: { x: ml + 126, w: 14, align: "center", label: "Exp.Dt" },
    qty: { x: ml + 140, w: 13, align: "center", label: "Qty" },
    free: { x: ml + 153, w: 12, align: "center", label: "Free" },
    rate: { x: ml + 165, w: 18, align: "right", label: "Rate" },
    disc: { x: ml + 183, w: 13, align: "center", label: "Disc%" },
    namt: { x: ml + 196, w: 20, align: "right", label: "N.Amt" },
    gst: { x: ml + 216, w: 12, align: "center", label: "Gst%" },
    amt: { x: ml + 228, w: rw - 228, align: "right", label: "Amount" },
  };

  const headerH = 7.5;
  const rowH = 6;

  fillRect(ml, y, rw, headerH, BLUE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);

  const hTy = y + headerH - 2;
  for (const [, col] of Object.entries(cols)) {
    const tx =
      col.align === "right"
        ? col.x + col.w
        : col.align === "center"
          ? col.x + col.w / 2
          : col.x + 1;
    doc.text(col.label, tx, hTy, { align: col.align });
  }

  let iy = y + headerH;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);

  for (let i = 0; i < bill.items.length; i++) {
    const item = bill.items[i];
    if (i % 2 !== 0) fillRect(ml, iy, rw, rowH, [240, 246, 255]);
    doc.setTextColor(30, 30, 30);
    const rY = iy + rowH - 1.8;

    function cellText(key: ColKey, text: string) {
      const col = cols[key];
      const tx =
        col.align === "right"
          ? col.x + col.w
          : col.align === "center"
            ? col.x + col.w / 2
            : col.x + 1;
      doc.text(text, tx, rY, { align: col.align });
    }

    cellText("sn", String(Number(item.sn)));
    cellText("name", item.itemName.substring(0, 22));
    cellText("hsn", item.hsn);
    cellText("pack", item.pack);
    cellText("mfg", item.mfg.substring(0, 10));
    cellText("mrp", item.mrp.toFixed(2));
    cellText("batch", item.batchNo);
    cellText("exp", item.expDt);
    cellText("qty", String(Number(item.qty)));
    cellText("free", String(Number(item.free)));
    cellText("rate", item.rate.toFixed(2));
    cellText("disc", `${item.discPercent}%`);
    cellText("namt", item.netAmt.toFixed(2));
    cellText("gst", `${item.gstPercent}%`);
    cellText("amt", `Rs.${item.amount.toFixed(2)}`);

    doc.setDrawColor(220, 228, 240);
    doc.line(ml, iy + rowH, ml + rw, iy + rowH);
    iy += rowH;
  }

  // Items total row
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.5);
  doc.line(ml, iy, ml + rw, iy);
  doc.setLineWidth(0.2);
  iy += rowH;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  const itemTotal = bill.items.reduce((s, it) => s + it.amount, 0);
  doc.text("Total", cols.namt.x + cols.namt.w, iy - 1.5, { align: "right" });
  doc.text(`Rs.${itemTotal.toFixed(2)}`, cols.amt.x + cols.amt.w, iy - 1.5, {
    align: "right",
  });

  y = iy + 4;
  hline(y, [200, 200, 200]);
  y += 4;

  // ── FOOTER: Totals + Bank + Signatory ─────────────────────────────────────
  const thirdW = rw / 3 - 4;
  const col1X = ml;
  const col2Xf = ml + rw / 3 + 2;
  const col3X = ml + (rw * 2) / 3 + 2;

  // Col 1: Bank details + terms
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text("BANK DETAILS", col1X, y);
  let by = y + 4.5;
  const bankLines: Array<[string, string]> = [
    ["Bank:", "Punjab And Sind Bank, Gandhinagar"],
    ["Acct No:", "12801000004020"],
    ["IFSC:", "PSIB0002180"],
    ["Holder:", "MAHAMAD SHAIKH"],
  ];
  doc.setFontSize(7.5);
  for (const [label, val] of bankLines) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(label, col1X, by);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text(val, col1X + doc.getTextWidth(label) + 1.5, by);
    by += 4;
  }

  if (bill.termsConditions) {
    by += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text("TERMS & CONDITIONS", col1X, by);
    by += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    const wrapped = doc.splitTextToSize(bill.termsConditions, thirdW);
    doc.text(wrapped, col1X, by);
  }

  // Col 2: Footer totals table
  const footerRows: Array<{ label: string; val: string; highlight?: boolean }> =
    [
      { label: "SGST Amount", val: `Rs.${bill.sgstAmount.toFixed(2)}` },
      { label: "CGST Amount", val: `Rs.${bill.cgstAmount.toFixed(2)}` },
      {
        label: "Cash Discount",
        val: `-Rs.${bill.cashDiscountTotal.toFixed(2)}`,
      },
      {
        label: "Scheme Discount",
        val: `-Rs.${bill.schemeDiscountTotal.toFixed(2)}`,
      },
      { label: "Add/Less CN/DN", val: `Rs.${bill.addLessCnDn.toFixed(2)}` },
      {
        label: "Freight/Pkt Charge",
        val: `Rs.${bill.freightPktCharge.toFixed(2)}`,
      },
      { label: "Round Off", val: `Rs.${bill.roundOff.toFixed(2)}` },
      {
        label: "GRAND TOTAL",
        val: `Rs.${bill.grandTotal.toFixed(2)}`,
        highlight: true,
      },
    ];

  const fRowH = 5.5;
  let fy = y;
  const fRight = col2Xf + thirdW + 4;

  for (const row of footerRows) {
    if (row.highlight) {
      fillRect(col2Xf, fy, thirdW + 4, fRowH, BLUE);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text(row.label, col2Xf + 2, fy + fRowH - 1.5);
      doc.text(row.val, fRight, fy + fRowH - 1.5, { align: "right" });
    } else {
      doc.setDrawColor(220, 220, 220);
      doc.line(col2Xf, fy + fRowH, fRight, fy + fRowH);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(80, 80, 80);
      doc.text(row.label, col2Xf + 2, fy + fRowH - 1.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...DARK);
      doc.text(row.val, fRight, fy + fRowH - 1.5, { align: "right" });
    }
    fy += fRowH;
  }

  // Col 3: Authorized Signatory
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text("For: LIFE CARE MEDICAL & GENERAL STORE", col3X, y);

  const sigBoxX = col3X;
  const sigBoxY = y + 4;
  const sigBoxW = thirdW;
  const sigBoxH = 16;
  doc.setDrawColor(170, 170, 170);
  dashedLine(doc, sigBoxX, sigBoxY, sigBoxX + sigBoxW, sigBoxY);
  dashedLine(
    doc,
    sigBoxX + sigBoxW,
    sigBoxY,
    sigBoxX + sigBoxW,
    sigBoxY + sigBoxH,
  );
  dashedLine(
    doc,
    sigBoxX + sigBoxW,
    sigBoxY + sigBoxH,
    sigBoxX,
    sigBoxY + sigBoxH,
  );
  dashedLine(doc, sigBoxX, sigBoxY + sigBoxH, sigBoxX, sigBoxY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text(
    "Authorized Signatory",
    sigBoxX + sigBoxW / 2,
    sigBoxY + sigBoxH + 4,
    { align: "center" },
  );

  // Ensure content stays on page
  if (ph > 0) {
    // Page height used for layout only — jsPDF handles overflow
  }

  doc.save(`PurchaseBill-${bill.invoiceNo}.pdf`);
}
