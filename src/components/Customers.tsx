/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  CalendarDays, 
  UserSquare2, 
  Receipt, 
  ChevronRight, 
  Clock, 
  Award,
  CirclePlay
} from 'lucide-react';
import { LocalDB } from '../services/db';
import { Customer, Invoice } from '../types/pos';

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Load database arrays
  const rawCustomers = useMemo(() => LocalDB.getCustomers(), []);
  const invoices = useMemo(() => LocalDB.getInvoices(), []);
  const settings = useMemo(() => LocalDB.getShopSettings(), []);
  
  const currencySymbol = settings.currency === 'USD' ? '$' : settings.currency === 'INR' ? '₹' : settings.currency === 'EUR' ? '€' : settings.currency;

  // Synthesize Customers statistics from local invoices database
  const customerStats = useMemo(() => {
    const statsMap: { 
      [phone: string]: { 
        visitCount: number; 
        lifetimeSpend: number; 
        lastVisit: string;
        invoices: Invoice[];
      } 
    } = {};

    invoices.forEach(inv => {
      if (!inv.customerPhone) return;
      const phone = inv.customerPhone.trim();
      
      if (!statsMap[phone]) {
        statsMap[phone] = {
          visitCount: 0,
          lifetimeSpend: 0,
          lastVisit: inv.createdAt,
          invoices: []
        };
      }
      
      statsMap[phone].visitCount += 1;
      statsMap[phone].lifetimeSpend += inv.grandTotal;
      statsMap[phone].invoices.push(inv);

      // check newest
      if (new Date(inv.createdAt) > new Date(statsMap[phone].lastVisit)) {
        statsMap[phone].lastVisit = inv.createdAt;
      }
    });

    return statsMap;
  }, [invoices]);

  // Combine static profiles and dynamic sales metrics
  const customerList = useMemo(() => {
    return rawCustomers.map(cust => {
      const stats = customerStats[cust.phone.trim()] || {
        visitCount: 0,
        lifetimeSpend: 0,
        lastVisit: cust.createdAt,
        invoices: []
      };

      return {
        ...cust,
        visitCount: stats.visitCount,
        lifetimeSpend: stats.lifetimeSpend,
        lastVisit: stats.lastVisit,
        invoices: stats.invoices
      };
    }).sort((a, b) => b.lifetimeSpend - a.lifetimeSpend); // Top spenders first!
  }, [rawCustomers, customerStats]);

  // Search filter matching
  const filteredCustomers = useMemo(() => {
    return customerList.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
    );
  }, [customerList, searchTerm]);

  // Selected customer details lookup
  const selectedCustomerDetails = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customerList.find(c => c.id === selectedCustomerId);
  }, [customerList, selectedCustomerId]);

  return (
    <div id="customers-root" className="space-y-6">
      {/* Title Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
          Customer Management
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Track customer profiles, lifetime purchase histories, and value rankings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* CUSTOMERS DIRECTORY (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                <Search size={18} />
              </span>
              <input
                id="crm-search-input"
                type="text"
                placeholder="Search CRM register by customer name or telephone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold bg-slate-50/20"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-650 uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-3 px-4">Spender Name</th>
                    <th className="py-3 px-4">Contact Phone</th>
                    <th className="py-3 px-4 text-center">Checkout Count</th>
                    <th className="py-3 px-4 text-right">Lifetime Spends</th>
                    <th className="py-3 px-4 text-center">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <Users size={32} className="mx-auto text-slate-300 mb-2" />
                        No customers registered to the CRM database yet.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust) => (
                      <tr 
                        key={cust.id} 
                        className={`hover:bg-slate-50/70 transition-colors cursor-pointer ${
                          selectedCustomerId === cust.id ? 'bg-indigo-50/50 hover:bg-indigo-50' : ''
                        }`}
                        onClick={() => setSelectedCustomerId(cust.id)}
                      >
                        <td className="py-3 px-4 font-bold text-slate-800 text-sm">{cust.name}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono">{cust.phone}</td>
                        <td className="py-3 px-4 text-center font-bold font-mono text-slate-600">{cust.visitCount} visits</td>
                        <td className="py-3 px-4 text-right font-extrabold text-slate-900 font-mono">
                          {currencySymbol}{cust.lifetimeSpend.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            id={`view-cust-history-${cust.id}`}
                            className="bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 text-slate-705 text-slate-705 text-slate-700 border border-slate-200 py-1.5 px-2.5 rounded-lg text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer mx-auto transition-colors"
                          >
                            Track Invoices <ChevronRight size={12} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* PURCHASE LOG HISTORY DRAWER DETAILS (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs h-full min-h-[450px]">
          {selectedCustomerDetails ? (
            <div className="space-y-5">
              {/* Profile summary headers statistics */}
              <div className="flex items-start gap-3.5 border-b border-slate-100 pb-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100">
                  <UserSquare2 size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{selectedCustomerDetails.name}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedCustomerDetails.phone}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Customer loyalty profile created on {new Date(selectedCustomerDetails.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Dynamic totals widgets */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Times Checked out</span>
                  <div className="text-xl font-bold font-mono text-slate-800">{selectedCustomerDetails.visitCount} visits</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Accumulated spends</span>
                  <div className="text-xl font-extrabold font-mono text-slate-800">
                    {currencySymbol}{selectedCustomerDetails.lifetimeSpend.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Invoices listings log */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Purchase Receipts History</h4>
                {selectedCustomerDetails.invoices.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No checkout invoices traced to this phone number.</p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {selectedCustomerDetails.invoices.map((inv) => (
                      <div key={inv.id} className="p-3 border border-slate-150 border-slate-200/60 rounded-xl space-y-2 hover:bg-slate-50/40">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold font-mono text-slate-700">{inv.id}</span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(inv.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {/* Sold items overview snippet */}
                        <div className="text-[11px] text-slate-550 leading-relaxed text-slate-500 truncate">
                          Items: {inv.items.map(it => `${it.productName} (x${it.quantity})`).join(', ')}
                        </div>

                        <div className="flex justify-between items-center border-t border-slate-50 pt-2 text-xs">
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-mono font-medium">
                            {inv.paymentMethod}
                          </span>
                          <span className="font-bold text-slate-900 font-mono">
                            {currencySymbol}{inv.grandTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-12">
              <UserSquare2 size={40} className="text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">No Customer Selected</p>
              <p className="text-xs text-slate-400 max-w-[200px] mt-1 mx-auto leading-relaxed">
                Click on any verified customer row in the registry to expose purchase records.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
