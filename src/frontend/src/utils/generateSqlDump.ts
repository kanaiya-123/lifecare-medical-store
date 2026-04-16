import type { Bill, Customer, Medicine } from "../backend";

function esc(val: string): string {
  return val.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n");
}

function tsNano(nanoseconds: bigint): string {
  const ms = Number(nanoseconds) / 1_000_000;
  return new Date(ms)
    .toISOString()
    .replace("T", " ")
    .replace("Z", "")
    .slice(0, 19);
}

function unixToDate(seconds: number): string {
  return new Date(seconds * 1000).toISOString().slice(0, 10);
}

export function generateSqlDump(
  medicines: Medicine[],
  customers: Customer[],
  bills: Bill[],
): string {
  const lines: string[] = [];

  lines.push("-- ============================================================");
  lines.push("-- Lifecare Medical & General Store -- Database Export");
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push("-- ============================================================");
  lines.push("");
  lines.push("SET FOREIGN_KEY_CHECKS = 0;");
  lines.push("");

  // ── Medicines
  lines.push("-- ----------------------------");
  lines.push("-- Table: medicines");
  lines.push("-- ----------------------------");
  lines.push("DROP TABLE IF EXISTS `medicines`;");
  lines.push(`CREATE TABLE \`medicines\` (
  \`id\`             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`name\`           VARCHAR(255) NOT NULL,
  \`category\`       ENUM('Tablet','Syrup','Injection','Capsule','Drops','Cream','Other') NOT NULL DEFAULT 'Other',
  \`brand\`          VARCHAR(255) NOT NULL DEFAULT '',
  \`price\`          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  \`discount\`       DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  \`stock_quantity\` INT UNSIGNED NOT NULL DEFAULT 0,
  \`expiry_date\`    DATE NOT NULL,
  \`created_at\`     DATETIME NOT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  lines.push("");

  if (medicines.length > 0) {
    lines.push(
      "INSERT INTO `medicines` (`id`,`name`,`category`,`brand`,`price`,`discount`,`stock_quantity`,`expiry_date`,`created_at`) VALUES",
    );
    const rows = medicines.map((m) => {
      const id = Number(m.id);
      const name = esc(m.name);
      const cat = esc(m.category.toString());
      const brand = esc(m.brand);
      const price = m.price.toFixed(2);
      const disc = m.discount.toFixed(2);
      const stock = Number(m.stockQuantity);
      const expiry = unixToDate(Number(m.expiryDate));
      const created = tsNano(m.createdAt);
      return `  (${id},'${name}','${cat}','${brand}',${price},${disc},${stock},'${expiry}','${created}')`;
    });
    lines.push(`${rows.join(",\n")};`);
  }
  lines.push("");

  // ── Customers
  lines.push("-- ----------------------------");
  lines.push("-- Table: customers");
  lines.push("-- ----------------------------");
  lines.push("DROP TABLE IF EXISTS `customers`;");
  lines.push(`CREATE TABLE \`customers\` (
  \`id\`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`name\`       VARCHAR(255) NOT NULL,
  \`mobile\`     VARCHAR(20)  NOT NULL DEFAULT '',
  \`address\`    TEXT         NOT NULL,
  \`created_at\` DATETIME     NOT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  lines.push("");

  if (customers.length > 0) {
    lines.push(
      "INSERT INTO `customers` (`id`,`name`,`mobile`,`address`,`created_at`) VALUES",
    );
    const rows = customers.map((c) => {
      const id = Number(c.id);
      const name = esc(c.name);
      const mobile = esc(c.mobile);
      const address = esc(c.address);
      const created = tsNano(c.createdAt);
      return `  (${id},'${name}','${mobile}','${address}','${created}')`;
    });
    lines.push(`${rows.join(",\n")};`);
  }
  lines.push("");

  // ── Invoices
  lines.push("-- ----------------------------");
  lines.push("-- Table: invoices");
  lines.push("-- ----------------------------");
  lines.push("DROP TABLE IF EXISTS `invoice_items`;");
  lines.push("DROP TABLE IF EXISTS `invoices`;");
  lines.push(`CREATE TABLE \`invoices\` (
  \`id\`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`invoice_number\`  VARCHAR(50)  NOT NULL,
  \`customer_id\`     INT UNSIGNED NOT NULL,
  \`customer_name\`   VARCHAR(255) NOT NULL,
  \`customer_mobile\` VARCHAR(20)  NOT NULL DEFAULT '',
  \`subtotal\`        DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`discount_amount\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`gst_percent\`     DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
  \`gst_amount\`      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`total_amount\`    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`created_at\`      DATETIME      NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`invoice_number\` (\`invoice_number\`),
  KEY \`fk_invoice_customer\` (\`customer_id\`),
  CONSTRAINT \`fk_invoice_customer\` FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\` (\`id\`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  lines.push("");

  lines.push(`CREATE TABLE \`invoice_items\` (
  \`id\`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`invoice_id\`    INT UNSIGNED NOT NULL,
  \`medicine_id\`   INT UNSIGNED NOT NULL,
  \`medicine_name\` VARCHAR(255) NOT NULL,
  \`quantity\`      INT UNSIGNED NOT NULL DEFAULT 1,
  \`price\`         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  \`discount\`      DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
  \`amount\`        DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (\`id\`),
  KEY \`fk_item_invoice\` (\`invoice_id\`),
  CONSTRAINT \`fk_item_invoice\` FOREIGN KEY (\`invoice_id\`) REFERENCES \`invoices\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  lines.push("");

  if (bills.length > 0) {
    lines.push(
      "INSERT INTO `invoices` (`id`,`invoice_number`,`customer_id`,`customer_name`,`customer_mobile`,`subtotal`,`discount_amount`,`gst_percent`,`gst_amount`,`total_amount`,`created_at`) VALUES",
    );
    const billRows = bills.map((b) => {
      const id = Number(b.id);
      const inv = esc(b.invoiceNumber);
      const cid = Number(b.customerId);
      const cname = esc(b.customerName);
      const cmob = esc(b.customerMobile);
      const sub = b.subtotal.toFixed(2);
      const disc = b.discountAmount.toFixed(2);
      const gstPct = b.gstPercent.toFixed(2);
      const gst = b.gstAmount.toFixed(2);
      const total = b.totalAmount.toFixed(2);
      const created = tsNano(b.createdAt);
      return `  (${id},'${inv}',${cid},'${cname}','${cmob}',${sub},${disc},${gstPct},${gst},${total},'${created}')`;
    });
    lines.push(`${billRows.join(",\n")};`);
    lines.push("");

    const allItems: string[] = [];
    for (const b of bills) {
      for (const item of b.items) {
        const invoiceId = Number(b.id);
        const medId = Number(item.medicineId);
        const mname = esc(item.medicineName);
        const qty = Number(item.quantity);
        const price = item.price.toFixed(2);
        const disc = item.discount.toFixed(2);
        const amount = item.amount.toFixed(2);
        allItems.push(
          `  (${invoiceId},${medId},'${mname}',${qty},${price},${disc},${amount})`,
        );
      }
    }
    if (allItems.length > 0) {
      lines.push(
        "INSERT INTO `invoice_items` (`invoice_id`,`medicine_id`,`medicine_name`,`quantity`,`price`,`discount`,`amount`) VALUES",
      );
      lines.push(`${allItems.join(",\n")};`);
    }
  }

  lines.push("");
  lines.push("SET FOREIGN_KEY_CHECKS = 1;");
  lines.push("");
  lines.push("-- Export complete.");

  return lines.join("\n");
}

export function downloadSqlFile(
  content: string,
  filename = "lifecare_database.sql",
) {
  const blob = new Blob([content], { type: "application/sql" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
