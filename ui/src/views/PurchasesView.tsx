import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { PurchaseOrder, Supplier } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import {
  Truck,
  Plus,
  Search,
  PackageCheck,
  Building2,
  DollarSign,
  Globe,
} from 'lucide-react';
import { NewPurchaseOrderModal } from '../components/modals/NewPurchaseOrderModal';
import { ReceiveStockModal } from '../components/modals/ReceiveStockModal';
import { Modal } from '../components/common/Modal';

export const PurchasesView: React.FC = () => {
  const { purchaseOrders, suppliers, addSupplier } = useCRM();

  const [activeTab, setActiveTab] = useState<'orders' | 'suppliers'>('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [newPOModalOpen, setNewPOModalOpen] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [selectedPOForReceive, setSelectedPOForReceive] = useState<PurchaseOrder | null>(null);
  const [newSupplierModalOpen, setNewSupplierModalOpen] = useState(false);

  // New Supplier Form
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supCity, setSupCity] = useState('Mumbai');
  const [supCountry, setSupCountry] = useState('India');
  const [supIsForeign, setSupIsForeign] = useState(false);
  const [supLeadTime, setSupLeadTime] = useState(2);

  const filteredPOs = purchaseOrders.filter((po: PurchaseOrder) => {
    const q = searchQuery.toLowerCase().trim();
    if (
      q &&
      !po.poNumber.toLowerCase().includes(q) &&
      !po.supplierName.toLowerCase().includes(q) &&
      !po.items.some(i => i.itemName.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q))
    ) {
      return false;
    }
    if (statusFilter !== 'ALL' && po.status !== statusFilter) return false;
    return true;
  });

  const handleAddSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName || !supPhone) return;

    addSupplier({
      name: supName,
      contactPerson: supContact,
      phone: supPhone,
      email: supEmail,
      address: supAddress,
      city: supCity,
      country: supCountry,
      isForeign: supIsForeign,
      outstandingBalance: 0,
      leadTimeDays: Number(supLeadTime),
    });

    setNewSupplierModalOpen(false);
  };

  const totalOutstandingSupplierPayables = purchaseOrders.reduce((sum: number, po: PurchaseOrder) => sum + po.balanceDue, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Purchases &amp; Spares Imports
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Manage purchase orders, overseas freight landed costs, stock inwarding, and supplier payables
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex bg-gray-200 dark:bg-[#202020] p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                activeTab === 'orders'
                  ? 'bg-white dark:bg-[#121212] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              <Truck className="w-4 h-4 inline mr-1" />
              Purchase Orders
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                activeTab === 'suppliers'
                  ? 'bg-white dark:bg-[#121212] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              <Building2 className="w-4 h-4 inline mr-1" />
              Suppliers Directory
            </button>
          </div>

          <button
            onClick={() => setNewPOModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-[#F5ED31] hover:bg-[#E5DC24] dark:bg-[#DAFC08] dark:hover:bg-[#C4E407] text-black shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Create PO</span>
          </button>
        </div>
      </div>

      {/* Outstanding Payables Banner */}
      <div className="p-4 rounded-2xl glass-panel flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#547BDE]/15 flex items-center justify-center text-[#547BDE] font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-gray-400">Total Outstanding Supplier Payables</p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-white">
              {formatINR(totalOutstandingSupplierPayables)}
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-500 max-w-xs text-right hidden sm:block">
          PO stock inwards increase inventory assets and create supplier liabilities.
        </p>
      </div>

      {/* Tab 1: Purchase Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl glass-panel flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search PO #, supplier, SKU..."
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white focus:outline-none"
            >
              <option value="ALL">All PO Statuses</option>
              <option value="Sent">Sent (In Transit)</option>
              <option value="Partially Received">Partially Received</option>
              <option value="Received">Received (Inwarded)</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          {/* PO List */}
          <div className="space-y-3">
            {filteredPOs.map((po: PurchaseOrder) => {
              const isReceived = po.status === 'Received';
              return (
                <div
                  key={po.id}
                  className="p-5 rounded-3xl glass-card space-y-3 hover:border-[#F5ED31] dark:hover:border-[#DAFC08]/60 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/5 dark:border-white/5 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-extrabold text-sm text-gray-900 dark:text-white">
                        {po.poNumber}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          isReceived
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : 'bg-[#547BDE]/15 text-[#547BDE]'
                        }`}
                      >
                        {po.status}
                      </span>
                      {po.isForeign && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          <span>Import ({po.currency})</span>
                        </span>
                      )}
                    </div>

                    {!isReceived && (
                      <button
                        onClick={() => {
                          setSelectedPOForReceive(po);
                          setReceiveModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm transition active:scale-95"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span>Receive Stock Inward</span>
                      </button>
                    )}
                  </div>

                  {/* PO Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-gray-400 text-[10px] uppercase font-bold block">Supplier</span>
                      <p className="font-extrabold text-gray-900 dark:text-white">{po.supplierName}</p>
                      <p className="text-[11px] text-gray-500">Ordered: {formatDate(po.orderDate)}</p>
                    </div>

                    <div>
                      <span className="text-gray-400 text-[10px] uppercase font-bold block">Expected &amp; Ref</span>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        ETA: {formatDate(po.expectedDeliveryDate)}
                      </p>
                      <p className="text-[11px] font-mono text-gray-500">Ref: {po.shipmentReference || 'Direct'}</p>
                    </div>

                    <div>
                      <span className="text-gray-400 text-[10px] uppercase font-bold block">Landed Cost</span>
                      <p className="font-extrabold text-gray-900 dark:text-white">{formatINR(po.totalCost)}</p>
                      <p className="text-[10px] text-gray-500">
                        Items: {formatINR(po.subtotal)} + Freight: {formatINR(po.freightAndLandedCost)}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-400 text-[10px] uppercase font-bold block">Payable Balance</span>
                      <p className={`font-extrabold ${po.balanceDue > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {formatINR(po.balanceDue)} ({po.paymentStatus})
                      </p>
                      <p className="text-[10px] text-gray-400">Paid: {formatINR(po.amountPaid)}</p>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="p-3 glass-panel rounded-2xl text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Consignment Items:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {po.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                          <div>
                            <span className="font-mono font-bold text-[#FF934F] dark:text-[#DAFC08] mr-2">
                              {it.sku}
                            </span>
                            <span>{it.itemName}</span>
                          </div>
                          <span className="font-semibold">
                            {it.receivedQty}/{it.orderQty} Received
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Suppliers Directory */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setNewSupplierModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#F5ED31] hover:bg-[#E5DC24] dark:bg-[#DAFC08] dark:hover:bg-[#C4E407] text-black shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Add Supplier</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suppliers.map((s: Supplier) => (
              <div
                key={s.id}
                className="p-5 rounded-3xl glass-card space-y-3 hover:border-[#F5ED31] dark:hover:border-[#DAFC08]/60 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">{s.name}</h3>
                    <p className="text-xs text-gray-500">Contact: {s.contactPerson}</p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      s.isForeign
                        ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                        : 'bg-[#547BDE]/15 text-[#547BDE]'
                    }`}
                  >
                    {s.isForeign ? `Foreign (${s.country})` : `Domestic (${s.city})`}
                  </span>
                </div>

                <div className="text-xs space-y-1 text-gray-600 dark:text-gray-300">
                  <p>📞 Phone: {s.phone}</p>
                  <p>✉️ Email: {s.email}</p>
                  <p>📍 Address: {s.address}, {s.city}</p>
                </div>

                <div className="pt-2 border-t border-black/5 dark:border-white/5 flex justify-between text-xs">
                  <span className="text-gray-400">Average Lead Time: <strong>{s.leadTimeDays} Days</strong></span>
                  <span className="font-bold text-rose-500">Payable: {formatINR(s.outstandingBalance)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {newPOModalOpen && (
        <NewPurchaseOrderModal
          isOpen={newPOModalOpen}
          onClose={() => setNewPOModalOpen(false)}
        />
      )}

      {receiveModalOpen && selectedPOForReceive && (
        <ReceiveStockModal
          isOpen={receiveModalOpen}
          onClose={() => setReceiveModalOpen(false)}
          po={selectedPOForReceive}
        />
      )}

      {/* Add Supplier Modal */}
      {newSupplierModalOpen && (
        <Modal
          isOpen={newSupplierModalOpen}
          onClose={() => setNewSupplierModalOpen(false)}
          title="Add New Vendor / Supplier"
          subtitle="Register domestic parts distributor or foreign import exporter"
          maxWidth="2xl"
        >
          <form onSubmit={handleAddSupplierSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Supplier / Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={supName}
                  onChange={e => setSupName(e.target.value)}
                  placeholder="e.g. Mumbai Screen Spares Hub"
                  className="w-full px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={supContact}
                  onChange={e => setSupContact(e.target.value)}
                  placeholder="e.g. Suresh Mehta"
                  className="w-full px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={supPhone}
                  onChange={e => setSupPhone(e.target.value)}
                  placeholder="e.g. +91 98200 45678"
                  className="w-full px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={supEmail}
                  onChange={e => setSupEmail(e.target.value)}
                  placeholder="orders@supplier.in"
                  className="w-full px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  City &amp; Country
                </label>
                <input
                  type="text"
                  value={supCity}
                  onChange={e => setSupCity(e.target.value)}
                  placeholder="City"
                  className="w-full px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Lead Time (Days)
                </label>
                <input
                  type="number"
                  value={supLeadTime}
                  onChange={e => setSupLeadTime(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white text-center"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Supplier Origin
                </label>
                <select
                  value={supIsForeign ? 'foreign' : 'domestic'}
                  onChange={e => {
                    const isF = e.target.value === 'foreign';
                    setSupIsForeign(isF);
                    setSupCountry(isF ? 'China' : 'India');
                  }}
                  className="w-full px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white font-bold"
                >
                  <option value="domestic">Domestic (India)</option>
                  <option value="foreign">Foreign (Import / China)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={() => setNewSupplierModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-extrabold bg-[#F5ED31] hover:bg-[#E5DC24] dark:bg-[#DAFC08] dark:hover:bg-[#C4E407] text-black shadow-sm transition active:scale-95"
              >
                Save Supplier
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
