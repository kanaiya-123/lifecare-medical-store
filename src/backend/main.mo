import Text "mo:core/Text";
import Float "mo:core/Float";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Order "mo:core/Order";


actor {
  // ── Types ──────────────────────────────────────────────────────────────────

  type Category = {
    #Tablet; #Syrup; #Injection; #Capsule; #Drops; #Cream; #Other;
  };

  type Medicine = {
    id : Nat; name : Text; category : Category; brand : Text;
    price : Float; discount : Float; stockQuantity : Nat;
    expiryDate : Int; createdAt : Int;
  };

  type Customer = {
    id : Nat; name : Text; mobile : Text; address : Text; createdAt : Int;
  };

  type Supplier = {
    id : Nat; name : Text; mobile : Text; address : Text;
    email : Text; gstNo : Text; createdAt : Int;
  };

  type BillItem = {
    medicineId : Nat; medicineName : Text; quantity : Nat;
    price : Float; discount : Float; amount : Float;
    hsnSac : ?Text;
  };

  type Bill = {
    id : Nat; invoiceNumber : Text; customerId : Nat;
    customerName : Text; customerMobile : Text; items : [BillItem];
    subtotal : Float; discountAmount : Float; gstAmount : Float;
    totalAmount : Float; gstPercent : Float; createdAt : Int;
    customerGstin : ?Text; placeOfSupply : ?Text;
    paymentMode : Text; receivedAmount : Float; balanceAmount : Float;
  };

  type BillItemInput = {
    medicineId : Nat; medicineName : Text; quantity : Nat;
    price : Float; discount : Float; amount : Float;
    hsnSac : ?Text;
  };

  type BillInput = {
    customerId : Nat; items : [BillItemInput]; gstPercent : Float;
    customerGstin : ?Text; placeOfSupply : ?Text;
    paymentMode : ?Text; receivedAmount : ?Float;
  };

  type DashboardStats = {
    totalSales : Float; totalCustomers : Nat; totalMedicines : Nat;
    lowStockMedicines : [Medicine]; expiringMedicines : [Medicine];
  };

  type MedicineInput = {
    name : Text; category : Category; brand : Text;
    price : Float; discount : Float; stockQuantity : Nat; expiryDate : Int;
  };

  type CustomerInput = { name : Text; mobile : Text; address : Text };
  type SupplierInput = { name : Text; mobile : Text; address : Text; email : Text; gstNo : Text };

  type SupplierBillItem = {
    sn : Nat; itemName : Text; hsn : Text; pack : Text; mfg : Text;
    mrp : Float; batchNo : Text; expDt : Text; qty : Nat; free : Nat;
    rate : Float; discPercent : Float; netAmt : Float; gstPercent : Float;
    amount : Float;
  };

  type SupplierBill = {
    id : Nat; supplierId : Nat; supplierName : Text; invoiceNo : Text;
    date : Int; challanNo : ?Text; salesMan : ?Text; transport : ?Text;
    lrNo : ?Text; items : [SupplierBillItem]; sgstAmount : Float;
    cgstAmount : Float; cashDiscountTotal : Float; schemeDiscountTotal : Float;
    addLessCnDn : Float; freightPktCharge : Float; roundOff : Float;
    grandTotal : Float; termsConditions : ?Text; createdAt : Int;
  };

  type SupplierBillInput = {
    supplierId : Nat; invoiceNo : Text; date : Int; challanNo : ?Text;
    salesMan : ?Text; transport : ?Text; lrNo : ?Text;
    items : [SupplierBillItem]; sgstAmount : Float; cgstAmount : Float;
    cashDiscountTotal : Float; schemeDiscountTotal : Float;
    addLessCnDn : Float; freightPktCharge : Float; roundOff : Float;
    grandTotal : Float; termsConditions : ?Text;
  };

  // ── Legacy Bill type (kept for stable compatibility with old on-chain data) ─

  type OldBillItem = {
    medicineId : Nat; medicineName : Text; quantity : Nat;
    price : Float; discount : Float; amount : Float;
  };
  type OldBill = {
    id : Nat; invoiceNumber : Text; customerId : Nat;
    customerName : Text; customerMobile : Text; items : [OldBillItem];
    subtotal : Float; discountAmount : Float; gstAmount : Float;
    totalAmount : Float; gstPercent : Float; createdAt : Int;
  };

  // `bills` keeps the OldBill shape so the stable var is compatible with
  // on-chain data from previous deployments.
  // New bills are stored in `billsV2` with all Vyapar fields.
  let bills     = Map.empty<Nat, OldBill>();
  let billsV2   = Map.empty<Nat, Bill>();

  // ── Active state ──────────────────────────────────────────────────────────

  let medicines     = Map.empty<Nat, Medicine>();
  let customers     = Map.empty<Nat, Customer>();
  let suppliers     = Map.empty<Nat, Supplier>();
  let supplierBills = Map.empty<Nat, SupplierBill>();

  var medicineIdCounter    = 1;
  var customerIdCounter    = 1;
  var supplierIdCounter    = 1;
  var billIdCounter        = 1;
  var invoiceNumberCounter = 1;
  var nextSupplierBillId   = 1;

  // ── Helpers ───────────────────────────────────────────────────────────────

  func categoryToText(c : Category) : Text {
    switch c {
      case (#Tablet)    "tablet";
      case (#Syrup)     "syrup";
      case (#Injection) "injection";
      case (#Capsule)   "capsule";
      case (#Drops)     "drops";
      case (#Cream)     "cream";
      case (#Other)     "other";
    };
  };

  func cmpMed(a : Medicine, b : Medicine) : Order.Order { Nat.compare(a.id, b.id) };
  func cmpBill(a : Bill, b : Bill)        : Order.Order { Nat.compare(a.id, b.id) };

  // Promote an OldBill to a Bill (fill defaults for new fields)
  func promoteBill(old : OldBill) : Bill {
    let items : [BillItem] = old.items.map<OldBillItem, BillItem>(func(i) {
      { i with hsnSac = null }
    });
    {
      id             = old.id;
      invoiceNumber  = old.invoiceNumber;
      customerId     = old.customerId;
      customerName   = old.customerName;
      customerMobile = old.customerMobile;
      items          = items;
      subtotal       = old.subtotal;
      discountAmount = old.discountAmount;
      gstAmount      = old.gstAmount;
      totalAmount    = old.totalAmount;
      gstPercent     = old.gstPercent;
      createdAt      = old.createdAt;
      customerGstin  = null;
      placeOfSupply  = null;
      paymentMode    = "Cash";
      receivedAmount = old.totalAmount;
      balanceAmount  = 0.0;
    }
  };

  // Get a bill by id (checks billsV2 first, then falls back to legacy bills)
  func getBillById(id : Nat) : ?Bill {
    switch (billsV2.get(id)) {
      case (?b) ?b;
      case null {
        switch (bills.get(id)) {
          case (?old) ?(promoteBill(old));
          case null null;
        }
      };
    }
  };

  // Get all bills merged from both maps
  func getAllBillsMerged() : [Bill] {
    let r = List.empty<Bill>();
    for (b in billsV2.values()) { r.add(b) };
    for (old in bills.values()) {
      if (not billsV2.containsKey(old.id)) r.add(promoteBill(old));
    };
    r.toArray().sort(cmpBill);
  };

  // ── Medicine ──────────────────────────────────────────────────────────────

  public shared func addMedicine(input : MedicineInput) : async Nat {
    if (input.discount < 0.0 or input.discount > 15.0) Runtime.trap("Discount 0-15%");
    let id = medicineIdCounter;
    medicineIdCounter += 1;
    medicines.add(id, { input with id; createdAt = Time.now() });
    id;
  };

  public shared func updateMedicine(id : Nat, input : MedicineInput) : async () {
    let e = switch (medicines.get(id)) { case null Runtime.trap("Not found"); case (?v) v };
    if (input.discount < 0.0 or input.discount > 15.0) Runtime.trap("Discount 0-15%");
    medicines.add(id, { input with id; createdAt = e.createdAt });
  };

  public shared func deleteMedicine(id : Nat) : async () {
    if (not medicines.containsKey(id)) Runtime.trap("Not found");
    medicines.remove(id);
  };

  public query func getMedicine(id : Nat) : async Medicine {
    switch (medicines.get(id)) { case null Runtime.trap("Not found"); case (?v) v };
  };

  public query func getAllMedicines() : async [Medicine] {
    medicines.values().toArray().sort(cmpMed);
  };

  public query func searchMedicines(term : Text) : async [Medicine] {
    let t = term.toLower();
    let r = List.empty<Medicine>();
    for (m in medicines.values()) {
      if (m.name.toLower().contains(#text t) or categoryToText(m.category).contains(#text t)) r.add(m);
    };
    r.toArray();
  };

  // ── Customer ──────────────────────────────────────────────────────────────

  public shared func addCustomer(input : CustomerInput) : async Nat {
    let id = customerIdCounter;
    customerIdCounter += 1;
    customers.add(id, { input with id; createdAt = Time.now() });
    id;
  };

  public shared func updateCustomer(id : Nat, input : CustomerInput) : async () {
    let e = switch (customers.get(id)) { case null Runtime.trap("Not found"); case (?v) v };
    customers.add(id, { input with id; createdAt = e.createdAt });
  };

  public shared func deleteCustomer(id : Nat) : async () {
    if (not customers.containsKey(id)) Runtime.trap("Not found");
    customers.remove(id);
  };

  public query func getCustomer(id : Nat) : async Customer {
    switch (customers.get(id)) { case null Runtime.trap("Not found"); case (?v) v };
  };

  public query func getAllCustomers() : async [Customer] {
    customers.values().toArray();
  };

  // ── Supplier ──────────────────────────────────────────────────────────────

  public shared func addSupplier(input : SupplierInput) : async Nat {
    let id = supplierIdCounter;
    supplierIdCounter += 1;
    suppliers.add(id, { input with id; createdAt = Time.now() });
    id;
  };

  public shared func updateSupplier(id : Nat, input : SupplierInput) : async () {
    let e = switch (suppliers.get(id)) { case null Runtime.trap("Not found"); case (?v) v };
    suppliers.add(id, { input with id; createdAt = e.createdAt });
  };

  public shared func deleteSupplier(id : Nat) : async () {
    if (not suppliers.containsKey(id)) Runtime.trap("Not found");
    suppliers.remove(id);
  };

  public query func getSupplier(id : Nat) : async Supplier {
    switch (suppliers.get(id)) { case null Runtime.trap("Not found"); case (?v) v };
  };

  public query func getAllSuppliers() : async [Supplier] {
    suppliers.values().toArray();
  };

  // ── Billing ───────────────────────────────────────────────────────────────

  public shared func createBill(customerId : Nat, items : [BillItemInput], gstPercent : Float) : async Nat {
    let customer = switch (customers.get(customerId)) { case null Runtime.trap("Customer not found"); case (?v) v };

    let subtotal = items.foldLeft(0.0, func(acc : Float, item : BillItemInput) : Float { acc + item.amount });
    let discountAmount = items.foldLeft(0.0, func(acc : Float, item : BillItemInput) : Float {
      acc + (item.price * item.quantity.toInt().toFloat() * (item.discount / 100.0));
    });
    let taxableAmount = subtotal - discountAmount;
    let gstAmount   = taxableAmount * (gstPercent / 100.0);
    let totalAmount = taxableAmount + gstAmount;

    for (item in items.values()) {
      let m = switch (medicines.get(item.medicineId)) { case null Runtime.trap("Medicine not found"); case (?v) v };
      if (m.stockQuantity < item.quantity) Runtime.trap("Insufficient stock: " # item.medicineName);
      medicines.add(item.medicineId, { m with stockQuantity = m.stockQuantity - item.quantity });
    };

    let id = billIdCounter;
    billIdCounter += 1;
    let invoiceNumber = "INV-" # invoiceNumberCounter.toText();
    invoiceNumberCounter += 1;

    let billItems : [BillItem] = items.map<BillItemInput, BillItem>(func(i) { i });

    billsV2.add(id, {
      id; invoiceNumber; customerId;
      customerName    = customer.name;
      customerMobile  = customer.mobile;
      items           = billItems;
      subtotal; discountAmount; gstAmount; totalAmount; gstPercent;
      createdAt       = Time.now();
      customerGstin   = null;
      placeOfSupply   = null;
      paymentMode     = "Cash";
      receivedAmount  = totalAmount;
      balanceAmount   = 0.0;
    });
    id;
  };

  public shared func createBillV2(input : BillInput) : async Nat {
    let customer = switch (customers.get(input.customerId)) { case null Runtime.trap("Customer not found"); case (?v) v };

    let subtotal = input.items.foldLeft(0.0, func(acc : Float, item : BillItemInput) : Float { acc + item.amount });
    let discountAmount = input.items.foldLeft(0.0, func(acc : Float, item : BillItemInput) : Float {
      acc + (item.price * item.quantity.toInt().toFloat() * (item.discount / 100.0));
    });
    let taxableAmount = subtotal - discountAmount;
    let gstAmount   = taxableAmount * (input.gstPercent / 100.0);
    let totalAmount = taxableAmount + gstAmount;

    for (item in input.items.values()) {
      let m = switch (medicines.get(item.medicineId)) { case null Runtime.trap("Medicine not found"); case (?v) v };
      if (m.stockQuantity < item.quantity) Runtime.trap("Insufficient stock: " # item.medicineName);
      medicines.add(item.medicineId, { m with stockQuantity = m.stockQuantity - item.quantity });
    };

    let id = billIdCounter;
    billIdCounter += 1;
    let invoiceNumber = "INV-" # invoiceNumberCounter.toText();
    invoiceNumberCounter += 1;

    let mode     = switch (input.paymentMode)   { case (?m) m; case null "Cash" };
    let received = switch (input.receivedAmount) { case (?r) r; case null totalAmount };
    let balance  = received - totalAmount;

    let billItems : [BillItem] = input.items.map<BillItemInput, BillItem>(func(i) { i });

    billsV2.add(id, {
      id; invoiceNumber;
      customerId     = input.customerId;
      customerName   = customer.name;
      customerMobile = customer.mobile;
      items          = billItems;
      subtotal; discountAmount; gstAmount; totalAmount;
      gstPercent     = input.gstPercent;
      createdAt      = Time.now();
      customerGstin  = input.customerGstin;
      placeOfSupply  = input.placeOfSupply;
      paymentMode    = mode;
      receivedAmount = received;
      balanceAmount  = balance;
    });
    id;
  };

  public query func getBill(id : Nat) : async Bill {
    switch (getBillById(id)) { case null Runtime.trap("Not found"); case (?v) v };
  };

  public query func getAllBills() : async [Bill] {
    getAllBillsMerged();
  };

  public query func getCustomerBills(customerId : Nat) : async [Bill] {
    let r = List.empty<Bill>();
    for (b in getAllBillsMerged().values()) {
      if (b.customerId == customerId) r.add(b);
    };
    r.toArray();
  };

  // ── Supplier Bills ────────────────────────────────────────────────────────

  public shared func createSupplierBill(input : SupplierBillInput) : async SupplierBill {
    let supplier = switch (suppliers.get(input.supplierId)) {
      case null Runtime.trap("Supplier not found");
      case (?v) v;
    };
    let id = nextSupplierBillId;
    nextSupplierBillId += 1;
    let bill : SupplierBill = {
      id;
      supplierId     = input.supplierId;
      supplierName   = supplier.name;
      invoiceNo      = input.invoiceNo;
      date           = input.date;
      challanNo      = input.challanNo;
      salesMan       = input.salesMan;
      transport      = input.transport;
      lrNo           = input.lrNo;
      items          = input.items;
      sgstAmount     = input.sgstAmount;
      cgstAmount     = input.cgstAmount;
      cashDiscountTotal    = input.cashDiscountTotal;
      schemeDiscountTotal  = input.schemeDiscountTotal;
      addLessCnDn    = input.addLessCnDn;
      freightPktCharge     = input.freightPktCharge;
      roundOff       = input.roundOff;
      grandTotal     = input.grandTotal;
      termsConditions = input.termsConditions;
      createdAt      = Time.now();
    };
    supplierBills.add(id, bill);
    bill;
  };

  public query func getSupplierBill(id : Nat) : async ?SupplierBill {
    supplierBills.get(id);
  };

  public query func getAllSupplierBills() : async [SupplierBill] {
    let r = List.empty<SupplierBill>();
    for (b in supplierBills.values()) { r.add(b) };
    r.toArray().sort(func(a : SupplierBill, b : SupplierBill) : Order.Order { Nat.compare(a.id, b.id) });
  };

  public query func getSupplierBillsBySupplier(supplierId : Nat) : async [SupplierBill] {
    let r = List.empty<SupplierBill>();
    for (b in supplierBills.values()) {
      if (b.supplierId == supplierId) r.add(b);
    };
    r.toArray();
  };

  public shared func deleteSupplierBill(id : Nat) : async Bool {
    if (not supplierBills.containsKey(id)) { return false };
    supplierBills.remove(id);
    true;
  };

  // ── Dashboard ─────────────────────────────────────────────────────────────

  public query func getDashboardStats() : async DashboardStats {
    let allBills = getAllBillsMerged();
    let totalSales = allBills.foldLeft(0.0, func(acc : Float, b : Bill) : Float { acc + b.totalAmount });
    let lowStock  = List.empty<Medicine>();
    let expiring  = List.empty<Medicine>();
    let threshold = Time.now() + 30 * 24 * 60 * 60 * 1_000_000_000;
    for (m in medicines.values()) {
      if (m.stockQuantity < 10)      lowStock.add(m);
      if (m.expiryDate < threshold)  expiring.add(m);
    };
    {
      totalSales;
      totalCustomers    = customers.size();
      totalMedicines    = medicines.size();
      lowStockMedicines = lowStock.toArray();
      expiringMedicines = expiring.toArray();
    };
  };
};
