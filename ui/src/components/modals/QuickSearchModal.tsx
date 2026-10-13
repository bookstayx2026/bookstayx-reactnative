import React, { useState, useEffect } from 'react';
import { Search, Wrench, CalendarClock, Boxes, Smartphone, Users, ArrowRight, X } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { maskIMEI, formatINR } from '../../utils/formatters';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectJob: (jobId: string) => void;
  onNavigate: (viewId: string) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectJob,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const { jobs, bookings, inventory, resaleDevices, customers, setSelectedJob } = useCRM();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const matchedJobs = q
    ? jobs.filter(
        j =>
          j.jobCardNumber.toLowerCase().includes(q) ||
          j.customerName.toLowerCase().includes(q) ||
          j.customerPhone.includes(q) ||
          j.deviceBrand.toLowerCase().includes(q) ||
          j.deviceModel.toLowerCase().includes(q) ||
          j.imeiSerial?.toLowerCase().includes(q) ||
          j.status.toLowerCase().includes(q)
      )
    : [];

  const matchedBookings = q
    ? bookings.filter(
        b =>
          b.bookingNumber.toLowerCase().includes(q) ||
          b.customerName.toLowerCase().includes(q) ||
          b.customerPhone.includes(q) ||
          b.deviceBrand.toLowerCase().includes(q) ||
          b.deviceModel.toLowerCase().includes(q)
      )
    : [];

  const matchedInventory = q
    ? inventory.filter(
        i =>
          i.sku.toLowerCase().includes(q) ||
          i.name.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.compatibleModels.some(m => m.toLowerCase().includes(q))
      )
    : [];

  const matchedResale = q
    ? resaleDevices.filter(
        r =>
          r.sku.toLowerCase().includes(q) ||
          r.brand.toLowerCase().includes(q) ||
          r.model.toLowerCase().includes(q) ||
          r.imeiSerial.includes(q)
      )
    : [];

  const matchedCustomers = q
    ? customers.filter(
        c => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q)
      )
    : [];

  const totalMatches =
    matchedJobs.length +
    matchedBookings.length +
    matchedInventory.length +
    matchedResale.length +
    matchedCustomers.length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center pt-16 sm:pt-24 p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
      ></div>

      {/* Search Palette */}
      <div className="relative w-full max-w-2xl glass-modal rounded-3xl shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden z-10 flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150">
        {/* Search Input bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-black/5 dark:border-white/5">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type to search job cards, bookings, customers, SKUs, IMEIs..."
            autoFocus
            className="flex-1 bg-transparent text-sm md:text-base text-gray-900 dark:text-white focus:outline-none placeholder:text-gray-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs font-mono glass-panel border border-black/5 dark:border-white/10 rounded text-gray-500">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {!q ? (
            <div className="py-12 text-center text-gray-400">
              <Search className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">Search across all One Repair operations</p>
              <p className="text-xs text-gray-500 mt-1">
                Try searching "iPhone 14", "Rahul", "OLED", "BKG-2026-001", or "Anker"
              </p>
            </div>
          ) : totalMatches === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <p className="text-sm font-semibold">No results found for "{query}"</p>
              <p className="text-xs text-gray-500 mt-1">Check spelling or search by phone number / SKU</p>
            </div>
          ) : (
            <>
              {/* Jobs section */}
              {matchedJobs.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <Wrench className="w-3.5 h-3.5 text-[#547BDE]" />
                    <span>Repair Jobs ({matchedJobs.length})</span>
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchedJobs.map(job => (
                      <button
                        key={job.id}
                        onClick={() => {
                          setSelectedJob(job);
                          onNavigate('repairs');
                          onClose();
                        }}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between transition group"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-gray-900 dark:text-white">
                              {job.jobCardNumber}
                            </span>
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                              {job.deviceBrand} {job.deviceModel}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-500 font-bold">
                              {job.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Customer: {job.customerName} ({job.customerPhone}) • Tech: {job.technicianName}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-amber-500 dark:group-hover:text-[#DAFC08] transition" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bookings section */}
              {matchedBookings.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <CalendarClock className="w-3.5 h-3.5 text-amber-500 dark:text-[#DAFC08]" />
                    <span>Bookings ({matchedBookings.length})</span>
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchedBookings.map(bkg => (
                      <button
                        key={bkg.id}
                        onClick={() => {
                          onNavigate('bookings');
                          onClose();
                        }}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between transition group"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-gray-900 dark:text-white">
                              {bkg.bookingNumber}
                            </span>
                            <span className="text-xs text-gray-600 dark:text-gray-300">
                              {bkg.customerName} — {bkg.deviceBrand} {bkg.deviceModel}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {bkg.serviceMode} • {bkg.status} • Preferred: {bkg.preferredDate} ({bkg.preferredTimeSlot})
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-amber-500 dark:group-hover:text-[#DAFC08] transition" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Inventory section */}
              {matchedInventory.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <Boxes className="w-3.5 h-3.5 text-emerald-500 dark:text-[#DAFC08]" />
                    <span>Inventory ({matchedInventory.length})</span>
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchedInventory.map(item => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate('inventory');
                          onClose();
                        }}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between transition group"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-amber-600 dark:text-[#DAFC08]">
                              {item.sku}
                            </span>
                            <span className="text-xs font-semibold text-gray-900 dark:text-white">
                              {item.name}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Stock: {item.onHandQty} (Avail: {item.availableQty}) • Price: {formatINR(item.sellingPrice)} • Loc: {item.location}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-amber-500 dark:group-hover:text-[#DAFC08] transition" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Resale section */}
              {matchedResale.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <Smartphone className="w-3.5 h-3.5 text-purple-500 dark:text-[#547BDE]" />
                    <span>Resale Devices ({matchedResale.length})</span>
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchedResale.map(r => (
                      <button
                        key={r.id}
                        onClick={() => {
                          onNavigate('resale');
                          onClose();
                        }}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between transition group"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-gray-900 dark:text-white">
                              {r.brand} {r.model} ({r.storage})
                            </span>
                            <span className="text-xs text-purple-500 dark:text-[#547BDE] font-semibold">
                              {r.conditionGrade}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              IMEI: {maskIMEI(r.imeiSerial)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Status: {r.status} • Asking: {formatINR(r.askingPrice)}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-amber-500 dark:group-hover:text-[#DAFC08] transition" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Customers section */}
              {matchedCustomers.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <Users className="w-3.5 h-3.5 text-pink-500 dark:text-[#FF934F]" />
                    <span>Customers ({matchedCustomers.length})</span>
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchedCustomers.map(cust => (
                      <button
                        key={cust.id}
                        onClick={() => {
                          onNavigate('customers');
                          onClose();
                        }}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between transition group"
                      >
                        <div>
                          <span className="font-bold text-xs text-gray-900 dark:text-white">
                            {cust.name}
                          </span>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {cust.phone} • {cust.email} • Total Visits: {cust.totalVisits}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-amber-500 dark:group-hover:text-[#DAFC08] transition" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
