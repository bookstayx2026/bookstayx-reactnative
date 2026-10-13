import React, { useState } from 'react';
import { CRMProvider } from './context/CRMContext';
import { Layout } from './components/layout/Layout';
import { DashboardView } from './views/DashboardView';
import { BookingsView } from './views/BookingsView';
import { RepairJobsView } from './views/RepairJobsView';
import { WorkshopView } from './views/WorkshopView';
import { InventoryView } from './views/InventoryView';
import { ResaleView } from './views/ResaleView';
import { PurchasesView } from './views/PurchasesView';
import { BillingView } from './views/BillingView';
import { ExpensesView } from './views/ExpensesView';
import { CustomersView } from './views/CustomersView';
import { ReportsView } from './views/ReportsView';
import { DownloadReportView } from './views/DownloadReportView';
import { StaffView } from './views/StaffView';
import { SettingsView } from './views/SettingsView';

export const App: React.FC = () => {
  // STRICT SCOPE: The default screen must be the internal Dashboard.
  const [currentView, setCurrentView] = useState<string>('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView onNavigate={setCurrentView} />;
      case 'bookings':
        return <BookingsView />;
      case 'repairs':
        return <RepairJobsView />;
      case 'workshop':
        return <WorkshopView />;
      case 'inventory':
        return <InventoryView />;
      case 'resale':
        return <ResaleView />;
      case 'purchases':
        return <PurchasesView />;
      case 'billing':
        return <BillingView />;
      case 'expenses':
        return <ExpensesView />;
      case 'customers':
        return <CustomersView />;
      case 'reports':
        return <ReportsView onNavigate={setCurrentView} />;
      case 'download_report':
        return <DownloadReportView />;
      case 'staff':
        return <StaffView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView onNavigate={setCurrentView} />;
    }
  };

  return (
    <CRMProvider>
      <Layout currentView={currentView} onNavigate={setCurrentView}>
        {renderView()}
      </Layout>
    </CRMProvider>
  );
};

export default App;
