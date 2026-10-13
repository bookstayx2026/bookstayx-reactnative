import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { InventoryItem, QualityGrade, StockMovement } from '../types';
import { formatINR, formatDateTime } from '../utils/formatters';
import { Boxes, Plus, Search, History } from 'lucide-react';
import { Modal } from '../components/common/Modal';

export const InventoryView: React.FC = () => {
  const { inventory, stockMovements, addInventoryItem, adjustStock, suppliers } = useCRM();

  const [activeTab, setActiveTab] = useState<'inventory' | 'movements'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('ALL');

  // Modals
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState<InventoryItem | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<'Adjustment / Audit' | 'Damaged / Return'>('Adjustment / Audit');
  const [adjustNotes, setAdjustNotes] = useState('');

  // Add Item form state
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<InventoryItem['category']>('Screens & LCD');
  const [newType, setNewType] = useState<'Repair Part' | 'Counter Accessory'>('Repair Part');
  const [newCompat, setNewCompat] = useState('iPhone 14');
  const [newGrade, setNewGrade] = useState<QualityGrade>('OEM Original');
  const [newSupplierId, setNewSupplierId] = useState(suppliers[0]?.id || 'SUP-01');
  const [newPurchaseCost, setNewPurchaseCost] = useState(1500);
  const [newSellingPrice, setNewSellingPrice] = useState(2500);
  const [newOnHand, setNewOnHand] = useState(5);
  const [newReorderLevel, setNewReorderLevel] = useState(2);
  const [newLocation, setNewLocation] = useState('Shelf A-01');
  const [newWarrantyDays, setNewWarrantyDays] = useState(180);

  // Filter inventory
  const filteredInventory = inventory.filter((item: InventoryItem) => {
    const q = searchQuery.toLowerCase().trim();
    if (
      q &&
      !item.sku.toLowerCase().includes(q) &&
      !item.name.toLowerCase().includes(q) &&
      !item.category.toLowerCase().includes(q) &&
      !item.compatibleModels.some((m: string) => m.toLowerCase().includes(q))
    ) {
      return false;
    }
    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
    if (typeFilter !== 'ALL' && item.type !== typeFilter) return false;
    if (stockStatusFilter === 'LOW' && item.availableQty > item.reorderLevel) return false;
    if (stockStatusFilter === 'OUT' && item.availableQty > 0) return false;
    return true;
  });

  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku || !newName) return;
    const sup = suppliers.find(s => s.id === newSupplierId);

    addInventoryItem({
      sku: newSku,
      name: newName,
      category: newCategory,
      type: newType,
      compatibleModels: newCompat.split(',').map(s => s.trim()),
      qualityGrade: newGrade,
      supplierId: newSupplierId,
      supplierName: sup?.name || 'Local Vendor',
      purchaseCost: Number(newPurchaseCost),
      sellingPrice: Number(newSellingPrice),
      onHandQty: Number(newOnHand),
      reservedQty: 0,
      reorderLevel: Number(newReorderLevel),
      location: newLocation,
      warrantyDays: Number(newWarrantyDays),
      damagedQty: 0,
      lastRestockedDate: new Date().toISOString().slice(0, 10),
    });

    setAddItemModalOpen(false);
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForAdjust) return;
    adjustStock(selectedItemForAdjust.id, Number(adjustDelta), adjustReason, adjustNotes || 'Physical stock audit');
    setAdjustModalOpen(false);
  };

  const lowStockCount = inventory.filter((i: InventoryItem) => i.availableQty <= i.reorderLevel).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Inventory &amp; Spare Parts Stock
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Real-time tracking of repair parts, counter accessories, reserved job stock, and reorders
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Switch */}
          <div className="flex bg-gray-200 dark:bg-[#202020] p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                activeTab === 'inventory'
                  ? 'bg-white dark:bg-[#121212] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              <Boxes className="w-4 h-4 inline mr-1" />
              Stock List
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                activeTab === 'movements'
                  ? 'bg-white dark:bg-[#121212] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              <History className="w-4 h-4 inline mr-1" />
              Audit Ledger
            </button>
          </div>

          <button
            onClick={() => setAddItemModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-[#F5ED31] hover:bg-[#E5DC24] dark:bg-[#DAFC08] dark:hover:bg-[#C4E407] text-black shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Add SKU</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl glass-panel flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search SKU, name, category, phone model..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="Screens & LCD">Screens &amp; LCD</option>
            <option value="Batteries">Batteries</option>
            <option value="Charging Ports">Charging Ports</option>
            <option value="Cameras">Cameras</option>
            <option value="Back Glass">Back Glass</option>
            <option value="Flex Cables & ICs">Flex Cables &amp; ICs</option>
            <option value="Accessories & Cases">Accessories &amp; Cases</option>
            <option value="Chargers & Cables">Chargers &amp; Cables</option>
            <option value="Audio & Wearables">Audio &amp; Wearables</option>
          </select>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white focus:outline-none font-semibold"
          >
            <option value="ALL">All Item Types</option>
            <option value="Repair Part">🔧 Repair Parts Only</option>
            <option value="Counter Accessory">🛍️ Counter Accessories</option>
          </select>

          <select
            value={stockStatusFilter}
            onChange={e => setStockStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white focus:outline-none font-semibold"
          >
            <option value="ALL">All Stock Levels</option>
            <option value="LOW">⚠️ Low Stock Alerts ({lowStockCount})</option>
            <option value="OUT">🚨 Out of Stock (0 Avail)</option>
          </select>
        </div>
      </div>

      {/* Tab 1: Inventory Table */}
      {activeTab === 'inventory' && (
        <div className="p-4 rounded-3xl glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-black/5 dark:border-white/5 text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">SKU &amp; Item Name</th>
                  <th className="py-3 px-3">Category &amp; Type</th>
                  <th className="py-3 px-3">Grade &amp; Models</th>
                  <th className="py-3 px-3">Cost / Sell Price</th>
                  <th className="py-3 px-3 text-center">On Hand</th>
                  <th className="py-3 px-3 text-center">Reserved</th>
                  <th className="py-3 px-3 text-center">Available</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-400">
                      No inventory items found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item: InventoryItem) => {
                    const isLow = item.availableQty <= item.reorderLevel;
                    const isOut = item.availableQty <= 0;

                    return (
                      <tr key={item.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition">
                        <td className="py-3 px-3">
                          <p className="font-mono font-bold text-[#FF934F] dark:text-[#DAFC08]">
                            {item.sku}
                          </p>
                          <p className="font-extrabold text-gray-900 dark:text-white max-w-xs">{item.name}</p>
                          <span className="text-[10px] text-gray-400">Supplier: {item.supplierName}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold block text-gray-800 dark:text-gray-200">{item.category}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              item.type === 'Repair Part'
                                ? 'bg-[#547BDE]/15 text-[#547BDE] dark:text-[#8AA8F8]'
                                : 'bg-emerald-500/15 text-emerald-500'
                            }`}
                          >
                            {item.type}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-[11px] text-gray-700 dark:text-gray-300 block">
                            {item.qualityGrade}
                          </span>
                          <p className="text-[10px] text-gray-400 truncate max-w-[140px]">
                            {item.compatibleModels.join(', ')}
                          </p>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[11px] text-gray-400 block">Buy: {formatINR(item.purchaseCost)}</span>
                          <span className="font-extrabold text-gray-900 dark:text-white">
                            Sell: {formatINR(item.sellingPrice)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold">{item.onHandQty}</td>
                        <td className="py-3 px-3 text-center text-[#FF934F] dark:text-amber-400 font-bold">{item.reservedQty}</td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full font-extrabold text-xs ${
                              isOut
                                ? 'bg-rose-500/20 text-rose-500 animate-pulse'
                                : isLow
                                ? 'bg-amber-500/20 text-amber-500'
                                : 'bg-[#DAFC08]/20 text-[#889d03] dark:text-[#DAFC08]'
                            }`}
                          >
                            {item.availableQty}
                          </span>
                          {isLow && (
                            <span className="text-[9px] text-rose-500 block font-bold mt-0.5">
                              Reorder &le;{item.reorderLevel}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-gray-500">{item.location}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedItemForAdjust(item);
                              setAdjustDelta(1);
                              setAdjustModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-xl glass-card hover:border-[#F5ED31] dark:hover:border-[#DAFC08] text-gray-700 dark:text-gray-300 font-bold text-xs transition"
                          >
                            Adjust Stock
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
      )}

      {/* Tab 2: Stock Movements Audit Log */}
      {activeTab === 'movements' && (
        <div className="p-4 rounded-3xl glass-panel space-y-3">
          <h3 className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
            Stock Movements &amp; Consumption Audit Trail
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-black/5 dark:border-white/5 text-gray-500 dark:text-gray-400 uppercase text-[10px]">
                  <th className="py-2.5 px-3">Date &amp; Time</th>
                  <th className="py-2.5 px-3">Movement Type</th>
                  <th className="py-2.5 px-3">SKU &amp; Item</th>
                  <th className="py-2.5 px-3 text-center">Change Qty</th>
                  <th className="py-2.5 px-3">Ref Number</th>
                  <th className="py-2.5 px-3">Performed By</th>
                  <th className="py-2.5 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {stockMovements.map((mov: StockMovement) => (
                  <tr key={mov.id} className="hover:bg-white/40 dark:hover:bg-white/5">
                    <td className="py-2.5 px-3 text-gray-500">{formatDateTime(mov.date)}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          mov.type === 'Purchase Inward'
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : mov.type === 'Job Consumption'
                            ? 'bg-[#547BDE]/15 text-[#547BDE]'
                            : mov.type === 'Counter Sale'
                            ? 'bg-[#FF934F]/15 text-[#FF934F]'
                            : 'bg-[#DAFC08]/20 text-[#889d03] dark:text-[#DAFC08]'
                        }`}
                      >
                        {mov.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-bold text-[#FF934F] dark:text-[#DAFC08] mr-2">
                        {mov.itemSku}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">{mov.itemName}</span>
                    </td>
                    <td
                      className={`py-2.5 px-3 text-center font-extrabold ${
                        mov.quantity > 0 ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] font-bold text-gray-700 dark:text-gray-300">
                      {mov.referenceNumber}
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">{mov.performedBy}</td>
                    <td className="py-2.5 px-3 text-gray-500 max-w-xs truncate">{mov.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add SKU Modal */}
      {addItemModalOpen && (
        <Modal
          isOpen={addItemModalOpen}
          onClose={() => setAddItemModalOpen(false)}
          title="Add New Inventory Item / SKU"
          subtitle="Define repair part or counter accessory with specifications"
          maxWidth="2xl"
        >
          <form onSubmit={handleAddItemSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  SKU Code *
                </label>
                <input
                  type="text"
                  required
                  value={newSku}
                  onChange={e => setNewSku(e.target.value.toUpperCase())}
                  placeholder="e.g. SCR-IP14-OEM"
                  className="w-full px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white font-mono uppercase"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. iPhone 14 OLED Screen Assembly"
                  className="w-full px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white"
                >
                  <option value="Screens & LCD">Screens &amp; LCD</option>
                  <option value="Batteries">Batteries</option>
                  <option value="Charging Ports">Charging Ports</option>
                  <option value="Cameras">Cameras</option>
                  <option value="Back Glass">Back Glass</option>
                  <option value="Flex Cables & ICs">Flex Cables &amp; ICs</option>
                  <option value="Accessories & Cases">Accessories &amp; Cases</option>
                  <option value="Chargers & Cables">Chargers &amp; Cables</option>
                  <option value="Audio & Wearables">Audio &amp; Wearables</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Item Type
                </label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white font-bold"
                >
                  <option value="Repair Part">Repair Part (Internal Work)</option>
                  <option value="Counter Accessory">Counter Accessory (Sale)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Quality Grade
                </label>
                <select
                  value={newGrade}
                  onChange={e => setNewGrade(e.target.value as QualityGrade)}
                  className="w-full px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white"
                >
                  <option value="OEM Original">OEM Original</option>
                  <option value="Original Refurbished">Original Refurbished</option>
                  <option value="High Quality Aftermarket">High Quality Aftermarket</option>
                  <option value="Standard Compatible">Standard Compatible</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Compatible Phone Models (Comma separated)
                </label>
                <input
                  type="text"
                  value={newCompat}
                  onChange={e => setNewCompat(e.target.value)}
                  placeholder="iPhone 14, iPhone 14 Plus"
                  className="w-full px-3 py-2 rounded-xl glass-input text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Supplier / Vendor
                </label>
                <select
                  value={newSupplierId}
                  onChange={e => setNewSupplierId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-gray-900 dark:text-white"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Purchase Cost (₹)
                </label>
                <input
                  type="number"
                  value={newPurchaseCost}
                  onChange={e => setNewPurchaseCost(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl glass-input text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Selling Price (₹)
                </label>
                <input
                  type="number"
                  value={newSellingPrice}
                  onChange={e => setNewSellingPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl glass-input text-gray-900 dark:text-white font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Initial On-Hand
                </label>
                <input
                  type="number"
                  value={newOnHand}
                  onChange={e => setNewOnHand(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl glass-input text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Reorder Level
                </label>
                <input
                  type="number"
                  value={newReorderLevel}
                  onChange={e => setNewReorderLevel(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl glass-input text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Shelf / Bin Location
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                  placeholder="e.g. Shelf A-01"
                  className="w-full px-3 py-2 rounded-xl glass-input text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Warranty Coverage (Days)
                </label>
                <input
                  type="number"
                  value={newWarrantyDays}
                  onChange={e => setNewWarrantyDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl glass-input text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={() => setAddItemModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-extrabold bg-[#F5ED31] hover:bg-[#E5DC24] dark:bg-[#DAFC08] dark:hover:bg-[#C4E407] text-black shadow-sm transition active:scale-95"
              >
                Add to Inventory
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Adjust Stock Modal */}
      {adjustModalOpen && selectedItemForAdjust && (
        <Modal
          isOpen={adjustModalOpen}
          onClose={() => setAdjustModalOpen(false)}
          title={`Adjust Stock — ${selectedItemForAdjust.sku}`}
          subtitle={`Current On-Hand: ${selectedItemForAdjust.onHandQty} (Available: ${selectedItemForAdjust.availableQty})`}
          maxWidth="md"
        >
          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Adjustment Quantity (Use + to add or - to deduct)
              </label>
              <input
                type="number"
                required
                value={adjustDelta}
                onChange={e => setAdjustDelta(Number(e.target.value))}
                placeholder="+2 or -1"
                className="w-full px-3 py-2 rounded-xl text-sm glass-input text-gray-900 dark:text-white font-bold text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Reason Category
              </label>
              <select
                value={adjustReason}
                onChange={e => setAdjustReason(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white"
              >
                <option value="Adjustment / Audit">Physical Count Audit Adjustment</option>
                <option value="Damaged / Return">Damaged in Bench / Vendor Return</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Audit Notes / Justification
              </label>
              <input
                type="text"
                required
                value={adjustNotes}
                onChange={e => setAdjustNotes(e.target.value)}
                placeholder="e.g. Physical inventory count verified by Tejas"
                className="w-full px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={() => setAdjustModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-extrabold bg-[#F5ED31] hover:bg-[#E5DC24] dark:bg-[#DAFC08] dark:hover:bg-[#C4E407] text-black shadow-sm transition active:scale-95"
              >
                Confirm Stock Adjustment
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
