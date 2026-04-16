import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface BillItem {
    hsnSac?: string;
    discount: number;
    quantity: bigint;
    price: number;
    medicineId: bigint;
    amount: number;
    medicineName: string;
}
export interface SupplierBillInput {
    salesMan?: string;
    addLessCnDn: number;
    challanNo?: string;
    date: bigint;
    lrNo?: string;
    transport?: string;
    invoiceNo: string;
    cashDiscountTotal: number;
    grandTotal: number;
    freightPktCharge: number;
    schemeDiscountTotal: number;
    items: Array<SupplierBillItem>;
    cgstAmount: number;
    sgstAmount: number;
    roundOff: number;
    supplierId: bigint;
    termsConditions?: string;
}
export interface SupplierBillItem {
    sn: bigint;
    hsn: string;
    mfg: string;
    mrp: number;
    qty: bigint;
    free: bigint;
    pack: string;
    rate: number;
    gstPercent: number;
    discPercent: number;
    netAmt: number;
    expDt: string;
    itemName: string;
    batchNo: string;
    amount: number;
}
export interface MedicineInput {
    stockQuantity: bigint;
    expiryDate: bigint;
    name: string;
    discount: number;
    category: Category;
    brand: string;
    price: number;
}
export interface BillInput {
    customerGstin?: string;
    gstPercent: number;
    receivedAmount?: number;
    paymentMode?: string;
    customerId: bigint;
    placeOfSupply?: string;
    items: Array<BillItemInput>;
}
export interface Customer {
    id: bigint;
    name: string;
    createdAt: bigint;
    address: string;
    mobile: string;
}
export interface DashboardStats {
    expiringMedicines: Array<Medicine>;
    totalSales: number;
    totalMedicines: bigint;
    totalCustomers: bigint;
    lowStockMedicines: Array<Medicine>;
}
export interface SupplierInput {
    name: string;
    email: string;
    gstNo: string;
    address: string;
    mobile: string;
}
export interface CustomerInput {
    name: string;
    address: string;
    mobile: string;
}
export interface BillItemInput {
    hsnSac?: string;
    discount: number;
    quantity: bigint;
    price: number;
    medicineId: bigint;
    amount: number;
    medicineName: string;
}
export interface SupplierBill {
    id: bigint;
    salesMan?: string;
    addLessCnDn: number;
    challanNo?: string;
    supplierName: string;
    date: bigint;
    lrNo?: string;
    createdAt: bigint;
    transport?: string;
    invoiceNo: string;
    cashDiscountTotal: number;
    grandTotal: number;
    freightPktCharge: number;
    schemeDiscountTotal: number;
    items: Array<SupplierBillItem>;
    cgstAmount: number;
    sgstAmount: number;
    roundOff: number;
    supplierId: bigint;
    termsConditions?: string;
}
export interface Medicine {
    id: bigint;
    stockQuantity: bigint;
    expiryDate: bigint;
    name: string;
    createdAt: bigint;
    discount: number;
    category: Category;
    brand: string;
    price: number;
}
export interface Bill {
    id: bigint;
    customerName: string;
    customerGstin?: string;
    balanceAmount: number;
    discountAmount: number;
    createdAt: bigint;
    gstPercent: number;
    customerMobile: string;
    receivedAmount: number;
    gstAmount: number;
    invoiceNumber: string;
    totalAmount: number;
    paymentMode: string;
    customerId: bigint;
    placeOfSupply?: string;
    items: Array<BillItem>;
    subtotal: number;
}
export interface Supplier {
    id: bigint;
    name: string;
    createdAt: bigint;
    email: string;
    gstNo: string;
    address: string;
    mobile: string;
}
export enum Category {
    Syrup = "Syrup",
    Drops = "Drops",
    Capsule = "Capsule",
    Injection = "Injection",
    Tablet = "Tablet",
    Other = "Other",
    Cream = "Cream"
}
export interface backendInterface {
    addCustomer(input: CustomerInput): Promise<bigint>;
    addMedicine(input: MedicineInput): Promise<bigint>;
    addSupplier(input: SupplierInput): Promise<bigint>;
    createBill(customerId: bigint, items: Array<BillItemInput>, gstPercent: number): Promise<bigint>;
    createBillV2(input: BillInput): Promise<bigint>;
    createSupplierBill(input: SupplierBillInput): Promise<SupplierBill>;
    deleteCustomer(id: bigint): Promise<void>;
    deleteMedicine(id: bigint): Promise<void>;
    deleteSupplier(id: bigint): Promise<void>;
    deleteSupplierBill(id: bigint): Promise<boolean>;
    getAllBills(): Promise<Array<Bill>>;
    getAllCustomers(): Promise<Array<Customer>>;
    getAllMedicines(): Promise<Array<Medicine>>;
    getAllSupplierBills(): Promise<Array<SupplierBill>>;
    getAllSuppliers(): Promise<Array<Supplier>>;
    getBill(id: bigint): Promise<Bill>;
    getCustomer(id: bigint): Promise<Customer>;
    getCustomerBills(customerId: bigint): Promise<Array<Bill>>;
    getDashboardStats(): Promise<DashboardStats>;
    getMedicine(id: bigint): Promise<Medicine>;
    getSupplier(id: bigint): Promise<Supplier>;
    getSupplierBill(id: bigint): Promise<SupplierBill | null>;
    getSupplierBillsBySupplier(supplierId: bigint): Promise<Array<SupplierBill>>;
    searchMedicines(term: string): Promise<Array<Medicine>>;
    updateCustomer(id: bigint, input: CustomerInput): Promise<void>;
    updateMedicine(id: bigint, input: MedicineInput): Promise<void>;
    updateSupplier(id: bigint, input: SupplierInput): Promise<void>;
}
