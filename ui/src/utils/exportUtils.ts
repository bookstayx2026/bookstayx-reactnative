import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Booking,
  RepairJob,
  InventoryItem,
  PurchaseOrder,
  Invoice,
  ResaleDevice,
  Expense,
  Staff,
  WarrantyClaim,
  ShopSettings,
} from '../types';
import { calculateFinancialSummary } from './calculations';
import { formatINR, formatDate, formatDateTime, maskIMEI } from './formatters';

export interface ExportDataPayload {
  periodLabel: string;
  startDate?: string;
  endDate?: string;
  selectedSections: {
    summary: boolean;
    bookings: boolean;
    repairs: boolean;
    inventory: boolean;
    purchases: boolean;
    sales: boolean;
    resale: boolean;
    expenses: boolean;
    staff: boolean;
    warranty: boolean;
  };
  bookings: Booking[];
  jobs: RepairJob[];
  inventory: InventoryItem[];
  purchaseOrders: PurchaseOrder[];
  invoices: Invoice[];
  resaleDevices: ResaleDevice[];
  expenses: Expense[];
  staff: Staff[];
  warrantyClaims: WarrantyClaim[];
  settings: ShopSettings;
}

export const exportToExcel = (payload: ExportDataPayload) => {
  const wb = XLSX.utils.book_new();
  const summary = calculateFinancialSummary(
    payload.invoices,
    payload.expenses,
    payload.jobs,
    payload.resaleDevices,
    payload.inventory,
    { startDate: payload.startDate, endDate: payload.endDate }
  );

  // 1. Summary Sheet
  if (payload.selectedSections.summary) {
    const summaryData = [
      ['ONE REPAIR CRM - EXECUTIVE PERFORMANCE REPORT', ''],
      ['Shop Location', `${payload.settings.shopName}, ${payload.settings.area}, ${payload.settings.city}`],
      ['GSTIN', payload.settings.gstNumber],
      ['Report Period', payload.periodLabel],
      ['Generated On', formatDateTime(new Date().toISOString())],
      ['Notice', 'Demo frontend estimate report. Real API data will replace mock state in production.'],
      ['', ''],
      ['FINANCIAL PERFORMANCE METRICS', 'AMOUNT (INR)'],
      ['Repair Net Sales (Excl. Tax)', summary.repairNetSales],
      ['Accessory Net Sales (Excl. Tax)', summary.accessoryNetSales],
      ['Resale Net Sales (Excl. Tax)', summary.resaleNetSales],
      ['TOTAL NET SALES', summary.totalNetSales],
      ['', ''],
      ['COST OF GOODS SOLD (COGS)', ''],
      ['Repair Parts Consumed Cost', summary.repairPartsCogs],
      ['Accessory Sold Cost', summary.accessoryCogs],
      ['Resale Phone Acquisition & Refurb Cost', summary.resaleCogs],
      ['TOTAL COGS', summary.totalCogs],
      ['', ''],
      ['GROSS PROFIT', summary.grossProfit],
      ['Gross Margin (%)', `${summary.grossMarginPct.toFixed(1)}%`],
      ['', ''],
      ['OPERATING EXPENSES (Paid)', summary.totalOperatingExpenses],
      ['ESTIMATED OPERATING PROFIT', summary.estimatedOperatingProfit],
      ['Operating Margin (%)', `${summary.operatingMarginPct.toFixed(1)}%`],
      ['', ''],
      ['CASH FLOW & RECEIVABLES', ''],
      ['Total Cash Collected (Inflow)', summary.totalCashCollected],
      ['Total Collected Tax (GST Payable)', summary.totalCollectedTax],
      ['Total Gross Invoiced (Incl. Tax)', summary.totalGrossInvoiced],
      ['Total Outstanding Receivables (Due)', summary.totalOutstandingReceivables],
      ['Total Invoices Issued', summary.invoiceCount],
      ['Paid Invoices', summary.paidInvoiceCount],
      ['Unpaid / Partial Invoices', summary.unpaidInvoiceCount + summary.partialInvoiceCount],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
  }

  // 2. Bookings Sheet
  if (payload.selectedSections.bookings) {
    const bookingsData = payload.bookings.map(b => ({
      'Booking ID': b.bookingNumber,
      'Customer Name': b.customerName,
      'Phone': b.customerPhone,
      'Device': `${b.deviceBrand} ${b.deviceModel}`,
      'Reported Fault': b.faultDescription,
      'Service Mode': b.serviceMode,
      'Source': b.source,
      'Preferred Date': formatDate(b.preferredDate),
      'Time Slot': b.preferredTimeSlot,
      'Status': b.status,
      'Assigned Staff': b.assignedStaffName || 'Unassigned',
      'Travel Fee (INR)': b.travelCharge,
      'Handover Status': b.handoverStatus,
      'Created At': formatDate(b.createdAt),
    }));
    const ws = XLSX.utils.json_to_sheet(bookingsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Bookings');
  }

  // 3. Repairs Sheet
  if (payload.selectedSections.repairs) {
    const repairsData = payload.jobs.map(j => ({
      'Job Card No': j.jobCardNumber,
      'Customer': j.customerName,
      'Phone': j.customerPhone,
      'Device': `${j.deviceBrand} ${j.deviceModel}`,
      'IMEI/Serial': maskIMEI(j.imeiSerial),
      'Fault': j.reportedFault,
      'Status': j.status,
      'Priority': j.priority,
      'Technician': j.technicianName,
      'Intake Date': formatDate(j.intakeDate),
      'Promised Date': formatDate(j.promisedDate),
      'Diagnosis': j.diagnosis,
      'Estimate Status': j.estimate.status,
      'Estimate (INR)': j.estimate.total,
      'Parts Count Used': j.partsUsed.length,
      'Machine Used': j.assignedMachineId || 'None',
      'Payment Status': j.invoiceSummary?.paymentStatus || 'Unpaid',
      'Warranty (Months)': j.warrantyMonths,
    }));
    const ws = XLSX.utils.json_to_sheet(repairsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Repairs');
  }

  // 4. Inventory Sheet
  if (payload.selectedSections.inventory) {
    const inventoryData = payload.inventory.map(i => ({
      'SKU': i.sku,
      'Name': i.name,
      'Category': i.category,
      'Type': i.type,
      'Grade': i.qualityGrade,
      'Supplier': i.supplierName,
      'Purchase Cost (INR)': i.purchaseCost,
      'Selling Price (INR)': i.sellingPrice,
      'On Hand Qty': i.onHandQty,
      'Reserved Qty': i.reservedQty,
      'Available Qty': i.availableQty,
      'Reorder Level': i.reorderLevel,
      'Stock Alert': i.availableQty <= i.reorderLevel ? 'LOW STOCK' : 'OK',
      'Location': i.location,
      'Warranty Days': i.warrantyDays,
      'Damaged Qty': i.damagedQty,
    }));
    const ws = XLSX.utils.json_to_sheet(inventoryData);
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
  }

  // 5. Purchases Sheet
  if (payload.selectedSections.purchases) {
    const poData = payload.purchaseOrders.map(po => ({
      'PO Number': po.poNumber,
      'Supplier': po.supplierName,
      'Type': po.isForeign ? `Import (${po.currency})` : 'Domestic',
      'Order Date': formatDate(po.orderDate),
      'Expected Delivery': formatDate(po.expectedDeliveryDate),
      'Status': po.status,
      'Items Count': po.items.length,
      'Subtotal (INR)': po.subtotal,
      'Freight & Landed Cost (INR)': po.freightAndLandedCost,
      'Total Cost (INR)': po.totalCost,
      'Payment Status': po.paymentStatus,
      'Amount Paid (INR)': po.amountPaid,
      'Balance Due (INR)': po.balanceDue,
      'Shipment Ref': po.shipmentReference || '—',
    }));
    const ws = XLSX.utils.json_to_sheet(poData);
    XLSX.utils.book_append_sheet(wb, ws, 'Purchases');
  }

  // 6. Sales Sheet
  if (payload.selectedSections.sales) {
    const salesData = payload.invoices.map(inv => ({
      'Invoice No': inv.invoiceNumber,
      'Type': inv.type,
      'Date': formatDate(inv.date),
      'Customer': inv.customerName,
      'Phone': inv.customerPhone,
      'Subtotal (INR)': inv.subtotal,
      'Discount (INR)': inv.discount,
      'Tax Amount (INR)': inv.taxAmount,
      'Grand Total (INR)': inv.grandTotal,
      'Amount Paid (INR)': inv.amountPaid,
      'Balance Due (INR)': inv.balanceDue,
      'Payment Status': inv.paymentStatus,
      'Tally Status': inv.tallyExported ? 'Exported' : 'Pending',
    }));
    const ws = XLSX.utils.json_to_sheet(salesData);
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');
  }

  // 7. Resale Sheet
  if (payload.selectedSections.resale) {
    const resaleData = payload.resaleDevices.map(r => ({
      'SKU': r.sku,
      'Device': `${r.brand} ${r.model} (${r.storage})`,
      'Condition': r.conditionGrade,
      'IMEI': maskIMEI(r.imeiSerial),
      'Acquisition Source': r.acquisitionSource,
      'Purchase Cost (INR)': r.purchaseCost,
      'Refurb Parts Cost (INR)': r.refurbPartsCost,
      'Refurb Labour Cost (INR)': r.refurbLabourCost,
      'Total Landed Cost (INR)': r.purchaseCost + r.totalRefurbCost,
      'Asking Price (INR)': r.askingPrice,
      'Sale Price (INR)': r.salePrice || '—',
      'Gross Margin (INR)': r.salePrice ? r.salePrice - (r.purchaseCost + r.totalRefurbCost) : '—',
      'Status': r.status,
      'Acquired Date': formatDate(r.acquiredDate),
      'Sold Date': formatDate(r.soldDate),
      'Warranty Days': r.warrantyDays,
    }));
    const ws = XLSX.utils.json_to_sheet(resaleData);
    XLSX.utils.book_append_sheet(wb, ws, 'Resale');
  }

  // 8. Payments Sheet
  const allPayments: any[] = [];
  payload.invoices.forEach(inv => {
    inv.payments.forEach(p => {
      allPayments.push({
        'Payment ID': p.id,
        'Invoice No': inv.invoiceNumber,
        'Customer': inv.customerName,
        'Date': formatDateTime(p.date),
        'Amount (INR)': p.amount,
        'Method': p.method,
        'Transaction Ref': p.transactionRef || 'N/A',
        'Recorded By': p.recordedBy,
      });
    });
  });
  if (allPayments.length > 0) {
    const ws = XLSX.utils.json_to_sheet(allPayments);
    XLSX.utils.book_append_sheet(wb, ws, 'Payments');
  }

  // 9. Expenses Sheet
  if (payload.selectedSections.expenses) {
    const expensesData = payload.expenses.map(e => ({
      'Expense No': e.expenseNumber,
      'Date': formatDate(e.date),
      'Category': e.category,
      'Description': e.description,
      'Amount (INR)': e.amount,
      'Payee': e.payee,
      'Payment Method': e.paymentMethod,
      'Payment Status': e.paymentStatus,
      'Recurrence': e.recurrence,
      'Entered By': e.enteredBy,
    }));
    const ws = XLSX.utils.json_to_sheet(expensesData);
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
  }

  // 10. Staff Sheet
  if (payload.selectedSections.staff) {
    const staffData = payload.staff.map(s => ({
      'Name': s.name,
      'Role': s.role,
      'Phone': s.phone,
      'Email': s.email,
      'Specialization': s.specialization,
      'Active Jobs Queue': s.activeJobsCount,
      'Monthly Completed Jobs': s.completedJobsMonth,
    }));
    const ws = XLSX.utils.json_to_sheet(staffData);
    XLSX.utils.book_append_sheet(wb, ws, 'Staff');
  }

  // 11. Warranty Claims Sheet
  if (payload.selectedSections.warranty) {
    const warrantyData = payload.warrantyClaims.map(w => ({
      'Claim No': w.claimNumber,
      'Invoice No': w.originalInvoiceNumber,
      'Customer': w.customerName,
      'Phone': w.customerPhone,
      'Device': w.deviceModel,
      'Part': w.partDescription,
      'Issue': w.issueReported,
      'Claim Date': formatDate(w.claimDate),
      'Status': w.status,
      'Resolved Date': formatDate(w.resolvedDate),
      'Action Taken': w.actionTaken || 'Under Review',
    }));
    const ws = XLSX.utils.json_to_sheet(warrantyData);
    XLSX.utils.book_append_sheet(wb, ws, 'Warranty');
  }

  // 12. Definitions & Accounting Policy Sheet
  const definitionsData = [
    ['METRIC / TERM', 'ACCOUNTING LOGIC & DEFINITION IN ONE REPAIR CRM'],
    ['Net Sales', 'Invoiced repair, accessory, and resale sales minus discounts and refunds, excluding collected tax (GST).'],
    ['Cost of Goods Sold (COGS)', 'Direct cost of parts consumed in completed repairs + inventory purchase cost of accessories sold + device purchase cost and refurbishment parts for sold resale phones.'],
    ['Gross Profit', 'Net Sales minus Cost of Goods Sold (COGS).'],
    ['Operating Expenses', 'Shop operational costs (staff salaries, technician incentives, shop rent, electricity, tools, machine maintenance, transport, marketing, internet). Does NOT double count stock purchases.'],
    ['Estimated Operating Profit', 'Gross Profit minus Operating Expenses.'],
    ['Cash Collected', 'Actual money received through Cash, UPI, Card, or Bank Transfer in the selected period.'],
    ['Outstanding Receivables', 'Unpaid balances remaining on issued invoices.'],
    ['Inventory Double Counting Rule', 'Stock purchases increase inventory asset and create supplier payables. Stock is ONLY counted as COGS when consumed on a repair or sold as an accessory/phone.'],
  ];
  const wsDef = XLSX.utils.aoa_to_sheet(definitionsData);
  XLSX.utils.book_append_sheet(wb, wsDef, 'Definitions');

  // Trigger download
  const cleanPeriod = payload.periodLabel.toLowerCase().replace(/\s+/g, '_');
  const filename = `OneRepair_CRM_Report_${cleanPeriod}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
};

export const exportToPDF = (payload: ExportDataPayload) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const summary = calculateFinancialSummary(
    payload.invoices,
    payload.expenses,
    payload.jobs,
    payload.resaleDevices,
    payload.inventory,
    { startDate: payload.startDate, endDate: payload.endDate }
  );

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 15;

  // Header Banner
  doc.setFillColor(26, 26, 26);
  doc.rect(10, 10, pageWidth - 20, 26, 'F');

  doc.setTextColor(218, 252, 8); // #DAFC08 Lime
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ONE REPAIR CRM & ERP - PIMPRI HUB', 15, 20);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Shop: ${payload.settings.shopName} | ${payload.settings.area}, ${payload.settings.city} | GSTIN: ${payload.settings.gstNumber}`, 15, 27);
  doc.text(`Report Period: ${payload.periodLabel} | Generated: ${formatDateTime(new Date().toISOString())}`, 15, 32);

  currentY = 42;

  // Financial KPI Cards Table
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Executive Financial Summary (Demo Estimates)', 14, currentY);
  currentY += 4;

  const financialRows = [
    ['Repair Invoiced Net Sales', formatINR(summary.repairNetSales), 'Repair Parts COGS', formatINR(summary.repairPartsCogs)],
    ['Accessory Net Sales', formatINR(summary.accessoryNetSales), 'Accessory COGS', formatINR(summary.accessoryCogs)],
    ['Resale Phones Net Sales', formatINR(summary.resaleNetSales), 'Resale Acquisition & Refurb COGS', formatINR(summary.resaleCogs)],
    ['TOTAL NET SALES (Excl Tax)', formatINR(summary.totalNetSales), 'TOTAL COGS', formatINR(summary.totalCogs)],
    ['GROSS PROFIT', formatINR(summary.grossProfit), 'Gross Margin (%)', `${summary.grossMarginPct.toFixed(1)}%`],
    ['OPERATING EXPENSES (Paid)', formatINR(summary.totalOperatingExpenses), 'ESTIMATED OPERATING PROFIT', formatINR(summary.estimatedOperatingProfit)],
    ['Total Cash Collected (Inflow)', formatINR(summary.totalCashCollected), 'Outstanding Receivables (Due)', formatINR(summary.totalOutstandingReceivables)],
    ['Total Tax (GST Collected)', formatINR(summary.totalCollectedTax), 'Total Invoices Issued', summary.invoiceCount.toString()],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Revenue Metric', 'Amount', 'Cost / Margin Metric', 'Amount']],
    body: financialRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Repair Pipeline Table
  if (payload.selectedSections.repairs && payload.jobs.length > 0) {
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('2. Repair Job Operations (Recent Active & Completed)', 14, currentY);
    currentY += 4;

    const repairRows = payload.jobs.slice(0, 15).map(j => [
      j.jobCardNumber,
      j.customerName,
      `${j.deviceBrand} ${j.deviceModel}`,
      j.technicianName,
      j.status,
      formatINR(j.estimate.total),
      j.invoiceSummary?.paymentStatus || 'Unpaid',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Job ID', 'Customer', 'Device', 'Tech', 'Status', 'Estimate', 'Payment']],
      body: repairRows,
      theme: 'striped',
      headStyles: { fillColor: [84, 123, 222], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5 },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Inventory Critical Alerts Table
  if (payload.selectedSections.inventory && payload.inventory.length > 0) {
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('3. Inventory Status & Reorder Alerts', 14, currentY);
    currentY += 4;

    const inventoryRows = payload.inventory.slice(0, 12).map(i => [
      i.sku,
      i.name,
      i.category,
      formatINR(i.purchaseCost),
      formatINR(i.sellingPrice),
      `${i.onHandQty} (Avail: ${i.availableQty})`,
      i.availableQty <= i.reorderLevel ? 'LOW STOCK' : 'OK',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['SKU', 'Item Name', 'Category', 'Cost', 'Price', 'Stock', 'Alert']],
      body: inventoryRows,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5 },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Expenses Breakdown Table
  if (payload.selectedSections.expenses && payload.expenses.length > 0) {
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('4. Operating Expenses Breakdown', 14, currentY);
    currentY += 4;

    const expenseCategoryRows = Object.entries(summary.expensesByCategory).map(([cat, amt]) => [
      cat,
      formatINR(amt),
      summary.totalOperatingExpenses > 0 ? `${((amt / summary.totalOperatingExpenses) * 100).toFixed(1)}%` : '0%',
      'Operating Cost (Not Double Counted with Inventory)',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Expense Category', 'Total Amount', '% of Expenses', 'Accounting Treatment']],
      body: expenseCategoryRows,
      theme: 'striped',
      headStyles: { fillColor: [180, 83, 9], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5 },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Add Page Numbers and Disclaimer Footer to each page
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text(
      'Confidential Internal Document — One Repair Pimpri. Demo frontend data generated for evaluation.',
      14,
      doc.internal.pageSize.getHeight() - 8
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - 28,
      doc.internal.pageSize.getHeight() - 8
    );
  }

  const cleanPeriod = payload.periodLabel.toLowerCase().replace(/\s+/g, '_');
  const filename = `OneRepair_Performance_Report_${cleanPeriod}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
};
