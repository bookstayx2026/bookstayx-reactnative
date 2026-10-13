import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { ServiceMode } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatDate, formatINR } from '../utils/formatters';
import {
  CalendarClock,
  Plus,
  Search,
  MapPin,
  Clock,
  CheckCircle2,
  Calendar,
  List,
} from 'lucide-react';
import { NewBookingModal } from '../components/modals/NewBookingModal';

export const BookingsView: React.FC = () => {
  const { bookings, convertBookingToJobCard } = useCRM();

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [serviceModeFilter, setServiceModeFilter] = useState<string>('ALL');
  const [newBookingModalOpen, setNewBookingModalOpen] = useState(false);

  // Filter bookings
  const filteredBookings = bookings.filter(b => {
    const q = searchQuery.toLowerCase().trim();
    if (
      q &&
      !b.bookingNumber.toLowerCase().includes(q) &&
      !b.customerName.toLowerCase().includes(q) &&
      !b.customerPhone.includes(q) &&
      !b.deviceBrand.toLowerCase().includes(q) &&
      !b.deviceModel.toLowerCase().includes(q)
    ) {
      return false;
    }
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    if (serviceModeFilter !== 'ALL' && b.serviceMode !== serviceModeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Customer Bookings &amp; Device Intake
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Manage counter walk-ins, phone appointments, doorstep visits, and pickup requests
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-200 dark:bg-[#202020] p-1 rounded-xl">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-[#121212] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              <List className="w-4 h-4 inline mr-1" />
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-[#121212] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-1" />
              Schedule
            </button>
          </div>

          <button
            onClick={() => setNewBookingModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-[#F5ED31] hover:bg-[#E5DC24] dark:bg-[#DAFC08] dark:hover:bg-[#C4E407] text-black shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ New Booking</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl glass-panel flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search booking #, customer, phone, device..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="In Progress">In Progress</option>
            <option value="Converted to Job">Converted to Job</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={serviceModeFilter}
            onChange={e => setServiceModeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white focus:outline-none"
          >
            <option value="ALL">All Service Modes</option>
            <option value="Shop Walk-in">Shop Walk-in</option>
            <option value="Pickup & Delivery">Pickup &amp; Delivery</option>
            <option value="Doorstep Service">Doorstep Service</option>
          </select>
        </div>
      </div>

      {/* Bookings View: List Mode */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {filteredBookings.length === 0 ? (
            <div className="py-16 text-center text-gray-400 glass-panel rounded-3xl">
              <CalendarClock className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">No bookings found matching filters</p>
            </div>
          ) : (
            filteredBookings.map(bkg => (
              <div
                key={bkg.id}
                className="p-4 rounded-2xl glass-card hover:border-[#F5ED31] dark:hover:border-[#DAFC08]/60 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/5 dark:border-white/5 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-sm text-gray-900 dark:text-white">
                      {bkg.bookingNumber}
                    </span>
                    <StatusBadge type="booking" status={bkg.status} />
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                      Channel: {bkg.source}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {bkg.status !== 'Converted to Job' && bkg.status !== 'Cancelled' && (
                      <button
                        onClick={() => convertBookingToJobCard(bkg.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-[#F5ED31] hover:bg-[#E5DC24] dark:bg-[#DAFC08] dark:hover:bg-[#C4E407] text-black shadow-sm transition active:scale-95"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Receive &amp; Create Job Card</span>
                      </button>
                    )}

                    {bkg.status === 'Converted to Job' && (
                      <span className="text-xs font-bold text-emerald-500 font-mono">
                        Job Card #{bkg.jobCardId || 'Generated'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Customer &amp; Phone</span>
                    <p className="font-bold text-gray-900 dark:text-white">{bkg.customerName}</p>
                    <p className="text-gray-600 dark:text-gray-400 font-mono">{bkg.customerPhone}</p>
                    {bkg.address && (
                      <p className="text-[11px] text-gray-500 mt-1 flex items-start gap-1">
                        <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        <span>{bkg.address}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Device &amp; Reported Issue</span>
                    <p className="font-extrabold text-gray-900 dark:text-white">
                      {bkg.deviceBrand} {bkg.deviceModel}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 italic mt-0.5">"{bkg.faultDescription}"</p>
                  </div>

                  <div>
                    <span className="text-gray-400 text-[10px] uppercase font-bold block">
                      Preferred Schedule &amp; Staff
                    </span>
                    <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#FF934F] dark:text-[#547BDE]" />
                      <span>
                        {formatDate(bkg.preferredDate)} ({bkg.preferredTimeSlot})
                      </span>
                    </p>
                    <p className="text-gray-500 text-[11px] mt-0.5">
                      Mode: <span className="font-bold text-gray-700 dark:text-gray-300">{bkg.serviceMode}</span>
                      {bkg.travelCharge > 0 && <span> (Fee: {formatINR(bkg.travelCharge)})</span>}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Assigned: <span className="font-semibold">{bkg.assignedStaffName || 'Reception'}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Bookings View: Schedule / Calendar Slots */}
      {viewMode === 'calendar' && (
        <div className="p-5 rounded-3xl glass-panel space-y-4">
          <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
            Today's Intake &amp; Visit Schedule
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['10:00 AM - 01:00 PM (Morning Slot)', '02:00 PM - 05:30 PM (Afternoon Slot)', '06:00 PM - 09:00 PM (Evening Slot)'].map(slot => (
              <div key={slot} className="p-4 rounded-2xl glass-card space-y-3">
                <span className="text-xs font-extrabold text-[#FF934F] dark:text-[#DAFC08] uppercase block">
                  {slot}
                </span>
                <div className="space-y-2">
                  {filteredBookings.map(b => (
                    <div
                      key={b.id}
                      className="p-3 rounded-xl glass-panel text-xs space-y-1 shadow-sm"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold">{b.bookingNumber}</span>
                        <StatusBadge type="booking" status={b.status} />
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {b.customerName} — {b.deviceBrand} {b.deviceModel}
                      </p>
                      <p className="text-gray-500 text-[11px]">{b.serviceMode} • Staff: {b.assignedStaffName}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {newBookingModalOpen && (
        <NewBookingModal
          isOpen={newBookingModalOpen}
          onClose={() => setNewBookingModalOpen(false)}
        />
      )}
    </div>
  );
};
