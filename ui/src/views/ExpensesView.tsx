import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { Expense } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import {
  Plus,
  Search,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { NewExpenseModal } from '../components/modals/NewExpenseModal';

export const ExpensesView: React.FC = () => {
  const { expenses, deleteExpense } = useCRM();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [newExpenseModalOpen, setNewExpenseModalOpen] = useState(false);

  const filteredExpenses = expenses.filter((exp: Expense) => {
    const q = searchQuery.toLowerCase().trim();
    if (
      q &&
      !exp.expenseNumber.toLowerCase().includes(q) &&
      !exp.description.toLowerCase().includes(q) &&
      !exp.payee.toLowerCase().includes(q) &&
      !exp.category.toLowerCase().includes(q)
    ) {
      return false;
    }
    if (categoryFilter !== 'ALL' && exp.category !== categoryFilter) return false;
    return true;
  });

  const totalPaidExpenses = expenses
    .filter((e: Expense) => e.paymentStatus === 'Paid')
    .reduce((sum: number, e: Expense) => sum + e.amount, 0);

  // Category aggregations
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e: Expense) => {
    if (e.paymentStatus === 'Paid') {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    }
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Shop Operating Expenses
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Track overhead costs, premise rent, salaries, utilities, and workshop maintenance
          </p>
        </div>

        <button
          onClick={() => setNewExpenseModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-[#F5ED31] hover:bg-[#E5DC24] dark:bg-[#DAFC08] dark:hover:bg-[#C4E407] text-black shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Record Expense</span>
        </button>
      </div>

      {/* Accounting Rule Notice */}
      <div className="p-4 rounded-3xl bg-[#547BDE]/10 border border-[#547BDE]/30 flex items-start gap-3 text-xs text-blue-900 dark:text-blue-200 backdrop-blur-md">
        <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#547BDE] mt-0.5" />
        <div>
          <p className="font-extrabold text-sm mb-0.5 text-gray-900 dark:text-white">Inventory Double-Counting Protection Rule</p>
          <p className="leading-relaxed text-[11px] text-gray-700 dark:text-gray-300">
            Receiving purchased stock increases the Inventory Asset account and creates supplier payables. Its cost is recognized in <strong>Cost of Goods Sold (COGS)</strong> only when a part is consumed on a completed repair or an accessory/resale phone is sold. Inventory purchases are intentionally <strong>excluded</strong> from operating expenses here to ensure accurate accounting profits.
          </p>
        </div>
      </div>

      {/* Expense KPI Summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl glass-card">
          <p className="text-xs font-bold uppercase text-gray-400">Total Operational Expenses</p>
          <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-1">
            {formatINR(totalPaidExpenses)}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">Paid operating overheads</p>
        </div>

        <div className="p-4 rounded-2xl glass-card">
          <p className="text-xs font-bold uppercase text-gray-400">Salaries &amp; Incentives</p>
          <p className="text-xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">
            {formatINR((categoryTotals['Staff Salaries'] || 0) + (categoryTotals['Technician Incentives'] || 0))}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">5 shop staff members</p>
        </div>

        <div className="p-4 rounded-2xl glass-card">
          <p className="text-xs font-bold uppercase text-gray-400">Shop Rent (Pimpri)</p>
          <p className="text-xl font-extrabold text-[#547BDE] dark:text-[#8AA8F8] mt-1">
            {formatINR(categoryTotals['Rent'] || 0)}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">Commercial premise lease</p>
        </div>

        <div className="p-4 rounded-2xl glass-card">
          <p className="text-xs font-bold uppercase text-gray-400">Utilities &amp; Maintenance</p>
          <p className="text-xl font-extrabold text-[#FF934F] dark:text-amber-400 mt-1">
            {formatINR((categoryTotals['Electricity'] || 0) + (categoryTotals['Machine Maintenance'] || 0) + (categoryTotals['Internet & Phone'] || 0))}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">Power, fiber, machine filters</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl glass-panel flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search description, payee, expense #..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white focus:outline-none"
        >
          <option value="ALL">All Categories ({expenses.length})</option>
          <option value="Staff Salaries">Staff Salaries</option>
          <option value="Technician Incentives">Technician Incentives</option>
          <option value="Rent">Rent</option>
          <option value="Electricity">Electricity</option>
          <option value="Internet & Phone">Internet &amp; Phone</option>
          <option value="Machine Maintenance">Machine Maintenance</option>
          <option value="Transport & Fuel">Transport &amp; Fuel</option>
          <option value="Packaging & Consumables">Packaging &amp; Consumables</option>
          <option value="Marketing & Signage">Marketing &amp; Signage</option>
          <option value="Software & Tools">Software &amp; Tools</option>
          <option value="Tea & Office Misc">Tea &amp; Office Misc</option>
        </select>
      </div>

      {/* Expenses Table */}
      <div className="p-4 rounded-3xl glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/5 text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Expense #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Description &amp; Purpose</th>
                <th className="py-3 px-3">Payee</th>
                <th className="py-3 px-3">Amount (INR)</th>
                <th className="py-3 px-3">Mode</th>
                <th className="py-3 px-3">Recurrence</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    No operating expenses recorded matching filters.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp: Expense) => (
                  <tr key={exp.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition">
                    <td className="py-3 px-3 font-mono font-bold text-gray-900 dark:text-white">
                      {exp.expenseNumber}
                    </td>
                    <td className="py-3 px-3 text-gray-500">{formatDate(exp.date)}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-gray-800 dark:text-gray-200 text-[11px]">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{exp.description}</p>
                      {exp.receiptNote && (
                        <span className="text-[10px] font-mono text-gray-400">Ref: {exp.receiptNote}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-gray-700 dark:text-gray-300">{exp.payee}</td>
                    <td className="py-3 px-3 font-extrabold text-sm text-gray-900 dark:text-white">
                      {formatINR(exp.amount)}
                    </td>
                    <td className="py-3 px-3 text-gray-500">{exp.paymentMethod}</td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] text-gray-400 font-semibold">{exp.recurrence}</span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => deleteExpense(exp.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {newExpenseModalOpen && (
        <NewExpenseModal
          isOpen={newExpenseModalOpen}
          onClose={() => setNewExpenseModalOpen(false)}
        />
      )}
    </div>
  );
};
