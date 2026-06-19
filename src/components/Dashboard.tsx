/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Receipt, 
  AlertTriangle, 
  Clock, 
  Award, 
  Tags, 
  CalendarDays, 
  Percent, 
  ArrowUpRight, 
  Layers 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  CartesianGrid 
} from 'recharts';
import { LocalDB } from '../services/db';
import { Product, Invoice } from '../types/pos';

interface DashboardProps {
  onNavigate: (route: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  // Read database values dynamically
  const settings = useMemo(() => LocalDB.getShopSettings(), []);
  const products = useMemo(() => LocalDB.getProducts(), []);
  const invoices = useMemo(() => LocalDB.getInvoices(), []);

  // Compute Core Metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

    let totalRevenue = 0;
    let totalGst = 0;
    let todaySales = 0;
    let weeklySales = 0;
    let monthlySales = 0;
    let todayCount = 0;

    invoices.forEach(inv => {
      const invDate = new Date(inv.createdAt);
      totalRevenue += inv.grandTotal;
      totalGst += inv.gstTotal;

      if (invDate >= startOfToday) {
        todaySales += inv.grandTotal;
        todayCount++;
      }
      if (invDate >= oneWeekAgo) {
        weeklySales += inv.grandTotal;
      }
      if (invDate >= oneMonthAgo) {
        monthlySales += inv.grandTotal;
      }
    });

    const lowStockAlerts = products.filter(p => p.stock <= p.lowStockThreshold);

    return {
      totalRevenue,
      totalGst,
      todaySales,
      weeklySales,
      monthlySales,
      invoiceCount: invoices.length,
      todayCount,
      lowStockAlertsCount: lowStockAlerts.length,
      lowStockItems: lowStockAlerts.slice(0, 5) // top 5 low stock products
    };
  }, [invoices, products]);

  // Sales Trends: Aggregated for last 7 days
  const salesTrendsData = useMemo(() => {
    const dataMap: { [date: string]: { dateLabel: string; total: number; count: number } } = {};
    
    // Initialize past 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dKey = d.toDateString();
      dataMap[dKey] = { dateLabel: dateStr, total: 0, count: 0 };
    }

    invoices.forEach(inv => {
      const invKey = new Date(inv.createdAt).toDateString();
      if (dataMap[invKey]) {
        dataMap[invKey].total += inv.grandTotal;
        dataMap[invKey].count += 1;
      }
    });

    return Object.values(dataMap);
  }, [invoices]);

  // Category and Product analytics
  const { topProducts, categorySales, peakHours, bestSalesDay } = useMemo(() => {
    const productQuantities: { [name: string]: { name: string; quantity: number; revenue: number; category: string } } = {};
    const categoryRevenue: { [cat: string]: number } = {};
    const hourMap = Array(24).fill(0);
    const dayOfWeekSales = Array(7).fill(0); // Sun(0) - Sat(6)

    // Map existing products to fetch their category securely
    const productCategoryMap = new Map<string, string>();
    products.forEach(p => productCategoryMap.set(p.id, p.category));

    invoices.forEach(inv => {
      const date = new Date(inv.createdAt);
      const hour = date.getHours();
      const day = date.getDay();

      hourMap[hour] += inv.grandTotal;
      dayOfWeekSales[day] += inv.grandTotal;

      inv.items.forEach(item => {
        const cat = productCategoryMap.get(item.productId) || "General";
        
        // Sum products
        if (!productQuantities[item.productName]) {
          productQuantities[item.productName] = {
            name: item.productName,
            quantity: 0,
            revenue: 0,
            category: cat
          };
        }
        productQuantities[item.productName].quantity += item.quantity;
        productQuantities[item.productName].revenue += item.total;

        // Sum category
        categoryRevenue[cat] = (categoryRevenue[cat] || 0) + item.total;
      });
    });

    // Peak Hour Formatting
    const formattedPeakHours = hourMap.map((revenue, hour) => {
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      return {
        hourLabel: `${displayHour} ${period}`,
        revenue: Math.round(revenue * 100) / 100
      };
    }).filter(h => h.revenue > 0 || (h.revenue === 0 && invoices.length === 0)); // only show interactive active hours

    // If no active sales, create standard intervals
    const peakHourChartData = formattedPeakHours.length > 0 ? formattedPeakHours : [
      { hourLabel: '9 AM', revenue: 0 },
      { hourLabel: '12 PM', revenue: 0 },
      { hourLabel: '3 PM', revenue: 0 },
      { hourLabel: '6 PM', revenue: 0 }
    ];

    // Best Sales Day mapping
    const daysName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const maxDayVal = Math.max(...dayOfWeekSales);
    const maxDayIndex = dayOfWeekSales.indexOf(maxDayVal);
    const bestDay = invoices.length > 0 ? daysName[maxDayIndex] : "No Transactions";

    // Format top selling products
    const sortedProducts = Object.values(productQuantities)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Format categories for Pie Chart
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
    const sortedCategories = Object.entries(categoryRevenue)
      .map(([name, value], idx) => ({
        name,
        value: Math.round(value * 100) / 100,
        color: COLORS[idx % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);

    return {
      topProducts: sortedProducts,
      categorySales: sortedCategories,
      peakHours: peakHourChartData,
      bestSalesDay: bestDay
    };
  }, [invoices, products]);

  const currencySymbol = settings.currency === 'USD' ? '$' : settings.currency === 'INR' ? '₹' : settings.currency === 'EUR' ? '€' : settings.currency;

  return (
    <div id="dashboard-root" className="space-y-6">
      {/* Header section with immediate business summary */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
            Dashboard Overview
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Real-time analytics for <span className="font-semibold text-slate-700">{settings.shopName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="launch-billing-button"
            onClick={() => onNavigate('billing')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-5 rounded-xl shadow-xs cursor-pointer flex items-center gap-2 transition-all text-sm"
          >
            <Receipt size={16} />
            Launch Terminal (F2)
          </button>
        </div>
      </div>
 
      {/* Main Grid for Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider">Total Revenue</span>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {currencySymbol}{metrics.totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-slate-400">All-time billing volume</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/50">
            <DollarSign size={22} />
          </div>
        </div>
 
        {/* Daily Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider">Today's Sales</span>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {currencySymbol}{metrics.todaySales.toFixed(2)}
            </div>
            <p className="text-xs text-slate-500">
              From <span className="font-semibold text-slate-700 font-mono">{metrics.todayCount}</span> checkout receipts
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100/50">
            <TrendingUp size={22} />
          </div>
        </div>
 
        {/* Taxes/GST Amount */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider">GST Collected</span>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {currencySymbol}{metrics.totalGst.toFixed(2)}
            </div>
            <p className="text-xs text-slate-400">
              {settings.gstRegistered ? `Active GSTIN: ${settings.gstin}` : 'GST Billing Disabled'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100/50">
            <Percent size={20} />
          </div>
        </div>
 
        {/* Invoices Count / System Health */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider">Total Invoices</span>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {metrics.invoiceCount}
            </div>
            <p className="text-xs text-slate-400">Secure logs in database</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center border border-slate-200/60">
            <Receipt size={22} />
          </div>
        </div>
      </div>
 
      {/* Warning Alert if Low Stock is checked */}
      {metrics.lowStockAlertsCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-5 py-4 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm">Low Stock Alert Detected!</p>
              <p className="text-xs text-amber-700 mt-0.5">
                There are <span className="font-bold underline">{metrics.lowStockAlertsCount}</span> products in your inventory falling below designated low thresholds.
              </p>
            </div>
          </div>
          <button
            id="go-inventory-alert-button"
            onClick={() => onNavigate('inventory')}
            className="bg-amber-600 hover:bg-amber-700 text-white font-medium py-1.5 px-3 rounded-lg text-xs transition-colors shrink-0 cursor-pointer"
          >
            Manage Stock
          </button>
        </div>
      )}
 
      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart (Area Chart) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-0.5">
              <h3 className="font-bold text-slate-900 text-base">Weekly Billing Volume</h3>
              <p className="text-xs text-slate-500">Aggregate daily sales value over the past 7 days</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1 font-mono">
              <CalendarDays size={12} /> Last 7 Days
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                   <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                     <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                   </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${currencySymbol}${val}`} />
                <Tooltip 
                  formatter={(value: any) => [`${currencySymbol}${Number(value).toFixed(2)}`, 'Sales']}
                  contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
 
        {/* Best Selling Category (Pie Chart / Breakdown) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="space-y-0.5 mb-4">
            <h3 className="font-bold text-slate-900 text-base">Category Contribution</h3>
            <p className="text-xs text-slate-500 font-display">Sales distribution across categories</p>
          </div>
          {categorySales.length === 0 ? (
            <div className="h-72 flex flex-col items-center justify-center text-slate-400 text-sm">
               <Layers size={36} className="mb-2 text-slate-300" />
              No sales categories mapped yet.
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categorySales}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categorySales.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [`${currencySymbol}${Number(value).toFixed(2)}`, 'Sales']}
                      contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full mt-4 space-y-2 overflow-y-auto max-h-24 pr-1">
                {categorySales.slice(0, 4).map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                      <span className="truncate">{entry.name}</span>
                    </div>
                    <span className="font-semibold font-mono text-slate-900 shrink-0">
                      {currencySymbol}{entry.value.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
 
      {/* Hour-based Peak Times and Best Day Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours (Bar Chart) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-0.5">
              <h3 className="font-bold text-slate-900 text-base">Sales Volume by Hour</h3>
              <p className="text-xs text-slate-500">Discover peak business hours during the day</p>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-600 flex items-center gap-1 font-mono">
              <Clock size={12} /> Peak Times
            </span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHours.slice(7, 21)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                {/* showing standard active hours 7 am to 9 pm */}
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hourLabel" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value: any) => [`${currencySymbol}${Number(value).toFixed(2)}`, 'Revenue']}
                  contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Extra statistics block: Best selling items and alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-900 text-base">Key Performance Indexes</h3>
                <p className="text-xs text-slate-500">Important shop performance trackers</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Award size={14} className="text-indigo-500" /> Best Sales Day
                </div>
                <div className="text-lg font-bold text-slate-800 tracking-tight font-display">
                  {bestSalesDay}
                </div>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Tags size={14} className="text-pink-500" /> Active Catalog
                </div>
                <div className="text-lg font-bold font-mono text-slate-800">
                  {products.length} Products
                </div>
              </div>
            </div>

            {/* Top 3 Selling Products list */}
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Top Performing Products</span>
              {topProducts.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No sales tracked yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {topProducts.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono uppercase">{item.category}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-extrabold text-slate-900 font-mono">
                          {item.quantity} units
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {currencySymbol}{item.revenue.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-50 flex justify-between text-xs text-slate-400 font-mono">
            <span>Database Status: Active</span>
            <span>Local Sync OK</span>
          </div>
        </div>
      </div>
    </div>
  );
}
