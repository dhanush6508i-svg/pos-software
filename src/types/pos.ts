/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ShopSettings {
  shopName: string;
  address: string;
  phone: string;
  gstRegistered: boolean;
  gstin: string;
  currency: string;
  logo: string; // Base64 data OR icon initials
  enabledGstRate: number; // default rate
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number; // Base selling price
  gstPercentage: number; // e.g. 0, 5, 12, 18, 28
  barcode: string;
  stock: number;
  lowStockThreshold: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  createdAt: string; // ISO format
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  price: number; // unit price before discount
  quantity: number;
  gstPercentage: number;
  gstAmount: number; // calculated item GST
  total: number; // quantity * price + gstAmount
}

export interface Invoice {
  id: string; // Automatic sequence number like INV-2026-0001
  customerName: string;
  customerPhone: string;
  items: InvoiceItem[];
  subtotal: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  gstTotal: number;
  grandTotal: number;
  paymentMethod: 'Cash' | 'Card' | 'UPI' | 'Wallet';
  createdAt: string; // ISO format
}

export interface SalesSummary {
  totalRevenue: number;
  invoiceCount: number;
  totalGst: number;
  lowStockAlertsCount: number;
}
