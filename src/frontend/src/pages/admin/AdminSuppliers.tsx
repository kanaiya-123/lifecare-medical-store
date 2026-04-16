import { Download, Eye, Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useActor } from "../../hooks/useActor";
import type {
  Supplier,
  SupplierBill,
  SupplierBillInput,
  SupplierBillItem,
  SupplierInput,
} from "../../hooks/useActor";
import { generateSupplierBillPdf } from "../../utils/generateSupplierBillPdf";

const EMPTY_SUPPLIER: SupplierInput = {
  name: "",
  mobile: "",
  address: "",
  email: "",
  gstNo: "",
};

type BillFormItem = {
  sn: number;
  itemName: string;
  hsn: string;
  pack: string;
  mfg: string;
  mrp: string;
  batchNo: string;
  expDt: string;
  qty: string;
  free: string;
  rate: string;
  discPercent: string;
  netAmt: number;
  gstPercent: string;
  amount: number;
};

function calcRow(item: BillFormItem): BillFormItem {
  const qty = Number(item.qty) || 0;
  const rate = Number(item.rate) || 0;
  const disc = Number(item.discPercent) || 0;
  const gst = Number(item.gstPercent) || 0;
  const netAmt = qty * rate - qty * rate * (disc / 100);
  const amount = netAmt + netAmt * (gst / 100);
  return {
    ...item,
    netAmt: Number.parseFloat(netAmt.toFixed(2)),
    amount: Number.parseFloat(amount.toFixed(2)),
  };
}

function makeEmptyFormItem(sn: number): BillFormItem {
  return {
    sn,
    itemName: "",
    hsn: "",
    pack: "",
    mfg: "",
    mrp: "",
    batchNo: "",
    expDt: "",
    qty: "0",
    free: "0",
    rate: "0",
    discPercent: "0",
    netAmt: 0,
    gstPercent: "0",
    amount: 0,
  };
}

type BillForm = {
  invoiceNo: string;
  date: string;
  challanNo: string;
  salesMan: string;
  transport: string;
  lrNo: string;
  items: BillFormItem[];
  sgstAmount: string;
  cgstAmount: string;
  cashDiscountTotal: string;
  schemeDiscountTotal: string;
  addLessCnDn: string;
  freightPktCharge: string;
  termsConditions: string;
};

function makeEmptyBillForm(): BillForm {
  return {
    invoiceNo: "",
    date: new Date().toISOString().split("T")[0],
    challanNo: "",
    salesMan: "",
    transport: "",
    lrNo: "",
    items: [makeEmptyFormItem(1)],
    sgstAmount: "0",
    cgstAmount: "0",
    cashDiscountTotal: "0",
    schemeDiscountTotal: "0",
    addLessCnDn: "0",
    freightPktCharge: "0",
    termsConditions: "",
  };
}

function calcGrandTotal(form: BillForm): {
  subTotal: number;
  sgst: number;
  cgst: number;
  roundOff: number;
  grandTotal: number;
} {
  const subTotal = form.items.reduce((s, i) => s + i.amount, 0);
  const sgst = Number(form.sgstAmount) || 0;
  const cgst = Number(form.cgstAmount) || 0;
  const cashDisc = Number(form.cashDiscountTotal) || 0;
  const schemeDisc = Number(form.schemeDiscountTotal) || 0;
  const cndn = Number(form.addLessCnDn) || 0;
  const freight = Number(form.freightPktCharge) || 0;
  const raw = subTotal + sgst + cgst - cashDisc - schemeDisc + cndn + freight;
  const roundOff = Math.round(raw) - raw;
  return {
    subTotal,
    sgst,
    cgst,
    roundOff: Number.parseFloat(roundOff.toFixed(2)),
    grandTotal: Number.parseFloat((raw + roundOff).toFixed(2)),
  };
}

function toItemInput(item: BillFormItem, sn: number): SupplierBillItem {
  return {
    sn: BigInt(sn),
    itemName: item.itemName,
    hsn: item.hsn,
    pack: item.pack,
    mfg: item.mfg,
    mrp: Number(item.mrp) || 0,
    batchNo: item.batchNo,
    expDt: item.expDt,
    qty: BigInt(Number(item.qty) || 0),
    free: BigInt(Number(item.free) || 0),
    rate: Number(item.rate) || 0,
    discPercent: Number(item.discPercent) || 0,
    netAmt: item.netAmt,
    gstPercent: Number(item.gstPercent) || 0,
    amount: item.amount,
  };
}

