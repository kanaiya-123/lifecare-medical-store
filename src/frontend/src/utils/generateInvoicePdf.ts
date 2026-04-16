import jsPDF from "jspdf";
import type { Bill } from "../backend";

// ─── Number to Words (Indian English) ────────────────────────────────────────
const ones = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const tens = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function wordsBelow1000(n: number): string {
  if (n === 0) return "";
  if (n < 20) return ones[n];
  if (n < 100)
    return `${tens[Math.floor(n / 10)]}${n % 10 !== 0 ? ` ${ones[n % 10]}` : ""}`;
  return `${ones[Math.floor(n / 100)]} Hundred${n % 100 !== 0 ? ` and ${wordsBelow1000(n % 100)}` : ""}`;
}

export function numberToWords(n: number): string {
  if (n === 0) return "Zero Rupees only";
  const crore = Math.floor(n / 10_000_000);
  const lakh = Math.floor((n % 10_000_000) / 100_000);
  const thousand = Math.floor((n % 100_000) / 1_000);
  const rest = n % 1_000;

  let result = "";
  if (crore) result += `${wordsBelow1000(crore)} Crore `;
  if (lakh) result += `${wordsBelow1000(lakh)} Lakh `;
  if (thousand) result += `${wordsBelow1000(thousand)} Thousand `;
  if (rest) result += wordsBelow1000(rest);
  return `${result.trim()} Rupees only`;
}

