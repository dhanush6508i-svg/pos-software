/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShopSettings, Product, Customer, Invoice, InvoiceItem } from '../types/pos';

const STORAGE_KEYS = {
  SHOP_SETTINGS: 'pos_shop_settings',
  PRODUCTS: 'pos_products',
  CUSTOMERS: 'pos_customers',
  INVOICES: 'pos_invoices',
  AUTH: 'pos_auth',
};

// Default Settings
const DEFAULT_SETTINGS: ShopSettings = {
  shopName: "Daily Basket Supermarket",
  address: "128, High Street Avenue, Sector 4, Metro City",
  phone: "+1 (555) 019-2834",
  gstRegistered: true,
  gstin: "27AAPCS1234F1Z5",
  currency: "USD",
  logo: "DB",
  enabledGstRate: 12,
};

// Mock products to seed on first load
const INITIAL_PRODUCTS: Product[] = [
  { id: "P001", name: "Premium Basmati Rice (1kg)", category: "Groceries", price: 4.50, gstPercentage: 5, barcode: "8901058002315", stock: 120, lowStockThreshold: 15 },
  { id: "P002", name: "Whole Grain Wheat Flour (5kg)", category: "Groceries", price: 12.99, gstPercentage: 5, barcode: "8901058002322", stock: 8, lowStockThreshold: 10 },
  { id: "P003", name: "Farm Fresh Butter (200g)", category: "Dairy", price: 3.20, gstPercentage: 12, barcode: "8901058005411", stock: 45, lowStockThreshold: 12 },
  { id: "P004", name: "Pure Organic Milk (1L)", category: "Dairy", price: 1.80, gstPercentage: 5, barcode: "8901058005428", stock: 68, lowStockThreshold: 20 },
  { id: "P005", name: "Chocolate Chip Cookies (150g)", category: "Bakery", price: 2.50, gstPercentage: 18, barcode: "8901111902831", stock: 30, lowStockThreshold: 8 },
  { id: "P006", name: "Whole Wheat Bread", category: "Bakery", price: 2.00, gstPercentage: 0, barcode: "8901111902848", stock: 25, lowStockThreshold: 5 },
  { id: "P007", name: "Green Tea Bags (100 pack)", category: "Beverages", price: 6.80, gstPercentage: 18, barcode: "8902008102434", stock: 50, lowStockThreshold: 10 },
  { id: "P008", name: "Fresh Apple Juice (1L)", category: "Beverages", price: 3.50, gstPercentage: 12, barcode: "8902008102441", stock: 32, lowStockThreshold: 8 },
  { id: "P009", name: "Double-Line Notebook A4", category: "Stationery", price: 1.50, gstPercentage: 12, barcode: "8904005123912", stock: 110, lowStockThreshold: 20 },
  { id: "P010", name: "Classic Blue Gel Pen", category: "Stationery", price: 0.80, gstPercentage: 18, barcode: "8904005123929", stock: 2, lowStockThreshold: 15 },
  { id: "P011", name: "Assorted Chocolate Box", category: "Snacks", price: 15.00, gstPercentage: 18, barcode: "8905001201298", stock: 18, lowStockThreshold: 5 },
  { id: "P012", name: "Crunchy Salted Potato Chips", category: "Snacks", price: 1.20, gstPercentage: 18, barcode: "8905001201304", stock: 85, lowStockThreshold: 15 }
];

// Seed some initial customer profiles
const INITIAL_CUSTOMERS: Customer[] = [
  { id: "C001", name: "Johnathan Doe", phone: "+1 (555) 012-3456", createdAt: "2026-05-10T10:00:00Z" },
  { id: "C002", name: "Sarah Connor", phone: "+1 (555) 013-4567", createdAt: "2026-05-15T11:30:00Z" },
  { id: "C003", name: "Alex Mercer", phone: "+1 (555) 014-5678", createdAt: "2026-06-01T15:45:00Z" },
  { id: "C004", name: "Emily Watson", phone: "+1 (555) 015-6789", createdAt: "2026-06-12T09:15:00Z" }
];

