/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Barcode, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  X,
  Package,
  FileDown
} from 'lucide-react';
import { LocalDB } from '../services/db';
import { Product } from '../types/pos';

export default function Inventory() {
  // Load products list dynamically
  const [products, setProducts] = useState<Product[]>(() => LocalDB.getProducts());
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Form Modal/Drawer States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState(0);
  const [gstPercentage, setGstPercentage] = useState(12);
  const [barcode, setBarcode] = useState('');
  const [stock, setStock] = useState(10);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [error, setError] = useState('');

  // Loaded Shop Settings for Currency
  const settings = useMemo(() => LocalDB.getShopSettings(), []);
  const currencySymbol = settings.currency === 'USD' ? '$' : settings.currency === 'INR' ? '₹' : settings.currency === 'EUR' ? '€' : settings.currency;

  // Derive all active categories
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['All', ...Array.from(cats)];
  }, [products]);

  // Open forms helper
  const openAddForm = () => {
    setEditingProduct(null);
    setName('');
    setCategory('');
    setPrice(0);
    setGstPercentage(settings.enabledGstRate);
    setBarcode('');
    setStock(10);
    setLowStockThreshold(5);
    setError('');
    setIsFormOpen(true);
  };

  const openEditForm = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category);
    setPrice(p.price);
    setGstPercentage(p.gstPercentage);
    setBarcode(p.barcode || '');
    setStock(p.stock);
    setLowStockThreshold(p.lowStockThreshold);
    setError('');
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Product Name is required.');
    if (!category.trim()) return setError('Category is required.');
    if (price < 0) return setError('Price cannot be negative.');
    if (stock < 0) return setError('Stock quantity cannot be negative.');

    let updatedList: Product[] = [];

    if (editingProduct) {
      // Edit mode
      updatedList = products.map(p => {
        if (p.id === editingProduct.id) {
          return {
            ...p,
            name: name.trim(),
            category: category.trim(),
            price: Number(price),
            gstPercentage: Number(gstPercentage),
            barcode: barcode.trim(),
            stock: Number(stock),
            lowStockThreshold: Number(lowStockThreshold)
          };
        }
        return p;
      });
    } else {
      // Add mode - generate new Product ID
      const newProduct: Product = {
        id: `P${String(products.length + 1).padStart(3, '0')}`,
        name: name.trim(),
        category: category.trim(),
        price: Number(price),
        gstPercentage: Number(gstPercentage),
        barcode: barcode.trim(),
        stock: Number(stock),
        lowStockThreshold: Number(lowStockThreshold)
      };
      
      // Make sure barcode or ID is unique
      if (barcode.trim() && products.some(p => p.barcode === barcode.trim())) {
        return setError(`Barcode "${barcode.trim()}" is already registered to another item!`);
      }

      updatedList = [newProduct, ...products];
    }

    setProducts(updatedList);
    LocalDB.saveProducts(updatedList);
    setIsFormOpen(false);
  };

  const handleDelete = (pId: string) => {
    if (window.confirm("Are you absolutely sure you want to delete this product?")) {
      const updatedList = products.filter(p => p.id !== pId);
      setProducts(updatedList);
      LocalDB.saveProducts(updatedList);
    }
  };

  // Search Filter products Catalog
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (p.barcode && p.barcode.includes(searchTerm));
      const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  // Export current catalog as csv representation helper
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Name,Category,Price,Tax (GST %),Barcode,Stock,Low Stock Threshold\n";
    products.forEach(p => {
      csvContent += `"${p.id}","${p.name}","${p.category}",${p.price},${p.gstPercentage},"${p.barcode || ''}",${p.stock},${p.lowStockThreshold}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `POS_Product_Catalog_Backup.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="inventory-root" className="space-y-6">
      {/* Title block info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
            Product Management
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Add, edit, remove products and manage real-time inventory stocks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Export Catalog CSV button */}
          <button
            id="export-csv-btn"
            onClick={handleExportCSV}
            className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2 px-3.5 rounded-xl text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileDown size={15} /> Export Catalog
          </button>

          <button
            id="open-add-product-modal"
            onClick={openAddForm}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl text-sm flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Plus size={16} /> Add New Product
          </button>
        </div>
      </div>

      {/* Quick Search & Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
            <Search size={18} />
          </span>
          <input
            id="inventory-search-box"
            type="text"
            placeholder="Search catalog by product name, item code, or barcode sequence..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm bg-slate-50/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold shrink-0">Filter Category:</span>
          <select
            id="inventory-category-select-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
          >
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Products Data Grid list */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-right">GST %</th>
                <th className="py-3 px-4 text-center">Barcode</th>
                <th className="py-3 px-4 text-center">Stock Level</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Package size={32} className="mx-auto text-slate-350 mb-2" />
                    No products added to the catalog yet.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isOutOfStock = p.stock <= 0;
                  const isLowStock = p.stock <= p.lowStockThreshold && p.stock > 0;
                  
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold font-mono text-slate-500">{p.id}</td>
                      <td className="py-3 px-4 font-bold text-slate-800 text-sm max-w-[200px] truncate">{p.name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold uppercase font-sans">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                        {currencySymbol}{p.price.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">{p.gstPercentage}%</td>
                      <td className="py-3 px-4 text-center font-mono text-slate-500">{p.barcode || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isOutOfStock ? (
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                          ) : isLowStock ? (
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                          )}
                          <span className={`font-bold font-mono ${
                            isOutOfStock ? 'text-red-650 text-red-600' : isLowStock ? 'text-amber-600' : 'text-slate-800'
                          }`}>
                            {p.stock} units
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center space-x-1.5">
                        <button
                          id={`edit-item-${p.id}`}
                          onClick={() => openEditForm(p)}
                          className="hover:bg-indigo-50 text-indigo-600 p-1.5 rounded-lg cursor-pointer transition-colors inline-flex border border-transparent hover:border-indigo-100"
                          title="Edit product"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          id={`delete-item-${p.id}`}
                          onClick={() => handleDelete(p.id)}
                          className="hover:bg-red-50 text-red-650 text-red-600 p-1.5 rounded-lg cursor-pointer transition-colors inline-flex border border-transparent hover:border-red-105"
                          title="Delete product"
                        >
                          <Trash2 size={14} />
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

      {/* Add / Edit product Drawer Overlay dialog */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-100 p-6 relative">
            <button
              id="close-product-drawer-btn"
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-755 hover:text-slate-700 transition-colors rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-5">
              <Package className="text-indigo-600" size={20} />
              <h3 className="font-bold text-slate-900 font-display text-base">
                {editingProduct ? `Edit ${editingProduct.name}` : 'Add Unlimited Custom Product'}
              </h3>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Product Basic Name */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Product Name *</label>
                <input
                  id="form-product-name"
                  type="text"
                  required
                  placeholder="e.g. Sugar Packet (1kg)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-medium"
                />
              </div>

              {/* Group category and Price code */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Category / Group *</label>
                  <input
                    id="form-product-category"
                    type="text"
                    required
                    placeholder="e.g. Groceries, Dairy"
                    list="category-suggestions"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-medium"
                  />
                  <datalist id="category-suggestions">
                    {categories.filter(c => c !== 'All').map((c, i) => (
                      <option key={i} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Selling Price ({currencySymbol}) *</label>
                  <input
                    id="form-product-price"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={price || ''}
                    onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
                    className="w-full border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-medium font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Barcode and GST settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Product Barcode</label>
                  <input
                    id="form-product-barcode"
                    type="text"
                    placeholder="89010580..."
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Tax Rate (GST %) *</label>
                  <select
                    id="form-product-gst"
                    value={gstPercentage}
                    onChange={(e) => setGstPercentage(Number(e.target.value))}
                    className="w-full border border-slate-200 bg-white rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-medium"
                  >
                    {[0, 5, 12, 18, 28].map((rate) => (
                      <option key={rate} value={rate}>{rate}% GST</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stock and thresholds */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Initial Stock *</label>
                  <input
                    id="form-product-stock"
                    type="number"
                    min="0"
                    required
                    placeholder="10"
                    value={stock || ''}
                    onChange={(e) => setStock(Math.max(0, Number(e.target.value)))}
                    className="w-full border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-medium font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Low Stock Limit *</label>
                  <input
                    id="form-product-limit"
                    type="number"
                    min="1"
                    required
                    placeholder="5"
                    value={lowStockThreshold || ''}
                    onChange={(e) => setLowStockThreshold(Math.max(1, Number(e.target.value)))}
                    className="w-full border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-medium font-mono"
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-500 font-semibold text-[11px] leading-relaxed">
                  * {error}
                </div>
              )}

              <button
                id="form-submit-product-item"
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors shadow-xs mt-6 cursor-pointer"
              >
                {editingProduct ? 'Save Product Changes' : 'Register New Product'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
