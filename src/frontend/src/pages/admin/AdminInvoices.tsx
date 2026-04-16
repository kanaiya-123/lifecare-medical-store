import { Link } from "@tanstack/react-router";
import { Download, Eye, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { useActor } from "../../hooks/useActor";
import type { Bill } from "../../hooks/useActor";
import { generateInvoicePdf } from "../../utils/generateInvoicePdf";

export default function AdminInvoices() {
  const { actor } = useActor();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actor) return;
    actor.getAllBills().then((b) => {
      setBills(b);
      setLoading(false);
    });
  }, [actor]);

  if (loading) {
    return (
      <div
        data-ocid="invoices.loading_state"
        className="flex items-center justify-center h-40"
      >
        <div className="animate-spin w-8 h-8 border-4 border-[#2F8F66] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: "#1a3a6b" }}>
          Invoices
        </h2>
        <span className="text-sm text-gray-500">
          {bills.length} {bills.length === 1 ? "invoice" : "invoices"}
        </span>
      </div>

      {bills.length === 0 ? (
        <div
          data-ocid="invoices.empty_state"
          className="bg-white rounded-xl p-10 text-center border border-dashed border-gray-200"
        >
          <FileText size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">No invoices yet.</p>
          <p className="text-gray-400 text-sm mt-1">
            Create a bill to generate your first invoice.
          </p>
          <Link
            to="/admin/billing"
            className="inline-block mt-4 text-white text-sm px-4 py-2 rounded-lg font-medium"
            style={{ backgroundColor: "#1565C0" }}
          >
            + New Bill
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <table className="w-full text-sm" data-ocid="invoices.table">
            <thead>
              <tr
                style={{ backgroundColor: "#1565C0" }}
                className="text-white text-left text-xs"
              >
                <th className="px-4 py-3 font-semibold">Invoice #</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill, i) => {
                const dateObj = new Date(Number(bill.createdAt) / 1_000_000);
                const dd = String(dateObj.getDate()).padStart(2, "0");
                const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
                const yyyy = dateObj.getFullYear();
                const dateStr = `${dd}-${mm}-${yyyy}`;

                return (
                  <tr
                    key={bill.id.toString()}
                    className={`border-t border-gray-50 hover:bg-blue-50/20 transition-colors ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                    }`}
                    data-ocid={`invoices.item.${i + 1}`}
                  >
                    <td
                      className="px-4 py-3 font-mono text-xs font-semibold"
                      style={{ color: "#1565C0" }}
                    >
                      {bill.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {bill.customerName}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{dateStr}</td>
                    <td
                      className="px-4 py-3 font-semibold"
                      style={{ color: "#1a3a6b" }}
                    >
                      ₹{bill.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor:
                            bill.paymentMode === "Cash"
                              ? "#e8f5e9"
                              : bill.paymentMode === "UPI"
                                ? "#e3f2fd"
                                : bill.paymentMode === "Card"
                                  ? "#fff3e0"
                                  : "#fce4ec",
                          color:
                            bill.paymentMode === "Cash"
                              ? "#2e7d32"
                              : bill.paymentMode === "UPI"
                                ? "#1565C0"
                                : bill.paymentMode === "Card"
                                  ? "#e65100"
                                  : "#c62828",
                        }}
                      >
                        {bill.paymentMode ?? "Cash"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          to="/admin/invoices/$id"
                          params={{ id: bill.id.toString() }}
                          className="flex items-center gap-1 hover:underline text-xs font-medium"
                          style={{ color: "#2F8F66" }}
                          data-ocid={`invoices.link.${i + 1}`}
                        >
                          <Eye size={13} /> View
                        </Link>
                        <button
                          type="button"
                          onClick={() => generateInvoicePdf(bill)}
                          className="flex items-center gap-1 text-xs font-medium hover:underline"
                          style={{ color: "#1565C0" }}
                          data-ocid={`invoices.download.${i + 1}`}
                        >
                          <Download size={13} /> Download
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
