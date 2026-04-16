import {
  Link,
  Navigate,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import AdminLayout from "./components/AdminLayout";
import PublicLayout from "./components/PublicLayout";
import ContactPage from "./pages/ContactPage";
import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import AdminBilling from "./pages/admin/AdminBilling";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminExport from "./pages/admin/AdminExport";
import AdminInvoiceDetail from "./pages/admin/AdminInvoiceDetail";
import AdminInvoices from "./pages/admin/AdminInvoices";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminMedicines from "./pages/admin/AdminMedicines";
import AdminSuppliers from "./pages/admin/AdminSuppliers";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const publicLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "public",
  component: PublicLayout,
});

const homeRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/",
  component: HomePage,
});

const shopRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/shop",
  component: ShopPage,
});

const contactRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/contact",
  component: ContactPage,
});

const adminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/login",
  component: AdminLoginPage,
});

function AdminGuard() {
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  if (!isAdmin) return <Navigate to="/admin/login" />;
  return <AdminLayout />;
}

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminGuard,
});

const adminIndexRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/",
  component: () => <Navigate to="/admin/dashboard" />,
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/dashboard",
  component: AdminDashboard,
});

const adminMedicinesRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/medicines",
  component: AdminMedicines,
});

const adminCustomersRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/customers",
  component: AdminCustomers,
});

const adminBillingRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/billing",
  component: AdminBilling,
});

const adminInvoicesRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/invoices",
  component: AdminInvoices,
});

const adminInvoiceDetailRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/invoices/$id",
  component: AdminInvoiceDetail,
});

const adminSuppliersRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/suppliers",
  component: AdminSuppliers,
});

const adminExportRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/export",
  component: AdminExport,
});

const routeTree = rootRoute.addChildren([
  publicLayoutRoute.addChildren([homeRoute, shopRoute, contactRoute]),
  adminLoginRoute,
  adminRoute.addChildren([
    adminIndexRoute,
    adminDashboardRoute,
    adminMedicinesRoute,
    adminCustomersRoute,
    adminBillingRoute,
    adminInvoicesRoute,
    adminInvoiceDetailRoute,
    adminSuppliersRoute,
    adminExportRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
