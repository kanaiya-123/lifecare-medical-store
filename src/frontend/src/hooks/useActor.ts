import { useActor as useActorBase } from "@caffeineai/core-infrastructure";
import { createActor } from "../backend";
import type {
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

// Re-export backend types so components can import from this hook file
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
};
export { Category } from "../backend";

// Extended actor interface that matches actual backend methods
export interface ActorMethods {
  getAllMedicines(): Promise<Medicine[]>;
  getMedicine(id: bigint): Promise<Medicine>;
  addMedicine(input: MedicineInput): Promise<bigint>;
  updateMedicine(id: bigint, input: MedicineInput): Promise<void>;
  deleteMedicine(id: bigint): Promise<void>;
  searchMedicines(term: string): Promise<Medicine[]>;

  getAllCustomers(): Promise<Customer[]>;
  getCustomer(id: bigint): Promise<Customer>;
  addCustomer(input: CustomerInput): Promise<bigint>;
  updateCustomer(id: bigint, input: CustomerInput): Promise<void>;
  deleteCustomer(id: bigint): Promise<void>;

  getAllSuppliers(): Promise<Supplier[]>;
  getSupplier(id: bigint): Promise<Supplier>;
  addSupplier(input: SupplierInput): Promise<bigint>;
  updateSupplier(id: bigint, input: SupplierInput): Promise<void>;
  deleteSupplier(id: bigint): Promise<void>;

  createBill(
    customerId: bigint,
    items: BillItemInput[],
    gstPercent: number,
  ): Promise<bigint>;
  createBillV2(input: BillInput): Promise<bigint>;
  getBill(id: bigint): Promise<Bill>;
  getAllBills(): Promise<Bill[]>;
  getCustomerBills(customerId: bigint): Promise<Bill[]>;

  createSupplierBill(input: SupplierBillInput): Promise<SupplierBill>;
  getSupplierBill(id: bigint): Promise<SupplierBill | null>;
  getAllSupplierBills(): Promise<SupplierBill[]>;
  getSupplierBillsBySupplier(supplierId: bigint): Promise<SupplierBill[]>;
  deleteSupplierBill(id: bigint): Promise<boolean>;

  getDashboardStats(): Promise<DashboardStats>;
}

// useActor pre-bound with createActor — returns actor typed as ActorMethods
export function useActor(): {
  actor: ActorMethods | null;
  isFetching: boolean;
} {
  const result = useActorBase(createActor);
  return result as { actor: ActorMethods | null; isFetching: boolean };
}
