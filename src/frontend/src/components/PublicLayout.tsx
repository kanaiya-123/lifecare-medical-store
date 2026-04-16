import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { useState } from "react";

export default function PublicLayout() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="bg-[#2F8F66] text-white text-xs py-1 px-4 flex items-center justify-between">
        <span>📞 +91-XXXXXXXXXX | 🕐 Mon–Sat: 8AM–9PM</span>
        <Link to="/admin/login" className="hover:underline text-white/90">
          Admin Panel
        </Link>
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-[#2F8F66] font-bold text-xl">
            💊 Lifecare Medical
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === link.href
                    ? "text-[#2F8F66] border-b-2 border-[#2F8F66]"
                    : "text-gray-600 hover:text-[#2F8F66]"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/shop"
              className="bg-[#2F8F66] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#27795a] transition-colors"
            >
              Order Now
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-gray-600"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 px-4 py-3 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMenuOpen(false)}
                className="block text-sm py-1 text-gray-700 hover:text-[#2F8F66]"
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/admin/login"
              className="block text-sm py-1 text-[#2F8F66] hover:underline"
            >
              Admin Panel
            </Link>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 text-sm py-8 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-white font-bold mb-2">💊 Lifecare Medical</p>
            <p className="text-xs">
              Your trusted pharmacy for all health needs.
            </p>
          </div>
          <div>
            <p className="text-white font-semibold mb-2">Quick Links</p>
            <div className="space-y-1">
              <Link to="/" className="block hover:text-[#2F8F66]">
                Home
              </Link>
              <Link to="/shop" className="block hover:text-[#2F8F66]">
                Shop
              </Link>
              <Link to="/contact" className="block hover:text-[#2F8F66]">
                Contact
              </Link>
              <Link to="/admin/login" className="block hover:text-[#2F8F66]">
                Admin Login
              </Link>
            </div>
          </div>
          <div>
            <p className="text-white font-semibold mb-2">Store Hours</p>
            <p className="text-xs">Mon–Sat: 8:00 AM – 9:00 PM</p>
            <p className="text-xs">Sunday: 9:00 AM – 6:00 PM</p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-6 pt-4 border-t border-gray-800 text-center text-xs">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="hover:text-white"
            target="_blank"
            rel="noreferrer"
          >
            caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
