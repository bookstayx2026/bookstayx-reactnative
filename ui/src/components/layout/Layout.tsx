import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { ToastContainer } from '../common/ToastContainer';
import { QuickSearchModal } from '../modals/QuickSearchModal';
import { NewBookingModal } from '../modals/NewBookingModal';
import { NewJobCardModal } from '../modals/NewJobCardModal';
import { NewSaleInvoiceModal } from '../modals/NewSaleInvoiceModal';
import { NewExpenseModal } from '../modals/NewExpenseModal';
import { JobCardDetailModal } from '../modals/JobCardDetailModal';
import { InstallAppModal } from '../modals/InstallAppModal';
import { useCRM } from '../../context/CRMContext';
import { usePWA } from '../../hooks/usePWA';

interface LayoutProps {
  currentView: string;
  onNavigate: (viewId: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, onNavigate, children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);
  const [newBookingOpen, setNewBookingOpen] = useState(false);
  const [newJobOpen, setNewJobOpen] = useState(false);
  const [newSaleOpen, setNewSaleOpen] = useState(false);
  const [newExpenseOpen, setNewExpenseOpen] = useState(false);
  const [installModalOpen, setInstallModalOpen] = useState(false);

  const { isInstallable, isInstalled, platform, installApp } = usePWA();
  const { selectedJob, setSelectedJob } = useCRM();

  // Handle Ctrl+K shortcut for quick search & Ctrl+B for sidebar toggle
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setQuickSearchOpen(prev => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSidebarCollapsed(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative h-screen flex flex-col bg-[#DDDDDD] dark:bg-[#0D0D0D] text-[#0D0C0B] dark:text-white transition-colors duration-200 overflow-hidden font-urbanist dark:font-lufga">
      {/* Frosted Ambient Luminous Gradient Mesh (Behind Glass UI) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Light Theme Glow Orbs */}
        <div className="dark:hidden absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#F5ED31]/30 blur-[130px] transform-gpu"></div>
        <div className="dark:hidden absolute top-1/3 -right-40 w-[650px] h-[650px] rounded-full bg-[#FF934F]/25 blur-[140px] transform-gpu"></div>
        <div className="dark:hidden absolute -bottom-40 left-1/4 w-[500px] h-[500px] rounded-full bg-[#F5ED31]/20 blur-[120px] transform-gpu"></div>

        {/* Dark Theme Glow Orbs */}
        <div className="hidden dark:block absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#DAFC08]/12 blur-[140px] transform-gpu"></div>
        <div className="hidden dark:block absolute top-1/3 -right-40 w-[650px] h-[650px] rounded-full bg-[#547BDE]/14 blur-[150px] transform-gpu"></div>
        <div className="hidden dark:block absolute -bottom-40 left-1/3 w-[550px] h-[550px] rounded-full bg-[#DAFC08]/08 blur-[130px] transform-gpu"></div>
      </div>

      {/* Top Floating Frosted Header */}
      <Header
        onOpenQuickSearch={() => setQuickSearchOpen(true)}
        onOpenNewBooking={() => setNewBookingOpen(true)}
        onOpenNewJob={() => setNewJobOpen(true)}
        onOpenNewSale={() => setNewSaleOpen(true)}
        onOpenNewExpense={() => setNewExpenseOpen(true)}
        onNavigate={onNavigate}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(prev => !prev)}
      />

      {/* Main Workspace Body */}
      <div className="relative z-10 flex-1 flex overflow-hidden min-h-0">
        {/* Desktop Frosted Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={onNavigate}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
          onOpenInstallApp={() => setInstallModalOpen(true)}
          isInstalled={isInstalled}
          isInstallable={isInstallable}
        />

        {/* Main Content View with independent smooth scroll */}
        <main className="flex-1 h-full overflow-y-auto min-h-0 p-3 sm:p-4 md:p-5 pb-20 md:pb-8">
          <div className="w-full space-y-3.5 sm:space-y-4">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Navigation & Drawer */}
      <MobileNav
        currentView={currentView}
        onNavigate={onNavigate}
        onOpenInstallApp={() => setInstallModalOpen(true)}
        isInstalled={isInstalled}
      />

      {/* Global Modals */}
      <QuickSearchModal
        isOpen={quickSearchOpen}
        onClose={() => setQuickSearchOpen(false)}
        onSelectJob={() => {
          onNavigate('repairs');
        }}
        onNavigate={onNavigate}
      />

      <NewBookingModal
        isOpen={newBookingOpen}
        onClose={() => setNewBookingOpen(false)}
      />

      <NewJobCardModal
        isOpen={newJobOpen}
        onClose={() => setNewJobOpen(false)}
      />

      <NewSaleInvoiceModal
        isOpen={newSaleOpen}
        onClose={() => setNewSaleOpen(false)}
      />

      <NewExpenseModal
        isOpen={newExpenseOpen}
        onClose={() => setNewExpenseOpen(false)}
      />

      <InstallAppModal
        isOpen={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        platform={platform}
        onInstall={installApp}
      />

      {selectedJob && (
        <JobCardDetailModal
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
          job={selectedJob}
        />
      )}

      {/* Toast Notification Stack */}
      <ToastContainer />
    </div>
  );
};
