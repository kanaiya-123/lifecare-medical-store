import { useNavigate } from "@tanstack/react-router";
import { Download, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useActor } from "../../hooks/useActor";
import type {
  Bill,
  BillItemInput,
  Customer,
  Medicine,
} from "../../hooks/useActor";
import {
  generateInvoicePdf,
  numberToWords,
} from "../../utils/generateInvoicePdf";

type CartItem = {
  medicine: Medicine;
  quantity: number;
  hsnSac: string;
};

export default function AdminBilling() {
  const navigate = useNavigate();
  const { actor } = useActor();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedMed, setSelectedMed] = useState("");
  const [qty, setQty] = useState(1);
  const [hsnInput, setHsnInput] = useState("");
  const [gstPercent, setGstPercent] = useState(12);
  const [customerGstin, setCustomerGstin] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("Gujarat");
  const [paymentMode, setPaymentMode] = useState<
    "Cash" | "UPI" | "Card" | "Credit"
  >("Cash");
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [previewBill, setPreviewBill] = useState<Bill | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!actor) return;
    Promise.all([actor.getAllCustomers(), actor.getAllMedicines()]).then(
      ([custs, meds]) => {
        setCustomers(custs);
        setMedicines(meds);
      },
    );
  }, [actor]);

  // Close modal on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPreviewBill(null);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  function addToCart() {
    const med = medicines.find((m) => m.id.toString() === selectedMed);
    if (!med) return;
    const existing = cart.find((c) => c.medicine.id === med.id);
    if (existing) {
      setCart((prev) =>
        prev.map((c) =>
          c.medicine.id === med.id ? { ...c, quantity: c.quantity + qty } : c,
        ),
      );
    } else {
      setCart((prev) => [
        ...prev,
        { medicine: med, quantity: qty, hsnSac: hsnInput },
      ]);
    }
    setSelectedMed("");
    setQty(1);
    setHsnInput("");
  }

  function removeFromCart(medicineId: bigint) {
    setCart((prev) => prev.filter((c) => c.medicine.id !== medicineId));
  }

  function updateCartHsn(medicineId: bigint, value: string) {
    setCart((prev) =>
      prev.map((c) =>
        c.medicine.id === medicineId ? { ...c, hsnSac: value } : c,
      ),
    );
  }

  function updateCartQty(medicineId: bigint, value: number) {
    if (value < 1) return;
    setCart((prev) =>
      prev.map((c) =>
        c.medicine.id === medicineId ? { ...c, quantity: value } : c,
      ),
    );
  }

  const subtotal = cart.reduce(
    (sum, item) => sum + item.quantity * item.medicine.price,
    0,
  );
  const discountTotal = cart.reduce(
    (sum, item) =>
      sum +
      item.quantity * item.medicine.price * (item.medicine.discount / 100),
    0,
  );
  const gstAmount = (subtotal - discountTotal) * (gstPercent / 100);
  const total = subtotal - discountTotal + gstAmount;
  const balance = total - receivedAmount;

  async function handleCreateBill() {
    if (!actor || !selectedCustomer || cart.length === 0) return;
    setSaving(true);
    try {
      const items: BillItemInput[] = cart.map((item) => ({
        medicineId: item.medicine.id,
        medicineName: item.medicine.name,
        quantity: BigInt(item.quantity),
        price: item.medicine.price,
        discount: item.medicine.discount,
        amount: item.quantity * item.medicine.price,
        hsnSac: item.hsnSac || undefined,
      }));

      let billId: bigint;
      if (typeof actor.createBillV2 === "function") {
        billId = await actor.createBillV2({
          customerId: selectedCustomer.id,
          items,
          gstPercent,
          customerGstin: customerGstin || undefined,
          placeOfSupply: placeOfSupply || undefined,
          paymentMode: paymentMode || undefined,
          receivedAmount: receivedAmount || undefined,
        });
      } else {
        billId = await actor.createBill(selectedCustomer.id, items, gstPercent);
      }

      // Build a local preview bill to show the invoice immediately
      const now = BigInt(Date.now()) * BigInt(1_000_000);
      const invoiceItems: BillItemInput[] = items;
      const syntheticBill: Bill = {
        id: billId,
        invoiceNumber: `INV-${billId.toString()}`,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerMobile: selectedCustomer.mobile,
        items: invoiceItems,
        subtotal: subtotal - discountTotal,
        discountAmount: discountTotal,
        gstAmount: gstAmount,
        gstPercent,
        totalAmount: total,
        createdAt: now,
        customerGstin: customerGstin || undefined,
        placeOfSupply: placeOfSupply || undefined,
        paymentMode,
        receivedAmount,
        balanceAmount: balance,
      };

      // Try to fetch the real bill from backend (has the real invoice number)
      try {
        if (typeof actor.getBill === "function") {
          const realBill = await actor.getBill(billId);
          setPreviewBill(realBill ?? syntheticBill);
        } else {
          setPreviewBill(syntheticBill);
        }
      } catch {
        setPreviewBill(syntheticBill);
      }
    } catch {
      alert("Failed to create bill. Please check stock availability.");
    } finally {
      setSaving(false);
    }
  }

  function handleViewFull() {
    if (!previewBill) return;
    navigate({
      to: "/admin/invoices/$id",
      params: { id: previewBill.id.toString() },
    });
  }

  function handleDownloadPdf() {
    if (!previewBill) return;
    generateInvoicePdf(previewBill);
  }

  const previewDateObj = previewBill
    ? new Date(Number(previewBill.createdAt) / 1_000_000)
    : new Date();
  const previewDateStr = previewBill
    ? `${String(previewDateObj.getDate()).padStart(2, "0")}-${String(previewDateObj.getMonth() + 1).padStart(2, "0")}-${previewDateObj.getFullYear()}`
    : "";
  const previewPlaceSupply = previewBill?.placeOfSupply ?? "Gujarat";
  const previewGstin = previewBill?.customerGstin ?? "";
  const previewTotal = previewBill?.totalAmount ?? 0;
  const previewReceived = previewBill?.receivedAmount ?? previewTotal;
  const previewBalance = previewBill?.balanceAmount ?? 0;
  const previewPayMode = previewBill?.paymentMode ?? "Cash";
  // previewBill.subtotal = taxable amount (gross - discount), discountAmount = discount
  const previewTaxableAmt = previewBill?.subtotal ?? 0;
  const previewDiscountAmt = previewBill?.discountAmount ?? 0;
  const previewGrossAmt = previewTaxableAmt + previewDiscountAmt;
  const previewGstAmt = previewBill?.gstAmount ?? 0;
  const previewGstPct = previewBill?.gstPercent ?? 0;
  const previewAmtWords = previewBill
    ? numberToWords(Math.round(previewTotal))
    : "";

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <h2 className="text-xl font-bold" style={{ color: "#1a3a6b" }}>
        New Bill
      </h2>

      {/* Customer + Bill Info Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3
            className="font-semibold text-sm mb-3"
            style={{ color: "#1565C0" }}
          >
            Bill To
          </h3>
          <div className="space-y-3">
            <div>
              <label
                htmlFor="customer-select"
                className="text-xs text-gray-500 mb-1 block"
              >
                Customer *
              </label>
              <select
                id="customer-select"
                value={selectedCustomer?.id.toString() ?? ""}
                onChange={(e) => {
                  const c = customers.find(
                    (c) => c.id.toString() === e.target.value,
                  );
                  setSelectedCustomer(c ?? null);
                }}
                data-ocid="billing.select"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="">-- Select Customer --</option>
                {customers.map((c) => (
                  <option key={c.id.toString()} value={c.id.toString()}>
                    {c.name} - {c.mobile}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="customer-gstin"
                className="text-xs text-gray-500 mb-1 block"
              >
                Customer GSTIN (optional)
              </label>
              <input
                id="customer-gstin"
                type="text"
                value={customerGstin}
                onChange={(e) => setCustomerGstin(e.target.value)}
                placeholder="e.g. 24XXXXX1234X1ZX"
                data-ocid="billing.gstin_input"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3
            className="font-semibold text-sm mb-3"
            style={{ color: "#1565C0" }}
          >
            Invoice Details
          </h3>
          <div className="space-y-3">
            <div>
              <label
                htmlFor="place-of-supply"
                className="text-xs text-gray-500 mb-1 block"
              >
                Place of Supply
              </label>
              <input
                id="place-of-supply"
                type="text"
                value={placeOfSupply}
                onChange={(e) => setPlaceOfSupply(e.target.value)}
                data-ocid="billing.place_of_supply_input"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <label
                htmlFor="gst-percent"
                className="text-xs text-gray-500 mb-1 block"
              >
                GST (%)
              </label>
              <input
                id="gst-percent"
                type="number"
                min={0}
                max={28}
                value={gstPercent}
                onChange={(e) => setGstPercent(Number(e.target.value))}
                data-ocid="billing.gst_input"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add Item */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-sm mb-3" style={{ color: "#1565C0" }}>
          Add Item
        </h3>
        <div className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-5">
            <label
              htmlFor="medicine-select"
              className="text-xs text-gray-500 mb-1 block"
            >
              Medicine
            </label>
            <select
              id="medicine-select"
              value={selectedMed}
              onChange={(e) => setSelectedMed(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="">-- Select Medicine --</option>
              {medicines.map((m) => (
                <option key={m.id.toString()} value={m.id.toString()}>
                  {m.name} — ₹{m.price.toFixed(2)} (Stock:{" "}
                  {m.stockQuantity.toString()})
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label
              htmlFor="hsn-input"
              className="text-xs text-gray-500 mb-1 block"
            >
              HSN/SAC
            </label>
            <input
              id="hsn-input"
              type="text"
              value={hsnInput}
              onChange={(e) => setHsnInput(e.target.value)}
              placeholder="e.g. 3004"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div className="col-span-2">
            <label
              htmlFor="qty-input"
              className="text-xs text-gray-500 mb-1 block"
            >
              Qty
            </label>
            <input
              id="qty-input"
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div className="col-span-3">
            <button
              type="button"
              onClick={addToCart}
              disabled={!selectedMed}
              data-ocid="billing.primary_button"
              className="w-full text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
              style={{ backgroundColor: "#2F8F66" }}
            >
              + Add Item
            </button>
          </div>
        </div>
      </div>

      {/* Cart Table */}
      {cart.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-white text-left text-xs"
                style={{ backgroundColor: "#1565C0" }}
              >
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Item Name</th>
                <th className="px-4 py-3">HSN/SAC</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Price/Unit</th>
                <th className="px-4 py-3">Disc%</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {cart.map((item, i) => {
                const lineTotal =
                  item.quantity *
                  item.medicine.price *
                  (1 - item.medicine.discount / 100);
                return (
                  <tr
                    key={item.medicine.id.toString()}
                    className={`border-t border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-blue-50/20"}`}
                    data-ocid={`cart.item.${i + 1}`}
                  >
                    <td className="px-4 py-2 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2 font-medium">
                      {item.medicine.name}
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        aria-label={`HSN/SAC for ${item.medicine.name}`}
                        value={item.hsnSac}
                        onChange={(e) =>
                          updateCartHsn(item.medicine.id, e.target.value)
                        }
                        placeholder="HSN"
                        className="border border-gray-200 rounded px-2 py-1 text-xs w-20 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min={1}
                        aria-label={`Quantity for ${item.medicine.name}`}
                        value={item.quantity}
                        onChange={(e) =>
                          updateCartQty(
                            item.medicine.id,
                            Number(e.target.value),
                          )
                        }
                        className="border border-gray-200 rounded px-2 py-1 text-xs w-16 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-2">
                      ₹{item.medicine.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-gray-500">
                      {item.medicine.discount}%
                    </td>
                    <td className="px-4 py-2 font-medium">
                      ₹{lineTotal.toFixed(2)}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.medicine.id)}
                        className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 transition-colors"
                        data-ocid={`cart.delete_button.${i + 1}`}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals + Payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t border-gray-100">
            <div className="p-4 border-r border-gray-100">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Payment Details
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="payment-mode"
                    className="text-sm text-gray-600 w-36"
                  >
                    Payment Mode
                  </label>
                  <select
                    id="payment-mode"
                    value={paymentMode}
                    onChange={(e) =>
                      setPaymentMode(
                        e.target.value as "Cash" | "UPI" | "Card" | "Credit",
                      )
                    }
                    data-ocid="billing.payment_mode_select"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Credit">Credit</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="received-amount"
                    className="text-sm text-gray-600 w-36"
                  >
                    Received (₹)
                  </label>
                  <input
                    id="received-amount"
                    type="number"
                    min={0}
                    step="0.01"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(Number(e.target.value))}
                    data-ocid="billing.received_amount_input"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-36">
                    Balance (₹)
                  </span>
                  <span
                    className={`flex-1 text-sm font-semibold ${balance > 0 ? "text-red-600" : "text-green-600"}`}
                  >
                    ₹{balance.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Summary
              </h4>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Gross Amount</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {discountTotal > 0 && (
                  <div
                    className="flex justify-between"
                    style={{ color: "#c62828" }}
                  >
                    <span>Less: Discount</span>
                    <span>-₹{discountTotal.toFixed(2)}</span>
                  </div>
                )}
                {discountTotal > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Taxable Amount</span>
                    <span>₹{(subtotal - discountTotal).toFixed(2)}</span>
                  </div>
                )}
                {gstPercent > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>GST ({gstPercent}%)</span>
                    <span>+₹{gstAmount.toFixed(2)}</span>
                  </div>
                )}
                <div
                  className="flex justify-between font-bold text-base border-t pt-2 mt-2"
                  style={{ color: "#1565C0" }}
                >
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleCreateBill}
              disabled={saving || !selectedCustomer}
              data-ocid="billing.submit_button"
              className="w-full text-white py-3 rounded-xl font-semibold disabled:opacity-50 transition-colors"
              style={{ backgroundColor: "#1565C0" }}
            >
              {saving ? "Creating Bill..." : "✓ Create Bill & Generate Invoice"}
            </button>
          </div>
        </div>
      )}

      {cart.length === 0 && (
        <div className="bg-white rounded-xl p-8 text-center border border-dashed border-gray-200">
          <p className="text-gray-400 text-sm">
            No items added yet. Select a medicine and click "+ Add Item" to
            begin.
          </p>
        </div>
      )}

      {/* ══════════════════ INVOICE PREVIEW MODAL ══════════════════ */}
      {previewBill && (
        <dialog
          open
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-6 m-0 max-w-none w-full h-full p-0 border-0"
          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewBill(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setPreviewBill(null);
          }}
          aria-label="Invoice Preview"
        >
          <div
            ref={modalRef}
            className="relative w-full max-w-3xl mx-4 rounded-xl overflow-hidden shadow-2xl"
            style={{ backgroundColor: "#f5f6f7" }}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ backgroundColor: "#1565C0" }}
            >
              <span className="text-white font-bold text-sm tracking-wide">
                Invoice Preview — {previewBill.invoiceNumber}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  data-ocid="billing.download_button"
                  className="flex items-center gap-1.5 bg-white text-blue-700 font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Download size={13} /> Download Invoice
                </button>
                <button
                  type="button"
                  onClick={handleViewFull}
                  data-ocid="billing.view_full_button"
                  className="flex items-center gap-1.5 bg-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-white/30 transition-colors"
                >
                  View Full
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewBill(null)}
                  aria-label="Close preview"
                  data-ocid="billing.close_button"
                  className="text-white/80 hover:text-white ml-1 p-1 rounded transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Invoice Card inside modal */}
            <div className="p-5">
              <div
                className="bg-white rounded-lg overflow-hidden"
                style={{
                  fontFamily: "Arial, sans-serif",
                  fontSize: "12px",
                  border: "1px solid #e0e0e0",
                }}
              >
                {/* Header */}
                <div
                  className="text-center px-6 pt-5 pb-3"
                  style={{ borderBottom: "2px solid #1565C0" }}
                >
                  <h2
                    className="font-bold uppercase"
                    style={{
                      fontSize: "16px",
                      color: "#1a1a1a",
                      letterSpacing: "0.05em",
                    }}
                  >
                    LIFE CARE MEDICAL &amp; GENERAL STORE
                  </h2>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#555",
                      marginTop: "2px",
                    }}
                  >
                    Shop No 5 Burj Mastana, New Vavol, Gandhinagar
                  </p>
                  <p style={{ fontSize: "11px", color: "#555" }}>
                    Ph: 6351499478
                  </p>
                  <div style={{ marginTop: "8px" }}>
                    <span
                      className="font-bold uppercase tracking-widest"
                      style={{ fontSize: "13px", color: "#1565C0" }}
                    >
                      Bill of Supply
                    </span>
                  </div>
                  <div
                    style={{
                      height: "2px",
                      backgroundColor: "#1565C0",
                      marginTop: "5px",
                    }}
                  />
                </div>

                {/* Bill To + Invoice Details */}
                <div
                  className="grid grid-cols-2"
                  style={{
                    borderBottom: "1px solid #ddd",
                    padding: "12px 22px",
                  }}
                >
                  <div
                    style={{
                      paddingRight: "12px",
                      borderRight: "1px solid #e0e0e0",
                    }}
                  >
                    <p
                      className="font-bold uppercase"
                      style={{
                        fontSize: "9px",
                        color: "#1565C0",
                        letterSpacing: "0.1em",
                        marginBottom: "5px",
                      }}
                    >
                      Bill To
                    </p>
                    <p
                      className="font-bold"
                      style={{ fontSize: "13px", color: "#1a1a1a" }}
                    >
                      {previewBill.customerName}
                    </p>
                    <p
                      style={{
                        fontSize: "11px",
                        color: "#555",
                        marginTop: "2px",
                      }}
                    >
                      Contact No: {previewBill.customerMobile}
                    </p>
                    {previewGstin && (
                      <p style={{ fontSize: "11px", color: "#555" }}>
                        GSTIN Number: {previewGstin}
                      </p>
                    )}
                    <p style={{ fontSize: "11px", color: "#555" }}>
                      State: {previewPlaceSupply}
                    </p>
                  </div>
                  <div style={{ paddingLeft: "12px" }}>
                    <p
                      className="font-bold uppercase text-right"
                      style={{
                        fontSize: "9px",
                        color: "#1565C0",
                        letterSpacing: "0.1em",
                        marginBottom: "5px",
                      }}
                    >
                      Invoice Details
                    </p>
                    <table className="w-full" style={{ fontSize: "11px" }}>
                      <tbody>
                        {[
                          ["Invoice No:", previewBill.invoiceNumber],
                          ["Date:", previewDateStr],
                          ["Place of Supply:", previewPlaceSupply],
                        ].map(([label, val]) => (
                          <tr key={label}>
                            <td style={{ color: "#777", paddingBottom: "2px" }}>
                              {label}
                            </td>
                            <td
                              className="text-right font-semibold"
                              style={{ color: "#1a1a1a", paddingBottom: "2px" }}
                            >
                              {val}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Items Table */}
                <div style={{ padding: "0 22px" }}>
                  <table
                    className="w-full"
                    style={{ fontSize: "11px", borderCollapse: "collapse" }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: "#1565C0", color: "#fff" }}>
                        {[
                          { label: "#", align: "left" },
                          { label: "Item Name", align: "left" },
                          { label: "HSN/SAC", align: "center" },
                          { label: "Qty", align: "center" },
                          { label: "Price/Unit", align: "right" },
                          { label: "Disc%", align: "center" },
                          { label: "Taxable Amt", align: "right" },
                        ].map((h) => (
                          <th
                            key={h.label}
                            style={{
                              padding: "7px 6px",
                              textAlign: h.align as "left" | "center" | "right",
                              fontWeight: 600,
                            }}
                          >
                            {h.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewBill.items.map((item, i) => {
                        const hsnVal =
                          (item as typeof item & { hsnSac?: string }).hsnSac ??
                          "—";
                        const grossAmt = Number(item.quantity) * item.price;
                        const discAmt = grossAmt * (item.discount / 100);
                        const taxableLineAmt = grossAmt - discAmt;
                        return (
                          <tr
                            key={item.medicineId.toString()}
                            style={{
                              backgroundColor: i % 2 === 0 ? "#fff" : "#f0f6ff",
                              borderBottom: "1px solid #e0e0e0",
                            }}
                          >
                            <td style={{ padding: "6px 6px", color: "#888" }}>
                              {i + 1}
                            </td>
                            <td style={{ padding: "6px 6px", fontWeight: 500 }}>
                              {item.medicineName}
                            </td>
                            <td
                              style={{
                                padding: "6px 6px",
                                textAlign: "center",
                                color: "#555",
                              }}
                            >
                              {hsnVal}
                            </td>
                            <td
                              style={{
                                padding: "6px 6px",
                                textAlign: "center",
                              }}
                            >
                              {Number(item.quantity)}
                            </td>
                            <td
                              style={{ padding: "6px 6px", textAlign: "right" }}
                            >
                              ₹{item.price.toFixed(2)}
                            </td>
                            <td
                              style={{
                                padding: "6px 6px",
                                textAlign: "center",
                                color: "#555",
                              }}
                            >
                              {item.discount}%
                            </td>
                            <td
                              style={{
                                padding: "6px 6px",
                                textAlign: "right",
                                fontWeight: 600,
                              }}
                            >
                              ₹{taxableLineAmt.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                      <tr style={{ borderTop: "2px solid #1565C0" }}>
                        <td
                          colSpan={6}
                          style={{
                            padding: "7px 6px",
                            textAlign: "right",
                            fontWeight: 700,
                            color: "#1a1a1a",
                          }}
                        >
                          Gross Total
                        </td>
                        <td
                          style={{
                            padding: "7px 6px",
                            textAlign: "right",
                            fontWeight: 700,
                            color: "#1a1a1a",
                          }}
                        >
                          ₹{previewGrossAmt.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Summary + Amount in Words */}
                <div
                  className="grid grid-cols-2"
                  style={{ padding: "12px 22px", borderTop: "1px solid #ddd" }}
                >
                  <div
                    style={{
                      paddingRight: "12px",
                      borderRight: "1px solid #e0e0e0",
                    }}
                  >
                    <p
                      className="font-bold uppercase"
                      style={{
                        fontSize: "9px",
                        color: "#888",
                        letterSpacing: "0.1em",
                        marginBottom: "4px",
                      }}
                    >
                      Amount in Words
                    </p>
                    <p
                      className="font-semibold"
                      style={{
                        fontSize: "11px",
                        color: "#1565C0",
                        fontStyle: "italic",
                      }}
                    >
                      {previewAmtWords}
                    </p>
                    <div style={{ marginTop: "12px" }}>
                      <p
                        className="font-bold uppercase"
                        style={{
                          fontSize: "9px",
                          color: "#888",
                          letterSpacing: "0.1em",
                          marginBottom: "3px",
                        }}
                      >
                        Terms &amp; Conditions
                      </p>
                      <p style={{ fontSize: "10px", color: "#666" }}>
                        Thank you for doing business with us.
                      </p>
                    </div>
                  </div>
                  <div style={{ paddingLeft: "12px" }}>
                    <table
                      className="w-full"
                      style={{ fontSize: "11px", borderCollapse: "collapse" }}
                    >
                      <tbody>
                        <tr style={{ borderBottom: "1px solid #eee" }}>
                          <td style={{ padding: "4px 3px", color: "#666" }}>
                            Gross Amount
                          </td>
                          <td
                            style={{
                              padding: "4px 3px",
                              textAlign: "right",
                              fontWeight: 500,
                            }}
                          >
                            ₹{previewGrossAmt.toFixed(2)}
                          </td>
                        </tr>
                        {previewDiscountAmt > 0 && (
                          <tr style={{ borderBottom: "1px solid #eee" }}>
                            <td
                              style={{ padding: "4px 3px", color: "#c62828" }}
                            >
                              Less: Discount
                            </td>
                            <td
                              style={{
                                padding: "4px 3px",
                                textAlign: "right",
                                fontWeight: 500,
                                color: "#c62828",
                              }}
                            >
                              -₹{previewDiscountAmt.toFixed(2)}
                            </td>
                          </tr>
                        )}
                        <tr style={{ borderBottom: "1px solid #eee" }}>
                          <td style={{ padding: "4px 3px", color: "#666" }}>
                            Taxable Amount
                          </td>
                          <td
                            style={{
                              padding: "4px 3px",
                              textAlign: "right",
                              fontWeight: 500,
                            }}
                          >
                            ₹{previewTaxableAmt.toFixed(2)}
                          </td>
                        </tr>
                        {previewGstPct > 0 && (
                          <tr style={{ borderBottom: "1px solid #eee" }}>
                            <td style={{ padding: "4px 3px", color: "#666" }}>
                              GST ({previewGstPct}%)
                            </td>
                            <td
                              style={{
                                padding: "4px 3px",
                                textAlign: "right",
                                fontWeight: 500,
                              }}
                            >
                              +₹{previewGstAmt.toFixed(2)}
                            </td>
                          </tr>
                        )}
                        <tr style={{ backgroundColor: "#1565C0" }}>
                          <td
                            style={{
                              padding: "6px 5px",
                              color: "#fff",
                              fontWeight: 700,
                            }}
                          >
                            Total
                          </td>
                          <td
                            style={{
                              padding: "6px 5px",
                              textAlign: "right",
                              color: "#fff",
                              fontWeight: 700,
                            }}
                          >
                            ₹{previewTotal.toFixed(2)}
                          </td>
                        </tr>
                        {[
                          {
                            label: "Received",
                            val: `₹${previewReceived.toFixed(2)}`,
                            color: "#2e7d32",
                          },
                          {
                            label: "Balance",
                            val: `₹${previewBalance.toFixed(2)}`,
                            color: previewBalance > 0 ? "#c62828" : "#2e7d32",
                          },
                          {
                            label: "Payment Mode",
                            val: previewPayMode,
                            color: "#1a1a1a",
                          },
                          {
                            label: "Previous Balance",
                            val: "₹0.00",
                            color: "#1a1a1a",
                          },
                          {
                            label: "Current Balance",
                            val: `₹${previewBalance.toFixed(2)}`,
                            color: previewBalance > 0 ? "#c62828" : "#2e7d32",
                          },
                        ].map(({ label, val, color }) => (
                          <tr
                            key={label}
                            style={{ borderBottom: "1px solid #eee" }}
                          >
                            <td style={{ padding: "4px 3px", color: "#666" }}>
                              {label}
                            </td>
                            <td
                              style={{
                                padding: "4px 3px",
                                textAlign: "right",
                                fontWeight: 600,
                                color,
                              }}
                            >
                              {val}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer */}
                <div
                  className="grid grid-cols-2"
                  style={{
                    padding: "12px 22px 16px 22px",
                    borderTop: "1px solid #ddd",
                    backgroundColor: "#f9f9f9",
                  }}
                >
                  <div
                    style={{
                      paddingRight: "12px",
                      borderRight: "1px solid #e0e0e0",
                    }}
                  >
                    <p
                      className="font-bold uppercase"
                      style={{
                        fontSize: "9px",
                        color: "#888",
                        letterSpacing: "0.1em",
                        marginBottom: "5px",
                      }}
                    >
                      Bank Details
                    </p>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#444",
                        lineHeight: "1.7",
                      }}
                    >
                      <p>
                        <span style={{ color: "#777" }}>Bank Name: </span>Punjab
                        And Sind Bank, Gandhinagar
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
                        <span style={{ color: "#777" }}>
                          Account Holder Name:{" "}
                        </span>
                        MAHAMAD SHAIKH
                      </p>
                    </div>
                  </div>
                  <div style={{ paddingLeft: "12px", textAlign: "right" }}>
                    <p
                      style={{
                        fontSize: "10px",
                        color: "#666",
                        marginBottom: "4px",
                      }}
                    >
                      For: LIFE CARE MEDICAL &amp; GENERAL STORE
                    </p>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "120px",
                        height: "44px",
                        border: "2px dashed #bbb",
                        borderRadius: "4px",
                        color: "#ccc",
                        fontSize: "10px",
                        margin: "3px 0",
                      }}
                    >
                      Signature
                    </div>
                    <p
                      style={{
                        fontSize: "10px",
                        color: "#555",
                        marginTop: "3px",
                      }}
                    >
                      Authorized Signatory
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
