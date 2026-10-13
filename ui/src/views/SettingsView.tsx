import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import {
  Save,
  Building,
  FileSpreadsheet,
  Sun,
  Percent,
  CheckCircle2,
  Smartphone,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, theme, setThemeMode } = useCRM();

  const [shopName, setShopName] = useState(settings.shopName);
  const [tagline, setTagline] = useState(settings.tagline);
  const [address, setAddress] = useState(settings.address);
  const [area, setArea] = useState(settings.area);
  const [city, setCity] = useState(settings.city);
  const [pincode, setPincode] = useState(settings.pincode);
  const [phone, setPhone] = useState(settings.phone);
  const [email] = useState(settings.email);
  const [gstNumber, setGstNumber] = useState(settings.gstNumber);
  const [operatingHours, setOperatingHours] = useState(settings.operatingHours);
  const [defaultTaxRate, setDefaultTaxRate] = useState(settings.defaultTaxRate);
  const [defaultWarrantyMonths, setDefaultWarrantyMonths] = useState(settings.defaultWarrantyMonths);
  const [googleReviewUrl, setGoogleReviewUrl] = useState(settings.googleReviewUrl);

  // Tally Mapping State
  const [repairLedger, setRepairLedger] = useState(settings.tallyLedgerMapping.repairSales);
  const [accessoryLedger, setAccessoryLedger] = useState(settings.tallyLedgerMapping.accessorySales);
  const [resaleLedger, setResaleLedger] = useState(settings.tallyLedgerMapping.resaleSales);
  const [bankAccountLedger] = useState(settings.tallyLedgerMapping.bankAccount);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      shopName,
      tagline,
      address,
      area,
      city,
      pincode,
      phone,
      email,
      gstNumber,
      operatingHours,
      defaultTaxRate: Number(defaultTaxRate),
      defaultWarrantyMonths: Number(defaultWarrantyMonths),
      googleReviewUrl,
      tallyLedgerMapping: {
        repairSales: repairLedger,
        accessorySales: accessoryLedger,
        resaleSales: resaleLedger,
        cashAccount: settings.tallyLedgerMapping.cashAccount,
        bankAccount: bankAccountLedger,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Shop Configuration &amp; Settings
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            One Repair Pimpri branch details, GSTIN, Tally chart of accounts, and UI preferences
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-extrabold bg-[#F5ED31] hover:bg-[#E5DC24] dark:bg-[#DAFC08] dark:hover:bg-[#C4E407] text-black shadow-sm transition active:scale-95"
        >
          <Save className="w-4 h-4 stroke-[3]" />
          <span>Save Shop Settings</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Shop Profile & Contact Details */}
        <div className="glass-panel p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
            <Building className="w-4 h-4 text-amber-500 dark:text-[#DAFC08]" />
            <span className="text-xs font-extrabold uppercase text-gray-900 dark:text-white tracking-wider">
              1. Shop Profile &amp; Location (One Repair Pimpri)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Shop Business Name *
              </label>
              <input
                type="text"
                required
                value={shopName}
                onChange={e => setShopName(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs font-extrabold text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Tagline / Sub-heading
              </label>
              <input
                type="text"
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Shop Street Address *
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Area Hub *
              </label>
              <input
                type="text"
                required
                value={area}
                onChange={e => setArea(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                City &amp; District
              </label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Pincode
              </label>
              <input
                type="text"
                value={pincode}
                onChange={e => setPincode(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs font-mono text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                GSTIN Number *
              </label>
              <input
                type="text"
                required
                value={gstNumber}
                onChange={e => setGstNumber(e.target.value.toUpperCase())}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs font-mono font-bold uppercase text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Shop Helpline &amp; Intake Phone *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs font-mono text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Operating Working Hours
              </label>
              <input
                type="text"
                value={operatingHours}
                onChange={e => setOperatingHours(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Financial, Warranty Defaults & Google Review */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Defaults & Tax */}
          <div className="glass-panel p-6 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
              <Percent className="w-4 h-4 text-emerald-500 dark:text-[#DAFC08]" />
              <span className="text-xs font-extrabold uppercase text-gray-900 dark:text-white tracking-wider">
                2. Warranty &amp; Tax Defaults
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Default Tax Rate (%)
                </label>
                <input
                  type="number"
                  value={defaultTaxRate}
                  onChange={e => setDefaultTaxRate(Number(e.target.value))}
                  className="glass-input w-full px-3 py-2 rounded-xl font-bold text-center text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Default Warranty (Months)
                </label>
                <input
                  type="number"
                  value={defaultWarrantyMonths}
                  onChange={e => setDefaultWarrantyMonths(Number(e.target.value))}
                  className="glass-input w-full px-3 py-2 rounded-xl font-bold text-center text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Google Review Invitation URL
              </label>
              <input
                type="text"
                value={googleReviewUrl}
                onChange={e => setGoogleReviewUrl(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs font-mono text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Tally Chart of Accounts Mapping */}
          <div className="glass-panel p-6 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
              <FileSpreadsheet className="w-4 h-4 text-blue-500 dark:text-[#547BDE]" />
              <span className="text-xs font-extrabold uppercase text-gray-900 dark:text-white tracking-wider">
                3. Tally ERP Ledger Account Names
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block font-semibold text-gray-500 mb-0.5">Repair Revenue Ledger</label>
                <input
                  type="text"
                  value={repairLedger}
                  onChange={e => setRepairLedger(e.target.value)}
                  className="glass-input w-full px-3 py-1.5 rounded-xl text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-500 mb-0.5">Accessories Sales Ledger</label>
                <input
                  type="text"
                  value={accessoryLedger}
                  onChange={e => setAccessoryLedger(e.target.value)}
                  className="glass-input w-full px-3 py-1.5 rounded-xl text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-500 mb-0.5">Resale Devices Sales Ledger</label>
                <input
                  type="text"
                  value={resaleLedger}
                  onChange={e => setResaleLedger(e.target.value)}
                  className="glass-input w-full px-3 py-1.5 rounded-xl text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Design System & Theme Mode */}
        <div className="glass-panel p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500 dark:text-[#DAFC08]" />
              <span className="text-xs font-extrabold uppercase text-gray-900 dark:text-white tracking-wider">
                4. CRM Theme Preference
              </span>
            </div>
            <span className="text-xs font-bold text-gray-400">
              Active: <strong className="text-gray-900 dark:text-white uppercase">{theme}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Dark Mode Card */}
            <div
              onClick={() => setThemeMode('dark')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 space-y-3 glass-card text-white ${
                theme === 'dark' ? 'border-[#DAFC08] ring-2 ring-[#DAFC08]/40 shadow-glow-lime' : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-[#DAFC08]">Dark Theme (Active Default)</span>
                {theme === 'dark' && <CheckCircle2 className="w-5 h-5 text-[#DAFC08]" />}
              </div>
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#0D0D0D] border border-white/20 shadow-inner" title="Main Background: #0D0D0D"></div>
                <div className="w-7 h-7 rounded-xl bg-[#DAFC08] shadow-glow-lime" title="Primary Accent: #DAFC08"></div>
                <div className="w-7 h-7 rounded-xl bg-[#547BDE]" title="Secondary Accent: #547BDE"></div>
                <div className="w-7 h-7 rounded-xl bg-[#5E5E5E]" title="Muted Surface: #5E5E5E"></div>
              </div>
              <p className="text-[11px] text-gray-300">
                Lufga / Geometric typography with frosted glass surfaces, neon lime accent, and periwinkle badges.
              </p>
            </div>

            {/* Light Mode Card */}
            <div
              onClick={() => setThemeMode('light')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 space-y-3 glass-card text-black ${
                theme === 'light' ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-glow-yellow' : 'border-black/10 hover:border-black/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-gray-900">Light Theme</span>
                {theme === 'light' && <CheckCircle2 className="w-5 h-5 text-amber-500" />}
              </div>
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#DDDDDD] border border-gray-300 shadow-inner" title="Background: #DDDDDD"></div>
                <div className="w-7 h-7 rounded-xl bg-[#F5ED31] shadow-glow-yellow" title="Primary Accent: #F5ED31"></div>
                <div className="w-7 h-7 rounded-xl bg-[#FF934F]" title="Secondary Accent: #FF934F"></div>
                <div className="w-7 h-7 rounded-xl bg-[#0D0C0B]" title="Deep Obsidian: #0D0C0B"></div>
              </div>
              <p className="text-[11px] text-gray-700">
                Urbanist typography with frosted glass surfaces, warm sun yellow accent, and orange secondary highlights.
              </p>
            </div>
          </div>
        </div>

        {/* Section 5: PWA App Installation & Offline Status */}
        <div className="glass-panel p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-500 dark:text-[#DAFC08]" />
              <span className="text-xs font-extrabold uppercase text-gray-900 dark:text-white tracking-wider">
                5. Progressive Web App (PWA) &amp; Device Installation
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F5ED31]/30 text-black dark:bg-[#DAFC08]/20 dark:text-[#DAFC08] font-bold">
              Standalone App
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl glass-card border border-black/5 dark:border-white/10">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border border-black/10 dark:border-white/20 flex-shrink-0">
              <img src="/pwa-icon.png" alt="OneRepair PWA" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 text-center sm:text-left space-y-1">
              <h4 className="text-sm font-black text-gray-900 dark:text-white">
                OneRepair Mobile Repair CRM
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Install as a native application on Windows, Mac, iPad, Android tablets, or shop counter PCs for distraction-free offline workshop operations.
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  ✓ Offline Cache Ready
                </span>
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
                  ✓ Window Standalone Mode
                </span>
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                  ✓ Fast Bench Loading
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button Footer */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-extrabold bg-[#F5ED31] hover:bg-[#E5DC24] dark:bg-[#DAFC08] dark:hover:bg-[#C4E407] text-black shadow-lg transition active:scale-95"
          >
            <Save className="w-4 h-4 stroke-[3]" />
            <span>Save All Configuration Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
};
