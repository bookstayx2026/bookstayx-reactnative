import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Search,
  Plus,
  Wrench,
  Sparkles,
  UserCheck,
  ChevronDown,
  Clock,
  Laptop,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';

interface HeaderProps {
  onOpenQuickSearch: () => void;
  onOpenNewBooking: () => void;
  onOpenNewJob: () => void;
  onOpenNewSale: () => void;
  onOpenNewExpense: () => void;
  onNavigate: (viewId: string) => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenQuickSearch,
  onOpenNewBooking,
  onOpenNewJob,
  onOpenNewSale,
  onOpenNewExpense,
  sidebarCollapsed,
  onToggleSidebar,
}) => {
  const { theme, toggleTheme, currentStaff, staff, setCurrentStaff, triggerDemoFlow, settings } = useCRM();
  const [showStaffMenu, setShowStaffMenu] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex-shrink-0 flex items-center justify-between h-16 px-3 sm:px-4 md:px-6 glass-header transition-colors">
      {/* Left side: Brand, Sidebar Toggle and Location tag */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="hidden md:flex items-center justify-center p-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-white/10 glass-input transition"
            title={sidebarCollapsed ? 'Expand Sidebar (Ctrl+B)' : 'Collapse Sidebar (Ctrl+B)'}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-[#547BDE] dark:text-[#DAFC08]" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        )}

        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#F5ED31] dark:bg-[#DAFC08] flex items-center justify-center text-black font-extrabold shadow-sm flex-shrink-0">
            <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-black stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-base sm:text-lg text-[#0D0C0B] dark:text-white whitespace-nowrap">
                {settings.shopName.toUpperCase()}
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F5ED31]/30 text-black dark:bg-[#DAFC08]/20 dark:text-[#DAFC08] border border-amber-500/30 dark:border-[#DAFC08]/40 shadow-xs whitespace-nowrap">
                {settings.area} HUB
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-[#5E5E5E] dark:text-gray-400 hidden xl:block">
              Internal Shop CRM &amp; Machine Operations
            </p>
          </div>
        </div>

        {/* Live Shop Indicator - shown on extra large screens only to save tablet space */}
        <div className="hidden 2xl:flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Workshop Live (3 Machines Active)</span>
        </div>
      </div>

      {/* Center / Search bar trigger */}
      <div className="flex-1 max-w-xs xl:max-w-md mx-2 sm:mx-4 hidden lg:block">
        <button
          onClick={onOpenQuickSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm glass-input text-gray-700 dark:text-gray-300 transition-all group hover:border-[#F5ED31] dark:hover:border-[#DAFC08]/50"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0 group-hover:text-amber-500 dark:group-hover:text-[#DAFC08]" />
            <span className="truncate text-xs sm:text-sm">Search job cards, customers, IMEIs...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white/70 dark:bg-[#151515]/70 border border-gray-300 dark:border-[#444] rounded text-gray-500 dark:text-gray-400 shadow-xs flex-shrink-0 ml-1">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
        {/* Mobile / Tablet Search Icon */}
        <button
          onClick={onOpenQuickSearch}
          className="lg:hidden p-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-white/10 glass-input"
          title="Quick Search (Ctrl+K)"
        >
          <Search className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Guided Interactive Demo Scenarios Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowDemoMenu(!showDemoMenu);
              setShowQuickActions(false);
              setShowStaffMenu(false);
            }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-extrabold bg-[#547BDE]/15 text-[#547BDE] hover:bg-[#547BDE]/25 dark:bg-[#547BDE]/20 dark:text-[#8AA8F8] border border-[#547BDE]/40 shadow-xs transition whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span className="hidden xl:inline">Interactive Demos</span>
            <span className="hidden sm:inline xl:hidden">Demos</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showDemoMenu && (
            <div className="absolute right-0 mt-2 w-72 glass-modal rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-1.5 border-b border-gray-200/50 dark:border-[#2C2C2C] mb-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Clickable Scenario Triggers
                </p>
              </div>
              <button
                onClick={() => {
                  triggerDemoFlow('full_repair');
                  setShowDemoMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-white/60 dark:hover:bg-white/10 flex items-center gap-2.5 text-gray-800 dark:text-gray-200"
              >
                <div className="w-2 h-2 rounded-full bg-[#DAFC08]"></div>
                <div>
                  <div className="font-bold">1. Full Repair Lifecycle</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">Intake → Estimate → Machine → Invoice → Handover</div>
                </div>
              </button>
              <button
                onClick={() => {
                  triggerDemoFlow('stock_blocker');
                  setShowDemoMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-white/60 dark:hover:bg-white/10 flex items-center gap-2.5 text-gray-800 dark:text-gray-200"
              >
                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                <div>
                  <div className="font-bold">2. Missing Stock Blocker</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">OnePlus Fold screen 0 stock alert</div>
                </div>
              </button>
              <button
                onClick={() => {
                  triggerDemoFlow('po_receive');
                  setShowDemoMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-white/60 dark:hover:bg-white/10 flex items-center gap-2.5 text-gray-800 dark:text-gray-200"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <div>
                  <div className="font-bold">3. Receive PO Stock Inward</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">Import shipment clearance &amp; stock restock</div>
                </div>
              </button>
              <button
                onClick={() => {
                  triggerDemoFlow('resale_lifecycle');
                  setShowDemoMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-white/60 dark:hover:bg-white/10 flex items-center gap-2.5 text-gray-800 dark:text-gray-200"
              >
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <div>
                  <div className="font-bold">4. Resale Phone Lifecycle</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">Acquire → Refurbish → Set Margins</div>
                </div>
              </button>
              <button
                onClick={() => {
                  triggerDemoFlow('rent_expense');
                  setShowDemoMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-white/60 dark:hover:bg-white/10 flex items-center gap-2.5 text-gray-800 dark:text-gray-200"
              >
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <div>
                  <div className="font-bold">5. Shop Storage Rent Expense</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">Instant operating profit deduction</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Quick Action Button */}
        <div className="relative">
          <button
            onClick={() => {
              setShowQuickActions(!showQuickActions);
              setShowStaffMenu(false);
              setShowDemoMenu(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-[#F5ED31] hover:bg-[#E5DC24] dark:bg-[#DAFC08] dark:hover:bg-[#C4E407] text-black shadow-md transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Quick Action</span>
            <ChevronDown className="w-3 h-3 stroke-[3]" />
          </button>

          {showQuickActions && (
            <div className="absolute right-0 mt-2 w-56 glass-modal rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <button
                onClick={() => {
                  onOpenNewBooking();
                  setShowQuickActions(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-white/60 dark:hover:bg-white/10 flex items-center gap-2 text-gray-800 dark:text-gray-200"
              >
                <Clock className="w-4 h-4 text-amber-500" />
                <span>+ New Intake Booking</span>
              </button>
              <button
                onClick={() => {
                  onOpenNewJob();
                  setShowQuickActions(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-white/60 dark:hover:bg-white/10 flex items-center gap-2 text-gray-800 dark:text-gray-200"
              >
                <Wrench className="w-4 h-4 text-[#547BDE]" />
                <span>+ Create Job Card</span>
              </button>
              <button
                onClick={() => {
                  onOpenNewSale();
                  setShowQuickActions(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-white/60 dark:hover:bg-white/10 flex items-center gap-2 text-gray-800 dark:text-gray-200"
              >
                <Laptop className="w-4 h-4 text-emerald-500" />
                <span>+ Counter / Resale Sale</span>
              </button>
              <button
                onClick={() => {
                  onOpenNewExpense();
                  setShowQuickActions(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-white/60 dark:hover:bg-white/10 flex items-center gap-2 text-gray-800 dark:text-gray-200"
              >
                <Plus className="w-4 h-4 text-rose-500" />
                <span>+ Record Shop Expense</span>
              </button>
            </div>
          )}
        </div>

        {/* Light / Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-white/10 glass-input transition active:scale-95"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-[#DAFC08] animate-spin-slow" />
          ) : (
            <Moon className="w-4 h-4 text-[#FF934F]" />
          )}
        </button>

        {/* Staff Switcher Profile */}
        <div className="relative">
          <button
            onClick={() => {
              setShowStaffMenu(!showStaffMenu);
              setShowQuickActions(false);
              setShowDemoMenu(false);
            }}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl glass-input hover:bg-white/60 dark:hover:bg-white/10 transition"
          >
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] text-black shadow-xs"
              style={{ backgroundColor: currentStaff.avatarColor }}
            >
              {currentStaff.name.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold leading-tight text-gray-900 dark:text-white truncate max-w-[100px]">
                {currentStaff.name.split(' ')[0]}
              </p>
              <p className="text-[10px] text-[#5E5E5E] dark:text-gray-400 leading-tight font-medium">
                {currentStaff.role}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {showStaffMenu && (
            <div className="absolute right-0 mt-2 w-64 glass-modal rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-gray-200/50 dark:border-[#2C2C2C] mb-1">
                <p className="text-[10px] uppercase font-bold text-gray-400">Switch Active Staff (5-6 Roster)</p>
              </div>
              {staff.map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    setCurrentStaff(s);
                    setShowStaffMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                    currentStaff.id === s.id
                      ? 'bg-[#F5ED31]/25 text-black dark:bg-[#DAFC08]/15 dark:text-[#DAFC08] font-bold'
                      : 'hover:bg-white/60 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] text-black shadow-xs"
                      style={{ backgroundColor: s.avatarColor }}
                    >
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-[10px] text-gray-400">{s.role}</p>
                    </div>
                  </div>
                  {currentStaff.id === s.id && <UserCheck className="w-4 h-4 text-emerald-500" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
