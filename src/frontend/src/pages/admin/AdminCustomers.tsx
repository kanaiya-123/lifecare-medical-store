import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useActor } from "../../hooks/useActor";
import type { Customer, CustomerInput } from "../../hooks/useActor";

const EMPTY: CustomerInput = { name: "", mobile: "", address: "" };

export default function AdminCustomers() {
  const { actor } = useActor();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<CustomerInput>(EMPTY);
  const [editId, setEditId] = useState<bigint | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!actor) return;
    actor.getAllCustomers().then((data) => {
      setCustomers(data);
      setLoading(false);
    });
  }, [actor]);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setForm(EMPTY);
    setEditId(null);
    setSaveError(null);
    setModal("add");
  }
  function openEdit(c: Customer) {
    setForm({ name: c.name, mobile: c.mobile, address: c.address });
    setEditId(c.id);
    setSaveError(null);
    setModal("edit");
  }

  async function handleSave() {
    if (!actor) return;
    if (!form.name.trim()) {
      setSaveError("Name is required.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const input: CustomerInput = {
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        address: form.address.trim(),
      };
      if (modal === "add") {
        await actor.addCustomer(input);
      } else if (editId !== null) {
        await actor.updateCustomer(editId, input);
      }
      setModal(null);
      setForm(EMPTY);
      load();
    } catch (err: unknown) {
      console.error("Failed to save customer:", err);
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
    if (!actor || !confirm("Delete this customer?")) return;
    await actor.deleteCustomer(id);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Customers</h2>
        <button
          type="button"
          onClick={openAdd}
          data-ocid="add-customer-btn"
          className="flex items-center gap-2 bg-[#2F8F66] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#27795a]"
        >
          <Plus size={16} /> Add Customer
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
                    Address
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((c) => (
                  <tr key={c.id.toString()} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {c.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.mobile}</td>
                    <td className="px-4 py-3 text-gray-600">{c.address}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          className="p-1.5 text-gray-400 hover:text-[#2F8F66] rounded"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id)}
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
            {customers.length === 0 && (
              <p className="text-center py-10 text-gray-400">
                No customers added yet.
              </p>
            )}
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg">
                {modal === "add" ? "Add Customer" : "Edit Customer"}
              </h3>
              <button type="button" onClick={() => setModal(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              {(["name", "mobile", "address"] as (keyof CustomerInput)[]).map(
                (field) => (
                  <div key={field}>
                    <label
                      htmlFor={`cust-${field}`}
                      className="block text-xs font-medium text-gray-600 mb-1 capitalize"
                    >
                      {field}
                    </label>
                    <input
                      id={`cust-${field}`}
                      className="input w-full"
                      value={form[field]}
                      onChange={(e) =>
                        setForm({ ...form, [field]: e.target.value })
                      }
                    />
                  </div>
                ),
              )}
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
                data-ocid="save-customer-btn"
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
