import { AlertTriangle, Clock, Pill, TrendingUp, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useActor } from "../../hooks/useActor";
import type { DashboardStats } from "../../hooks/useActor";

export default function AdminDashboard() {
  const { actor } = useActor();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actor) return;
    actor
      .getDashboardStats()
      .then((s) => {
        setStats(s);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [actor]);

  if (loading)
    return (
      <div className="text-center py-10 text-gray-400">
        Loading dashboard...
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-500 text-sm">
          Overview of Lifecare Medical Store
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Today's Sales"
          value={`₹${stats?.totalSales.toFixed(2) ?? "0.00"}`}
          color="bg-[#2F8F66]"
        />
        <StatCard
          icon={Users}
          label="Total Customers"
          value={stats?.totalCustomers.toString() ?? "0"}
          color="bg-blue-500"
        />
        <StatCard
          icon={Pill}
          label="Total Medicines"
          value={stats?.totalMedicines.toString() ?? "0"}
          color="bg-purple-500"
        />
        <StatCard
          icon={AlertTriangle}
          label="Low Stock"
          value={stats?.lowStockMedicines.length.toString() ?? "0"}
          color="bg-orange-500"
        />
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Low Stock */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle size={18} className="text-orange-500" /> Low Stock
            Medicines
          </h3>
          {stats?.lowStockMedicines.length === 0 ? (
            <p className="text-gray-400 text-sm">No low stock medicines.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {stats?.lowStockMedicines.map((m) => (
                <li
                  key={m.id.toString()}
                  className="py-2 flex justify-between text-sm"
                >
                  <span className="text-gray-700">{m.name}</span>
                  <span className="text-orange-600 font-semibold">
                    Stock: {m.stockQuantity.toString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Expiring */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Clock size={18} className="text-red-500" /> Expiring Soon (30 days)
          </h3>
          {stats?.expiringMedicines.length === 0 ? (
            <p className="text-gray-400 text-sm">No medicines expiring soon.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {stats?.expiringMedicines.map((m) => (
                <li
                  key={m.id.toString()}
                  className="py-2 flex justify-between text-sm"
                >
                  <span className="text-gray-700">{m.name}</span>
                  <span className="text-red-600 font-semibold">
                    Exp:{" "}
                    {new Date(Number(m.expiryDate) * 1000).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
      <div
        className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center shrink-0`}
      >
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-gray-500 text-xs">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
