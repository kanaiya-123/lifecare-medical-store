import { Database, Download, FileText } from "lucide-react";
import { useState } from "react";
import { useActor } from "../../hooks/useActor";
import { downloadSqlFile, generateSqlDump } from "../../utils/generateSqlDump";

export default function AdminExport() {
  const { actor } = useActor();
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleExport() {
    if (!actor) return;
    setExporting(true);
    setStatus(null);
    try {
      const [medicines, customers, bills] = await Promise.all([
        actor.getAllMedicines(),
        actor.getAllCustomers(),
        actor.getAllBills(),
      ]);

      const sql = generateSqlDump(medicines, customers, bills);
      const date = new Date().toISOString().slice(0, 10);
      downloadSqlFile(sql, `lifecare_database_${date}.sql`);

      setStatus(
        `Exported ${medicines.length} medicines, ${customers.length} customers, ${bills.length} invoices.`,
      );
    } catch (_e) {
      setStatus("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Export Database</h2>
        <p className="text-gray-500 text-sm mt-1">
          Download all data as a MySQL-compatible .sql file
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard
          icon={<Database size={22} className="text-[#2F8F66]" />}
          title="Medicines"
          desc="All medicine records with stock, price, expiry"
        />
        <InfoCard
          icon={<FileText size={22} className="text-blue-500" />}
          title="Customers"
          desc="All customer records with contact details"
        />
        <InfoCard
          icon={<FileText size={22} className="text-purple-500" />}
          title="Invoices"
          desc="All invoices and line items with GST"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-2">SQL Export</h3>
        <p className="text-sm text-gray-500 mb-4">
          Generates a complete MySQL dump with{" "}
          <code className="bg-gray-100 px-1 rounded text-xs">CREATE TABLE</code>{" "}
          and <code className="bg-gray-100 px-1 rounded text-xs">INSERT</code>{" "}
          statements for Medicines, Customers, Invoices, and Invoice Items.
          Compatible with MySQL / MariaDB / phpMyAdmin.
        </p>

        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 bg-[#2F8F66] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#27795a] disabled:opacity-50 transition-colors"
        >
          <Download size={18} />
          {exporting ? "Exporting..." : "Download .sql File"}
        </button>

        {status && (
          <p className="mt-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            {status}
          </p>
        )}
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3">
      <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-gray-900 text-sm">{title}</p>
        <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
