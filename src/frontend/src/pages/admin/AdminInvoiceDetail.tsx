import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Download, MessageCircle, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { useActor } from "../../hooks/useActor";
import type { Bill } from "../../hooks/useActor";
import {
  generateInvoicePdf,
  numberToWords,
} from "../../utils/generateInvoicePdf";

export default function AdminInvoiceDetail() {
  const { id } = useParams({ strict: false }) as { id?: string };
  const { actor } = useActor();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actor || !id) return;
    actor
      .getBill(BigInt(id))
      .then((b) => {
        setBill(b);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [actor, id]);

  const handleDownload = () => {
    if (!bill) return;
    generateInvoicePdf(bill);
  };

  if (loading) {
    return (
      <div
        data-ocid="invoice.loading_state"
        className="flex items-center justify-center h-40"
      >
        <div className="animate-spin w-8 h-8 border-4 border-[#2F8F66] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!bill) {
    return (
      <div
        data-ocid="invoice.error_state"
        className="bg-white rounded-xl p-8 text-center"
        style={{ color: "#666" }}
      >
        Invoice not found.
        <div className="mt-4">
          <Link to="/admin/invoices" className="text-[#2F8F66] hover:underline">
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  const invoiceNo = bill.invoiceNumber;
  const dateObj = new Date(Number(bill.createdAt) / 1_000_000);
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const yyyy = dateObj.getFullYear();
  const dateStr = `${dd}-${mm}-${yyyy}`;

  const subtotal =
    bill.subtotal ?? bill.items.reduce((s, i) => s + i.amount, 0);
  const discountAmt = bill.discountAmount ?? 0;
  // grossAmount = taxable + discount (subtotal here is already taxable after discount)
  const grossAmt = subtotal + discountAmt;
  const gstAmt = bill.gstAmount ?? 0;
  const gstPct = bill.gstPercent ?? 0;
  const totalAmt = bill.totalAmount ?? subtotal + gstAmt;
  const receivedAmt = bill.receivedAmount ?? totalAmt;
  const balanceAmt = bill.balanceAmount ?? 0;
  const payMode = bill.paymentMode ?? "Cash";
  const placeSupply = bill.placeOfSupply ?? "Gujarat";
  const custGstin = bill.customerGstin ?? "";
  const amtInWords = numberToWords(Math.round(totalAmt));

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Actions bar — hidden on print */}
      <div className="flex items-center justify-between no-print">
        <Link
          to="/admin/invoices"
          data-ocid="invoice.link"
          className="text-[#2F8F66] hover:underline text-sm flex items-center gap-1"
        >
          <ArrowLeft size={16} /> Back to Invoices
        </Link>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            data-ocid="invoice.print_button"
            className="flex items-center gap-2 text-white px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#2F8F66" }}
          >
            <Printer size={15} /> Print
          </button>
          <button
            type="button"
            onClick={handleDownload}
            data-ocid="invoice.download_button"
            className="flex items-center gap-2 text-white px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-colors"
            style={{ backgroundColor: "#1565C0" }}
          >
            <Download size={15} /> Download PDF
          </button>
          <a
            href={`https://wa.me/?text=Invoice ${invoiceNo} from Life Care Medical. Total: Rs.${totalAmt.toFixed(2)} Date: ${dateStr}`}
            target="_blank"
            rel="noreferrer"
            data-ocid="invoice.whatsapp_button"
            className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-green-600 transition-colors"
          >
            <MessageCircle size={15} /> WhatsApp
          </a>
        </div>
      </div>

      {/* ══════════════════ INVOICE CARD ══════════════════ */}
      <div
        id="invoice-print"
        className="bg-white shadow-md rounded-xl overflow-hidden"
        style={{
          fontFamily: "Arial, sans-serif",
          fontSize: "13px",
          border: "1px solid #e0e0e0",
        }}
      >
        {/* ── HEADER ── */}
        <div
          className="text-center px-8 pt-7 pb-4"
          style={{ borderBottom: "2px solid #1565C0" }}
        >
          <h1
            className="font-bold uppercase tracking-wider"
            style={{
              fontSize: "20px",
              color: "#1a1a1a",
              letterSpacing: "0.05em",
            }}
          >
            LIFE CARE MEDICAL &amp; GENERAL STORE
          </h1>
          <p className="mt-1" style={{ fontSize: "12px", color: "#555" }}>
            Shop No 5 Burj Mastana, New Vavol, Gandhinagar
          </p>
          <p style={{ fontSize: "12px", color: "#555" }}>Ph: 6351499478</p>

          {/* Bill of Supply Title */}
          <div className="mt-3">
            <span
              className="font-bold tracking-widest uppercase"
              style={{ fontSize: "15px", color: "#1565C0" }}
            >
              Bill of Supply
            </span>
          </div>
          <div
            style={{
              height: "2px",
              backgroundColor: "#1565C0",
              marginTop: "6px",
            }}
          />
        </div>

        {/* ── BILL TO + INVOICE DETAILS (2-col) ── */}
        <div
          className="grid grid-cols-2"
          style={{ borderBottom: "1px solid #ddd", padding: "14px 28px" }}
        >
          {/* Left: Bill To */}
          <div
            style={{ paddingRight: "16px", borderRight: "1px solid #e0e0e0" }}
          >
            <p
              className="font-bold uppercase tracking-widest"
              style={{
                fontSize: "10px",
                color: "#1565C0",
                marginBottom: "6px",
              }}
            >
              Bill To
            </p>
            <p
              className="font-bold"
              style={{ fontSize: "14px", color: "#1a1a1a" }}
            >
              {bill.customerName}
            </p>
            <p style={{ fontSize: "12px", color: "#555", marginTop: "3px" }}>
              Contact No: {bill.customerMobile}
            </p>
            {custGstin && (
              <p style={{ fontSize: "12px", color: "#555" }}>
                GSTIN Number: {custGstin}
              </p>
            )}
            <p style={{ fontSize: "12px", color: "#555" }}>
              State: {placeSupply}
            </p>
          </div>

          {/* Right: Invoice Details */}
          <div style={{ paddingLeft: "16px" }}>
            <p
              className="font-bold uppercase tracking-widest text-right"
              style={{
                fontSize: "10px",
                color: "#1565C0",
                marginBottom: "6px",
              }}
            >
              Invoice Details
            </p>
            <table className="w-full" style={{ fontSize: "12px" }}>
              <tbody>
                <tr>
                  <td
                    style={{
                      color: "#777",
                      paddingBottom: "3px",
                      width: "50%",
                    }}
                  >
                    Invoice No:
                  </td>
                  <td
                    className="text-right font-bold"
                    style={{ color: "#1a1a1a", paddingBottom: "3px" }}
                  >
                    {invoiceNo}
                  </td>
                </tr>
                <tr>
                  <td style={{ color: "#777", paddingBottom: "3px" }}>Date:</td>
                  <td
                    className="text-right font-semibold"
                    style={{ color: "#1a1a1a", paddingBottom: "3px" }}
                  >
                    {dateStr}
                  </td>
                </tr>
                <tr>
                  <td style={{ color: "#777" }}>Place of Supply:</td>
                  <td className="text-right" style={{ color: "#1a1a1a" }}>
                    {placeSupply}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── ITEMS TABLE ── */}
        <div style={{ padding: "0 28px 0 28px" }}>
          <table
            className="w-full"
            style={{ fontSize: "12px", borderCollapse: "collapse" }}
          >
            <thead>
              <tr style={{ backgroundColor: "#1565C0", color: "#fff" }}>
                <th
                  style={{
                    padding: "9px 8px",
                    textAlign: "left",
                    width: "32px",
                    fontWeight: 600,
                  }}
                >
                  #
                </th>
                <th
                  style={{
                    padding: "9px 8px",
                    textAlign: "left",
                    fontWeight: 600,
                  }}
                >
                  Item Name
                </th>
                <th
                  style={{
                    padding: "9px 8px",
                    textAlign: "center",
                    fontWeight: 600,
                  }}
                >
                  HSN/SAC
                </th>
                <th
                  style={{
                    padding: "9px 8px",
                    textAlign: "center",
                    fontWeight: 600,
                  }}
                >
                  Qty
                </th>
                <th
                  style={{
                    padding: "9px 8px",
                    textAlign: "right",
                    fontWeight: 600,
                  }}
                >
                  Price/Unit
                </th>
                <th
                  style={{
                    padding: "9px 8px",
                    textAlign: "center",
                    fontWeight: 600,
                  }}
                >
                  Disc%
                </th>
                <th
                  style={{
                    padding: "9px 8px",
                    textAlign: "right",
                    fontWeight: 600,
                  }}
                >
                  Taxable Amt
                </th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item, i) => {
                const hsnVal =
                  (item as typeof item & { hsnSac?: string }).hsnSac ?? "—";
                const lineGross = Number(item.quantity) * item.price;
                const lineDisc = lineGross * (item.discount / 100);
                const lineTaxable = lineGross - lineDisc;
                return (
                  <tr
                    key={item.medicineId.toString()}
                    style={{
                      backgroundColor: i % 2 === 0 ? "#fff" : "#f0f6ff",
                      borderBottom: "1px solid #e0e0e0",
                    }}
                  >
                    <td style={{ padding: "8px 8px", color: "#888" }}>
                      {i + 1}
                    </td>
                    <td style={{ padding: "8px 8px", fontWeight: 500 }}>
                      {item.medicineName}
                    </td>
                    <td
                      style={{
                        padding: "8px 8px",
                        textAlign: "center",
                        color: "#555",
                      }}
                    >
                      {hsnVal}
                    </td>
                    <td style={{ padding: "8px 8px", textAlign: "center" }}>
                      {Number(item.quantity)}
                    </td>
                    <td style={{ padding: "8px 8px", textAlign: "right" }}>
                      ₹{item.price.toFixed(2)}
                    </td>
                    <td
                      style={{
                        padding: "8px 8px",
                        textAlign: "center",
                        color: "#555",
                      }}
                    >
                      {item.discount}%
                    </td>
                    <td
                      style={{
                        padding: "8px 8px",
                        textAlign: "right",
                        fontWeight: 600,
                      }}
                    >
                      ₹{lineTaxable.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
              {/* Total row */}
              <tr style={{ borderTop: "2px solid #1565C0" }}>
                <td
                  colSpan={6}
                  style={{
                    padding: "8px 8px",
                    textAlign: "right",
                    fontWeight: 700,
                    color: "#1a1a1a",
                  }}
                >
                  Gross Total
                </td>
                <td
                  style={{
                    padding: "8px 8px",
                    textAlign: "right",
                    fontWeight: 700,
                    color: "#1a1a1a",
                  }}
                >
                  ₹{grossAmt.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── AMOUNT SUMMARY SECTION ── */}
        <div
          className="grid grid-cols-2"
          style={{
            padding: "16px 28px 16px 28px",
            borderTop: "1px solid #ddd",
          }}
        >
          {/* Left: Amount in words + T&C */}
          <div
            style={{ paddingRight: "16px", borderRight: "1px solid #e0e0e0" }}
          >
            <p
              className="font-bold uppercase tracking-widest"
              style={{ fontSize: "10px", color: "#888", marginBottom: "5px" }}
            >
              Amount in Words
            </p>
            <p
              className="font-semibold"
              style={{
                fontSize: "12px",
                color: "#1565C0",
                fontStyle: "italic",
              }}
            >
              {amtInWords}
            </p>

            <div style={{ marginTop: "16px" }}>
              <p
                className="font-bold uppercase tracking-widest"
                style={{ fontSize: "10px", color: "#888", marginBottom: "4px" }}
              >
                Terms &amp; Conditions
              </p>
              <p style={{ fontSize: "11px", color: "#666", lineHeight: "1.5" }}>
                Thank you for doing business with us.
              </p>
            </div>
          </div>

          {/* Right: Summary table */}
          <div style={{ paddingLeft: "16px" }}>
            <table
              className="w-full"
              style={{ fontSize: "12px", borderCollapse: "collapse" }}
            >
              <tbody>
                <tr style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "5px 4px", color: "#666" }}>
                    Gross Amount
                  </td>
                  <td
                    style={{
                      padding: "5px 4px",
                      textAlign: "right",
                      fontWeight: 500,
                    }}
                  >
                    ₹{grossAmt.toFixed(2)}
                  </td>
                </tr>
                {discountAmt > 0 && (
                  <tr style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "5px 4px", color: "#c62828" }}>
                      Less: Discount
                    </td>
                    <td
                      style={{
                        padding: "5px 4px",
                        textAlign: "right",
                        fontWeight: 500,
                        color: "#c62828",
                      }}
                    >
                      -₹{discountAmt.toFixed(2)}
                    </td>
                  </tr>
                )}
                <tr style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "5px 4px", color: "#666" }}>
                    Taxable Amount
                  </td>
                  <td
                    style={{
                      padding: "5px 4px",
                      textAlign: "right",
                      fontWeight: 500,
                    }}
                  >
                    ₹{subtotal.toFixed(2)}
                  </td>
                </tr>
                {gstPct > 0 && (
                  <tr style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "5px 4px", color: "#666" }}>
                      GST ({gstPct}%)
                    </td>
                    <td
                      style={{
                        padding: "5px 4px",
                        textAlign: "right",
                        fontWeight: 500,
                      }}
                    >
                      +₹{gstAmt.toFixed(2)}
                    </td>
                  </tr>
                )}
                {/* Total — blue highlight */}
                <tr style={{ backgroundColor: "#1565C0" }}>
                  <td
                    style={{
                      padding: "7px 6px",
                      color: "#fff",
                      fontWeight: 700,
                    }}
                  >
                    Total
                  </td>
                  <td
                    style={{
                      padding: "7px 6px",
                      textAlign: "right",
                      color: "#fff",
                      fontWeight: 700,
                    }}
                  >
                    ₹{totalAmt.toFixed(2)}
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "5px 4px", color: "#666" }}>
                    Received
                  </td>
                  <td
                    style={{
                      padding: "5px 4px",
                      textAlign: "right",
                      fontWeight: 500,
                      color: "#2e7d32",
                    }}
                  >
                    ₹{receivedAmt.toFixed(2)}
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "5px 4px", color: "#666" }}>Balance</td>
                  <td
                    style={{
                      padding: "5px 4px",
                      textAlign: "right",
                      fontWeight: 600,
                      color: balanceAmt > 0 ? "#c62828" : "#2e7d32",
                    }}
                  >
                    ₹{balanceAmt.toFixed(2)}
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "5px 4px", color: "#666" }}>
                    Payment Mode
                  </td>
                  <td
                    style={{
                      padding: "5px 4px",
                      textAlign: "right",
                      fontWeight: 500,
                    }}
                  >
                    {payMode}
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "5px 4px", color: "#666" }}>
                    Previous Balance
                  </td>
                  <td
                    style={{
                      padding: "5px 4px",
                      textAlign: "right",
                      fontWeight: 500,
                    }}
                  >
                    ₹0.00
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "5px 4px", color: "#666" }}>
                    Current Balance
                  </td>
                  <td
                    style={{
                      padding: "5px 4px",
                      textAlign: "right",
                      fontWeight: 600,
                      color: balanceAmt > 0 ? "#c62828" : "#2e7d32",
                    }}
                  >
                    ₹{balanceAmt.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── FOOTER: Bank Details + Signatory ── */}
        <div
          className="grid grid-cols-2"
          style={{
            padding: "14px 28px 18px 28px",
            borderTop: "1px solid #ddd",
            backgroundColor: "#f9f9f9",
          }}
        >
          {/* Left: Bank Details */}
          <div
            style={{ paddingRight: "16px", borderRight: "1px solid #e0e0e0" }}
          >
            <p
              className="font-bold uppercase tracking-widest"
              style={{ fontSize: "10px", color: "#888", marginBottom: "6px" }}
            >
              Bank Details
            </p>
            <div style={{ fontSize: "11px", color: "#444", lineHeight: "1.7" }}>
              <p>
                <span style={{ color: "#777" }}>Bank Name: </span>
                Punjab And Sind Bank, Gandhinagar
              </p>
              <p>
                <span style={{ color: "#777" }}>Account No: </span>
                12801000004020
              </p>
              <p>
                <span style={{ color: "#777" }}>IFSC Code: </span>
                PSIB0002180
              </p>
              <p>
                <span style={{ color: "#777" }}>Account Holder Name: </span>
                MAHAMAD SHAIKH
              </p>
            </div>
          </div>

          {/* Right: Authorized Signatory */}
          <div style={{ paddingLeft: "16px", textAlign: "right" }}>
            <p style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>
              For: LIFE CARE MEDICAL &amp; GENERAL STORE
            </p>
            {/* Signature placeholder dashed box */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "160px",
                height: "56px",
                border: "2px dashed #bbb",
                borderRadius: "4px",
                margin: "4px 0",
                color: "#ccc",
                fontSize: "11px",
              }}
            >
              Signature
            </div>
            <p style={{ fontSize: "11px", color: "#555", marginTop: "4px" }}>
              Authorized Signatory
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