// Helper to seed random previous dates within the last 30 days
const getPastDateString = (daysAgo: number, hour: number, minute: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

// Generates high-quality mock invoices spread across past days for charts to look stunning
const getInitialInvoices = (): Invoice[] => {
  return [
    {
      id: "INV-2026-0001",
      customerName: "Johnathan Doe",
      customerPhone: "+1 (555) 012-3456",
      items: [
        { productId: "P001", productName: "Premium Basmati Rice (1kg)", price: 4.50, quantity: 2, gstPercentage: 5, gstAmount: 0.45, total: 9.45 },
        { productId: "P003", productName: "Farm Fresh Butter (200g)", price: 3.20, quantity: 1, gstPercentage: 12, gstAmount: 0.38, total: 3.58 },
        { productId: "P006", productName: "Whole Wheat Bread", price: 2.00, quantity: 2, gstPercentage: 0, gstAmount: 0.00, total: 4.00 }
      ],
      subtotal: 14.20,
      discountType: "percentage",
      discountValue: 10,
      discountAmount: 1.42,
      gstTotal: 0.83,
      grandTotal: 13.61,
      paymentMethod: "UPI",
      createdAt: getPastDateString(12, 10, 15) // 12 days ago, 10:15 AM
    },
    {
      id: "INV-2026-0002",
      customerName: "Sarah Connor",
      customerPhone: "+1 (555) 013-4567",
      items: [
        { productId: "P002", productName: "Whole Grain Wheat Flour (5kg)", price: 12.99, quantity: 1, gstPercentage: 5, gstAmount: 0.65, total: 13.64 },
        { productId: "P004", productName: "Pure Organic Milk (1L)", price: 1.80, quantity: 3, gstPercentage: 5, gstAmount: 0.27, total: 5.67 },
        { productId: "P008", productName: "Fresh Apple Juice (1L)", price: 3.50, quantity: 2, gstPercentage: 12, gstAmount: 0.84, total: 7.84 }
      ],
      subtotal: 21.79,
      discountType: "fixed",
      discountValue: 2.00,
      discountAmount: 2.00,
      gstTotal: 1.76,
      grandTotal: 21.55,
      paymentMethod: "Card",
      createdAt: getPastDateString(10, 14, 20) // 10 days ago, 2:20 PM
    },
    {
      id: "INV-2026-0003",
      customerName: "Walk-in Customer",
      customerPhone: "",
      items: [
        { productId: "P005", productName: "Chocolate Chip Cookies (150g)", price: 2.50, quantity: 4, gstPercentage: 18, gstAmount: 1.80, total: 11.80 },
        { productId: "P007", productName: "Green Tea Bags (100 pack)", price: 6.80, quantity: 1, gstPercentage: 18, gstAmount: 1.22, total: 8.02 }
      ],
      subtotal: 16.80,
      discountType: "percentage",
      discountValue: 0,
      discountAmount: 0,
      gstTotal: 3.02,
      grandTotal: 19.82,
      paymentMethod: "Cash",
      createdAt: getPastDateString(8, 17, 45) // 8 days ago, 5:45 PM
    },
    {
      id: "INV-2026-0004",
      customerName: "Alex Mercer",
      customerPhone: "+1 (555) 014-5678",
      items: [
        { productId: "P001", productName: "Premium Basmati Rice (1kg)", price: 4.50, quantity: 5, gstPercentage: 5, gstAmount: 1.13, total: 23.63 },
        { productId: "P011", productName: "Assorted Chocolate Box", price: 15.00, quantity: 1, gstPercentage: 18, gstAmount: 2.70, total: 17.70 }
      ],
      subtotal: 37.50,
      discountType: "percentage",
      discountValue: 5,
      discountAmount: 1.88,
      gstTotal: 3.83,
      grandTotal: 39.45,
      paymentMethod: "UPI",
      createdAt: getPastDateString(6, 12, 10) // 6 days ago, 12:10 PM
    },
    {
      id: "INV-2026-0005",
      customerName: "Walk-in Customer",
      customerPhone: "",
      items: [
        { productId: "P003", productName: "Farm Fresh Butter (200g)", price: 3.20, quantity: 2, gstPercentage: 12, gstAmount: 0.77, total: 7.17 },
        { productId: "P012", productName: "Crunchy Salted Potato Chips", price: 1.20, quantity: 10, gstPercentage: 18, gstAmount: 2.16, total: 14.16 }
      ],
      subtotal: 18.40,
      discountType: "percentage",
      discountValue: 0,
      discountAmount: 0,
      gstTotal: 2.93,
      grandTotal: 21.33,
      paymentMethod: "Cash",
      createdAt: getPastDateString(4, 18, 30) // 4 days ago, 6:30 PM
    },
    {
      id: "INV-2026-0006",
      customerName: "Emily Watson",
      customerPhone: "+1 (555) 015-6789",
      items: [
        { productId: "P004", productName: "Pure Organic Milk (1L)", price: 1.80, quantity: 5, gstPercentage: 5, gstAmount: 0.45, total: 9.45 },
        { productId: "P006", productName: "Whole Wheat Bread", price: 2.00, quantity: 3, gstPercentage: 0, gstAmount: 0.00, total: 6.00 },
        { productId: "P008", productName: "Fresh Apple Juice (1L)", price: 3.50, quantity: 3, gstPercentage: 12, gstAmount: 1.26, total: 11.76 }
      ],
      subtotal: 25.50,
      discountType: "percentage",
      discountValue: 10,
      discountAmount: 2.55,
      gstTotal: 1.71,
      grandTotal: 24.66,
      paymentMethod: "Card",
      createdAt: getPastDateString(2, 11, 40) // 2 days ago, 11:40 AM
    },
    {
      id: "INV-2026-0007",
      customerName: "Walk-in Customer",
      customerPhone: "",
      items: [
        { productId: "P001", productName: "Premium Basmati Rice (1kg)", price: 4.50, quantity: 1, gstPercentage: 5, gstAmount: 0.23, total: 4.73 },
        { productId: "P012", productName: "Crunchy Salted Potato Chips", price: 1.20, quantity: 5, gstPercentage: 18, gstAmount: 1.08, total: 7.08 }
      ],
      subtotal: 10.50,
      discountType: "percentage",
      discountValue: 0,
      discountAmount: 0,
      gstTotal: 1.31,
      grandTotal: 11.81,
      paymentMethod: "Cash",
      createdAt: getPastDateString(1, 15, 0) // Yesterday, 3:00 PM
    },
    {
      id: "INV-2026-0008",
      customerName: "Sarah Connor",
      customerPhone: "+1 (555) 013-4567",
      items: [
        { productId: "P003", productName: "Farm Fresh Butter (200g)", price: 3.20, quantity: 3, gstPercentage: 12, gstAmount: 1.15, total: 10.75 },
        { productId: "P011", productName: "Assorted Chocolate Box", price: 15.00, quantity: 1, gstPercentage: 18, gstAmount: 2.70, total: 17.70 }
      ],
      subtotal: 24.60,
      discountType: "percentage",
      discountValue: 12,
      discountAmount: 2.95,
      gstTotal: 3.85,
      grandTotal: 25.50,
      paymentMethod: "UPI",
      createdAt: getPastDateString(0, 9, 30) // Today, 9:30 AM (or earlier today relative to 10:15)
    }
  ];
};

export class LocalDB {
  static getShopSettings(): ShopSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SHOP_SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SHOP_SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return JSON.parse(raw);
  }

  static saveShopSettings(settings: ShopSettings): void {
    localStorage.setItem(STORAGE_KEYS.SHOP_SETTINGS, JSON.stringify(settings));
  }

  static getProducts(): Product[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(raw);
  }

  static saveProducts(products: Product[]): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }

  static getCustomers(): Customer[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
      return INITIAL_CUSTOMERS;
    }
    return JSON.parse(raw);
  }

  static saveCustomers(customers: Customer[]): void {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }

  static getInvoices(): Invoice[] {
    const raw = localStorage.getItem(STORAGE_KEYS.INVOICES);
    if (!raw) {
      const invoices = getInitialInvoices();
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
      return invoices;
    }
    return JSON.parse(raw);
  }

  static saveInvoices(invoices: Invoice[]): void {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  }

  static getAuthPassword(): string {
    const p = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (!p) {
      // default admin password is 'admin123'
      localStorage.setItem(STORAGE_KEYS.AUTH, 'admin123');
      return 'admin123';
    }
    return p;
  }

  static saveAuthPassword(newPassword: string): void {
    localStorage.setItem(STORAGE_KEYS.AUTH, newPassword);
  }

  // Generate continuous Invoice sequence code
  static generateInvoiceNumber(): string {
    const invoices = this.getInvoices();
    const year = new Date().getFullYear();
    const count = invoices.length + 1;
    const formattedCount = String(count).padStart(4, '0');
    return `INV-${year}-${formattedCount}`;
  }

  // Create an invoice: deducts stock and records metrics
  static insertInvoice(invoice: Invoice): void {
    const invoices = this.getInvoices();
    invoices.unshift(invoice); // Newest first
    this.saveInvoices(invoices);

    // 1. Reduce stocks of the products sold
    const products = this.getProducts();
    invoice.items.forEach(item => {
      const pIndex = products.findIndex(p => p.id === item.productId);
      if (pIndex !== -1) {
        products[pIndex].stock = Math.max(0, products[pIndex].stock - item.quantity);
      }
    });
    this.saveProducts(products);

    // 2. Insert or update customer profile if phone is given
    if (invoice.customerPhone && invoice.customerPhone.trim()) {
      const customers = this.getCustomers();
      const existingCust = customers.find(c => c.phone.trim() === invoice.customerPhone.trim());
      if (!existingCust) {
        const newCustomer: Customer = {
          id: `C${Date.now()}`,
          name: invoice.customerName || "Walk-in Customer",
          phone: invoice.customerPhone.trim(),
          createdAt: new Date().toISOString()
        };
        customers.unshift(newCustomer);
        this.saveCustomers(customers);
      } else if (invoice.customerName && invoice.customerName !== "Walk-in Customer" && existingCust.name === "Walk-in Customer") {
        existingCust.name = invoice.customerName;
        this.saveCustomers(customers);
      }
    }
  }

  // Delete an invoice (and return stock)
  static deleteInvoice(invoiceId: string): void {
    const invoices = this.getInvoices();
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;

    // Refund stock
    const products = this.getProducts();
    invoice.items.forEach(item => {
      const pIndex = products.findIndex(p => p.id === item.productId);
      if (pIndex !== -1) {
        products[pIndex].stock += item.quantity;
      }
    });
    this.saveProducts(products);

    // Save invoices minus this one
    this.saveInvoices(invoices.filter(inv => inv.id !== invoiceId));
  }

  // Full export of DB to JSON
  static exportBackup(): string {
    const payload = {
      settings: this.getShopSettings(),
      products: this.getProducts(),
      customers: this.getCustomers(),
      invoices: this.getInvoices(),
      password: this.getAuthPassword()
    };
    return JSON.stringify(payload, null, 2);
  }

  // Full import/Restore of backup package
  static restoreBackup(jsonData: string): boolean {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.settings && parsed.products && parsed.customers && parsed.invoices) {
        this.saveShopSettings(parsed.settings);
        this.saveProducts(parsed.products);
        this.saveCustomers(parsed.customers);
        this.saveInvoices(parsed.invoices);
        if (parsed.password) {
          this.saveAuthPassword(parsed.password);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Hard reset database
  static resetToDefault(): void {
    localStorage.removeItem(STORAGE_KEYS.SHOP_SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.INVOICES);
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    this.getShopSettings();
    this.getProducts();
    this.getCustomers();
    this.getInvoices();
    this.getAuthPassword();
  }
}
