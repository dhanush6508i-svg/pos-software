/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Package, 
  Users, 
  FileSpreadsheet, 
  Settings as SettingsIcon, 
  LogOut, 
  Store, 
  CalendarDays, 
  Menu, 
  X,
  CreditCard,
  Building2
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

// Database core service
import { LocalDB } from './services/db';
import { Invoice } from './types/pos';

// Components
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Billing from './components/Billing';
import Inventory from './components/Inventory';
import Customers from './components/Customers';
import Reports from './components/Reports';
import Settings from './components/Settings';
import InvoiceReceipt from './components/InvoiceReceipt';

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('pos_authenticated') === 'true';
  });
  
  const [currentRoute, setCurrentRoute] = useState<string>('dashboard');
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load shop settings to render business metadata in headings
  const [shopSettings, setShopSettings] = useState(() => LocalDB.getShopSettings());

  // Watch for local changes or reloads
  useEffect(() => {
    // F2 Key launch billing hotkey listener for lightning-fast shop checkout desk!
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setCurrentRoute('billing');
        setActiveInvoice(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogin = () => {
    setAuthenticated(true);
    localStorage.setItem('pos_authenticated', 'true');
    setCurrentRoute('dashboard');
  };

  const handleLogout = () => {
    setAuthenticated(false);
    localStorage.removeItem('pos_authenticated');
  };

  // Triggers immediate printable invoice display
  const handleCheckoutReceipt = (invoice: Invoice) => {
    setActiveInvoice(invoice);
    setCurrentRoute('receipt');
  };

  // Allows reprinting historical transactions
  const handleReprintHistory = (invoice: Invoice) => {
    setActiveInvoice(invoice);
    setCurrentRoute('receipt');
  };

  // Auto-refresh header info on settings saves
  const handleSettingsUpdate = () => {
    setShopSettings(LocalDB.getShopSettings());
  };

  const menuItems = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'billing', label: 'Billing Terminal (F2)', icon: Receipt },
    { id: 'inventory', label: 'Product Inventory', icon: Package },
    { id: 'customers', label: 'Customers Registry', icon: Users },
    { id: 'reports', label: 'Sales Ledger', icon: FileSpreadsheet },
    { id: 'settings', label: 'System Settings', icon: SettingsIcon },
  ];

  if (!authenticated) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  return (
    <div id="pos-application-container" className="min-h-screen bg-slate-50 flex flex-col md:flex-row antialiased font-sans">
      
      {/* MOBILE HEADER BAR */}
      <header className="md:hidden bg-white text-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-200 z-35 shrink-0 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-650 bg-indigo-600 text-white flex items-center justify-center font-bold text-xs tracking-wider">
            {shopSettings.shopName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <span className="font-bold text-sm tracking-tight truncate max-w-[180px] text-slate-800">
            {shopSettings.shopName}
          </span>
        </div>
        <button
          id="mobile-hamburger-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 focus:outline-none cursor-pointer"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* MOBILE OVERLAY SIDEBAR DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900"
            />
            
            {/* Drawer Body */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-72 bg-white text-slate-600 flex flex-col h-full p-6 z-50 border-r border-slate-200 shadow-xl"
            >
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm tracking-wider">
                    {shopSettings.shopName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-extrabold text-slate-900 tracking-tight text-sm font-display">{shopSettings.shopName}</span>
                </div>
                <button
                  id="mobile-drawer-close"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer text-slate-500"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="flex-1 space-y-1.5">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = currentRoute === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`mobile-nav-${item.id}`}
                      onClick={() => {
                        setCurrentRoute(item.id);
                        setActiveInvoice(null);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                        active
                          ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' 
                          : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Icon size={18} />
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              <button
                id="mobile-logout-btn"
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 py-3 px-4 hover:bg-red-50 hover:text-red-650 hover:text-red-650 text-slate-500 font-semibold text-sm rounded-xl transition-all cursor-pointer border border-transparent hover:border-red-105"
              >
                <LogOut size={18} />
                Void Session
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white text-slate-600 border-r border-slate-200 shrink-0 h-screen sticky top-0">
        {/* Brand Banner */}
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-slate-200/80 font-medium bg-white">
          <div className="w-9 h-9 rounded-xl bg-indigo-650 bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-sm tracking-widest">
            {shopSettings.shopName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="font-extrabold text-slate-805 text-slate-900 text-xs truncate max-w-[150px] font-display">
              {shopSettings.shopName}
            </h2>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider truncate max-w-[150px]">
              {shopSettings.currency === 'INR' ? 'GST INVOICING' : 'TAX INTT.'}
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = currentRoute === item.id || (item.id === 'billing' && currentRoute === 'receipt');
            return (
              <button
                key={item.id}
                id={`desktop-nav-${item.id}`}
                onClick={() => {
                  setCurrentRoute(item.id);
                  setActiveInvoice(null);
                }}
                className={`w-full flex items-center gap-3.5 py-2.5 px-4 rounded-xl text-xs font-bold tracking-wide uppercase transition-all cursor-pointer ${
                  active 
                    ? 'bg-indigo-50 text-indigo-650 text-indigo-600 border border-indigo-100 shadow-xs' 
                    : 'hover:bg-slate-50 hover:text-slate-900 text-slate-450 text-slate-500'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Desktop Admin state card */}
        <div className="p-4 border-t border-slate-200/80 space-y-3">
          <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/50">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Operator Logged</span>
              <span className="text-xs font-semibold text-slate-700 truncate block">Administrator</span>
            </div>
          </div>

          <button
            id="desktop-logout-btn"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 py-2 px-3.5 hover:bg-red-50 text-slate-400 hover:text-red-600 font-bold text-xs tracking-wider uppercase rounded-xl border border-transparent hover:border-red-100 transition-all cursor-pointer"
          >
            <LogOut size={14} />
            Void Session
          </button>
        </div>
      </aside>

      {/* MASTER CENTRAL VIEWS PANEL CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        
        {/* TOP STATUS BAR BARCODE HELPERS */}
        <header className="hidden md:flex items-center justify-between bg-white border-b border-slate-200/80 px-8 py-4 shrink-0 shadow-xs">
          <div className="flex items-center gap-2">
            <Store size={16} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 tracking-tight">Terminal Root:</span>
            <span className="text-xs font-bold text-slate-800 font-mono">
              {shopSettings.address}
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 font-mono">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Offline Sync Engine Active</span>
            </div>
            <div className="border-l border-slate-200 h-4" />
            <div className="flex items-center gap-1 text-slate-755 text-slate-800">
              <CalendarDays size={14} className="text-slate-450" />
              <span>{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </header>

        {/* SCREEN WORKSPACE WRAPPER */}
        <div id="central-view-viewport" className="flex-1 p-4 md:p-8 overflow-y-auto">
          {currentRoute === 'dashboard' && (
            <Dashboard onNavigate={(route) => { setCurrentRoute(route); setActiveInvoice(null); }} />
          )}

          {currentRoute === 'billing' && (
            <Billing 
              onCheckoutSuccess={handleCheckoutReceipt} 
              onNavigate={(route) => { setCurrentRoute(route); setActiveInvoice(null); }} 
            />
          )}

          {currentRoute === 'receipt' && activeInvoice && (
            <InvoiceReceipt 
              invoice={activeInvoice} 
              onBackToTerminal={() => { setCurrentRoute('billing'); setActiveInvoice(null); }} 
            />
          )}

          {currentRoute === 'inventory' && (
            <Inventory />
          )}

          {currentRoute === 'customers' && (
            <Customers />
          )}

          {currentRoute === 'reports' && (
            <Reports onReprintInvoice={(inv) => { handleReprintHistory(inv); }} />
          )}

          {currentRoute === 'settings' && (
            <div onClick={handleSettingsUpdate}>
              <Settings />
            </div>
          )}
        </div>
      </main>

    </div>
  );
}
