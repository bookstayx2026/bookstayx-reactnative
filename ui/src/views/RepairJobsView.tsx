import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { JobStatus } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatINR, formatDate, maskIMEI } from '../utils/formatters';
import {
  Plus,
  Search,
  Kanban,
  Table as TableIcon,
} from 'lucide-react';
import { NewJobCardModal } from '../components/modals/NewJobCardModal';

export const RepairJobsView: React.FC = () => {
  const { jobs, setSelectedJob, staff } = useCRM();

  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [technicianFilter, setTechnicianFilter] = useState<string>('ALL');
  const [newJobModalOpen, setNewJobModalOpen] = useState(false);

  // Filter jobs
  const filteredJobs = jobs.filter(j => {
    const q = searchQuery.toLowerCase().trim();
    if (
      q &&
      !j.jobCardNumber.toLowerCase().includes(q) &&
      !j.customerName.toLowerCase().includes(q) &&
      !j.customerPhone.includes(q) &&
      !j.deviceBrand.toLowerCase().includes(q) &&
      !j.deviceModel.toLowerCase().includes(q) &&
      !j.reportedFault.toLowerCase().includes(q)
    ) {
      return false;
    }
    if (statusFilter !== 'ALL' && j.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && j.priority !== priorityFilter) return false;
    if (technicianFilter !== 'ALL' && j.technicianId !== technicianFilter) return false;
    return true;
  });

  const kanbanColumns: JobStatus[] = [
    'Received',
    'Diagnosing',
    'Awaiting Customer Approval',
    'Waiting for Parts',
    'Queued',
    'Repairing',
    'Quality Check',
    'Ready for Pickup',
    'Completed',
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Repair Jobs &amp; Job Cards
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Workbench execution, machine allocations, customer approvals, and QA sign-offs
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Table vs Kanban Toggle */}
          <div className="flex bg-gray-200 dark:bg-[#202020] p-1 rounded-xl">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-[#121212] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              <TableIcon className="w-4 h-4 inline mr-1" />
              Table
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-[#121212] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              <Kanban className="w-4 h-4 inline mr-1" />
              Kanban
            </button>
          </div>

          <button
            onClick={() => setNewJobModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-[#F5ED31] hover:bg-[#E5DC24] dark:bg-[#DAFC08] dark:hover:bg-[#C4E407] text-black shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Create Job Card</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl glass-panel flex flex-col lg:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search job card #, customer, phone, model..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white focus:outline-none font-semibold"
          >
            <option value="ALL">All Statuses ({jobs.length})</option>
            <option value="Received">Received</option>
            <option value="Diagnosing">Diagnosing</option>
            <option value="Awaiting Customer Approval">Awaiting Approval</option>
            <option value="Waiting for Parts">Waiting for Parts</option>
            <option value="Queued">Queued</option>
            <option value="Repairing">Repairing</option>
            <option value="Quality Check">Quality Check</option>
            <option value="Ready for Pickup">Ready for Pickup</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Unrepairable">Unrepairable</option>
          </select>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="Urgent">🚨 Urgent</option>
            <option value="High">High</option>
            <option value="Normal">Normal</option>
          </select>

          <select
            value={technicianFilter}
            onChange={e => setTechnicianFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs glass-input text-gray-900 dark:text-white focus:outline-none"
          >
            <option value="ALL">All Technicians</option>
            {staff.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="p-4 rounded-3xl glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-black/5 dark:border-white/5 text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Job Card #</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Device &amp; IMEI</th>
                  <th className="py-3 px-3">Reported Fault</th>
                  <th className="py-3 px-3">Technician</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Estimate / Paid</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      No repair job cards match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map(job => (
                    <tr
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className="hover:bg-white/40 dark:hover:bg-white/5 cursor-pointer transition"
                    >
                      <td className="py-3 px-3 font-extrabold font-mono text-gray-900 dark:text-white">
                        {job.jobCardNumber}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-gray-900 dark:text-white">{job.customerName}</p>
                        <p className="text-[11px] text-gray-500 font-mono">{job.customerPhone}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-gray-900 dark:text-white">
                          {job.deviceBrand} {job.deviceModel}
                        </p>
                        <p className="text-[11px] text-gray-400 font-mono">{maskIMEI(job.imeiSerial)}</p>
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <p className="truncate text-gray-700 dark:text-gray-300 font-medium">
                          {job.reportedFault}
                        </p>
                        <span className="text-[10px] text-gray-400">Due: {formatDate(job.promisedDate)}</span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-gray-800 dark:text-gray-200">
                        {job.technicianName}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge type="job" status={job.status} />
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold block text-gray-900 dark:text-white">
                          {formatINR(job.estimate.total)}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {job.invoiceSummary?.paymentStatus || 'Unpaid'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedJob(job);
                          }}
                          className="px-3 py-1 rounded-xl glass-card hover:border-[#F5ED31] dark:hover:border-[#DAFC08] font-bold text-xs text-gray-800 dark:text-white transition"
                        >
                          Open Card
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {kanbanColumns.map(colStatus => {
              const colJobs = filteredJobs.filter(j => j.status === colStatus);
              return (
                <div
                  key={colStatus}
                  className="w-72 p-3 rounded-3xl glass-panel flex flex-col max-h-[75vh]"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5 mb-3">
                    <span className="text-xs font-extrabold uppercase tracking-tight text-gray-800 dark:text-gray-200">
                      {colStatus}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                      {colJobs.length}
                    </span>
                  </div>

                  {/* Kanban Cards */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                    {colJobs.length === 0 ? (
                      <div className="py-8 text-center text-[11px] text-gray-400 italic">
                        No jobs in this stage
                      </div>
                    ) : (
                      colJobs.map(job => (
                        <div
                          key={job.id}
                          onClick={() => setSelectedJob(job)}
                          className="p-3 rounded-2xl glass-card hover:border-[#F5ED31] dark:hover:border-[#DAFC08]/60 cursor-pointer transition space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold font-mono text-xs text-gray-900 dark:text-white">
                              {job.jobCardNumber}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                job.priority === 'Urgent'
                                  ? 'bg-rose-500/15 text-rose-500 font-extrabold'
                                  : job.priority === 'High'
                                  ? 'bg-amber-500/15 text-amber-500'
                                  : 'bg-black/5 dark:bg-white/10 text-gray-500'
                              }`}
                            >
                              {job.priority}
                            </span>
                          </div>

                          <div>
                            <p className="font-bold text-xs text-gray-900 dark:text-white">
                              {job.deviceBrand} {job.deviceModel}
                            </p>
                            <p className="text-[11px] text-gray-500 truncate">{job.reportedFault}</p>
                          </div>

                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-black/5 dark:border-white/5">
                            <span className="text-gray-400">{job.technicianName.split(' ')[0]}</span>
                            <span className="font-bold text-gray-900 dark:text-white">
                              {formatINR(job.estimate.total)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {newJobModalOpen && (
        <NewJobCardModal
          isOpen={newJobModalOpen}
          onClose={() => setNewJobModalOpen(false)}
        />
      )}
    </div>
  );
};
