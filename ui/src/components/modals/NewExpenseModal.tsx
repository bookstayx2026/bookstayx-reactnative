import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useCRM } from '../../context/CRMContext';
import { ExpenseCategory, PaymentMethod, RecurrenceType } from '../../types';
import { AlertCircle } from 'lucide-react';

interface NewExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewExpenseModal: React.FC<NewExpenseModalProps> = ({ isOpen, onClose }) => {
  const { addExpense, currentStaff } = useCRM();

  const [category, setCategory] = useState<ExpenseCategory>('Rent');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending'>('Paid');
  const [payee, setPayee] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('Monthly');
  const [receiptNote, setReceiptNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const categories: ExpenseCategory[] = [
    'Staff Salaries',
    'Technician Incentives',
    'Rent',
    'Electricity',
    'Internet & Phone',
    'Machine Maintenance',
    'Transport & Fuel',
    'Packaging & Consumables',
    'Marketing & Signage',
    'Software & Tools',
    'Tea & Office Misc',
    'Custom',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !payee) return;

    addExpense({
      date,
      category,
      description,
      amount: Number(amount),
      paymentMethod,
      paymentStatus,
      payee,
      recurrence,
      receiptNote: receiptNote || undefined,
      enteredBy: currentStaff.name,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Operating Shop Expense"
      subtitle="Shop maintenance, utilities, salaries, and operational costs"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Accounting Rule Notice */}
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />
          <p className="leading-tight">
            <strong>Accounting Policy:</strong> Stock purchases increase Inventory Assets and create Supplier Payables. They are counted as COGS upon repair consumption or sale. Operating expenses entered here cover shop overheads (rent, salaries, electricity, etc.) without double-counting inventory.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Expense Category *
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as ExpenseCategory)}
              className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Amount (₹ INR) *
            </label>
            <input
              type="number"
              required
              min={1}
              value={amount}
              onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. 35000"
              className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white font-bold"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Description &amp; Purpose *
          </label>
          <input
            type="text"
            required
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Monthly rent for Pimpri shop premise (September)"
            className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Payee / Vendor *
            </label>
            <input
              type="text"
              required
              value={payee}
              onChange={e => setPayee(e.target.value)}
              placeholder="e.g. Premise Owner / MSEDCL"
              className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
              className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
            >
              <option value="UPI">UPI (GPay/PhonePe)</option>
              <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Recurrence
            </label>
            <select
              value={recurrence}
              onChange={e => setRecurrence(e.target.value as RecurrenceType)}
              className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
            >
              <option value="None (One-time)">None (One-time)</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Expense Date
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Receipt Reference / Txn Note
            </label>
            <input
              type="text"
              value={receiptNote}
              onChange={e => setReceiptNote(e.target.value)}
              placeholder="e.g. UTR #901824901 / Bill No"
              className="glass-input w-full px-3 py-2 rounded-xl text-xs text-gray-900 dark:text-white font-mono"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/5 dark:border-white/5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl text-xs font-extrabold bg-[#F5ED31] hover:bg-[#E5DC24] dark:bg-[#DAFC08] dark:hover:bg-[#C4E407] text-black shadow-sm transition active:scale-95"
          >
            Record Expense
          </button>
        </div>
      </form>
    </Modal>
  );
};
