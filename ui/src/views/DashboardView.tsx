import React from 'react';
import {
  Wrench,
  DollarSign,
  Boxes,
  CreditCard,
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Flame,
  AlertCircle,
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatINR, formatDateTime } from '../utils/formatters';
import { calculateFinancialSummary } from '../utils/calculations';

interface DashboardViewProps {
  onNavigate: (viewId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const {
    jobs,
    inventory,
    invoices,
    expenses,
    resaleDevices,
    bookings,
    machines,
    staff,
    setSelectedJob,
    triggerDemoFlow,
  } = useCRM();

  const summary = calculateFinancialSummary(invoices, expenses, jobs, resaleDevices, inventory);

  // Live metrics calculations
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaysBookings = bookings.filter(b => b.createdAt.startsWith(todayStr) || b.preferredDate === todayStr);
  const activeRepairs = jobs.filter(
    j => j.status !== 'Completed' && j.status !== 'Cancelled' && j.status !== 'Unrepairable'
  );
  const awaitingApproval = jobs.filter(j => j.status === 'Awaiting Customer Approval');
  const waitingParts = jobs.filter(j => j.status === 'Waiting for Parts');
  const readyForPickup = jobs.filter(j => j.status === 'Ready for Pickup');
  const lowStockItems = inventory.filter(i => i.availableQty <= i.reorderLevel);

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* Top Banner / Welcome with Frosted Glass styling and Guided Demo Scenario Triggers */}
      <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl glass-panel relative overflow-hidden shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 border border-white/60 dark:border-white/10">
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-[#0D0C0B] dark:text-white">
              One Repair CRM — Pimpri Operations Hub
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#F5ED31] text-black dark:bg-[#DAFC08] dark:text-black shadow-xs">
              ADMIN LIVE
            </span>
          </div>
          <p className="text-xs text-[#5E5E5E] dark:text-gray-300 mt-0.5 max-w-2xl font-medium">
            Managing 5 staff technicians, 4 specialized precision workshop machines, and active customer turnaround.
          </p>
        </div>

        {/* Quick Scenario Buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-2">
          <button
            onClick={() => triggerDemoFlow('full_repair')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-extrabold bg-[#F5ED31] hover:bg-[#E5DC24] dark:bg-[#DAFC08] text-black dark:hover:bg-[#C4E407] transition shadow-md active:scale-95"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Run Full Repair Demo</span>
          </button>
          <button
            onClick={() => onNavigate('download_report')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold glass-input hover:bg-white/80 dark:hover:bg-white/15 text-black dark:text-white transition shadow-xs"
          >
            <span>Download Report (PDF/XLS)</span>
          </button>
        </div>
      </div>

      {/* Critical Alert Banners (If any jobs are blocked) */}
      {(awaitingApproval.length > 0 || waitingParts.length > 0 || lowStockItems.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3">
          {awaitingApproval.length > 0 && (
            <div
              onClick={() => onNavigate('repairs')}
              className="p-3 sm:p-3.5 rounded-2xl glass-card border border-amber-500/40 flex items-center justify-between cursor-pointer hover:shadow-glow-yellow transition"
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse flex-shrink-0" />
                <div>
                  <p className="text-xs font-black text-amber-900 dark:text-amber-300">
                    {awaitingApproval.length} Repairs Awaiting Approval
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                    Customer confirmation needed on estimates
                  </p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            </div>
          )}

          {waitingParts.length > 0 && (
            <div
              onClick={() => onNavigate('repairs')}
              className="p-3 sm:p-3.5 rounded-2xl glass-card border border-rose-500/40 flex items-center justify-between cursor-pointer hover:shadow-lg transition"
            >
              <div className="flex items-center gap-2.5">
                <Boxes className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <div>
                  <p className="text-xs font-black text-rose-900 dark:text-rose-300">
                    {waitingParts.length} Jobs Blocked by Missing Parts
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-rose-700 dark:text-rose-400 font-medium">
                    Awaiting supplier import consignments
                  </p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
            </div>
          )}

          {lowStockItems.length > 0 && (
            <div
              onClick={() => onNavigate('inventory')}
              className="p-3 sm:p-3.5 rounded-2xl glass-card border border-[#547BDE]/40 flex items-center justify-between cursor-pointer hover:shadow-glow-blue transition"
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-[#547BDE] flex-shrink-0" />
                <div>
                  <p className="text-xs font-black text-blue-900 dark:text-[#8AA8F8]">
                    {lowStockItems.length} Low Stock Inventory Spares
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-blue-700 dark:text-blue-300 font-medium">
                    Items reached reorder threshold
                  </p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#547BDE] flex-shrink-0" />
            </div>
          )}
        </div>
      )}

      {/* Row 1: Core Operational KPIs (2 cols on mobile, 3 cols on tablet, 6 cols on XL desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3">
        <StatCard
          title="Today's Bookings"
          value={todaysBookings.length}
          subtitle="Walk-in &amp; pick-ups"
          icon={CalendarClock}
          colorType="accent"
          clickable
          onClick={() => onNavigate('bookings')}
        />
        <StatCard
          title="Active Repairs"
          value={activeRepairs.length}
          subtitle="On workbench / machines"
          icon={Wrench}
          colorType="blue"
          badge={`${readyForPickup.length} Ready`}
          clickable
          onClick={() => onNavigate('repairs')}
        />
        <StatCard
          title="Ready for Pickup"
          value={readyForPickup.length}
          subtitle="QC test verified"
          icon={CheckCircle2}
          colorType="emerald"
          clickable
          onClick={() => onNavigate('repairs')}
        />
        <StatCard
          title="Low Stock Spares"
          value={lowStockItems.length}
          subtitle="Reorder required"
          icon={Boxes}
          colorType="rose"
          clickable
          onClick={() => onNavigate('inventory')}
        />
        <StatCard
          title="Cash Collected"
          value={formatINR(summary.totalCashCollected)}
          subtitle="Demo estimates"
          icon={DollarSign}
          colorType="emerald"
          clickable
          onClick={() => onNavigate('billing')}
        />
        <StatCard
          title="Unpaid Balances"
          value={formatINR(summary.totalOutstandingReceivables)}
          subtitle="Pending customer dues"
          icon={CreditCard}
          colorType="amber"
          clickable
          onClick={() => onNavigate('billing')}
        />
      </div>

      {/* Row 2: Repair Pipeline & Machines Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Left 2 Cols: Repair Pipeline Stages */}
        <div className="lg:col-span-2 p-4 sm:p-5 rounded-2xl sm:rounded-3xl glass-panel space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs sm:text-sm font-black text-[#0D0C0B] dark:text-white uppercase tracking-wider">
                Live Workshop Repair Pipeline
              </h2>
              <p className="text-[11px] sm:text-xs text-[#5E5E5E] dark:text-gray-400 font-medium">
                Current status distribution across Pimpri workshop bench
              </p>
            </div>
            <button
              onClick={() => onNavigate('repairs')}
              className="text-xs font-bold text-amber-700 dark:text-[#DAFC08] hover:underline flex items-center gap-1"
            >
              <span>View Kanban</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
            {[
              { status: 'Received', count: jobs.filter(j => j.status === 'Received').length, color: 'border-blue-500/40 bg-blue-500/10' },
              { status: 'Diagnosing', count: jobs.filter(j => j.status === 'Diagnosing').length, color: 'border-purple-500/40 bg-purple-500/10' },
              { status: 'Approval Needed', count: awaitingApproval.length, color: 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300' },
              { status: 'Waiting Parts', count: waitingParts.length, color: 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-300' },
              { status: 'In Queue', count: jobs.filter(j => j.status === 'Queued').length, color: 'border-slate-500/40 bg-slate-500/10' },
              { status: 'Repairing', count: jobs.filter(j => j.status === 'Repairing').length, color: 'border-[#DAFC08]/50 bg-[#DAFC08]/10' },
              { status: 'Quality Check', count: jobs.filter(j => j.status === 'Quality Check').length, color: 'border-teal-500/40 bg-teal-500/10' },
              { status: 'Ready for Pickup', count: readyForPickup.length, color: 'border-emerald-500/40 bg-emerald-500/10 font-black text-emerald-600 dark:text-emerald-300' },
            ].map(stage => (
              <div
                key={stage.status}
                onClick={() => onNavigate('repairs')}
                className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl glass-card border ${stage.color} cursor-pointer hover:scale-[1.02] transition shadow-xs`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-gray-400 block truncate">
                  {stage.status}
                </span>
                <span className="text-lg sm:text-xl font-black text-[#0D0C0B] dark:text-white mt-0.5 block">
                  {stage.count}
                </span>
              </div>
            ))}
          </div>

          {/* Active High-Priority Repairs Table */}
          <div className="pt-1 space-y-2">
            <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-[#5E5E5E] dark:text-gray-400 block">
              Recent High Priority &amp; Urgent Bench Jobs
            </span>
            <div className="space-y-1.5 sm:space-y-2">
              {jobs
                .filter(j => j.status !== 'Completed' && j.status !== 'Cancelled')
                .slice(0, 4)
                .map(job => (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl glass-card flex items-center justify-between cursor-pointer hover:border-[#F5ED31] dark:hover:border-[#DAFC08] transition"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#F5ED31]/30 dark:bg-[#DAFC08]/15 flex items-center justify-center text-black dark:text-[#DAFC08] font-black text-xs shadow-xs flex-shrink-0">
                        {job.deviceBrand.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="font-extrabold text-xs text-[#0D0C0B] dark:text-white">
                            {job.jobCardNumber}
                          </span>
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                            {job.deviceBrand} {job.deviceModel}
                          </span>
                          <StatusBadge type="job" status={job.status} />
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-[#5E5E5E] dark:text-gray-400 mt-0.5 truncate">
                          Customer: {job.customerName} • Tech: {job.technicianName} • Due: {formatDateTime(job.promisedDate)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <span className="text-xs font-black text-[#0D0C0B] dark:text-white block">
                        {formatINR(job.estimate.total)}
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-[#5E5E5E] dark:text-gray-400 font-medium">
                        {job.invoiceSummary?.paymentStatus || 'Unpaid'}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Right Col: 4 Workshop Machines & Tech Queues */}
        <div className="space-y-3.5 sm:space-y-4">
          {/* Workshop Machines Status */}
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl glass-panel space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-[#0D0C0B] dark:text-white uppercase tracking-wider">
                  Workshop Machines (3–4 Units)
                </h3>
                <p className="text-[10px] sm:text-[11px] text-[#5E5E5E] dark:text-gray-400 font-medium">
                  Laser, Microscope, OCA Laminator, Thermal
                </p>
              </div>
              <button
                onClick={() => onNavigate('workshop')}
                className="text-xs font-extrabold text-[#547BDE] hover:underline"
              >
                Schedule
              </button>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              {machines.map(m => (
                <div
                  key={m.id}
                  className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl glass-card text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-[#0D0C0B] dark:text-white truncate">
                      {m.name}
                    </span>
                    <span
                      className={`text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 ${
                        m.status === 'Available'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                          : m.status === 'In Use'
                          ? 'bg-[#547BDE]/20 text-[#547BDE] dark:text-[#8AA8F8]'
                          : 'bg-rose-500/15 text-rose-600'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                  {m.status === 'In Use' ? (
                    <p className="text-[10px] sm:text-[11px] text-[#5E5E5E] dark:text-gray-400 font-medium truncate">
                      Job #{m.currentJobNumber} • {m.operatorName} ({m.currentSlot})
                    </p>
                  ) : m.status === 'Maintenance' ? (
                    <p className="text-[10px] sm:text-[11px] text-rose-600 dark:text-rose-400 italic truncate">
                      {m.maintenanceNote || 'Scheduled calibration'}
                    </p>
                  ) : (
                    <p className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                      Ready for next assigned repair job
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Technician Workload Queue */}
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl glass-panel space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-[#0D0C0B] dark:text-white uppercase tracking-wider">
                Technician Workload Roster
              </h3>
              <button
                onClick={() => onNavigate('staff')}
                className="text-xs font-extrabold text-[#5E5E5E] hover:underline"
              >
                View Staff
              </button>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              {staff
                .filter(s => s.role.includes('Technician') || s.role === 'Owner')
                .map(tech => (
                  <div
                    key={tech.id}
                    className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl glass-card text-xs"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                      <div
                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center font-black text-xs text-black shadow-xs flex-shrink-0"
                        style={{ backgroundColor: tech.avatarColor }}
                      >
                        {tech.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-[#0D0C0B] dark:text-white truncate">{tech.name}</p>
                        <p className="text-[9px] sm:text-[10px] text-[#5E5E5E] dark:text-gray-400 truncate">{tech.specialization}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <span className="px-2 py-0.5 rounded-full bg-[#F5ED31]/30 text-black dark:bg-[#DAFC08]/15 dark:text-[#DAFC08] font-black text-[10px] sm:text-[11px]">
                        {tech.activeJobsCount} Active
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
