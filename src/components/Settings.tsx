/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Store, 
  Percent, 
  Lock, 
  Database, 
  Save, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  ShieldX,
  FileCode2,
  Trash2
} from 'lucide-react';
import { LocalDB } from '../services/db';
import { ShopSettings } from '../types/pos';

export default function Settings() {
  // Load configuration
  const [settings, setSettings] = useState<ShopSettings>(() => LocalDB.getShopSettings());
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: 'info' });
  const [settingsMessage, setSettingsMessage] = useState('');
  const [databaseMessage, setDatabaseMessage] = useState('');

  // Logo icon letters
  const logoInitials = useMemo(() => {
    if (!settings.shopName) return 'POS';
    return settings.shopName.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
  }, [settings.shopName]);

  // Handle Save Shop Configurations
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings.shopName.trim()) return setSettingsMessage('Shop Name cannot be empty.');
    
    // Save settings
    LocalDB.saveShopSettings(settings);
    setSettingsMessage('Shop settings saved successfully!');
    setTimeout(() => setSettingsMessage(''), 3000);
  };

  // Handle Save Password Secrets update
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      setPasswordMessage({ text: 'Password cannot be empty.', type: 'err' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'Passwords do not match.', type: 'err' });
      return;
    }

    LocalDB.saveAuthPassword(newPassword.trim());
    setNewPassword('');
    setConfirmPassword('');
    setPasswordMessage({ text: 'Password updated successfully!', type: 'success' });
    setTimeout(() => setPasswordMessage({ text: '', type: 'info' }), 4000);
  };

  // Trigger JSON file backup export downloads
  const handleExportBackup = () => {
    const rawBackup = LocalDB.exportBackup();
    const blob = new Blob([rawBackup], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${settings.shopName.replace(/\s+/g, '_')}_POS_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDatabaseMessage('Backup file downloaded successfully!');
    setTimeout(() => setDatabaseMessage(''), 3000);
  };

  // Trigger local JSON file imports/restore
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        const success = LocalDB.restoreBackup(result);
        if (success) {
          setDatabaseMessage(`Success! Backup files matched and restored. Re-syncing database...`);
          setTimeout(() => {
            window.location.reload(); // Reload to refresh total states
          }, 1500);
        } else {
          setDatabaseMessage('Failed to restore. Invalid file schema or corrupted JSON.');
        }
      }
    };
    reader.readAsText(file);
  };

  // Factory reset everything
  const handleFactoryReset = () => {
    if (window.confirm("CRITICAL ACCORD: This will permanently wipe all local sales registers, invoices, customized product catalogs, and restore initial seed mock assets. Proceed?")) {
      LocalDB.resetToDefault();
      setDatabaseMessage('Database fully purged. Reloading POS module...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  return (
    <div id="settings-root" className="space-y-6">
      {/* Page Title */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
          System settings
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Configure shop identity, taxation modules, access controls, and storage replication.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start animate-fade-in">
        
        {/* SHOP METADATA & DATA FIELDS SETUP (Form) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Store size={18} className="text-indigo-600" />
            <h3 className="font-bold text-slate-950 font-display text-sm uppercase tracking-wider">Shop & Legal Setup</h3>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-display font-extrabold text-base tracking-widest">
                {logoInitials}
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Logo Identifier</span>
                <span className="text-xs text-slate-550 text-slate-500">Auto-generated from your business name initials</span>
              </div>
            </div>

            {/* Shop Name */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Registered Shop Name</label>
              <input
                id="setup-shop-name"
                type="text"
                required
                value={settings.shopName}
                onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                className="w-full border border-slate-205 border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/10"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Business Address</label>
              <textarea
                id="setup-shop-address"
                rows={2}
                required
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full border border-slate-205 border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/10"
              />
            </div>

            {/* Telephone & Currency in Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                <input
                  id="setup-shop-phone"
                  type="text"
                  required
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full border border-slate-205 border-slate-200 rounded-xl py-2 px-3 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/10"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">POS Currency Symbol</label>
                <select
                  id="setup-shop-currency"
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full border border-slate-205 border-slate-200 bg-white rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            {/* TAXATION GST DETAILS */}
            <div className="bg-slate-50/70 border border-slate-100 p-4 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800">GST Tax calculations</span>
                  <p className="text-[10px] text-slate-400">Enable if your shop is tax registered</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    id="setup-gst-toggle"
                    type="checkbox"
                    checked={settings.gstRegistered}
                    onChange={(e) => setSettings({ ...settings, gstRegistered: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 font-sans"></div>
                </label>
              </div>

              {settings.gstRegistered && (
                <div className="grid grid-cols-2 gap-3.5 pt-2 animate-fade-in">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Company GSTIN</label>
                    <input
                      id="setup-gstin-val"
                      type="text"
                      placeholder="e.g. 27AAPCS1234F..."
                      value={settings.gstin}
                      onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl py-1.5 px-3 text-xs font-mono font-bold uppercase focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Default GST Rate (%)</label>
                    <select
                      id="setup-default-tax-rate"
                      value={settings.enabledGstRate}
                      onChange={(e) => setSettings({ ...settings, enabledGstRate: Number(e.target.value) })}
                      className="w-full border border-slate-205 border-slate-200 bg-white rounded-xl py-1.5 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="0">0% (Tax Exempt)</option>
                      <option value="5">5% (Essentials)</option>
                      <option value="12">12% (Standard)</option>
                      <option value="18">18% (Services/Snacks)</option>
                      <option value="28">28% (Luxury)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {settingsMessage && (
              <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={14} /> {settingsMessage}
              </div>
            )}

            <button
              id="save-shop-configs-btn"
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer uppercase tracking-wider"
            >
              <Save size={15} /> Save Business Profile
            </button>
          </form>
        </div>

        {/* SECURITY PASSWORD & STORAGE WIPE ENGINE */}
        <div className="space-y-6">
          
          {/* SECURITY PASSWORDS (Form) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Lock size={18} className="text-amber-500" />
              <h3 className="font-bold text-slate-950 font-display text-sm uppercase tracking-wider">Authentication Passkey</h3>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-4">
              <p className="text-xs text-slate-400">
                Change the password used to unlock this terminal. Keep your sales and setup data secure.
              </p>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">New System Password</label>
                <input
                  id="setup-new-password"
                  type="password"
                  required
                  placeholder="Enter clean secret password..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-505 focus:ring-indigo-500 font-mono bg-slate-50/10"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                <input
                  id="setup-confirm-password"
                  type="password"
                  required
                  placeholder="Verify password..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-505 focus:ring-indigo-500 font-mono bg-slate-50/10"
                />
              </div>

              {passwordMessage.text && (
                <div className={`text-xs font-bold flex items-center gap-1 ${
                  passwordMessage.type === 'err' ? 'text-red-600' : 'text-emerald-600'
                }`}>
                  <CheckCircle2 size={14} /> {passwordMessage.text}
                </div>
              )}

              <button
                id="update-secret-pass-btn"
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Save size={15} /> Update Passcode Secrets
              </button>
            </form>
          </div>

          {/* BACKUP & RESTORE DATA (JSON) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Database size={18} className="text-emerald-500 animate-pulse" />
              <h3 className="font-bold text-slate-950 font-display text-sm uppercase tracking-wider">Backup & Disaster Recovery</h3>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Replicate products catalogs, registered loyalty user databases, and billing history ledgers into a secure serializable backup file. Offline databases protect you from cloud latency.
              </p>

              <div className="grid grid-cols-2 gap-3.5">
                {/* Export CTA Button */}
                <button
                  id="download-offline-db-backup"
                  onClick={handleExportBackup}
                  className="bg-amber-50 hover:bg-amber-100/80 text-amber-900 font-bold py-3 px-3 rounded-xl border border-amber-200/50 text-xs flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  <Download size={20} className="text-amber-600" />
                  <span>Download Backup File</span>
                </button>

                {/* Import/Restore file input drawer */}
                <div className="relative">
                  <label
                    htmlFor="restore-db-upload-ref"
                    className="bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 font-bold py-3 px-3 rounded-xl border border-emerald-200/50 text-xs flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center h-full"
                  >
                    <Upload size={20} className="text-emerald-600 animate-bounce" />
                    <span>Restore Local Backup</span>
                  </label>
                  <input
                    id="restore-db-upload-ref"
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </div>
              </div>

              {databaseMessage && (
                <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-lg text-center animate-pulse">
                  {databaseMessage}
                </div>
              )}

              {/* FACTORY RESET DAMPENER */}
              <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800">Clear Storage Cache</span>
                  <p className="text-[10px] text-slate-400">Purge POS logs to factory settings</p>
                </div>
                <button
                  id="factory-wipeout-btn"
                  onClick={handleFactoryReset}
                  className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-2 px-3 rounded-xl text-xs font-bold tracking-tight inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 size={13} /> Clear Ledger
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
