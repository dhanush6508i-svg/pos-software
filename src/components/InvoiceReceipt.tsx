/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Printer, 
  Download, 
  ArrowLeft, 
  Check, 
  Copy, 
  Sliders, 
  Wifi, 
  FileCheck2,
  Table
} from 'lucide-react';
import { Invoice, ShopSettings } from '../types/pos';
import { LocalDB } from '../services/db';

interface InvoiceReceiptProps {
  invoice: Invoice;
  onBackToTerminal: () => void;
}

export default function InvoiceReceipt({ invoice, onBackToTerminal }: InvoiceReceiptProps) {
  const settings = useMemo(() => LocalDB.getShopSettings(), []);
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('58mm');
  const [copied, setCopied] = useState(false);

  const currencySymbol = settings.currency === 'USD' ? '$' : settings.currency === 'INR' ? '₹' : settings.currency === 'EUR' ? '€' : settings.currency;

  // Trigger Native Browser Print View
  const handleNativePrint = () => {
    window.print();
  };

  // Generate ESC/POS commands in structured hex-codes for Bluetooth/USB printers
  const escPosCommands = useMemo(() => {
    const charsPerLine = paperWidth === '58mm' ? 32 : 48;
    const separator = '-'.repeat(charsPerLine);
    const dSub = '='.repeat(charsPerLine);

    // ESC/POS Command Mnemonics
    const INIT = "[ESC @]\n";
    const CENTER = "[ESC a 1]\n";
    const LEFT = "[ESC a 0]\n";
    const RIGHT = "[ESC a 2]\n";
    const BOLD_ON = "[ESC E 1]\n";
    const BOLD_OFF = "[ESC E 0]\n";
    const DBL_SIZE = "[GS ! 17]\n"; // double size text
    const REG_SIZE = "[GS ! 0]\n";
    const FEED_CUT = "\n[Feed & Cut (GS V 66 0)]\n";

    let text = INIT + CENTER + BOLD_ON + DBL_SIZE;
    text += `${settings.shopName.toUpperCase()}\n`;
    text += REG_SIZE + BOLD_OFF;
    text += `${settings.address}\n`;
    text += `Phone: ${settings.phone}\n`;
    
    if (settings.gstRegistered && settings.gstin) {
      text += `GSTIN: ${settings.gstin}\n`;
    }
    
    text += separator + "\n";
    text += `Invoice: ${invoice.id}\n`;
    text += `Date: ${new Date(invoice.createdAt).toLocaleString()}\n`;
    
    if (invoice.customerPhone) {
      text += `Customer: ${invoice.customerName}\n`;
      text += `Phone: ${invoice.customerPhone}\n`;
    }
    text += separator + "\n";

    // Column Headers
    if (paperWidth === '58mm') {
      text += "Item             Qty   Total\n";
    } else {
      text += "Item                      Qty   Price    Total\n";
    }
    text += separator + "\n";

    // Products list formatting
    invoice.items.forEach(item => {
      if (paperWidth === '58mm') {
        const itemLine = item.productName.slice(0, 16).padEnd(16);
        const qtyLine = String(item.quantity).padStart(4);
        const priceLine = `${currencySymbol}${item.total.toFixed(2)}`.padStart(11);
        text += `${itemLine}${qtyLine}${priceLine}\n`;
      } else {
        const itemLine = item.productName.slice(0, 24).padEnd(24);
        const qtyLine = String(item.quantity).padStart(5);
        const itemPrice = `${currencySymbol}${item.price.toFixed(2)}`.padStart(8);
        const priceLine = `${currencySymbol}${item.total.toFixed(2)}`.padStart(10);
        text += `${itemLine}${qtyLine}${itemPrice}${priceLine}\n`;
      }
    });

    text += separator + "\n";
    
    // Total summaries
    const padVal = paperWidth === '58mm' ? 22 : 38;
    text += `Subtotal:`.padEnd(padVal) + `${currencySymbol}${invoice.subtotal.toFixed(2)}\n`;
    
    if (invoice.discountAmount > 0) {
      text += `Discount:`.padEnd(padVal) + `-${currencySymbol}${invoice.discountAmount.toFixed(2)}\n`;
    }
    
    if (settings.gstRegistered && invoice.gstTotal > 0) {
      text += `Tax (GST):`.padEnd(padVal) + `+${currencySymbol}${invoice.gstTotal.toFixed(2)}\n`;
    }
    
    text += dSub + "\n";
    text += BOLD_ON + `GRAND TOTAL:`.padEnd(padVal) + `${currencySymbol}${invoice.grandTotal.toFixed(2)}\n` + BOLD_OFF;
    text += dSub + "\n";
    
    text += CENTER + "THANK YOU FOR YOUR PATRONAGE!\n";
    text += "Power POS: Small Retail Engine\n";
    text += FEED_CUT;

    return text;
  }, [invoice, settings, paperWidth, currencySymbol]);

  // Copy plain command instructions
  const handleCopyCommands = () => {
    navigator.clipboard.writeText(escPosCommands);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="receipt-preview-container" className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <button
          id="back-to-billing-ref-btn"
          onClick={onBackToTerminal}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} /> Write Next Transaction (F2)
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Printer Width Selector */}
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex gap-1">
            <button
              id="set-width-58mm-btn"
              onClick={() => setPaperWidth('58mm')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                paperWidth === '58mm' 
                  ? 'bg-white text-slate-800 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              58mm Roll
            </button>
            <button
              id="set-width-80mm-btn"
              onClick={() => setPaperWidth('80mm')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                paperWidth === '80mm' 
                  ? 'bg-white text-slate-800 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              80mm Roll
            </button>
          </div>

          <button
            id="print-invoice-action-btn"
            onClick={handleNativePrint}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer size={15} /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Grid of print receipt preview and developer ESC/POS commands output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Printable preview column (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            Screen View Invoice Preview ({paperWidth})
          </span>

          {/* HTML Printable Area */}
          <div 
            id="printable-receipt-container"
            className="bg-white border border-slate-300 rounded-lg p-5 shadow-sm font-mono text-xs text-slate-900 antialiased"
            style={{ width: paperWidth === '58mm' ? '300px' : '400px' }}
          >
            {/* Logo initials and title */}
            <div className="text-center space-y-1 mb-4">
              <div className="text-lg font-bold uppercase tracking-tight font-sans">
                {settings.shopName}
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-sans px-2">
                {settings.address}
              </p>
              <p className="text-[10px] text-slate-550 text-slate-550 text-slate-500 font-sans">
                Phone: {settings.phone}
              </p>
              {settings.gstRegistered && settings.gstin && (
                <p className="text-[10px] text-slate-600 font-bold uppercase font-sans">
                  GSTIN: {settings.gstin}
                </p>
              )}
            </div>

            <div className="border-t border-dashed border-slate-350 border-slate-300 py-3 space-y-1">
              <p className="text-[10px] flex justify-between">
                <span>Receipt Code:</span>
                <span className="font-bold">{invoice.id}</span>
              </p>
              <p className="text-[10px] flex justify-between">
                <span>Date:</span>
                <span>{new Date(invoice.createdAt).toLocaleString()}</span>
              </p>
              <p className="text-[10px] flex justify-between">
                <span>Payment:</span>
                <span className="font-bold uppercase text-[9px] px-1.5 py-0.2 bg-slate-100 rounded">
                  {invoice.paymentMethod}
                </span>
              </p>
              {invoice.customerPhone && (
                <div className="border-t border-slate-100 mt-2 pt-1">
                  <p className="text-[10px] font-bold font-sans">Billed To:</p>
                  <p className="text-[10px]">{invoice.customerName}</p>
                  <p className="text-[10px]">Ph: {invoice.customerPhone}</p>
                </div>
              )}
            </div>

            {/* Products Table */}
            <table className="w-full text-left border-t border-dashed border-slate-300 mt-2 pt-2">
              <thead>
                <tr className="text-[10px] text-slate-550 text-slate-550 text-slate-500 border-b border-dashed border-slate-200">
                  <th className="py-2 font-semibold">Item Details</th>
                  <th className="py-2 text-right font-semibold">Qty</th>
                  <th className="py-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-slate-100">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="text-[10px]">
                    <td className="py-2 max-w-[120px] truncate">
                      <div className="font-bold text-slate-800">{item.productName}</div>
                      <div className="text-[9px] text-slate-400">
                        {currencySymbol}{item.price.toFixed(2)} 
                        {settings.gstRegistered && item.gstPercentage > 0 && ` +${item.gstPercentage}% tax`}
                      </div>
                    </td>
                    <td className="py-2 text-right font-bold text-slate-700">{item.quantity}</td>
                    <td className="py-2 text-right font-bold text-slate-900 font-mono">
                      {currencySymbol}{item.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Financial Summary */}
            <div className="border-t border-dashed border-slate-300 py-3 space-y-1.5 font-mono mt-4">
              <div className="flex justify-between text-[11px]">
                <span>Total Items value</span>
                <span>{currencySymbol}{invoice.subtotal.toFixed(2)}</span>
              </div>
              
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-[11px] text-emerald-700 font-semibold">
                  <span>Discount Applied</span>
                  <span>-{currencySymbol}{invoice.discountAmount.toFixed(2)}</span>
                </div>
              )}

              {settings.gstRegistered && invoice.gstTotal > 0 && (
                <div className="flex justify-between text-[11px]">
                  <span>GST Tax Breakdown</span>
                  <span>+{currencySymbol}{invoice.gstTotal.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-xs font-bold border-t border-dashed border-slate-300 pt-2.5 text-slate-900">
                <span>GRAND BILL TOTAL</span>
                <span className="text-sm font-extrabold">{currencySymbol}{invoice.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Footer greeting note */}
            <div className="border-t border-dashed border-slate-300 pt-4 text-center space-y-1 mt-4">
              <p className="font-semibold text-[10px] font-sans">THANK YOU FOR SHOPPING WITH US!</p>
              <p className="text-[9px] text-slate-400 font-sans">Please visit again. Software powered by retail POS engine.</p>
            </div>
          </div>
        </div>

        {/* Developer ESC/POS logs column (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 rounded-xl p-5 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  <h3 className="font-bold text-sm tracking-tight">Thermal ESC/POS byte Stream commands</h3>
                </div>
                <p className="text-xs text-slate-400">Copy output directly for Bluetooth receipt printing apps</p>
              </div>
              <button
                id="copy-escpos-commands-btn"
                onClick={handleCopyCommands}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 px-3 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy Codes'}
              </button>
            </div>

            <div className="relative">
              <pre className="p-4 bg-slate-950 rounded-lg text-[10px] text-emerald-400 font-mono overflow-x-auto max-h-[350px]">
                {escPosCommands}
              </pre>
            </div>

            <div className="p-3 bg-blue-950/40 border border-blue-900/40 rounded-lg space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-blue-300 font-semibold mb-1">
                <Wifi size={14} /> Bluetooth ESC/POS Pairing Information
              </div>
              <p className="text-[11px] text-blue-200 leading-relaxed">
                This stream is standard Epson ESC/POS format. Copy this output payload and load it into any generic Android/iOS Bluetooth print utility, or pass it to your host thermal printer drivers directly via a USB/COM connection.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