export default function AdminSuppliers() {
  const { actor } = useActor();

  // Supplier CRUD state
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [supModal, setSupModal] = useState<"add" | "edit" | null>(null);
  const [supForm, setSupForm] = useState<SupplierInput>(EMPTY_SUPPLIER);
  const [editId, setEditId] = useState<bigint | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Purchase bills state
  const [activeSup, setActiveSup] = useState<Supplier | null>(null);
  const [bills, setBills] = useState<SupplierBill[]>([]);
  const [billsLoading, setBillsLoading] = useState(false);
  const [billModal, setBillModal] = useState<"add" | null>(null);
  const [viewBill, setViewBill] = useState<SupplierBill | null>(null);
  const [billForm, setBillForm] = useState<BillForm>(makeEmptyBillForm());
  const [billSaving, setBillSaving] = useState(false);
  const [billSaveError, setBillSaveError] = useState<string | null>(null);

  const loadSuppliers = useCallback(() => {
    if (!actor) return;
    actor.getAllSuppliers().then((data) => {
      setSuppliers(data);
      setLoading(false);
    });
  }, [actor]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const loadBills = useCallback(
    (supplierId: bigint) => {
      if (!actor) return;
      setBillsLoading(true);
      actor.getSupplierBillsBySupplier(supplierId).then((data) => {
        setBills(data);
        setBillsLoading(false);
      });
    },
    [actor],
  );

  useEffect(() => {
    if (activeSup) loadBills(activeSup.id);
  }, [activeSup, loadBills]);

  // Supplier modal handlers
  function openAddSupplier() {
    setSupForm(EMPTY_SUPPLIER);
    setEditId(null);
    setSaveError(null);
    setSupModal("add");
  }
  function openEditSupplier(s: Supplier) {
    setSupForm({
      name: s.name,
      mobile: s.mobile,
      address: s.address,
      email: s.email,
      gstNo: s.gstNo,
    });
    setEditId(s.id);
    setSaveError(null);
    setSupModal("edit");
  }
  async function handleSupplierSave() {
    if (!actor) return;
    if (!supForm.name.trim()) {
      setSaveError("Name is required.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      if (supModal === "add") await actor.addSupplier(supForm);
      else if (editId !== null) await actor.updateSupplier(editId, supForm);
      setSupModal(null);
      setSupForm(EMPTY_SUPPLIER);
      loadSuppliers();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to save. Please try again.";
      setSaveError(
        msg.length > 120 ? "Failed to save. Please try again." : msg,
      );
    } finally {
      setSaving(false);
    }
  }
  async function handleSupplierDelete(id: bigint) {
    if (!actor || !confirm("Delete this supplier?")) return;
    await actor.deleteSupplier(id);
    if (activeSup?.id === id) setActiveSup(null);
    loadSuppliers();
  }

  // Bill form item helpers
  function updateItem(idx: number, field: keyof BillFormItem, value: string) {
    setBillForm((prev) => {
      const items = [...prev.items];
      const updated = calcRow({
        ...items[idx],
        [field]: value,
      } as BillFormItem);
      items[idx] = updated;
      return { ...prev, items };
    });
  }
  function addItem() {
    setBillForm((prev) => ({
      ...prev,
      items: [...prev.items, makeEmptyFormItem(prev.items.length + 1)],
    }));
  }
  function removeItem(idx: number) {
    setBillForm((prev) => ({
      ...prev,
      items: prev.items
        .filter((_, i) => i !== idx)
        .map((it, i) => ({ ...it, sn: i + 1 })),
    }));
  }

  // Save purchase bill
  async function handleBillSave() {
    if (!actor || !activeSup) return;
    if (!billForm.invoiceNo.trim()) {
      setBillSaveError("Invoice No is required.");
      return;
    }
    if (billForm.items.length === 0) {
      setBillSaveError("Add at least one item.");
      return;
    }
    setBillSaving(true);
    setBillSaveError(null);
    try {
      const totals = calcGrandTotal(billForm);
      const input: SupplierBillInput = {
        supplierId: activeSup.id,
        invoiceNo: billForm.invoiceNo.trim(),
        date: BigInt(new Date(billForm.date).getTime()),
        challanNo: billForm.challanNo.trim() || undefined,
        salesMan: billForm.salesMan.trim() || undefined,
        transport: billForm.transport.trim() || undefined,
        lrNo: billForm.lrNo.trim() || undefined,
        items: billForm.items.map((it, i) => toItemInput(it, i + 1)),
        sgstAmount: totals.sgst,
        cgstAmount: totals.cgst,
        cashDiscountTotal: Number(billForm.cashDiscountTotal) || 0,
        schemeDiscountTotal: Number(billForm.schemeDiscountTotal) || 0,
        addLessCnDn: Number(billForm.addLessCnDn) || 0,
        freightPktCharge: Number(billForm.freightPktCharge) || 0,
        roundOff: totals.roundOff,
        grandTotal: totals.grandTotal,
        termsConditions: billForm.termsConditions.trim() || undefined,
      };
      await actor.createSupplierBill(input);
      setBillModal(null);
      setBillForm(makeEmptyBillForm());
      loadBills(activeSup.id);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to save. Please try again.";
      setBillSaveError(
        msg.length > 120 ? "Failed to save. Please try again." : msg,
      );
    } finally {
      setBillSaving(false);
    }
  }

  async function handleBillDelete(id: bigint) {
    if (!actor || !activeSup || !confirm("Delete this purchase bill?")) return;
    await actor.deleteSupplierBill(id);
    loadBills(activeSup.id);
  }

  const totals = calcGrandTotal(billForm);

  // ──────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* ── Supplier List ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Suppliers</h2>
        <button
          type="button"
          onClick={openAddSupplier}
          data-ocid="add-supplier-btn"
          className="flex items-center gap-2 bg-[#2F8F66] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#27795a] transition-colors"
        >
          <Plus size={16} /> Add Supplier
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">
                    Mobile
                  </th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">
                    GST No
                  </th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">
                    Address
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {suppliers.map((s) => (
                  <tr
                    key={s.id.toString()}
                    className={`hover:bg-gray-50 transition-colors ${activeSup?.id === s.id ? "bg-blue-50/30" : ""}`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {s.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.mobile}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {s.email || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                      {s.gstNo || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.address}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 items-center">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveSup(activeSup?.id === s.id ? null : s)
                          }
                          className="text-xs px-2.5 py-1 rounded-lg font-medium border transition-colors"
                          style={{
                            backgroundColor:
                              activeSup?.id === s.id ? "#1565C0" : "#e3f2fd",
                            color: activeSup?.id === s.id ? "#fff" : "#1565C0",
                            borderColor: "#1565C0",
                          }}
                          data-ocid={`supplier.bills_btn.${s.id}`}
                        >
                          Purchase Bills
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditSupplier(s)}
                          className="p-1.5 text-gray-400 hover:text-[#2F8F66] rounded"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSupplierDelete(s.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {suppliers.length === 0 && (
              <p className="text-center py-10 text-gray-400">
                No suppliers added yet.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Purchase Bills Panel ── */}
      {activeSup && (
        <div className="bg-white rounded-xl border border-blue-100 overflow-hidden shadow-sm">
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ backgroundColor: "#1565C0" }}
          >
            <div>
              <span className="font-bold text-white text-sm">
                Purchase Bills
              </span>
              <span className="text-blue-200 text-xs ml-2">
                — {activeSup.name}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setBillForm(makeEmptyBillForm());
                  setBillSaveError(null);
                  setBillModal("add");
                }}
                data-ocid="add-purchase-bill-btn"
                className="flex items-center gap-1.5 bg-white text-blue-700 font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Plus size={13} /> Add Purchase Bill
              </button>
              <button
                type="button"
                onClick={() => setActiveSup(null)}
                className="text-white/70 hover:text-white p-1 rounded"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {billsLoading ? (
            <div className="text-center py-6 text-gray-400 text-sm">
              Loading bills...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">
                      Invoice No
                    </th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">
                      Date
                    </th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">
                      Grand Total
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bills.map((b) => {
                    const d = new Date(Number(b.date));
                    const ds = `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
                    return (
                      <tr key={b.id.toString()} className="hover:bg-gray-50">
                        <td
                          className="px-4 py-3 font-mono text-xs font-semibold"
                          style={{ color: "#1565C0" }}
                        >
                          {b.invoiceNo}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{ds}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          ₹{b.grandTotal.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-3 items-center justify-end">
                            <button
                              type="button"
                              onClick={() => setViewBill(b)}
                              className="flex items-center gap-1 text-xs font-medium hover:underline"
                              style={{ color: "#2F8F66" }}
                            >
                              <Eye size={13} /> View
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                generateSupplierBillPdf(b, activeSup)
                              }
                              className="flex items-center gap-1 text-xs font-medium hover:underline"
                              style={{ color: "#1565C0" }}
                            >
                              <Download size={13} /> PDF
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBillDelete(b.id)}
                              className="p-1 text-gray-400 hover:text-red-500 rounded"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {bills.length === 0 && (
                <p className="text-center py-8 text-gray-400 text-sm">
                  No purchase bills yet. Click "Add Purchase Bill" to add one.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════ SUPPLIER MODAL ══════════════════ */}
      {supModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg">
                {supModal === "add" ? "Add Supplier" : "Edit Supplier"}
              </h3>
              <button type="button" onClick={() => setSupModal(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              {(["name", "mobile", "address"] as (keyof SupplierInput)[]).map(
                (field) => (
                  <div key={field}>
                    <label
                      htmlFor={`sup-${field}`}
                      className="block text-xs font-medium text-gray-600 mb-1 capitalize"
                    >
                      {field}
                    </label>
                    <input
                      id={`sup-${field}`}
                      className="input w-full"
                      value={supForm[field]}
                      onChange={(e) =>
                        setSupForm({ ...supForm, [field]: e.target.value })
                      }
                    />
                  </div>
                ),
              )}
              <div>
                <label
                  htmlFor="sup-email"
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  Email
                </label>
                <input
                  id="sup-email"
                  type="email"
                  className="input w-full"
                  value={supForm.email}
                  onChange={(e) =>
                    setSupForm({ ...supForm, email: e.target.value })
                  }
                  placeholder="supplier@example.com"
                />
              </div>
              <div>
                <label
                  htmlFor="sup-gstno"
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  GST No
                </label>
                <input
                  id="sup-gstno"
                  className="input w-full font-mono"
                  value={supForm.gstNo}
                  onChange={(e) =>
                    setSupForm({ ...supForm, gstNo: e.target.value })
                  }
                  placeholder="e.g. 24XXXXX0000X1ZK"
                />
              </div>
            </div>
            {saveError && (
              <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {saveError}
              </p>
            )}
            <div className="flex justify-end gap-3 mt-5">
              <button
                type="button"
                onClick={() => setSupModal(null)}
                className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSupplierSave}
                disabled={saving}
                className="px-4 py-2 bg-[#2F8F66] text-white rounded-lg hover:bg-[#27795a] disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ ADD PURCHASE BILL MODAL ══════════════════ */}
      {billModal === "add" && activeSup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-4 px-2">
          <div className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl my-4">
            {/* Modal Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b border-gray-100"
              style={{ backgroundColor: "#1565C0" }}
            >
              <div>
                <h3 className="font-bold text-white text-base">
                  Add Purchase Bill
                </h3>
                <p className="text-blue-200 text-xs mt-0.5">
                  Supplier: {activeSup.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBillModal(null)}
                className="text-white/70 hover:text-white p-1 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Header Fields */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  {
                    id: "inv-no",
                    label: "Invoice No *",
                    key: "invoiceNo",
                    type: "text",
                  },
                  {
                    id: "inv-date",
                    label: "Date *",
                    key: "date",
                    type: "date",
                  },
                  {
                    id: "challan-no",
                    label: "Challan No",
                    key: "challanNo",
                    type: "text",
                  },
                  {
                    id: "sales-man",
                    label: "Sales Man",
                    key: "salesMan",
                    type: "text",
                  },
                  {
                    id: "transport",
                    label: "Transport",
                    key: "transport",
                    type: "text",
                  },
                  { id: "lr-no", label: "L.R.No", key: "lrNo", type: "text" },
                ].map(({ id, label, key, type }) => (
                  <div key={id}>
                    <label
                      htmlFor={id}
                      className="block text-xs font-medium text-gray-600 mb-1"
                    >
                      {label}
                    </label>
                    <input
                      id={id}
                      type={type}
                      className="input w-full"
                      value={billForm[key as keyof BillForm] as string}
                      onChange={(e) =>
                        setBillForm((p) => ({ ...p, [key]: e.target.value }))
                      }
                    />
                  </div>
                ))}
              </div>

              {/* Items Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm text-gray-700">Items</h4>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium text-white flex items-center gap-1"
                    style={{ backgroundColor: "#2F8F66" }}
                  >
                    <Plus size={12} /> Add Item
                  </button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table
                    className="w-full text-xs"
                    style={{ minWidth: "1100px" }}
                  >
                    <thead>
                      <tr
                        className="text-white text-left"
                        style={{ backgroundColor: "#1565C0" }}
                      >
                        {[
                          "#",
                          "Item Name",
                          "HSN",
                          "Pack",
                          "Mfg",
                          "M.R.P.",
                          "Batch No.",
                          "Exp.Dt",
                          "Qty",
                          "Free",
                          "Rate",
                          "Disc%",
                          "N.Amt",
                          "GST%",
                          "Amount",
                          "",
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-2 py-2.5 font-semibold whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {billForm.items.map((item, idx) => (
                        <tr
                          key={`item-${item.sn}`}
                          className={
                            idx % 2 === 0 ? "bg-white" : "bg-blue-50/20"
                          }
                        >
                          <td className="px-2 py-1.5 text-gray-400">
                            {idx + 1}
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              aria-label="Item Name"
                              className="border border-gray-200 rounded px-2 py-1 w-28 focus:outline-none focus:ring-1 focus:ring-blue-300"
                              value={item.itemName}
                              onChange={(e) =>
                                updateItem(idx, "itemName", e.target.value)
                              }
                            />
                          </td>
                          {(["hsn", "pack", "mfg"] as const).map((f) => (
                            <td key={f} className="px-1 py-1.5">
                              <input
                                aria-label={f}
                                className="border border-gray-200 rounded px-2 py-1 w-16 focus:outline-none focus:ring-1 focus:ring-blue-300"
                                value={item[f]}
                                onChange={(e) =>
                                  updateItem(idx, f, e.target.value)
                                }
                              />
                            </td>
                          ))}
                          <td className="px-1 py-1.5">
                            <input
                              aria-label="MRP"
                              type="number"
                              min="0"
                              className="border border-gray-200 rounded px-2 py-1 w-16 focus:outline-none focus:ring-1 focus:ring-blue-300"
                              value={item.mrp}
                              onChange={(e) =>
                                updateItem(idx, "mrp", e.target.value)
                              }
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              aria-label="Batch No"
                              className="border border-gray-200 rounded px-2 py-1 w-18 focus:outline-none focus:ring-1 focus:ring-blue-300"
                              value={item.batchNo}
                              onChange={(e) =>
                                updateItem(idx, "batchNo", e.target.value)
                              }
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              aria-label="Expiry Date"
                              type="text"
                              placeholder="MM/YY"
                              className="border border-gray-200 rounded px-2 py-1 w-16 focus:outline-none focus:ring-1 focus:ring-blue-300"
                              value={item.expDt}
                              onChange={(e) =>
                                updateItem(idx, "expDt", e.target.value)
                              }
                            />
                          </td>
                          {(
                            ["qty", "free", "rate", "discPercent"] as const
                          ).map((f) => (
                            <td key={f} className="px-1 py-1.5">
                              <input
                                aria-label={f}
                                type="number"
                                min="0"
                                step={
                                  f === "rate" || f === "discPercent"
                                    ? "0.01"
                                    : "1"
                                }
                                className="border border-gray-200 rounded px-2 py-1 w-14 focus:outline-none focus:ring-1 focus:ring-blue-300"
                                value={item[f]}
                                onChange={(e) =>
                                  updateItem(idx, f, e.target.value)
                                }
                              />
                            </td>
                          ))}
                          <td className="px-2 py-1.5 font-medium text-gray-700">
                            {item.netAmt.toFixed(2)}
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              aria-label="GST%"
                              type="number"
                              min="0"
                              step="0.01"
                              className="border border-gray-200 rounded px-2 py-1 w-14 focus:outline-none focus:ring-1 focus:ring-blue-300"
                              value={item.gstPercent}
                              onChange={(e) =>
                                updateItem(idx, "gstPercent", e.target.value)
                              }
                            />
                          </td>
                          <td
                            className="px-2 py-1.5 font-semibold"
                            style={{ color: "#1565C0" }}
                          >
                            {item.amount.toFixed(2)}
                          </td>
                          <td className="px-1 py-1.5">
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              disabled={billForm.items.length === 1}
                              className="text-red-400 hover:text-red-600 disabled:opacity-30 p-1 rounded"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer Totals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-gray-700">
                    Charges & Discounts
                  </h4>
                  {[
                    { id: "sgst", label: "SGST Amount", key: "sgstAmount" },
                    { id: "cgst", label: "CGST Amount", key: "cgstAmount" },
                    {
                      id: "cash-disc",
                      label: "Cash Discount Total",
                      key: "cashDiscountTotal",
                    },
                    {
                      id: "scheme-disc",
                      label: "Scheme Discount Total",
                      key: "schemeDiscountTotal",
                    },
                    { id: "cndn", label: "Add/Less CN/DN", key: "addLessCnDn" },
                    {
                      id: "freight",
                      label: "Freight/Pkt Charge",
                      key: "freightPktCharge",
                    },
                  ].map(({ id, label, key }) => (
                    <div key={id} className="flex items-center gap-3">
                      <label
                        htmlFor={id}
                        className="text-sm text-gray-600 w-44"
                      >
                        {label}
                      </label>
                      <input
                        id={id}
                        type="number"
                        step="0.01"
                        className="input flex-1"
                        value={billForm[key as keyof BillForm] as string}
                        onChange={(e) =>
                          setBillForm((p) => ({ ...p, [key]: e.target.value }))
                        }
                      />
                    </div>
                  ))}
                  <div>
                    <label
                      htmlFor="terms"
                      className="block text-xs font-medium text-gray-600 mb-1"
                    >
                      Terms & Conditions
                    </label>
                    <textarea
                      id="terms"
                      rows={2}
                      className="input w-full resize-none"
                      value={billForm.termsConditions}
                      onChange={(e) =>
                        setBillForm((p) => ({
                          ...p,
                          termsConditions: e.target.value,
                        }))
                      }
                      placeholder="Thank you for doing business with us."
                    />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm self-start">
                  <h4 className="font-semibold text-gray-700 mb-3">
                    Bill Summary
                  </h4>
                  {[
                    {
                      label: "Sub Total",
                      value: `₹${totals.subTotal.toFixed(2)}`,
                    },
                    { label: "SGST", value: `₹${totals.sgst.toFixed(2)}` },
                    { label: "CGST", value: `₹${totals.cgst.toFixed(2)}` },
                    {
                      label: "Cash Discount",
                      value: `-₹${(Number(billForm.cashDiscountTotal) || 0).toFixed(2)}`,
                    },
                    {
                      label: "Scheme Discount",
                      value: `-₹${(Number(billForm.schemeDiscountTotal) || 0).toFixed(2)}`,
                    },
                    {
                      label: "Freight/Pkt",
                      value: `₹${(Number(billForm.freightPktCharge) || 0).toFixed(2)}`,
                    },
                    {
                      label: "Round Off",
                      value: `₹${totals.roundOff.toFixed(2)}`,
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex justify-between text-gray-600"
                    >
                      <span>{label}</span>
                      <span>{value}</span>
                    </div>
                  ))}
                  <div
                    className="flex justify-between font-bold text-base border-t border-gray-200 pt-2 mt-2"
                    style={{ color: "#1565C0" }}
                  >
                    <span>GRAND TOTAL</span>
                    <span>₹{totals.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {billSaveError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {billSaveError}
                </p>
              )}
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setBillModal(null)}
                  className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBillSave}
                  disabled={billSaving}
                  className="px-6 py-2 text-white font-semibold rounded-lg disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: "#1565C0" }}
                  data-ocid="save-purchase-bill-btn"
                >
                  {billSaving ? "Saving..." : "Save Purchase Bill"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ VIEW PURCHASE BILL MODAL ══════════════════ */}
      {viewBill && activeSup && (
        <dialog
          open
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-6 m-0 max-w-none w-full h-full p-0 border-0"
          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewBill(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setViewBill(null);
          }}
          aria-label="Purchase Bill Preview"
        >
          <div
            className="relative w-full max-w-5xl mx-4 rounded-xl overflow-hidden shadow-2xl"
            style={{ backgroundColor: "#f5f6f7" }}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ backgroundColor: "#1565C0" }}
            >
              <span className="text-white font-bold text-sm tracking-wide">
                Purchase Bill — {viewBill.invoiceNo}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => generateSupplierBillPdf(viewBill, activeSup)}
                  className="flex items-center gap-1.5 bg-white text-blue-700 font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Download size={13} /> Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => setViewBill(null)}
                  aria-label="Close"
                  className="text-white/80 hover:text-white ml-1 p-1 rounded transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Invoice Content */}
            <div className="p-5">
              <SupplierBillView bill={viewBill} supplier={activeSup} />
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────
// SupplierBillView — read-only display of a bill
// ──────────────────────────────────────────────────
function SupplierBillView({
  bill,
  supplier,
}: { bill: SupplierBill; supplier: Supplier }) {
  const d = new Date(Number(bill.date));
  const ds = `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;

  return (
    <div
      className="bg-white rounded-lg overflow-hidden"
      style={{
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        border: "1px solid #e0e0e0",
      }}
    >
      {/* Store Header */}
      <div
        className="text-center px-6 pt-5 pb-3"
        style={{ borderBottom: "2px solid #1565C0" }}
      >
        <h2
          className="font-bold uppercase"
          style={{
            fontSize: "15px",
            color: "#1a1a1a",
            letterSpacing: "0.05em",
          }}
        >
          LIFE CARE MEDICAL &amp; GENERAL STORE
        </h2>
        <p style={{ fontSize: "11px", color: "#555", marginTop: "2px" }}>
          Shop No 5 Burj Mastana, New Vavol, Gandhinagar
        </p>
        <p style={{ fontSize: "11px", color: "#555" }}>Ph: 6351499478</p>
        <div style={{ marginTop: "6px" }}>
          <span
            className="font-bold uppercase tracking-widest"
            style={{ fontSize: "12px", color: "#1565C0" }}
          >
            Purchase Bill (GST Invoice)
          </span>
        </div>
        <div
          style={{
            height: "2px",
            backgroundColor: "#1565C0",
            marginTop: "4px",
          }}
        />
      </div>

      {/* Header Info */}
      <div
        className="grid grid-cols-2"
        style={{ borderBottom: "1px solid #ddd", padding: "10px 20px" }}
      >
        <div style={{ paddingRight: "12px", borderRight: "1px solid #e0e0e0" }}>
          <p
            className="font-bold uppercase"
            style={{
              fontSize: "9px",
              color: "#1565C0",
              letterSpacing: "0.1em",
              marginBottom: "4px",
            }}
          >
            Supplier
          </p>
          <p className="font-bold" style={{ fontSize: "13px" }}>
            {supplier.name}
          </p>
          <p style={{ fontSize: "11px", color: "#555", marginTop: "2px" }}>
            Mobile: {supplier.mobile}
          </p>
          {supplier.email && (
            <p style={{ fontSize: "11px", color: "#555" }}>
              Email: {supplier.email}
            </p>
          )}
          {supplier.gstNo && (
            <p style={{ fontSize: "11px", color: "#555" }}>
              GST No: {supplier.gstNo}
            </p>
          )}
          {supplier.address && (
            <p style={{ fontSize: "11px", color: "#555" }}>
              {supplier.address}
            </p>
          )}
        </div>
        <div style={{ paddingLeft: "12px" }}>
          <p
            className="font-bold uppercase text-right"
            style={{
              fontSize: "9px",
              color: "#1565C0",
              letterSpacing: "0.1em",
              marginBottom: "4px",
            }}
          >
            Invoice Details
          </p>
          <table className="w-full" style={{ fontSize: "11px" }}>
            <tbody>
              {[
                ["Invoice No:", bill.invoiceNo],
                ["Date:", ds],
                ...(bill.challanNo ? [["Challan No:", bill.challanNo]] : []),
                ...(bill.salesMan ? [["Sales Man:", bill.salesMan]] : []),
                ...(bill.transport ? [["Transport:", bill.transport]] : []),
                ...(bill.lrNo ? [["L.R.No:", bill.lrNo]] : []),
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
      <div style={{ padding: "0 20px" }}>
        <table
          className="w-full"
          style={{ fontSize: "10px", borderCollapse: "collapse" }}
        >
          <thead>
            <tr style={{ backgroundColor: "#1565C0", color: "#fff" }}>
              {[
                "Sn",
                "Item Name",
                "HSN",
                "Pack",
                "Mfg",
                "M.R.P.",
                "Batch No.",
                "Exp.Dt",
                "Qty",
                "Free",
                "Rate",
                "Disc%",
                "N.Amt",
                "Gst%",
                "Amount",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "6px 4px",
                    textAlign: ["M.R.P.", "Rate", "N.Amt", "Amount"].includes(h)
                      ? "right"
                      : ["Qty", "Free", "Disc%", "Gst%"].includes(h)
                        ? "center"
                        : "left",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bill.items.map((item, i) => (
              <tr
                key={`bill-item-${Number(item.sn)}`}
                style={{
                  backgroundColor: i % 2 === 0 ? "#fff" : "#f0f6ff",
                  borderBottom: "1px solid #e0e0e0",
                }}
              >
                <td style={{ padding: "5px 4px", color: "#888" }}>
                  {Number(item.sn)}
                </td>
                <td style={{ padding: "5px 4px", fontWeight: 500 }}>
                  {item.itemName}
                </td>
                <td style={{ padding: "5px 4px", color: "#555" }}>
                  {item.hsn}
                </td>
                <td style={{ padding: "5px 4px", color: "#555" }}>
                  {item.pack}
                </td>
                <td style={{ padding: "5px 4px", color: "#555" }}>
                  {item.mfg}
                </td>
                <td style={{ padding: "5px 4px", textAlign: "right" }}>
                  ₹{item.mrp.toFixed(2)}
                </td>
                <td style={{ padding: "5px 4px" }}>{item.batchNo}</td>
                <td style={{ padding: "5px 4px" }}>{item.expDt}</td>
                <td style={{ padding: "5px 4px", textAlign: "center" }}>
                  {Number(item.qty)}
                </td>
                <td style={{ padding: "5px 4px", textAlign: "center" }}>
                  {Number(item.free)}
                </td>
                <td style={{ padding: "5px 4px", textAlign: "right" }}>
                  ₹{item.rate.toFixed(2)}
                </td>
                <td style={{ padding: "5px 4px", textAlign: "center" }}>
                  {item.discPercent}%
                </td>
                <td style={{ padding: "5px 4px", textAlign: "right" }}>
                  {item.netAmt.toFixed(2)}
                </td>
                <td style={{ padding: "5px 4px", textAlign: "center" }}>
                  {item.gstPercent}%
                </td>
                <td
                  style={{
                    padding: "5px 4px",
                    textAlign: "right",
                    fontWeight: 600,
                  }}
                >
                  ₹{item.amount.toFixed(2)}
                </td>
              </tr>
            ))}
            <tr style={{ borderTop: "2px solid #1565C0" }}>
              <td
                colSpan={14}
                style={{
                  padding: "6px 4px",
                  textAlign: "right",
                  fontWeight: 700,
                }}
              >
                Total
              </td>
              <td
                style={{
                  padding: "6px 4px",
                  textAlign: "right",
                  fontWeight: 700,
                }}
              >
                ₹{bill.items.reduce((s, i) => s + i.amount, 0).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer Totals */}
      <div
        className="grid grid-cols-2"
        style={{ padding: "12px 20px", borderTop: "1px solid #ddd" }}
      >
        <div style={{ paddingRight: "12px", borderRight: "1px solid #e0e0e0" }}>
          {bill.termsConditions && (
            <div>
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
                {bill.termsConditions}
              </p>
            </div>
          )}
          <div style={{ marginTop: bill.termsConditions ? "12px" : "0" }}>
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
            <div style={{ fontSize: "10px", color: "#444", lineHeight: "1.7" }}>
              <p>
                <span style={{ color: "#777" }}>Bank Name: </span>Punjab And
                Sind Bank, Gandhinagar
              </p>
              <p>
                <span style={{ color: "#777" }}>Account No: </span>
                12801000004020
              </p>
              <p>
                <span style={{ color: "#777" }}>IFSC Code: </span>PSIB0002180
              </p>
              <p>
                <span style={{ color: "#777" }}>Account Holder: </span>MAHAMAD
                SHAIKH
              </p>
            </div>
          </div>
        </div>
        <div style={{ paddingLeft: "12px" }}>
          <table
            className="w-full"
            style={{ fontSize: "11px", borderCollapse: "collapse" }}
          >
            <tbody>
              {[
                { label: "SGST Amount", val: `₹${bill.sgstAmount.toFixed(2)}` },
                { label: "CGST Amount", val: `₹${bill.cgstAmount.toFixed(2)}` },
                {
                  label: "Cash Discount",
                  val: `-₹${bill.cashDiscountTotal.toFixed(2)}`,
                },
                {
                  label: "Scheme Discount",
                  val: `-₹${bill.schemeDiscountTotal.toFixed(2)}`,
                },
                {
                  label: "Add/Less CN/DN",
                  val: `₹${bill.addLessCnDn.toFixed(2)}`,
                },
                {
                  label: "Freight/Pkt Charge",
                  val: `₹${bill.freightPktCharge.toFixed(2)}`,
                },
                { label: "Round Off", val: `₹${bill.roundOff.toFixed(2)}` },
              ].map(({ label, val }) => (
                <tr key={label} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "4px 3px", color: "#666" }}>{label}</td>
                  <td
                    style={{
                      padding: "4px 3px",
                      textAlign: "right",
                      fontWeight: 500,
                    }}
                  >
                    {val}
                  </td>
                </tr>
              ))}
              <tr style={{ backgroundColor: "#1565C0" }}>
                <td
                  style={{ padding: "7px 5px", color: "#fff", fontWeight: 700 }}
                >
                  GRAND TOTAL
                </td>
                <td
                  style={{
                    padding: "7px 5px",
                    textAlign: "right",
                    color: "#fff",
                    fontWeight: 700,
                  }}
                >
                  ₹{bill.grandTotal.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
          <div style={{ textAlign: "right", marginTop: "16px" }}>
            <p style={{ fontSize: "10px", color: "#666", marginBottom: "4px" }}>
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
            <p style={{ fontSize: "10px", color: "#555", marginTop: "3px" }}>
              Authorized Signatory
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
