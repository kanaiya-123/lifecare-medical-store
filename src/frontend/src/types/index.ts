// Local domain types for Lifecare Medical Store
// These re-export from backend.ts to ensure type alignment with backend Candid interface.
// Using backend.ts types directly avoids mismatches with generated Candid serialization.

export type {
  Bill,
  BillInput,
  BillItem,
  BillItemInput,
  Customer,
  CustomerInput,
  DashboardStats,
  Medicine,
  MedicineInput,
  Supplier,
  SupplierBill,
  SupplierBillInput,
  SupplierBillItem,
  SupplierInput,
} from "../backend";

// Category enum — exported as both type and value
export { Category } from "../backend";
