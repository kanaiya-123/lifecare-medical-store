import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Database,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Pill,
  Receipt,
  Truck,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/medicines", label: "Medicines", icon: Pill },
    { href: "/admin/customers", label: "Customers", icon: Users },
    { href: "/admin/billing", label: "New Bill", icon: Receipt },
    { href: "/admin/invoices", label: "Invoices", icon: FileText },
    { href: "/admin/suppliers", label: "Suppliers", icon: Truck },
    { href: "/admin/export", label: "Export SQL", icon: Database },
  ];

  function handleLogout() {
    localStorage.removeItem("isAdmin");
    navigate({ to: "/admin/login" });
  }

  return (
    <div className="flex h-screen bg-[#F5F6F7]">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:static md:block`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <p className="text-[#2F8F66] font-bold text-sm">Lifecare Medical</p>
            <p className="text-gray-500 text-xs">Admin Panel</p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              data-ocid={`nav.${item.label.toLowerCase().replace(" ", "_")}.link`}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.href
                  ? "bg-[#2F8F66] text-white"
                  : "text-gray-600 hover:bg-[#E6F4EE] hover:text-[#2F8F66]"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <button
            type="button"
            onClick={handleLogout}
            data-ocid="admin.logout_button"
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 mt-1"
          >
            ← Back to Website
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="md:hidden"
          >
            <Menu size={22} />
          </button>
          <h1 className="text-gray-800 font-semibold text-lg">
            {navItems.find((n) => n.href === location.pathname)?.label ||
              "Admin Panel"}
          </h1>
          <div className="text-sm text-gray-500">Admin</div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: overlay dismiss
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