// ─── PDF Generator ────────────────────────────────────────────────────────────
export function generateInvoicePdf(bill: Bill): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth(); // 210mm
  const ml = 14;
  const mr = 14;
  const rw = pw - ml - mr; // 182mm
  let y = 14;

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const BLUE: [number, number, number] = [21, 101, 192]; // #1565C0
  const DARK: [number, number, number] = [26, 26, 26];

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

  // ─── HEADER (centered) ──────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...DARK);
  doc.text("LIFE CARE MEDICAL & GENERAL STORE", pw / 2, y, { align: "center" });
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("Shop No 5 Burj Mastana, New Vavol, Gandhinagar", pw / 2, y, {
    align: "center",
  });
  y += 5;
  doc.text("Ph: 6351499478", pw / 2, y, { align: "center" });
  y += 5;

  // Blue line under header
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.8);
  doc.line(ml, y, pw - mr, y);
  doc.setLineWidth(0.2);
  y += 5;

  // "Bill of Supply" centered title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...BLUE);
  doc.text("Bill of Supply", pw / 2, y, { align: "center" });
  y += 3;
  hline(y, BLUE);
  y += 6;

  // ─── BILL TO + INVOICE DETAILS ───────────────────────────────────────────────
  const col2X = pw / 2 + 4;
  const secTopY = y;

  // Left: Bill To label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...BLUE);
  doc.text("BILL TO", ml, y);
  y += 5;

  const custGstin = bill.customerGstin ?? "";
  const placeSupply = bill.placeOfSupply ?? "Gujarat";
  const payMode = bill.paymentMode ?? "Cash";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text(bill.customerName, ml, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(70, 70, 70);
  doc.text(`Contact No: ${bill.customerMobile}`, ml, y);
  y += 4.5;

  if (custGstin) {
    doc.text(`GSTIN Number: ${custGstin}`, ml, y);
    y += 4.5;
  }

  doc.text(`State: ${placeSupply}`, ml, y);

  // Right: Invoice Details label
  let ry = secTopY;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...BLUE);
  doc.text("INVOICE DETAILS", pw - mr, ry, { align: "right" });
  ry += 5;

  const dateObj = new Date(Number(bill.createdAt) / 1_000_000);
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const mm2 = String(dateObj.getMonth() + 1).padStart(2, "0");
  const yyyy = dateObj.getFullYear();
  const dateStr = `${dd}-${mm2}-${yyyy}`;

  const invoiceDetails: Array<[string, string]> = [
    ["Invoice No:", bill.invoiceNumber],
    ["Date:", dateStr],
    ["Place of Supply:", placeSupply],
  ];

  doc.setFontSize(9);
  for (const [label, val] of invoiceDetails) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(label, col2X + 22, ry);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text(val, pw - mr, ry, { align: "right" });
    ry += 4.8;
  }

  y = Math.max(y, ry) + 5;
  hline(y, [200, 200, 200]);
  y += 3;

  // ─── ITEMS TABLE ─────────────────────────────────────────────────────────────
  const colDefs = {
    num: { x: ml, w: 8, align: "left" as const },
    name: { x: ml + 8, w: 56, align: "left" as const },
    hsn: { x: ml + 64, w: 24, align: "center" as const },
    qty: { x: ml + 88, w: 16, align: "center" as const },
    price: { x: ml + 104, w: 26, align: "right" as const },
    disc: { x: ml + 130, w: 16, align: "center" as const },
    amt: { x: ml + 146, w: rw - 146, align: "right" as const },
  };

  const headerH = 8.5;
  const rowH = 7;

  // Header row
  fillRect(ml, y, rw, headerH, BLUE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);

  const headerLabels: Array<{ col: keyof typeof colDefs; text: string }> = [
    { col: "num", text: "#" },
    { col: "name", text: "Item Name" },
    { col: "hsn", text: "HSN/SAC" },
    { col: "qty", text: "Qty" },
    { col: "price", text: "Price/Unit" },
    { col: "disc", text: "Disc%" },
    { col: "amt", text: "Taxable Amt" },
  ];

  const hTy = y + headerH - 2.5;
  for (const h of headerLabels) {
    const c = colDefs[h.col];
    const tx =
      c.align === "right"
        ? c.x + c.w
        : c.align === "center"
          ? c.x + c.w / 2
          : c.x + (h.col === "num" ? 1 : 0);
    doc.text(h.text, tx, hTy, { align: c.align });
  }

  let iy = y + headerH;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  for (let i = 0; i < bill.items.length; i++) {
    const item = bill.items[i];
    const hsnVal = (item as typeof item & { hsnSac?: string }).hsnSac ?? "—";
    const lineGross = Number(item.quantity) * item.price;
    const lineDisc = lineGross * (item.discount / 100);
    const lineTaxable = lineGross - lineDisc;

    if (i % 2 !== 0) {
      fillRect(ml, iy, rw, rowH, [240, 246, 255]);
    }

    doc.setTextColor(30, 30, 30);
    const rY = iy + rowH - 2;
    doc.text(String(i + 1), colDefs.num.x + 1, rY);
    doc.text(item.medicineName.substring(0, 28), colDefs.name.x, rY);
    doc.text(hsnVal, colDefs.hsn.x + colDefs.hsn.w / 2, rY, {
      align: "center",
    });
    doc.text(
      String(Number(item.quantity)),
      colDefs.qty.x + colDefs.qty.w / 2,
      rY,
      { align: "center" },
    );
    doc.text(
      `Rs.${item.price.toFixed(2)}`,
      colDefs.price.x + colDefs.price.w,
      rY,
      { align: "right" },
    );
    doc.text(`${item.discount}%`, colDefs.disc.x + colDefs.disc.w / 2, rY, {
      align: "center",
    });
    doc.text(
      `Rs.${lineTaxable.toFixed(2)}`,
      colDefs.amt.x + colDefs.amt.w,
      rY,
      { align: "right" },
    );

    doc.setDrawColor(220, 228, 240);
    doc.line(ml, iy + rowH, ml + rw, iy + rowH);
    iy += rowH;
  }

  // Gross Total row
  // taxableAmt = gross - discount (per-item: qty*price*(1-disc%))
  const taxableAmt =
    bill.subtotal ??
    bill.items.reduce(
      (s, item) =>
        s + Number(item.quantity) * item.price * (1 - item.discount / 100),
      0,
    );
  const discountAmt = bill.discountAmount ?? 0;
  const totalAmt = bill.totalAmount ?? taxableAmt + (bill.gstAmount ?? 0);
  const grossAmt = taxableAmt + discountAmt;
  const gstAmt = bill.gstAmount ?? 0;
  const gstPct = bill.gstPercent ?? 0;

  doc.setDrawColor(...(BLUE as [number, number, number]));
  doc.setLineWidth(0.5);
  doc.line(ml, iy, ml + rw, iy);
  doc.setLineWidth(0.2);

  iy += rowH;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text("Gross Total", colDefs.price.x + colDefs.price.w, iy - 1.5, {
    align: "right",
  });
  doc.text(
    `Rs.${grossAmt.toFixed(2)}`,
    colDefs.amt.x + colDefs.amt.w,
    iy - 1.5,
    { align: "right" },
  );

  y = iy + 5;
  hline(y, [200, 200, 200]);
  y += 5;

  // ─── BOTTOM 2-COL: Amount in Words + Summary ──────────────────────────────
  const receivedAmt = bill.receivedAmount ?? totalAmt;
  const balanceAmt = bill.balanceAmount ?? 0;
  const amtWords = numberToWords(Math.round(totalAmt));

  const botLeft = ml;
  const botMid = pw / 2;
  const botRight = pw - mr;
  const botLW = botMid - botLeft - 4;

  const bottomStartY = y;

  // Left: Amount in Words
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text("AMOUNT IN WORDS", botLeft, y);
  y += 5;

  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(9);
  doc.setTextColor(...BLUE);
  const wrappedWords = doc.splitTextToSize(amtWords, botLW);
  doc.text(wrappedWords, botLeft, y);
  const wordsBlockH = wrappedWords.length * 5;
  y += wordsBlockH + 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text("TERMS & CONDITIONS", botLeft, y);
  y += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text("Thank you for doing business with us.", botLeft, y);
  y += 10;

  // Right: Summary rows
  const sumRows: Array<{
    label: string;
    value: string;
    highlight?: boolean;
    valueColor?: [number, number, number];
    skip?: boolean;
  }> = [
    { label: "Gross Amount", value: `Rs.${grossAmt.toFixed(2)}` },
    {
      label: "Less: Discount",
      value: `-Rs.${discountAmt.toFixed(2)}`,
      valueColor: [198, 40, 40] as [number, number, number],
      skip: discountAmt === 0,
    },
    { label: "Taxable Amount", value: `Rs.${taxableAmt.toFixed(2)}` },
    {
      label: `GST (${gstPct}%)`,
      value: `+Rs.${gstAmt.toFixed(2)}`,
      skip: gstPct === 0,
    },
    { label: "Total", value: `Rs.${totalAmt.toFixed(2)}`, highlight: true },
    {
      label: "Received",
      value: `Rs.${receivedAmt.toFixed(2)}`,
      valueColor: [46, 125, 50],
    },
    {
      label: "Balance",
      value: `Rs.${balanceAmt.toFixed(2)}`,
      valueColor: balanceAmt > 0 ? [198, 40, 40] : [46, 125, 50],
    },
    { label: "Payment Mode", value: payMode },
    { label: "Previous Balance", value: "Rs.0.00" },
    {
      label: "Current Balance",
      value: `Rs.${balanceAmt.toFixed(2)}`,
      valueColor: balanceAmt > 0 ? [198, 40, 40] : [46, 125, 50],
    },
  ];

  const sumRowH = 6.5;
  let sy = bottomStartY;
  const sumW = botRight - botMid - 2;

  for (const row of sumRows) {
    if (row.skip) continue;
    if (row.highlight) {
      fillRect(botMid, sy, sumW, sumRowH, BLUE);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(row.label, botMid + 3, sy + sumRowH - 2);
      doc.text(row.value, botRight, sy + sumRowH - 2, { align: "right" });
    } else {
      doc.setDrawColor(220, 220, 220);
      doc.line(botMid, sy + sumRowH, botRight, sy + sumRowH);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(80, 80, 80);
      doc.text(row.label, botMid + 3, sy + sumRowH - 2);
      if (row.valueColor) {
        doc.setTextColor(...row.valueColor);
        doc.setFont("helvetica", "bold");
      } else {
        doc.setTextColor(30, 30, 30);
      }
      doc.text(row.value, botRight, sy + sumRowH - 2, { align: "right" });
    }
    sy += sumRowH;
  }

  y = Math.max(y, sy) + 8;
  hline(y - 4, [200, 200, 200]);

  // ─── FOOTER: Bank Details + Signatory ───────────────────────────────────────
  const footerY = y;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text("BANK DETAILS", botLeft, footerY);

  const bankLines: Array<[string, string]> = [
    ["Bank Name:", "Punjab And Sind Bank, Gandhinagar"],
    ["Account No:", "12801000004020"],
    ["IFSC Code:", "PSIB0002180"],
    ["Account Holder Name:", "MAHAMAD SHAIKH"],
  ];

  let by = footerY + 5;
  doc.setFontSize(8.5);
  for (const [label, val] of bankLines) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(label, botLeft, by);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    const lw = doc.getTextWidth(label) + 2;
    doc.text(val, botLeft + lw, by);
    by += 4.5;
  }

  // Signatory (right side)
  const sigX = botRight;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text("For: LIFE CARE MEDICAL & GENERAL STORE", sigX, footerY, {
    align: "right",
  });

  // Dashed signature box — drawn with short line segments to simulate dash
  const boxX = sigX - 44;
  const boxY = footerY + 4;
  const boxW = 44;
  const boxH = 16;
  doc.setDrawColor(170, 170, 170);
  // Draw dashed border by drawing short segments
  const dashLen = 2;
  const gapLen = 1.5;
  function dashedLine(x1: number, y1: number, x2: number, y2: number) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / len;
    const uy = dy / len;
    let d = 0;
    let drawing = true;
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
  dashedLine(boxX, boxY, boxX + boxW, boxY);
  dashedLine(boxX + boxW, boxY, boxX + boxW, boxY + boxH);
  dashedLine(boxX + boxW, boxY + boxH, boxX, boxY + boxH);
  dashedLine(boxX, boxY + boxH, boxX, boxY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text("Authorized Signatory", sigX, boxY + boxH + 4, { align: "right" });

  doc.save(`Invoice-${bill.invoiceNumber}.pdf`);
}
