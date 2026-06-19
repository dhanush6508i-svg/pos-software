/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  User, 
  Phone, 
  Grip, 
  Minimize2, 
  Plus, 
  Minus, 
  Tag, 
  CreditCard, 
  QrCode, 
  DollarSign, 
  FileText, 
  Sparkles, 
  AlertCircle,
  Barcode
} from 'lucide-react';
import { LocalDB } from '../services/db';
import { Product, InvoiceItem, Invoice } from '../types/pos';

interface BillingProps {
  onCheckoutSuccess: (invoice: Invoice) => void;
  onNavigate: (route: string) => void;
}

export default function Billing({ onCheckoutSuccess, onNavigate }: BillingProps) {
  // Load configuration
  const settings = useMemo(() => LocalDB.getShopSettings(), []);
  const allProducts = useMemo(() => LocalDB.getProducts(), []);
  const allCustomers = useMemo(() => LocalDB.getCustomers(), []);

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  
  // Customer details (optional)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  // Bill details
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'UPI' | 'Wallet'>('Cash');
  const [checkoutError, setCheckoutError] = useState('');

  // Refs for scanner simulation focus
  const barcodeRef = useRef<HTMLInputElement>(null);

  // Auto-resolve category list
  const categories = useMemo(() => {
    const cats = new Set(allProducts.map(p => p.category));
    return ['All', ...Array.from(cats)];
  }, [allProducts]);

  // Autocomplete customer names if phone is recognized
  useEffect(() => {
    if (customerPhone.trim().length >= 5) {
      const found = allCustomers.find(c => c.phone.replaceAll(/[-()\s]/g, '').includes(customerPhone.trim().replaceAll(/[-()\s]/g, '')));
      if (found && !customerName) {
        setCustomerName(found.name);
      }
    }
  }, [customerPhone, allCustomers, customerName]);

  // Barcode quick adder lookup
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    
    const matchedProduct = allProducts.find(p => p.barcode === barcodeInput.trim());
    if (matchedProduct) {
      addToCart(matchedProduct);
      setBarcodeInput('');
    } else {
      setCheckoutError(`No product found with barcode: ${barcodeInput}`);
      setTimeout(() => setCheckoutError(''), 3000);
    }
  };

  // Add Item to cart
  const addToCart = (product: Product) => {
    // Prevent adding products with 0 stock
    if (product.stock <= 0) {
      setCheckoutError(`Warning: "${product.name}" is out of stock!`);
      setTimeout(() => setCheckoutError(''), 3000);
      return;
    }

    setCart(prev => {
      const idx = prev.findIndex(item => item.product.id === product.id);
      if (idx !== -1) {
        // limit quantity by stock
        const currentQty = prev[idx].quantity;
        if (currentQty >= product.stock) {
          setCheckoutError(`Cannot add more than active stock (${product.stock}) for "${product.name}"`);
          setTimeout(() => setCheckoutError(''), 3000);
          return prev;
        }
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: currentQty + 1 };
        return updated;
      } else {
        return [...prev, { product, quantity: 1 }];
      }
    });
  };

  // Reduce dynamic quantity
  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.product.id === productId);
      if (idx === -1) return prev;
      
      const newQty = prev[idx].quantity + delta;
      const product = prev[idx].product;
      
      if (newQty <= 0) {
        return prev.filter(item => item.product.id !== productId);
      }
      
      if (newQty > product.stock) {
        setCheckoutError(`Cannot exceed stock level (${product.stock}) for ${product.name}`);
        setTimeout(() => setCheckoutError(''), 3000);
        return prev;
      }

      const updated = [...prev];
      updated[idx] = { ...updated[idx], quantity: newQty };
      return updated;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Filters product Catalog
  const filteredProducts = useMemo(() => {
    return allProducts.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (p.barcode && p.barcode.includes(searchTerm));
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allProducts, searchTerm, selectedCategory]);

  // Core Math computations
  const calculations = useMemo(() => {
    let subtotal = 0;
    let gstTotal = 0;

    cart.forEach(({ product, quantity }) => {
      const baseSub = product.price * quantity;
      subtotal += baseSub;

      if (settings.gstRegistered) {
        // Custom GST Calculation: price is selling price before or after tax? 
        // In retail, price is usually the base price, so tax is added. Let's add tax on top.
        const productTax = baseSub * (product.gstPercentage / 100);
        gstTotal += productTax;
      }
    });

    // Discount
    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = subtotal * (discountValue / 100);
    } else {
      discountAmount = discountValue;
    }
    // Limit discount to subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    const grandTotal = subtotal - discountAmount + gstTotal;

    return {
      subtotal,
      discountAmount,
      gstTotal,
      grandTotal: Math.max(0, grandTotal)
    };
  }, [cart, discountType, discountValue, settings.gstRegistered]);

  // Place transaction & finalize
  const handlePaymentSubmit = () => {
    if (cart.length === 0) {
      setCheckoutError("Cart is empty! Add products first.");
      return;
    }

    setCheckoutError('');

    // Prepare items
    const invoiceItems: InvoiceItem[] = cart.map(({ product, quantity }) => {
      const basePrice = product.price;
      const gstAmount = settings.gstRegistered ? (basePrice * quantity * (product.gstPercentage / 100)) : 0;
      
      return {
        productId: product.id,
        productName: product.name,
        price: basePrice,
        quantity,
        gstPercentage: settings.gstRegistered ? product.gstPercentage : 0,
        gstAmount: Math.round(gstAmount * 100) / 100,
        total: Math.round((basePrice * quantity + gstAmount) * 100) / 100
      };
    });

    // Save Customer Profile if we have name & phone (will be auto-inserted by LocalDB)
    const newInvoice: Invoice = {
      id: LocalDB.generateInvoiceNumber(),
      customerName: customerName.trim() || "Walk-in Customer",
      customerPhone: customerPhone.trim(),
      items: invoiceItems,
      subtotal: Math.round(calculations.subtotal * 100) / 100,
      discountType,
      discountValue,
      discountAmount: Math.round(calculations.discountAmount * 100) / 100,
      gstTotal: Math.round(calculations.gstTotal * 100) / 100,
      grandTotal: Math.round(calculations.grandTotal * 100) / 100,
      paymentMethod,
      createdAt: new Date().toISOString()
    };

    try {
      LocalDB.insertInvoice(newInvoice);
      
      // Clear Cart states
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDiscountValue(0);
      
      // Callback to parent to trigger thermal printer view
      onCheckoutSuccess(newInvoice);
    } catch (err: any) {
      setCheckoutError(err.message || "Failed to process checkout transaction.");
    }
  };

  const currencySymbol = settings.currency === 'USD' ? '$' : settings.currency === 'INR' ? '₹' : settings.currency === 'EUR' ? '€' : settings.currency;

  return (
    <div id="billing-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-120px)] overflow-hidden">
      {/* LEFT PANEL: Catalog Selection (7 cols) */}
      <div className="lg:col-span-7 flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Search header & Barcode quick entry */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Search size={18} />
              </span>
              <input
                id="product-search-input"
                type="text"
                placeholder="Search products by name, code or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-505 focus:ring-indigo-500 text-sm"
              />
            </div>
            {/* Barcode scanner action bar */}
            <form onSubmit={handleBarcodeSubmit} className="flex gap-2 shrink-0">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 pointer-events-none">
                  <Barcode size={16} />
                </span>
                <input
                  id="barcode-scanner-simulator"
                  type="text"
                  placeholder="Barcode scanner..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  ref={barcodeRef}
                  className="pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs w-44 font-mono uppercase"
                />
              </div>
              <button
                id="barcode-quick-add"
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-3 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                Scan
              </button>
            </form>
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {categories.map((cat, idx) => (
              <button
                key={idx}
                id={`category-filter-${cat}`}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors shrink-0 ${
                  selectedCategory === cat 
                    ? 'bg-indigo-600 text-white shadow-xs' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog grid */}
        <div id="product-grid-container" className="flex-1 overflow-y-auto p-4 bg-slate-50/20">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Sparkles size={40} className="text-slate-300 mb-2" />
              <p className="text-sm">No matched products found</p>
              <button
                id="clear-billing-filter-btn"
                onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
                className="text-xs text-indigo-650 text-indigo-650 font-semibold mt-2 hover:underline"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredProducts.map((p) => {
                const isLow = p.stock <= p.lowStockThreshold;
                return (
                  <button
                    key={p.id}
                    id={`catalog-product-card-${p.id}`}
                    onClick={() => addToCart(p)}
                    className="p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-500 hover:shadow-xs hover:scale-[1.01] active:scale-[0.98] transition-all text-left flex flex-col justify-between h-36 cursor-pointer focus:outline-none"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest truncate max-w-[70px]">
                          {p.category}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                          isLow ? 'bg-red-50 text-red-650 text-red-600' : 'bg-slate-100 text-slate-600'
                        }`}>
                          Qty: {p.stock}
                        </span>
                      </div>
                      <h4 className="font-semibold text-slate-800 text-xs mt-1.5 line-clamp-2">
                        {p.name}
                      </h4>
                    </div>

                    <div className="flex justify-between items-end mt-2 pt-2 border-t border-slate-100">
                      <span className="text-sm font-bold font-mono text-slate-900">
                        {currencySymbol}{p.price.toFixed(2)}
                      </span>
                      {settings.gstRegistered && p.gstPercentage > 0 && (
                        <span className="text-[9px] px-1 bg-amber-50 text-amber-700 rounded font-semibold font-mono">
                          +{p.gstPercentage}% GST
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Cart & Payment Checkout Dashboard (5 cols) */}
      <div className="lg:col-span-5 flex flex-col h-full bg-slate-50 rounded-2xl text-slate-800 overflow-hidden shadow-xs border border-slate-200">
        
        {/* Customer Setup Form (Optional) */}
        <div className="p-4 bg-white border-b border-slate-200 space-y-2 pb-3 shrink-0">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
            <span>Customer Details</span>
            <span className="text-[10px] lowercase text-slate-400 italic">Optional lookup</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-404 text-slate-400">
                <User size={14} />
              </span>
              <input
                id="billing-customer-name"
                type="text"
                placeholder="Walk-in Customer"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-450 text-slate-400">
                <Phone size={14} />
              </span>
              <input
                id="billing-customer-phone"
                type="text"
                placeholder="Search Phone..."
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Interactive Shopping Cart List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-white">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <ShoppingCart size={36} className="mb-2 text-slate-300" />
              <p className="text-xs font-semibold">Your billing cart is empty</p>
              <p className="text-[10px] text-slate-400 mt-1">Select products to begin checkout invoice</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map(({ product, quantity }) => (
                <div 
                  key={product.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 truncate">{product.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {currencySymbol}{product.price.toFixed(2)} each 
                      {settings.gstRegistered && product.gstPercentage > 0 && ` | ${product.gstPercentage}% GST`}
                    </p>
                  </div>
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      id={`cart-minus-${product.id}`}
                      onClick={() => updateQuantity(product.id, -1)}
                      className="w-6 h-6 rounded-md bg-slate-250 bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 cursor-pointer active:scale-95"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="text-xs font-bold font-mono text-slate-800 min-w-[12px] text-center">
                      {quantity}
                    </span>
                    <button
                      id={`cart-plus-${product.id}`}
                      onClick={() => updateQuantity(product.id, 1)}
                      className="w-6 h-6 rounded-md bg-slate-250 bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 cursor-pointer active:scale-95"
                    >
                      <Plus size={11} />
                    </button>
                  </div>

                  <div className="text-right shrink-0 min-w-[56px]">
                    <p className="text-xs font-bold font-mono text-slate-800">
                      {currencySymbol}{(product.price * quantity).toFixed(2)}
                    </p>
                  </div>

                  <button
                    id={`cart-delete-${product.id}`}
                    onClick={() => removeFromCart(product.id)}
                    className="text-slate-400 hover:text-red-500 p-1 rounded cursor-pointer transition-colors shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Calculation summary details */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3 pb-4 shrink-0">
          
          {/* Quick Discount Tool */}
          <div className="flex items-center justify-between gap-3 bg-white p-2 rounded-xl border border-slate-200/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold animate-none">
              <Tag size={14} className="text-indigo-600" />
              <span>Discount</span>
            </div>
            <div className="flex items-center gap-1.5">
              <select
                id="discount-type-selector"
                value={discountType}
                onChange={(e) => { setDiscountType(e.target.value as 'percentage' | 'fixed'); setDiscountValue(0); }}
                className="bg-white text-slate-700 border border-slate-205 border-slate-200 text-[11px] rounded px-1.5 py-0.5 focus:outline-none"
              >
                <option value="percentage">% Percent</option>
                <option value="fixed">Value ({currencySymbol})</option>
              </select>
              <input
                id="discount-value-input"
                type="number"
                min="0"
                placeholder="0"
                value={discountValue || ''}
                onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value)))}
                className="w-14 text-right bg-white border border-slate-200 text-xs rounded px-1.5 py-0.5 text-slate-800 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            {/* Subtotal */}
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="font-mono font-bold text-slate-800">{currencySymbol}{calculations.subtotal.toFixed(2)}</span>
            </div>

            {/* Discount display */}
            {calculations.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Discount Applied</span>
                <span className="font-mono">-{currencySymbol}{calculations.discountAmount.toFixed(2)}</span>
              </div>
            )}

            {/* GST summary only if enabled */}
            {settings.gstRegistered && calculations.gstTotal > 0 && (
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Tax Total (GST)</span>
                <span className="font-mono font-bold text-slate-800">+{currencySymbol}{calculations.gstTotal.toFixed(2)}</span>
              </div>
            )}

            {/* Grand Total */}
            <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-2.5">
              <span className="font-display">Grand Total</span>
              <span className="font-mono text-lg text-indigo-600">
                {currencySymbol}{calculations.grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Checkout warning box */}
          {checkoutError && (
            <div className="bg-red-50 border border-red-100 text-red-650 text-red-600 p-2.5 rounded-lg text-xs flex items-center gap-1.5">
              <AlertCircle size={15} className="shrink-0 text-red-500" />
              <span>{checkoutError}</span>
            </div>
          )}

          {/* Payment Method Selector Grid */}
          <div className="space-y-1.5 pt-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Payment Method</span>
            <div className="grid grid-cols-4 gap-2">
              {(['Cash', 'Card', 'UPI', 'Wallet'] as const).map((method) => (
                <button
                  key={method}
                  id={`payment-method-${method}`}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 rounded-lg text-xs font-bold cursor-pointer transition-all border flex flex-col items-center justify-center gap-1 ${
                    paymentMethod === method
                      ? 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-500 shadow-xs'
                      : 'bg-white text-slate-500 border-slate-205 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[10px] uppercase font-mono">{method}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pay & Print Receipt CTA Button */}
          <button
            id="billing-pay-submit-button"
            type="button"
            onClick={handlePaymentSubmit}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl font-bold text-[13px] uppercase tracking-wider shadow-sm active:scale-99 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <CreditCard size={15} />
            Charge {currencySymbol}{calculations.grandTotal.toFixed(2)} & Print
          </button>
        </div>

      </div>
    </div>
  );
}
