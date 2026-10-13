import React from 'react';
import {
  LayoutDashboard,
  CalendarClock,
  Wrench,
  Cpu,
  Boxes,
  Smartphone,
  Truck,
  Receipt,
  Wallet,
  Users,
  BarChart3,
  Download,
  UserCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';

interface SidebarProps {
  currentView: string;
  onNavigate: (viewId: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenInstallApp: () => void;
  isInstalled: boolean;
  isInstallable: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  collapsed,
  onToggleCollapse,
  onOpenInstallApp,
  isInstalled,
}) => {
  const { bookings, jobs, inventory, purchaseOrders, invoices, warrantyClaims, settings } = useCRM();

  // Calculate live badge counters
  const pendingBookingsCount = bookings.filter(b => b.status === 'Pending' || b.status === 'Confirmed').length;
  const activeRepairsCount = jobs.filter(
    j => j.status !== 'Completed' && j.status !== 'Cancelled' && j.status !== 'Unrepairable'
  ).length;
  const waitingApprovalCount = jobs.filter(j => j.status === 'Awaiting Customer Approval').length;
  const lowStockCount = inventory.filter(i => i.availableQty <= i.reorderLevel).length;
  const pendingPOCount = purchaseOrders.filter(p => p.status === 'Sent' || p.status === 'Draft').length;
  const unpaidInvoicesCount = invoices.filter(i => i.paymentStatus === 'Unpaid' || i.paymentStatus === 'Partial').length;
  const activeClaimsCount = warrantyClaims.filter(c => c.status !== 'Resolved' && c.status !== 'Rejected (Void / Damaged)').length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'bookings',
      label: 'Bookings & Intake',
      icon: CalendarClock,
      badge: pendingBookingsCount > 0 ? { count: pendingBookingsCount, color: 'bg-[#FF934F] text-black font-bold' } : null,
    },
    {
      id: 'repairs',
      label: 'Repair Jobs',
      icon: Wrench,
      badge: waitingApprovalCount > 0
        ? { count: waitingApprovalCount, color: 'bg-rose-500 text-white animate-pulse' }
        : activeRepairsCount > 0
        ? { count: activeRepairsCount, color: 'bg-[#547BDE] text-white' }
        : null,
    },
    {
      id: 'workshop',
      label: 'Workshop & Machines',
      icon: Cpu,
      badge: null,
    },
    {
      id: 'inventory',
      label: 'Inventory Spares',
      icon: Boxes,
      badge: lowStockCount > 0 ? { count: lowStockCount, color: 'bg-rose-500 text-white' } : null,
    },
    {
      id: 'resale',
      label: 'Resale Devices',
      icon: Smartphone,
      badge: null,
    },
    {
      id: 'purchases',
      label: 'Purchases & Imports',
      icon: Truck,
      badge: pendingPOCount > 0 ? { count: pendingPOCount, color: 'bg-[#547BDE] text-white' } : null,
    },
    {
      id: 'billing',
      label: 'Billing & Invoices',
      icon: Receipt,
      badge: unpaidInvoicesCount > 0 ? { count: unpaidInvoicesCount, color: 'bg-[#FF934F] text-black font-bold' } : null,
    },
    {
      id: 'expenses',
      label: 'Expenses',
      icon: Wallet,
      badge: null,
    },
    {
      id: 'customers',
      label: 'Customers & Warranty',
      icon: Users,
      badge: activeClaimsCount > 0 ? { count: activeClaimsCount, color: 'bg-rose-500 text-white' } : null,
    },
    {
      id: 'reports',
      label: 'Reports & Profit',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'download_report',
      label: 'Download Report',
      icon: Download,
      badge: { count: 'PDF/XLS', color: 'bg-[#DAFC08]/20 text-[#DAFC08] border border-[#DAFC08]/50 text-[10px]' },
      special: true,
    },
    {
      id: 'staff',
      label: 'Staff Roster',
      icon: UserCheck,
      badge: null,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col h-full flex-shrink-0 glass-sidebar transition-all duration-300 z-20 select-none ${
        collapsed ? 'w-16' : 'w-60 lg:w-64'
      }`}
    >
      {/* Navigation List */}
      <div className={`flex-1 overflow-y-auto ${collapsed ? 'py-3 px-1.5 space-y-1' : 'py-3 px-2.5 space-y-1'}`}>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-2.5 rounded-xl text-xs font-bold transition-all group relative ${
                collapsed ? 'justify-center p-2.5' : 'px-3 py-2'
              } ${
                isActive
                  ? 'bg-[#F5ED31] text-[#0D0C0B] shadow-md dark:bg-[#DAFC08] dark:text-black dark:shadow-glow-lime'
                  : 'text-gray-700 hover:bg-white/60 dark:text-gray-300 dark:hover:bg-white/10 hover:text-black dark:hover:text-white'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <div className="relative flex-shrink-0 flex items-center justify-center">
                <Icon
                  className={`w-4 h-4 transition ${
                    isActive
                      ? 'text-black stroke-[2.5]'
                      : 'text-gray-500 group-hover:text-black dark:text-gray-400 dark:group-hover:text-white'
                  }`}
                />
                {/* Collapsed active badge dot */}
                {collapsed && item.badge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-black"></span>
                )}
              </div>

              {!collapsed && (
                <span className="truncate flex-1 text-left font-extrabold">{item.label}</span>
              )}

              {!collapsed && item.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold shadow-xs ${item.badge.color}`}
                >
                  {item.badge.count}
                </span>
              )}

              {/* High-visibility Floating Tooltip on collapsed mode */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#151515] dark:bg-[#202020] text-white border border-white/20 text-xs rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-2xl font-bold">
                  {item.label}
                  {item.badge && ` (${item.badge.count})`}
                </div>
              )}
            </button>
          );
        })}

        {/* Install PWA App Option */}
        <button
          onClick={onOpenInstallApp}
          className={`w-full flex items-center gap-2.5 rounded-xl text-xs font-bold transition-all group relative border border-black/10 dark:border-white/10 hover:border-[#F5ED31] dark:hover:border-[#DAFC08] bg-white/40 dark:bg-white/5 hover:bg-white/70 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 ${
            collapsed ? 'justify-center p-2.5' : 'px-3 py-2'
          }`}
          title={collapsed ? (isInstalled ? 'App Installed' : 'Install OneRepair App') : undefined}
        >
          <div className="w-4 h-4 rounded-md overflow-hidden flex-shrink-0 shadow-xs">
            <img src="/pwa-icon.png" alt="OneRepair" className="w-full h-full object-cover" />
          </div>

          {!collapsed && (
            <span className="truncate flex-1 text-left font-extrabold">
              {isInstalled ? 'App Installed' : 'Install App'}
            </span>
          )}

          {!collapsed && (
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold shadow-xs ${
                isInstalled
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-[#F5ED31]/30 text-black dark:bg-[#DAFC08]/20 dark:text-[#DAFC08] border border-amber-500/30 dark:border-[#DAFC08]/40'
              }`}
            >
              {isInstalled ? 'Active' : 'PWA'}
            </span>
          )}

          {/* Tooltip on collapsed mode */}
          {collapsed && (
            <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#151515] dark:bg-[#202020] text-white border border-white/20 text-xs rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-2xl font-bold">
              {isInstalled ? 'OneRepair App Active' : 'Install OneRepair App'}
            </div>
          )}
        </button>

        {/* Explicit Collapse / Expand Button below Settings Tab */}
        <div className="pt-1.5 border-t border-black/5 dark:border-white/10 mt-1.5">
          <button
            onClick={onToggleCollapse}
            className={`w-full flex items-center gap-2.5 rounded-xl text-xs font-extrabold transition-all group relative glass-card text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white ${
              collapsed ? 'justify-center p-2.5' : 'px-3 py-2'
            }`}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 text-[#547BDE] dark:text-[#DAFC08] transition-transform group-hover:scale-125" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 text-[#547BDE] dark:text-[#DAFC08] transition-transform group-hover:-translate-x-1" />
                <span className="truncate flex-1 text-left">Collapse Menu</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-gray-500 dark:text-gray-400">
                  «
                </span>
              </>
            )}

            {collapsed && (
              <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#151515] dark:bg-[#202020] text-white border border-white/20 text-xs rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-2xl font-bold">
                Expand Menu
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Shop Info Footer */}
      {!collapsed ? (
        <div className="p-2.5 mx-2.5 mb-2.5 rounded-xl glass-card border border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></div>
            <span className="text-[11px] font-extrabold text-[#0D0C0B] dark:text-gray-200 truncate">
              {settings.shopName} ({settings.area})
            </span>
          </div>
          <p className="text-[10px] text-[#5E5E5E] dark:text-gray-400 mt-0.5 truncate">
            5 Active Techs • 4 Machines
          </p>
        </div>
      ) : (
        <div className="p-2 mb-2 flex justify-center">
          <div
            className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center cursor-pointer group relative shadow-xs"
            onClick={onToggleCollapse}
            title={`${settings.shopName} (${settings.area})`}
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#151515] dark:bg-[#202020] text-white border border-white/20 text-xs rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-2xl font-bold">
              {settings.shopName} ({settings.area})
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
