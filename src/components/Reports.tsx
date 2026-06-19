/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Trash2, 
  Receipt, 
  ExternalLink, 
  Tag, 
  X,
  CreditCard,
  Printer,
  ShoppingBag
} from 'lucide-react';
import { LocalDB } from '../services/db';
import { Invoice } from '../types/pos';

interface ReportsProps {
  onReprintInvoice: (invoice: Invoice) => void;
}

export default function Reports({ onReprintInvoice }: ReportsProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(() => LocalDB.getInvoices());
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');

  // Selected Invoice Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const settings = useMemo(() => LocalDB.getShopSettings(), []);
  const currencySymbol = settings.currency === 'USD' ? '$' : settings.currency === 'INR' ? '₹' : settings.currency === 'EUR' ? '€' : settings.currency;

  // Filter invoices list
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch = inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (inv.customerPhone && inv.customerPhone.includes(searchTerm));
      const matchesPayment = paymentFilter === 'All' || inv.paymentMethod === paymentFilter;
      return matchesSearch && matchesPayment;
    });
  }, [invoices, searchTerm, paymentFilter]);

  // Handle invoice refund stock validation and deletion
  const handleDeleteInvoice = (invId: string) => {
    if (window.confirm(`Are you sure you want to void and delete Invoice ${invId}? This will automatically refund product quantities to active stocks.`)) {
      LocalDB.deleteInvoice(invId);
      const updatedList = LocalDB.getInvoices();
      setInvoices(updatedList);
      setSelectedInvoice(null);
    }
  };

  return (
    <div id="reports-root" className="space-y-6">
      {/* Page Title */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
          Sales Ledger & Logs
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          View all checkouts history, void/refund transactions, or fetch thermal receipt formats.
        </p>
      </div>

      {/* Analytics Summary banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
            <Search size={18} />
          </span>
          <input
            id="ledger-search-box"
            type="text"
            placeholder="Search transactions by invoice code, buyer name, or telephone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold bg-slate-50/20"
          />
        </div>

        {/* Payment filters */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold shrink-0">Payment Option:</span>
          <select
            id="ledger-payment-filter"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-white border border-slate-100 border-slate-200 text-slate-755 text-slate-700 text-xs rounded-xl px-3 py-2 focus:outline-none font-semibold"
          >
            <option value="All">All Methods</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="UPI">UPI</option>
            <option value="Wallet">Wallet</option>
          </select>
        </div>
      </div>

      {/* Ledger DataTable */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                <th className="py-3 px-4">Receipt Code</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Buyer details</th>
                <th className="py-3 px-4 text-center">Items Billed</th>
                <th className="py-3 px-4 text-center">Method</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-center">Control Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileSpreadsheet size={32} className="mx-auto text-slate-350 mb-2" />
                    No sales invoice history matches filter properties.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const itemCount = inv.items.reduce((acc, current) => acc + current.quantity, 0);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold font-mono text-slate-600">{inv.id}</td>
                      <td className="py-3 px-4 text-slate-400">{new Date(inv.createdAt).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{inv.customerName}</div>
                        {inv.customerPhone && <div className="text-[10px] text-slate-400 font-mono mt-0.5">{inv.customerPhone}</div>}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500 font-bold font-mono">
                        {itemCount} units
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                          inv.paymentMethod === 'Cash' ? 'bg-amber-50 text-amber-600' :
                          inv.paymentMethod === 'UPI' ? 'bg-indigo-50 text-indigo-600' :
                          inv.paymentMethod === 'Card' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {inv.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900 font-mono text-sm">
                        {currencySymbol}{inv.grandTotal.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center space-x-2">
                        <button
                          id={`view-ledger-details-${inv.id}`}
                          onClick={() => setSelectedInvoice(inv)}
                          className="bg-slate-100 border border-slate-205 border-slate-200 text-slate-705 text-slate-700 font-semibold py-1 px-2.5 rounded-lg text-[10px] hover:bg-slate-200 cursor-pointer inline-flex items-center gap-1 transition-all"
                        >
                          Invoice Details <ExternalLink size={11} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice details Itemized Modal overlay dialog */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl border border-slate-100 p-6 relative">
            <button
              id="close-invoice-modal-btn"
              onClick={() => setSelectedInvoice(null)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Modal Title */}
            <div className="flex items-center gap-2 pb-4 border-b border-slate-150 border-slate-100 mb-5">
              <Receipt className="text-indigo-600" size={20} />
              <h3 className="font-bold text-slate-900 font-display text-base">
                Ledger Transaction ID: {selectedInvoice.id}
              </h3>
            </div>

            {/* Receipt Summary facts */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100 mb-4 text-xs font-medium text-slate-600">
              <div className="space-y-1">
                <p><span className="font-bold text-slate-400">Billing Date:</span> {new Date(selectedInvoice.createdAt).toLocaleString()}</p>
                <p><span className="font-bold text-slate-400">Payment Option:</span> <span className="font-bold text-slate-800 uppercase font-mono">{selectedInvoice.paymentMethod}</span></p>
              </div>
              <div className="space-y-1 text-right">
                <p><span className="font-bold text-slate-400">Client:</span> {selectedInvoice.customerName}</p>
                {selectedInvoice.customerPhone && <p><span className="font-bold text-slate-400">Phone:</span> <span className="font-mono">{selectedInvoice.customerPhone}</span></p>}
              </div>
            </div>

            {/* Itemized Tables */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Billed Items Catalog</span>
              <table className="w-full text-left text-xs text-slate-700">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-500 font-bold uppercase">
                    <th className="py-2 px-3">Item Name</th>
                    <th className="py-2 text-right">Unit Price</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right px-3">Agg Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {selectedInvoice.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/20">
                      <td className="py-2 px-3">
                        <div className="font-bold text-slate-800">{item.productName}</div>
                        {settings.gstRegistered && item.gstPercentage > 0 && (
                          <div className="text-[9px] text-slate-400">Tax applied: {item.gstPercentage}% GST</div>
                        )}
                      </td>
                      <td className="py-2 text-right font-mono text-slate-650 text-slate-500">{currencySymbol}{item.price.toFixed(2)}</td>
                      <td className="py-2 text-center font-bold font-mono text-slate-800">{item.quantity}</td>
                      <td className="py-2 text-right font-mono font-extrabold text-slate-900 px-3">{currencySymbol}{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Aggregated Totals math sheet */}
            <div className="border-t border-slate-100 py-3 mt-4 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Subtotal</span>
                <span className="font-mono font-bold">{currencySymbol}{selectedInvoice.subtotal.toFixed(2)}</span>
              </div>
              {selectedInvoice.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount Applied</span>
                  <span className="font-mono">-{currencySymbol}{selectedInvoice.discountAmount.toFixed(2)}</span>
                </div>
              )}
              {settings.gstRegistered && selectedInvoice.gstTotal > 0 && (
                <div className="flex justify-between text-slate-550 text-slate-500 font-medium">
                  <span>Tax Total (GST)</span>
                  <span className="font-mono">+{currencySymbol}{selectedInvoice.gstTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold border-t border-slate-100 pt-2.5 text-slate-900 font-display">
                <span>GRANT TOTAL</span>
                <span className="font-mono text-base text-indigo-600">{currencySymbol}{selectedInvoice.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Print reprints & Delete ledger voids actions */}
            <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-100">
              <button
                id="reprint-invoice-from-details"
                onClick={() => onReprintInvoice(selectedInvoice)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Printer size={13} /> Reprint / Open Printer Roll
              </button>

              <button
                id="delete-invoice-void-action-btn"
                onClick={() => handleDeleteInvoice(selectedInvoice.id)}
                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ml-auto"
              >
                <Trash2 size={13} /> Void Transaction & Return Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
