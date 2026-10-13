import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { Customer, WarrantyClaim } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import {
  Users,
  ShieldCheck,
  Search,
  Plus,
  ExternalLink,
  Star,
} from 'lucide-react';
import { Modal } from '../components/common/Modal';

export const CustomersView: React.FC = () => {
  const {
    customers,
    addCustomer,
    toggleCustomerReviewRequested,
    warrantyClaims,
    addWarrantyClaim,
    updateWarrantyClaimStatus,
    invoices,
    settings,
    showToast,
  } = useCRM();

  const [activeTab, setActiveTab] = useState<'customers' | 'warranty'>('customers');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [newCustomerModalOpen, setNewCustomerModalOpen] = useState(false);
  const [newClaimModalOpen, setNewClaimModalOpen] = useState(false);

  // New Customer State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('Pimpri, Pune');
  const [notes, setNotes] = useState('');

  // New Warranty Claim State
  const [claimCustomerName, setClaimCustomerName] = useState('');
  const [claimPhone, setClaimPhone] = useState('');
  const [claimInvoiceId, setClaimInvoiceId] = useState(invoices[0]?.id || '');
  const [claimDeviceModel, setClaimDeviceModel] = useState('');
  const [claimPartDescription, setClaimPartDescription] = useState('OEM Screen');
  const [claimIssue, setClaimIssue] = useState('');

  const filteredCustomers = customers.filter((c: Customer) => {
    const q = searchQuery.toLowerCase().trim();
    if (q && !c.name.toLowerCase().includes(q) && !c.phone.includes(q) && !c.email.toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });

  const handleCreateCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    addCustomer({
      name,
      phone,
      email,
      address,
      reviewRequested: false,
      notes,
    });
    setNewCustomerModalOpen(false);
  };

  const handleCreateClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimCustomerName || !claimIssue) return;

    addWarrantyClaim({
      originalInvoiceId: claimInvoiceId,
      originalInvoiceNumber: claimInvoiceId,
      customerName: claimCustomerName,
      customerPhone: claimPhone,
      deviceModel: claimDeviceModel || 'Smartphone',
      partDescription: claimPartDescription,
      issueReported: claimIssue,
      status: 'Pending Review',
      warrantyExpiryDate: new Date(Date.now() + 120 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    });

    setNewClaimModalOpen(false);
  };

  const handleCopyReviewLink = () => {
    navigator.clipboard.writeText(settings.googleReviewUrl);
    showToast('Link Copied', 'Google review link copied to clipboard', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Customers &amp; Warranty Care
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Customer directory, repair histories, warranty claims processing, and review invitations
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex bg-gray-200 dark:bg-[#202020] p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                activeTab === 'customers'
                  ? 'bg-white dark:bg-[#121212] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              <Users className="w-4 h-4 inline mr-1" />
              Directory ({customers.length})
            </button>
            <button
              onClick={() => setActiveTab('warranty')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                activeTab === 'warranty'
                  ? 'bg-white dark:bg-[#121212] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              <ShieldCheck className="w-4 h-4 inline mr-1" />
              Warranty Claims ({warrantyClaims.length})
            </button>
          </div>

          {activeTab === 'customers' ? (
            <button
              onClick={() => setNewCustomerModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-[#F5ED31] hover:bg-[#E5DC24] dark:bg-[#DAFC08] dark:hover:bg-[#C4E407] text-black shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Add Customer</span>
            </button>
          ) : (
            <button
              onClick={() => setNewClaimModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-rose-500 text-white hover:bg-rose-600 shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Log Warranty Claim</span>
            </button>
          )}
        </div>
      </div>

      {/* Google Review Invite Banner */}
      <div className="p-4 rounded-3xl glass-panel border border-[#F5ED31]/40 dark:border-[#DAFC08]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#F5ED31]/20 dark:bg-[#DAFC08]/20 text-amber-600 dark:text-[#DAFC08] flex items-center justify-center">
            <Star className="w-5 h-5 fill-[#F5ED31] dark:fill-[#DAFC08]" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
              Google Customer Review Policy &amp; QR
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Staff can manually request reviews post-completion. Automatic unsolicited messages are disabled.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyReviewLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold glass-card hover:border-[#F5ED31] dark:hover:border-[#DAFC08] text-gray-800 dark:text-gray-200 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Copy Google Review URL</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Customer Profiles Table */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl glass-panel">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search customer name, phone, email..."
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-4 rounded-3xl glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-black/5 dark:border-white/5 text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Customer Name</th>
                    <th className="py-3 px-3">Phone &amp; Email</th>
                    <th className="py-3 px-3">Address (Pimpri Hub)</th>
                    <th className="py-3 px-3 text-center">Total Visits</th>
                    <th className="py-3 px-3">Lifetime Spent</th>
                    <th className="py-3 px-3">Outstanding Due</th>
                    <th className="py-3 px-3">Google Review Status</th>
                    <th className="py-3 px-3">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {filteredCustomers.map((cust: Customer) => (
                    <tr key={cust.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition">
                      <td className="py-3 px-3 font-extrabold text-gray-900 dark:text-white">
                        {cust.name}
                        {cust.notes && (
                          <span className="text-[10px] text-gray-400 block font-normal">{cust.notes}</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-mono text-gray-800 dark:text-gray-200">{cust.phone}</p>
                        <p className="text-[11px] text-gray-400">{cust.email}</p>
                      </td>
                      <td className="py-3 px-3 text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {cust.address}
                      </td>
                      <td className="py-3 px-3 text-center font-bold">{cust.totalVisits}</td>
                      <td className="py-3 px-3 font-extrabold text-emerald-500">{formatINR(cust.totalSpent)}</td>
                      <td className="py-3 px-3 font-extrabold text-rose-500">{formatINR(cust.outstandingBalance)}</td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => toggleCustomerReviewRequested(cust.id)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${
                            cust.reviewRequested
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40'
                              : 'glass-card text-gray-500 hover:text-gray-900 dark:hover:text-white'
                          }`}
                        >
                          {cust.reviewRequested ? '★ Review Requested' : '+ Request Review'}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-gray-400 text-[11px]">{formatDate(cust.registeredDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Warranty Claims Processing */}
      {activeTab === 'warranty' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warrantyClaims.map((claim: WarrantyClaim) => (
              <div
                key={claim.id}
                className="p-5 rounded-3xl glass-card space-y-3 hover:border-rose-500/50 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-sm text-gray-900 dark:text-white">
                        {claim.claimNumber}
                      </span>
                      <span className="text-xs text-gray-500">Ref: {claim.originalInvoiceNumber}</span>
                    </div>
                    <p className="font-bold text-xs text-gray-900 dark:text-white mt-1">
                      {claim.customerName} ({claim.customerPhone})
                    </p>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      claim.status === 'Resolved'
                        ? 'bg-emerald-500/15 text-emerald-500'
                        : claim.status === 'Approved & Replacing'
                        ? 'bg-amber-500/15 text-amber-500'
                        : 'bg-rose-500/15 text-rose-500'
                    }`}
                  >
                    {claim.status}
                  </span>
                </div>

                <div className="p-3 glass-panel rounded-2xl text-xs space-y-1">
                  <p className="font-bold text-gray-800 dark:text-gray-200">
                    Device: {claim.deviceModel} • Replaced Part: {claim.partDescription}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 italic">
                    Reported Issue: "{claim.issueReported}"
                  </p>
                  {claim.actionTaken && (
                    <p className="text-emerald-600 dark:text-emerald-400 font-semibold pt-1 border-t border-black/5 dark:border-white/5">
                      Action: {claim.actionTaken}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5 text-xs">
                  <span className="text-gray-400 text-[11px]">
                    Claimed: {formatDate(claim.claimDate)} • Expiry: {formatDate(claim.warrantyExpiryDate)}
                  </span>

                  {claim.status !== 'Resolved' && (
                    <button
                      onClick={() =>
                        updateWarrantyClaimStatus(claim.id, 'Resolved', 'Replaced part under warranty & verified')
                      }
                      className="px-3 py-1 rounded-xl text-xs font-extrabold bg-emerald-500 text-white hover:bg-emerald-600 transition"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {newCustomerModalOpen && (
        <Modal
          isOpen={newCustomerModalOpen}
          onClose={() => setNewCustomerModalOpen(false)}
          title="Add New Customer Profile"
          subtitle="Register client contact information in Pimpri CRM"
          maxWidth="xl"
        >
          <form onSubmit={handleCreateCustomerSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Customer Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Anand K. Deshpande"
                className="w-full px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. +91 98220 99881"
                  className="w-full px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="customer@gmail.com"
                  className="w-full px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Shop Area / Location Address
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. Empire Estate, Chinchwad, Pimpri 411019"
                className="w-full px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={() => setNewCustomerModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-extrabold bg-[#F5ED31] hover:bg-[#E5DC24] dark:bg-[#DAFC08] dark:hover:bg-[#C4E407] text-black shadow-sm transition active:scale-95"
              >
                Save Customer
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Log Warranty Claim Modal */}
      {newClaimModalOpen && (
        <Modal
          isOpen={newClaimModalOpen}
          onClose={() => setNewClaimModalOpen(false)}
          title="Log Customer Warranty Claim"
          subtitle="Register part warranty return linked to previous repair invoice"
          maxWidth="xl"
        >
          <form onSubmit={handleCreateClaimSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={claimCustomerName}
                  onChange={e => setClaimCustomerName(e.target.value)}
                  placeholder="e.g. Kunal Sonawane"
                  className="w-full px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={claimPhone}
                  onChange={e => setClaimPhone(e.target.value)}
                  placeholder="+91 98221 66778"
                  className="w-full px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Original Invoice Reference
                </label>
                <select
                  value={claimInvoiceId}
                  onChange={e => setClaimInvoiceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white"
                >
                  {invoices.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} — {inv.customerName} ({formatINR(inv.grandTotal)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Replaced Part Description
                </label>
                <input
                  type="text"
                  value={claimPartDescription}
                  onChange={e => setClaimPartDescription(e.target.value)}
                  placeholder="e.g. iPhone 13 OLED Screen"
                  className="w-full px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Reported Failure / Issue Description *
              </label>
              <textarea
                required
                rows={2}
                value={claimIssue}
                onChange={e => setClaimIssue(e.target.value)}
                placeholder="e.g. Ghost touches on top corner when charging..."
                className="w-full px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={() => setNewClaimModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-extrabold bg-rose-500 text-white hover:bg-rose-600 shadow-sm transition active:scale-95"
              >
                Log Warranty Claim
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
