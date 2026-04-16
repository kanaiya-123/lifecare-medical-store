import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Category, useActor } from "../../hooks/useActor";
import type { Medicine, MedicineInput } from "../../hooks/useActor";

function makeEmptyForm(): MedicineInput {
  return {
    name: "",
    category: Category.Tablet,
    brand: "",
    price: 0,
    discount: 0,
    stockQuantity: BigInt(0),
    expiryDate: BigInt(
      Math.floor(new Date().getTime() / 1000) + 60 * 24 * 3600,
    ),
  };
}

export default function AdminMedicines() {
  const { actor } = useActor();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<MedicineInput>(makeEmptyForm());
  const [editId, setEditId] = useState<bigint | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!actor) return;
    actor.getAllMedicines().then((data) => {
      setMedicines(data);
      setLoading(false);
    });
  }, [actor]);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setForm(makeEmptyForm());
    setEditId(null);
    setSaveError(null);
    setModal("add");
  }

  function openEdit(m: Medicine) {
    setForm({
      name: m.name,
      category: m.category,
      brand: m.brand,
      price: m.price,
      discount: m.discount,
      stockQuantity: m.stockQuantity,
      expiryDate: m.expiryDate,
    });
    setEditId(m.id);
    setSaveError(null);
    setModal("edit");
  }

  async function handleSave() {
    if (!actor) return;
    if (!form.name.trim()) {
      setSaveError("Medicine name is required.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const input: MedicineInput = {
        name: form.name.trim(),
        category: form.category,
        brand: form.brand.trim(),
        price: Number(form.price) || 0,
        discount: Number(form.discount) || 0,
        stockQuantity: BigInt(form.stockQuantity),
        expiryDate: BigInt(form.expiryDate),
      };
      if (modal === "add") {
        await actor.addMedicine(input);
      } else if (editId !== null) {
        await actor.updateMedicine(editId, input);
      }
      setModal(null);
      setForm(makeEmptyForm());
      load();
    } catch (err: unknown) {
      console.error("Failed to save medicine:", err);
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

  async function handleDelete(id: bigint) {
    if (!actor || !confirm("Delete this medicine?")) return;
    await actor.deleteMedicine(id);
    load();
  }

  const now = Date.now() / 1000;
  const in30Days = now + 30 * 24 * 3600;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Medicines</h2>
        <button
          type="button"
          onClick={openAdd}
          data-ocid="add-medicine-btn"
          className="flex items-center gap-2 bg-[#2F8F66] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#27795a] transition-colors"
        >
          <Plus size={16} /> Add Medicine
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
                    Category
                  </th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">
                    Brand
                  </th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">
                    Price
                  </th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">
                    Stock
                  </th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">
                    Expiry
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {medicines.map((m) => {
                  const expTs = Number(m.expiryDate);
                  const isExpiring = expTs < in30Days;
                  const isLowStock = Number(m.stockQuantity) < 10;
                  return (
                    <tr key={m.id.toString()} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {m.name}
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-[#E6F4EE] text-[#2F8F66] px-2 py-0.5 rounded-full text-xs">
                          {m.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{m.brand}</td>
                      <td className="px-4 py-3 text-gray-900">
                        ₹{m.price.toFixed(2)}
                        {m.discount > 0 && (
                          <span className="text-xs text-green-600 ml-1">
                            -{m.discount}%
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            isLowStock
                              ? "text-orange-600 font-semibold"
                              : "text-gray-700"
                          }
                        >
                          {m.stockQuantity.toString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            isExpiring
                              ? "text-red-600 font-semibold"
                              : "text-gray-600"
                          }
                        >
                          {new Date(expTs * 1000).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(m)}
                            className="p-1.5 text-gray-400 hover:text-[#2F8F66] rounded"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(m.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {medicines.length === 0 && (
              <p className="text-center py-10 text-gray-400">
                No medicines added yet.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg text-gray-900">
                {modal === "add" ? "Add Medicine" : "Edit Medicine"}
              </h3>
              <button type="button" onClick={() => setModal(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="med-name"
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  Name
                </label>
                <input
                  id="med-name"
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="med-category"
                    className="block text-xs font-medium text-gray-600 mb-1"
                  >
                    Category
                  </label>
                  <select
                    id="med-category"
                    className="input"
                    value={form.category}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category: e.target.value as Category,
                      })
                    }
                  >
                    {Object.values(Category).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="med-brand"
                    className="block text-xs font-medium text-gray-600 mb-1"
                  >
                    Brand
                  </label>
                  <input
                    id="med-brand"
                    className="input"
                    value={form.brand}
                    onChange={(e) =>
                      setForm({ ...form, brand: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="med-price"
                    className="block text-xs font-medium text-gray-600 mb-1"
                  >
                    Price (₹)
                  </label>
                  <input
                    id="med-price"
                    type="number"
                    min="0"
                    step="0.01"
                    className="input"
                    value={form.price}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        price: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="med-discount"
                    className="block text-xs font-medium text-gray-600 mb-1"
                  >
                    Discount (%)
                  </label>
                  <input
                    id="med-discount"
                    type="number"
                    min="0"
                    max="15"
                    step="0.1"
                    className="input"
                    value={form.discount}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        discount: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="med-stock"
                    className="block text-xs font-medium text-gray-600 mb-1"
                  >
                    Stock Qty
                  </label>
                  <input
                    id="med-stock"
                    type="number"
                    min="0"
                    className="input"
                    value={form.stockQuantity.toString()}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        stockQuantity: BigInt(
                          Number.parseInt(e.target.value) || 0,
                        ),
                      })
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="med-expiry"
                    className="block text-xs font-medium text-gray-600 mb-1"
                  >
                    Expiry Date
                  </label>
                  <input
                    id="med-expiry"
                    type="date"
                    className="input"
                    value={
                      new Date(Number(form.expiryDate) * 1000)
                        .toISOString()
                        .split("T")[0]
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        expiryDate: BigInt(
                          Math.floor(new Date(e.target.value).getTime() / 1000),
                        ),
                      })
                    }
                  />
                </div>
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
                onClick={() => setModal(null)}
                className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                data-ocid="save-medicine-btn"
                className="px-4 py-2 bg-[#2F8F66] text-white rounded-lg hover:bg-[#27795a] disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
