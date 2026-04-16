import { Link } from "@tanstack/react-router";

const medicines = [
  {
    name: "Paracetamol 500mg",
    brand: "Cipla",
    price: 25,
    category: "Tablet",
    description: "Fever & pain relief",
  },
  {
    name: "Azithromycin 500mg",
    brand: "Sun Pharma",
    price: 85,
    category: "Antibiotic",
    description: "Bacterial infections",
  },
  {
    name: "Cetirizine 10mg",
    brand: "Abbott",
    price: 30,
    category: "Tablet",
    description: "Allergy relief",
  },
  {
    name: "Omeprazole 20mg",
    brand: "Alkem",
    price: 45,
    category: "Capsule",
    description: "Acidity & GERD",
  },
  {
    name: "Metformin 500mg",
    brand: "Zydus",
    price: 60,
    category: "Tablet",
    description: "Diabetes management",
  },
  {
    name: "Atorvastatin 10mg",
    brand: "Cadila",
    price: 95,
    category: "Tablet",
    description: "Cholesterol control",
  },
];

const services = [
  {
    icon: "🚚",
    title: "Free Home Delivery",
    desc: "Free delivery on orders above ₹500 within city limits",
  },
  {
    icon: "💯",
    title: "Genuine Medicines",
    desc: "100% authentic medicines from licensed distributors",
  },
  {
    icon: "👨‍⚕️",
    title: "Expert Guidance",
    desc: "Pharmacist consultation available 8AM-9PM",
  },
  {
    icon: "💳",
    title: "Easy Payments",
    desc: "Cash, UPI, card - all payment modes accepted",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#2F8F66] to-[#1a6b4a] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Your Health, Our Priority
          </h1>
          <p className="text-xl text-white/80 mb-8">
            Lifecare Medical & General Store — trusted pharmacy for all your
            health needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/shop"
              className="bg-white text-[#2F8F66] px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors"
            >
              Browse Medicines
            </Link>
            <Link
              to="/contact"
              className="border-2 border-white text-white px-8 py-3 rounded-xl font-bold hover:bg-white/10 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-12 px-4 bg-[#F5F6F7]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
            Why Choose Us?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {services.map((s) => (
              <div
                key={s.title}
                className="bg-white rounded-xl p-4 text-center shadow-sm"
              >
                <div className="text-3xl mb-2">{s.icon}</div>
                <p className="font-semibold text-sm text-gray-800">{s.title}</p>
                <p className="text-xs text-gray-500 mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Medicines */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-800">
              Popular Medicines
            </h2>
            <Link
              to="/shop"
              className="text-[#2F8F66] text-sm font-medium hover:underline"
            >
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {medicines.map((med) => (
              <div
                key={med.name}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <span className="text-xs bg-[#E6F4EE] text-[#2F8F66] px-2 py-0.5 rounded-full font-medium">
                  {med.category}
                </span>
                <h3 className="font-semibold text-gray-800 mt-2 text-sm">
                  {med.name}
                </h3>
                <p className="text-xs text-gray-500">{med.brand}</p>
                <p className="text-xs text-gray-400 mt-1">{med.description}</p>
                <p className="text-[#2F8F66] font-bold mt-2">₹{med.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#2F8F66] text-white py-12 px-4 text-center">
        <h2 className="text-2xl font-bold mb-3">Need a Prescription Filled?</h2>
        <p className="text-white/80 mb-6">
          Upload your prescription and we'll deliver medicines to your doorstep.
        </p>
        <Link
          to="/contact"
          className="bg-white text-[#2F8F66] px-8 py-3 rounded-xl font-bold inline-block hover:bg-gray-100 transition-colors"
        >
          Contact Pharmacist
        </Link>
      </section>
    </div>
  );
}
