import React, { useState } from 'react';
import {
  LayoutDashboard,
  CalendarClock,
  Wrench,
  Cpu,
  Menu,
  X,
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
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';

interface MobileNavProps {
  currentView: string;
  onNavigate: (viewId: string) => void;
  onOpenInstallApp: () => void;
  isInstalled: boolean;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentView,
  onNavigate,
  onOpenInstallApp,
  isInstalled,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { bookings, jobs } = useCRM();

  const activeRepairsCount = jobs.filter(
    j => j.status !== 'Completed' && j.status !== 'Cancelled' && j.status !== 'Unrepairable'
  ).length;
  const pendingBookingsCount = bookings.filter(b => b.status === 'Pending' || b.status === 'Confirmed').length;

  const quickNav = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'bookings', label: 'Bookings', icon: CalendarClock, badge: pendingBookingsCount },
    { id: 'repairs', label: 'Repairs', icon: Wrench, badge: activeRepairsCount },
    { id: 'workshop', label: 'Workshop', icon: Cpu },
  ];

  const allNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bookings', label: 'Bookings & Device Intake', icon: CalendarClock },
    { id: 'repairs', label: 'Repair Jobs & Job Cards', icon: Wrench },
    { id: 'workshop', label: 'Workshop & 4 Machines', icon: Cpu },
    { id: 'inventory', label: 'Inventory Spares & Accessories', icon: Boxes },
    { id: 'resale', label: 'Resale Certified Devices', icon: Smartphone },
    { id: 'purchases', label: 'Purchases & Parts Imports', icon: Truck },
    { id: 'billing', label: 'Billing, Invoices & Counter Sales', icon: Receipt },
    { id: 'expenses', label: 'Shop Operating Expenses', icon: Wallet },
    { id: 'customers', label: 'Customers & Warranty Claims', icon: Users },
    { id: 'reports', label: 'Reports & Profit Analytics', icon: BarChart3 },
    { id: 'download_report', label: 'Download PDF / Excel Report', icon: Download },
    { id: 'staff', label: 'Staff Roster & Workload', icon: UserCheck },
    { id: 'settings', label: 'Shop Settings & GST', icon: Settings },
  ];

  return (
    <>
      {/* Bottom Floating/Fixed Bar for Mobile & Tablets */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 glass-header px-3 py-1.5 flex items-center justify-around border-t border-gray-200/50 dark:border-white/10 shadow-lg">
        {quickNav.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl transition ${
                isActive
                  ? 'text-black dark:text-[#DAFC08] font-bold'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.8]' : ''}`} />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}

        {/* More button to toggle drawer */}
        <button
          onClick={() => setDrawerOpen(true)}
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl text-gray-600 dark:text-gray-400`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">All Modules</span>
        </button>
      </nav>

      {/* Slide-out Drawer for All Modules */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          ></div>

          <div className="relative ml-auto w-4/5 max-w-xs h-full glass-modal p-4 flex flex-col z-10 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200/50 dark:border-white/10">
              <span className="font-extrabold text-sm text-[#0D0C0B] dark:text-white">
                One Repair CRM Modules
              </span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-1">
              {allNav.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setDrawerOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                      isActive
                        ? 'bg-[#F5ED31] text-[#0D0C0B] dark:bg-[#DAFC08] dark:text-black shadow-sm'
                        : 'hover:bg-white/60 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}

              {/* Install App in Mobile Drawer */}
              <div className="pt-2 border-t border-gray-200/50 dark:border-white/10 mt-2">
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    onOpenInstallApp();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-extrabold transition bg-[#F5ED31]/20 dark:bg-[#DAFC08]/15 border border-amber-500/30 dark:border-[#DAFC08]/40 text-black dark:text-[#DAFC08]"
                >
                  <div className="w-5 h-5 rounded-md overflow-hidden flex-shrink-0 shadow-xs">
                    <img src="/pwa-icon.png" alt="OneRepair" className="w-full h-full object-cover" />
                  </div>
                  <span className="truncate flex-1 text-left">
                    {isInstalled ? 'App Installed (Active)' : 'Install OneRepair App'}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-black/10 dark:bg-white/10">
                    PWA
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
