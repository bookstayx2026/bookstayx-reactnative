import { Invoice, Expense, RepairJob, ResaleDevice, InventoryItem } from '../types';

export interface FinancialSummary {
  repairNetSales: number;
  accessoryNetSales: number;
  resaleNetSales: number;
  totalNetSales: number;
  
  repairPartsCogs: number;
  accessoryCogs: number;
  resaleCogs: number;
  totalCogs: number;
  
  grossProfit: number;
  grossMarginPct: number;
  
  totalOperatingExpenses: number;
  expensesByCategory: Record<string, number>;
  
  estimatedOperatingProfit: number;
  operatingMarginPct: number;
  
  totalCollectedTax: number;
  totalGrossInvoiced: number; // Invoiced inclusive of tax
  
  totalCashCollected: number;
  totalOutstandingReceivables: number;
  
  invoiceCount: number;
  paidInvoiceCount: number;
  partialInvoiceCount: number;
  unpaidInvoiceCount: number;
}

export const calculateFinancialSummary = (
  invoices: Invoice[],
  expenses: Expense[],
  jobs: RepairJob[],
  resaleDevices: ResaleDevice[],
  inventory: InventoryItem[],
  dateFilter?: { startDate?: string; endDate?: string }
): FinancialSummary => {
  // Filter invoices if date range provided
  const filteredInvoices = invoices.filter(inv => {
    if (!dateFilter?.startDate && !dateFilter?.endDate) return true;
    const invDate = new Date(inv.date).getTime();
    if (dateFilter.startDate && invDate < new Date(dateFilter.startDate).getTime()) return false;
    if (dateFilter.endDate && invDate > new Date(dateFilter.endDate).getTime()) return false;
    return true;
  });

  // Filter expenses if date range provided
  const filteredExpenses = expenses.filter(exp => {
    if (!dateFilter?.startDate && !dateFilter?.endDate) return true;
    const expDate = new Date(exp.date).getTime();
    if (dateFilter.startDate && expDate < new Date(dateFilter.startDate).getTime()) return false;
    if (dateFilter.endDate && expDate > new Date(dateFilter.endDate).getTime()) return false;
    return true;
  });

  let repairNetSales = 0;
  let accessoryNetSales = 0;
  let resaleNetSales = 0;
  let totalCollectedTax = 0;
  let totalGrossInvoiced = 0;
  let totalCashCollected = 0;
  let totalOutstandingReceivables = 0;

  let paidInvoiceCount = 0;
  let partialInvoiceCount = 0;
  let unpaidInvoiceCount = 0;

  filteredInvoices.forEach(inv => {
    // Invoiced subtotal minus discount = net sales (excluding tax)
    const invoiceNet = Math.max(0, inv.subtotal - inv.discount);
    totalCollectedTax += inv.taxAmount || 0;
    totalGrossInvoiced += inv.grandTotal;
    totalOutstandingReceivables += inv.balanceDue;

    if (inv.paymentStatus === 'Paid') paidInvoiceCount++;
    else if (inv.paymentStatus === 'Partial') partialInvoiceCount++;
    else if (inv.paymentStatus === 'Unpaid') unpaidInvoiceCount++;

    // Calculate actual payments received
    const paymentsSum = inv.payments.reduce((sum, p) => sum + p.amount, 0);
    totalCashCollected += paymentsSum;

    if (inv.type === 'Repair Job') {
      repairNetSales += invoiceNet;
    } else if (inv.type === 'Accessory Counter Sale') {
      accessoryNetSales += invoiceNet;
    } else if (inv.type === 'Resale Device Sale') {
      resaleNetSales += invoiceNet;
    }
  });

  const totalNetSales = repairNetSales + accessoryNetSales + resaleNetSales;

  // COGS Calculations:
  // 1. Repair Parts Consumed: parts used in completed / ready repairs with invoices
  let repairPartsCogs = 0;
  jobs.forEach(job => {
    if (job.status === 'Completed' || job.status === 'Ready for Pickup') {
      job.partsUsed.forEach(part => {
        repairPartsCogs += (part.unitCost || 0) * (part.quantity || 1);
      });
    }
  });

  // 2. Accessory COGS: find cost of goods sold from accessory invoices
  let accessoryCogs = 0;
  filteredInvoices
    .filter(inv => inv.type === 'Accessory Counter Sale')
    .forEach(inv => {
      inv.items.forEach(item => {
        // Find matching inventory item to get true purchase cost
        const matchedInv = inventory.find(i => i.name.toLowerCase() === item.description.toLowerCase() || i.category.includes('Accessory') || i.category.includes('Charger'));
        const unitCost = matchedInv ? matchedInv.purchaseCost : item.unitPrice * 0.45; // default 45% cost margin
        accessoryCogs += unitCost * item.quantity;
      });
    });

  // 3. Resale Device COGS: acquisition cost + refurbishment parts & labour for sold units
  let resaleCogs = 0;
  resaleDevices
    .filter(d => d.status === 'Sold')
    .forEach(d => {
      resaleCogs += (d.purchaseCost || 0) + (d.totalRefurbCost || 0);
    });

  const totalCogs = repairPartsCogs + accessoryCogs + resaleCogs;
  const grossProfit = totalNetSales - totalCogs;
  const grossMarginPct = totalNetSales > 0 ? (grossProfit / totalNetSales) * 100 : 0;

  // Operating Expenses breakdown
  const expensesByCategory: Record<string, number> = {};
  let totalOperatingExpenses = 0;

  filteredExpenses.forEach(exp => {
    if (exp.paymentStatus === 'Paid') {
      totalOperatingExpenses += exp.amount;
      expensesByCategory[exp.category] = (expensesByCategory[exp.category] || 0) + exp.amount;
    }
  });

  const estimatedOperatingProfit = grossProfit - totalOperatingExpenses;
  const operatingMarginPct = totalNetSales > 0 ? (estimatedOperatingProfit / totalNetSales) * 100 : 0;

  return {
    repairNetSales,
    accessoryNetSales,
    resaleNetSales,
    totalNetSales,
    repairPartsCogs,
    accessoryCogs,
    resaleCogs,
    totalCogs,
    grossProfit,
    grossMarginPct,
    totalOperatingExpenses,
    expensesByCategory,
    estimatedOperatingProfit,
    operatingMarginPct,
    totalCollectedTax,
    totalGrossInvoiced,
    totalCashCollected,
    totalOutstandingReceivables,
    invoiceCount: filteredInvoices.length,
    paidInvoiceCount,
    partialInvoiceCount,
    unpaidInvoiceCount,
  };
};
