import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useActor } from "../hooks/useActor";
import type { Medicine } from "../hooks/useActor";

export default function ShopPage() {
  const { actor } = useActor();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!actor) return;
    setLoading(true);
    actor
      .getAllMedicines()
      .then((data) => {
        setMedicines(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [actor]);

  const filtered = medicines.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.brand.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Shop Medicines</h1>
      <p className="text-gray-500 mb-6">
        Browse our complete range of medicines
      </p>

      <div className="relative mb-6">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search medicines by name, brand or category..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2F8F66]/30 bg-white"
        />
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">
          Loading medicines...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-6xl mb-4">💊</p>
          <p className="text-gray-500">
            {search
              ? "No medicines match your search."
              : "No medicines available yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((med) => (
            <div
              key={med.id.toString()}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
            >
              <div className="text-3xl text-center mb-3">💊</div>
              <span className="text-xs bg-[#E6F4EE] text-[#2F8F66] px-2 py-1 rounded-full">
                {med.category}
              </span>
              <h3 className="font-semibold text-gray-900 text-sm mt-2 mb-1">
                {med.name}
              </h3>
              <p className="text-gray-500 text-xs mb-2">{med.brand}</p>
              <div className="flex items-center justify-between">
                <p className="text-[#2F8F66] font-bold">
                  ₹{med.price.toFixed(2)}
                </p>
                {med.discount > 0 && (
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                    {med.discount}% off
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Stock: {med.stockQuantity.toString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
