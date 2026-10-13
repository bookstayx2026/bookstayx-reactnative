import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { ResaleDevice } from '../types';
import { formatINR, formatDate, maskIMEI } from '../utils/formatters';
import { StatusBadge } from '../components/common/StatusBadge';
import { Smartphone, Plus, Search, Battery } from 'lucide-react';
import { NewResaleModal } from '../components/modals/NewResaleModal';

export const ResaleView: React.FC = () => {
  const { resaleDevices, updateResaleStatus } = useCRM();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [brandFilter, setBrandFilter] = useState<string>('ALL');
  const [newResaleModalOpen, setNewResaleModalOpen] = useState(false);

  // Filter resale devices
  const filteredDevices = resaleDevices.filter((dev: ResaleDevice) => {
    const q = searchQuery.toLowerCase().trim();
    if (
      q &&
      !dev.sku.toLowerCase().includes(q) &&
      !dev.brand.toLowerCase().includes(q) &&
      !dev.model.toLowerCase().includes(q) &&
      !dev.imeiSerial.includes(q)
    ) {
      return false;
    }
    if (statusFilter !== 'ALL' && dev.status !== statusFilter) return false;
    if (brandFilter !== 'ALL' && dev.brand !== brandFilter) return false;
    return true;
  });

  // Calculate resale unit economics
  const totalResaleInventoryCost = resaleDevices
    .filter((d: ResaleDevice) => d.status !== 'Sold')
    .reduce((sum: number, d: ResaleDevice) => sum + d.purchaseCost + d.totalRefurbCost, 0);

  const totalSoldRevenue = resaleDevices
    .filter((d: ResaleDevice) => d.status === 'Sold')
    .reduce((sum: number, d: ResaleDevice) => sum + (d.salePrice || 0), 0);

  const totalSoldCogs = resaleDevices
    .filter((d: ResaleDevice) => d.status === 'Sold')
    .reduce((sum: number, d: ResaleDevice) => sum + d.purchaseCost + d.totalRefurbCost, 0);

  const totalSoldProfit = totalSoldRevenue - totalSoldCogs;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Certified Pre-Owned &amp; Resale Devices
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Track individual phones, refurbishment investment, IMEI history, and sales margins
          </p>
        </div>

        <button
          onClick={() => setNewResaleModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-[#F5ED31] hover:bg-[#E5DC24] dark:bg-[#DAFC08] dark:hover:bg-[#C4E407] text-black shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Acquire Phone</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl glass-card">
          <p className="text-xs font-bold uppercase text-gray-400">Active Stock Investment</p>
          <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-1">
            {formatINR(totalResaleInventoryCost)}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {resaleDevices.filter((d: ResaleDevice) => d.status === 'Ready for Sale').length} phones ready in showcase
          </p>
        </div>

        <div className="p-4 rounded-2xl glass-card">
          <p className="text-xs font-bold uppercase text-gray-400">Realized Resale Sales</p>
          <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatINR(totalSoldRevenue)}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {resaleDevices.filter((d: ResaleDevice) => d.status === 'Sold').length} units sold
          </p>
        </div>

        <div className="p-4 rounded-2xl glass-card">
          <p className="text-xs font-bold uppercase text-gray-400">Realized Net Resale Margin</p>
          <p className="text-xl font-extrabold text-[#FF934F] dark:text-[#DAFC08] mt-1">
            {formatINR(totalSoldProfit)}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {totalSoldRevenue > 0 ? `${((totalSoldProfit / totalSoldRevenue) * 100).toFixed(1)}%` : '0%'} gross margin
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl glass-panel flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search brand, model, SKU, IMEI..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white focus:outline-none font-semibold"
          >
            <option value="ALL">All Statuses</option>
            <option value="Acquired">Acquired</option>
            <option value="Inspecting">Inspecting</option>
            <option value="Refurbishing">Refurbishing</option>
            <option value="Ready for Sale">Ready for Sale</option>
            <option value="Sold">Sold</option>
          </select>

          <select
            value={brandFilter}
            onChange={e => setBrandFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white focus:outline-none"
          >
            <option value="ALL">All Brands</option>
            <option value="Apple">Apple</option>
            <option value="Samsung">Samsung</option>
            <option value="OnePlus">OnePlus</option>
            <option value="Google">Google</option>
          </select>
        </div>
      </div>

      {/* Resale Phones Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDevices.length === 0 ? (
          <div className="md:col-span-2 py-16 text-center text-gray-400 glass-panel rounded-3xl">
            <Smartphone className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold">No resale devices found matching filters</p>
          </div>
        ) : (
          filteredDevices.map((dev: ResaleDevice) => {
            const totalLandedCost = dev.purchaseCost + dev.totalRefurbCost;
            const projectedMargin = dev.askingPrice - totalLandedCost;
            const marginPct = dev.askingPrice > 0 ? (projectedMargin / dev.askingPrice) * 100 : 0;

            return (
              <div
                key={dev.id}
                className="p-5 rounded-3xl glass-card space-y-3 hover:border-[#F5ED31] dark:hover:border-[#DAFC08]/60 transition"
              >
                {/* Top header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                        {dev.brand} {dev.model}
                      </h3>
                      <span className="text-xs text-gray-500 font-semibold">({dev.storage})</span>
                    </div>
                    <p className="text-[11px] font-mono text-[#FF934F] dark:text-[#DAFC08] mt-0.5">
                      SKU: {dev.sku} • Color: {dev.color}
                    </p>
                  </div>

                  <StatusBadge type="resale" status={dev.status} />
                </div>

                {/* Specs and Condition Badges */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold text-[11px]">
                    {dev.conditionGrade}
                  </span>
                  {dev.batteryHealth && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                      <Battery className="w-3 h-3" />
                      <span>{dev.batteryHealth}% Battery</span>
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-gray-400">
                    IMEI: {maskIMEI(dev.imeiSerial)}
                  </span>
                </div>

                {/* Cost Breakdown Table */}
                <div className="p-3 glass-panel rounded-2xl space-y-1 text-xs">
                  <div className="flex justify-between text-gray-500">
                    <span>Acquisition Buy Cost:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatINR(dev.purchaseCost)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Refurb Parts + Labour:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatINR(dev.totalRefurbCost)} ({formatINR(dev.refurbPartsCost)} parts, {formatINR(dev.refurbLabourCost)} labour)
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-700 dark:text-gray-300 font-bold pt-1 border-t border-black/5 dark:border-white/5">
                    <span>Total Landed Investment:</span>
                    <span>{formatINR(totalLandedCost)}</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-gray-500">Asking Price:</span>
                    <span className="text-sm font-extrabold text-[#FF934F] dark:text-[#DAFC08]">
                      {formatINR(dev.askingPrice)}
                    </span>
                  </div>
                </div>

                {/* Status Specific Footer / Action */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  {dev.status === 'Sold' ? (
                    <div className="text-[11px] text-emerald-500 font-bold">
                      ✓ Sold on {formatDate(dev.soldDate)} to {dev.soldToCustomer} for {formatINR(dev.salePrice)}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-400">
                        Margin: <strong className="text-emerald-500">{formatINR(projectedMargin)} ({marginPct.toFixed(1)}%)</strong>
                      </span>
                    </div>
                  )}

                  {dev.status === 'Refurbishing' && (
                    <button
                      onClick={() => updateResaleStatus(dev.id, 'Ready for Sale')}
                      className="px-3 py-1 rounded-xl text-xs font-extrabold bg-emerald-500 text-white hover:bg-emerald-600 transition"
                    >
                      Mark Ready for Sale
                    </button>
                  )}

                  {dev.status === 'Inspecting' && (
                    <button
                      onClick={() => updateResaleStatus(dev.id, 'Refurbishing')}
                      className="px-3 py-1 rounded-xl text-xs font-bold bg-[#F5ED31] dark:bg-[#DAFC08] text-black transition"
                    >
                      Start Refurbishing
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {newResaleModalOpen && (
        <NewResaleModal
          isOpen={newResaleModalOpen}
          onClose={() => setNewResaleModalOpen(false)}
        />
      )}
    </div>
  );
};
