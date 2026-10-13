import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ThemeMode,
  Staff,
  Machine,
  Booking,
  RepairJob,
  InventoryItem,
  ResaleDevice,
  PurchaseOrder,
  Supplier,
  Invoice,
  Expense,
  Customer,
  WarrantyClaim,
  ShopSettings,
  StockMovement,
  JobStatus,
  Estimate,
  PaymentMethod,
  ResaleStatus,
} from '../types';
import {
  INITIAL_STAFF,
  INITIAL_MACHINES,
  INITIAL_BOOKINGS,
  INITIAL_REPAIR_JOBS,
  INITIAL_INVENTORY,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_RESALE_DEVICES,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_SUPPLIERS,
  INITIAL_INVOICES,
  INITIAL_EXPENSES,
  INITIAL_CUSTOMERS,
  INITIAL_WARRANTY_CLAIMS,
  INITIAL_SETTINGS,
} from '../mock/initialData';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: number;
}

interface CRMContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;

  staff: Staff[];
  currentStaff: Staff;
  setCurrentStaff: (staff: Staff) => void;

  machines: Machine[];
  updateMachineStatus: (id: string, status: Machine['status'], note?: string) => void;

  bookings: Booking[];
  addBooking: (booking: Omit<Booking, 'id' | 'bookingNumber' | 'createdAt'>) => Booking;
  updateBookingStatus: (id: string, status: Booking['status']) => void;
  convertBookingToJobCard: (bookingId: string) => RepairJob;

  jobs: RepairJob[];
  selectedJob: RepairJob | null;
  setSelectedJob: (job: RepairJob | null) => void;
  addRepairJob: (job: Omit<RepairJob, 'id' | 'jobCardNumber' | 'createdAt' | 'timeline'>) => RepairJob;
  updateJobStatus: (id: string, status: JobStatus, note?: string) => void;
  updateJobEstimate: (jobId: string, estimate: Estimate) => void;
  approveEstimate: (jobId: string) => void;
  rejectEstimate: (jobId: string, reason: string) => void;
  assignJobMachine: (jobId: string, machineId: string, slot?: string) => void;
  assignJobTechnician: (jobId: string, technicianId: string) => void;
  toggleQualityCheckItem: (jobId: string, checkItemId: string) => void;
  addJobPart: (jobId: string, inventoryId: string, quantity: number) => boolean;
  completeRepairAndInvoice: (jobId: string) => Invoice;
  handoverDevice: (jobId: string, remarks?: string) => void;

  inventory: InventoryItem[];
  stockMovements: StockMovement[];
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'availableQty'>) => void;
  adjustStock: (itemId: string, delta: number, reason: StockMovement['type'], notes: string) => void;

  resaleDevices: ResaleDevice[];
  addResaleDevice: (device: Omit<ResaleDevice, 'id' | 'sku' | 'acquiredDate' | 'totalRefurbCost'>) => void;
  updateResaleStatus: (id: string, status: ResaleStatus, refurbPartsCost?: number, refurbLabourCost?: number) => void;
  sellResaleDevice: (resaleId: string, salePrice: number, customerName: string, customerPhone: string, paymentMethod: PaymentMethod) => Invoice;

  purchaseOrders: PurchaseOrder[];
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'poNumber' | 'totalCost'>) => void;
  receivePurchaseOrderStock: (poId: string, receivedMap: Record<string, number>, actualFreightLanded?: number) => void;

  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;

  invoices: Invoice[];
  createInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber'>) => Invoice;
  recordPayment: (invoiceId: string, amount: number, method: PaymentMethod, ref?: string) => void;

  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'expenseNumber'>) => void;
  deleteExpense: (id: string) => void;

  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'totalVisits' | 'totalSpent' | 'outstandingBalance' | 'registeredDate'>) => void;
  toggleCustomerReviewRequested: (customerId: string) => void;

  warrantyClaims: WarrantyClaim[];
  addWarrantyClaim: (claim: Omit<WarrantyClaim, 'id' | 'claimNumber' | 'claimDate'>) => void;
  updateWarrantyClaimStatus: (id: string, status: WarrantyClaim['status'], actionTaken?: string) => void;

  settings: ShopSettings;
  updateSettings: (newSettings: Partial<ShopSettings>) => void;

  toasts: ToastMessage[];
  showToast: (title: string, message: string, type?: ToastMessage['type']) => void;
  dismissToast: (id: string) => void;

  // Interactive Guided Demos
  triggerDemoFlow: (flow: 'full_repair' | 'stock_blocker' | 'po_receive' | 'resale_lifecycle' | 'rent_expense') => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme State
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('one_repair_theme');
    return (saved as ThemeMode) || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('one_repair_theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setThemeMode = (mode: ThemeMode) => {
    setTheme(mode);
  };

  // State initialization
  const [staff, setStaff] = useState<Staff[]>(INITIAL_STAFF);
  const [currentStaff, setCurrentStaff] = useState<Staff>(INITIAL_STAFF[0]);
  const [machines, setMachines] = useState<Machine[]>(INITIAL_MACHINES);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [jobs, setJobs] = useState<RepairJob[]>(INITIAL_REPAIR_JOBS);
  const [selectedJob, setSelectedJob] = useState<RepairJob | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(INITIAL_STOCK_MOVEMENTS);
  const [resaleDevices, setResaleDevices] = useState<ResaleDevice[]>(INITIAL_RESALE_DEVICES);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(INITIAL_PURCHASE_ORDERS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [warrantyClaims, setWarrantyClaims] = useState<WarrantyClaim[]>(INITIAL_WARRANTY_CLAIMS);
  const [settings, setSettings] = useState<ShopSettings>(INITIAL_SETTINGS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast helper
  const showToast = (title: string, message: string, type: ToastMessage['type'] = 'info') => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    setToasts(prev => [...prev, { id, title, message, type, timestamp: Date.now() }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // 1. Machine status update
  const updateMachineStatus = (id: string, status: Machine['status'], note?: string) => {
    setMachines(prev =>
      prev.map(m => (m.id === id ? { ...m, status, maintenanceNote: note || m.maintenanceNote } : m))
    );
    showToast('Machine Updated', `Machine ${id} status set to ${status}`, 'info');
  };

  // 2. Bookings
  const addBooking = (data: Omit<Booking, 'id' | 'bookingNumber' | 'createdAt'>): Booking => {
    const count = bookings.length + 1;
    const bookingNumber = `BKG-2026-${String(count).padStart(3, '0')}`;
    const newBooking: Booking = {
      ...data,
      id: bookingNumber,
      bookingNumber,
      createdAt: new Date().toISOString(),
    };
    setBookings(prev => [newBooking, ...prev]);
    showToast('Booking Created', `Booking ${bookingNumber} added for ${newBooking.customerName}`, 'success');
    return newBooking;
  };

  const updateBookingStatus = (id: string, status: Booking['status']) => {
    setBookings(prev => prev.map(b => (b.id === id ? { ...b, status } : b)));
    showToast('Booking Status Updated', `Booking ${id} marked as ${status}`, 'info');
  };

  const convertBookingToJobCard = (bookingId: string): RepairJob => {
    const bkg = bookings.find(b => b.id === bookingId);
    const count = jobs.length + 90;
    const jobCardNumber = `JOB-2026-${String(count).padStart(3, '0')}`;

    const newJob: RepairJob = {
      id: jobCardNumber,
      jobCardNumber,
      bookingId: bkg?.id,
      customerName: bkg?.customerName || 'Customer',
      customerPhone: bkg?.customerPhone || '+91 98000 00000',
      customerAddress: bkg?.address || 'Pimpri, Pune',
      deviceBrand: bkg?.deviceBrand || 'Smartphone',
      deviceModel: bkg?.deviceModel || 'Model',
      reportedFault: bkg?.faultDescription || 'Inspection required',
      conditionPhotos: [],
      physicalCondition: {
        bodyScratches: true,
        crackedScreen: false,
        backGlassBroken: false,
        liquidDamage: false,
        powerOn: true,
        cameraWorking: true,
        touchWorking: true,
        speakerWorking: true,
        notes: 'Intake from booking #' + bookingId,
      },
      accessoriesReceived: ['Device only'],
      intakeDate: new Date().toISOString(),
      promisedDate: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
      technicianId: bkg?.assignedStaffId || 'staff-2',
      technicianName: bkg?.assignedStaffName || 'Rahul Jadhav',
      priority: 'Normal',
      status: 'Diagnosing',
      diagnosis: 'Initial diagnostic scan in progress.',
      internalNotes: `Converted from booking ${bookingId}. Service Mode: ${bkg?.serviceMode}`,
      customerNotes: 'Device received at Pimpri workshop for diagnosis.',
      estimate: {
        id: `EST-${count}-1`,
        revisionNumber: 1,
        initialIndicativePrice: 1500,
        confirmedPrice: 1500,
        partsCost: 0,
        labourCost: 1500,
        pickupFee: bkg?.travelCharge || 0,
        discount: 0,
        taxRate: 18,
        taxAmount: 270,
        total: 1770,
        estimatedCompletionDate: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
        status: 'Draft',
      },
      partsUsed: [],
      qualityChecklist: [
        { id: 'qc-c1', item: 'Display & Touch digitizer calibration', checked: false },
        { id: 'qc-c2', item: 'Speaker, Mic & Earpiece sound test', checked: false },
        { id: 'qc-c3', item: 'Front and Rear cameras focus test', checked: false },
        { id: 'qc-c4', item: 'Charging port & Fast charge recognition', checked: false },
      ],
      warrantyMonths: 3,
      timeline: [
        {
          id: 'tl-c1',
          timestamp: new Date().toISOString(),
          title: 'Booking Converted to Job Card',
          description: `Device checked in from booking ${bookingId}`,
          staffName: currentStaff.name,
          badgeType: 'info',
        },
      ],
      createdAt: new Date().toISOString(),
    };

    setJobs(prev => [newJob, ...prev]);
    setBookings(prev =>
      prev.map(b => (b.id === bookingId ? { ...b, status: 'Converted to Job', jobCardId: jobCardNumber } : b))
    );
    showToast('Job Card Generated', `Booking ${bookingId} converted to Job #${jobCardNumber}`, 'success');
    return newJob;
  };

  // 3. Repair Jobs
  const addRepairJob = (data: Omit<RepairJob, 'id' | 'jobCardNumber' | 'createdAt' | 'timeline'>): RepairJob => {
    const count = jobs.length + 90;
    const jobCardNumber = `JOB-2026-${String(count).padStart(3, '0')}`;
    const newJob: RepairJob = {
      ...data,
      id: jobCardNumber,
      jobCardNumber,
      timeline: [
        {
          id: 'tl-' + Date.now(),
          timestamp: new Date().toISOString(),
          title: 'Job Card Created',
          description: `Device intake logged for ${data.customerName}`,
          staffName: currentStaff.name,
          badgeType: 'info',
        },
      ],
      createdAt: new Date().toISOString(),
    };
    setJobs(prev => [newJob, ...prev]);
    showToast('New Job Created', `Job Card #${jobCardNumber} created for ${data.deviceBrand} ${data.deviceModel}`, 'success');
    return newJob;
  };

  const updateJobStatus = (id: string, status: JobStatus, note?: string) => {
    setJobs(prev =>
      prev.map(j => {
        if (j.id !== id) return j;
        const newTimeline = [
          ...j.timeline,
          {
            id: 'tl-' + Date.now(),
            timestamp: new Date().toISOString(),
            title: `Status updated to ${status}`,
            description: note || `Job progress moved to ${status}`,
            staffName: currentStaff.name,
            badgeType: status === 'Completed' || status === 'Ready for Pickup' ? ('success' as const) : ('info' as const),
          },
        ];
        return { ...j, status, timeline: newTimeline };
      })
    );
    showToast('Job Status Changed', `Job ${id} is now ${status}`, 'info');
  };

  const updateJobEstimate = (jobId: string, estimate: Estimate) => {
    setJobs(prev =>
      prev.map(j => {
        if (j.id !== jobId) return j;
        return {
          ...j,
          estimate,
          timeline: [
            ...j.timeline,
            {
              id: 'tl-' + Date.now(),
              timestamp: new Date().toISOString(),
              title: `Estimate Updated (Rev ${estimate.revisionNumber})`,
              description: `Estimate updated to ₹${estimate.total} (Status: ${estimate.status})`,
              staffName: currentStaff.name,
              badgeType: 'warning' as const,
            },
          ],
        };
      })
    );
    showToast('Estimate Updated', `Job ${jobId} estimate updated to ₹${estimate.total}`, 'info');
  };

  const approveEstimate = (jobId: string) => {
    setJobs(prev =>
      prev.map(j => {
        if (j.id !== jobId) return j;
        const newEst: Estimate = {
          ...j.estimate,
          status: 'Approved',
          approvedAt: new Date().toISOString(),
          approvedByCustomer: true,
        };
        const nextStatus: JobStatus = j.status === 'Awaiting Customer Approval' ? 'Queued' : j.status;
        return {
          ...j,
          status: nextStatus,
          estimate: newEst,
          timeline: [
            ...j.timeline,
            {
              id: 'tl-' + Date.now(),
              timestamp: new Date().toISOString(),
              title: 'Customer Approved Estimate',
              description: `Estimate of ₹${newEst.total} confirmed. Ready for technician queue.`,
              staffName: currentStaff.name,
              badgeType: 'success' as const,
            },
          ],
        };
      })
    );
    showToast('Estimate Approved', `Customer confirmed estimate for Job ${jobId}`, 'success');
  };

  const rejectEstimate = (jobId: string, reason: string) => {
    setJobs(prev =>
      prev.map(j => {
        if (j.id !== jobId) return j;
        const newEst: Estimate = {
          ...j.estimate,
          status: 'Rejected',
          notes: reason,
        };
        return {
          ...j,
          status: 'Cancelled',
          estimate: newEst,
          timeline: [
            ...j.timeline,
            {
              id: 'tl-' + Date.now(),
              timestamp: new Date().toISOString(),
              title: 'Customer Rejected Estimate',
              description: `Reason: ${reason}`,
              staffName: currentStaff.name,
              badgeType: 'error' as const,
            },
          ],
        };
      })
    );
    showToast('Estimate Rejected', `Job ${jobId} marked Cancelled`, 'warning');
  };

  const assignJobMachine = (jobId: string, machineId: string, slot?: string) => {
    setJobs(prev =>
      prev.map(j => (j.id === jobId ? { ...j, assignedMachineId: machineId, machineSlot: slot || 'Immediate' } : j))
    );
    setMachines(prev =>
      prev.map(m =>
        m.id === machineId
          ? {
              ...m,
              status: 'In Use',
              currentJobId: jobId,
              currentJobNumber: jobId,
              currentSlot: slot || 'Current Slot',
              operatorName: currentStaff.name,
            }
          : m
      )
    );
    showToast('Machine Scheduled', `Job ${jobId} assigned to ${machineId} (${slot || 'Active'})`, 'info');
  };

  const assignJobTechnician = (jobId: string, technicianId: string) => {
    const tech = staff.find(s => s.id === technicianId);
    setJobs(prev =>
      prev.map(j =>
        j.id === jobId
          ? {
              ...j,
              technicianId,
              technicianName: tech?.name || 'Technician',
              timeline: [
                ...j.timeline,
                {
                  id: 'tl-' + Date.now(),
                  timestamp: new Date().toISOString(),
                  title: 'Technician Assigned',
                  description: `Assigned to ${tech?.name}`,
                  staffName: currentStaff.name,
                },
              ],
            }
          : j
      )
    );
    showToast('Technician Assigned', `Job ${jobId} assigned to ${tech?.name}`, 'info');
  };

  const toggleQualityCheckItem = (jobId: string, checkItemId: string) => {
    setJobs(prev =>
      prev.map(j => {
        if (j.id !== jobId) return j;
        const updatedChecklist = j.qualityChecklist.map(item =>
          item.id === checkItemId
            ? {
                ...item,
                checked: !item.checked,
                checkedBy: !item.checked ? currentStaff.name : undefined,
                checkedAt: !item.checked ? new Date().toISOString() : undefined,
              }
            : item
        );
        return { ...j, qualityChecklist: updatedChecklist };
      })
    );
  };

  const addJobPart = (jobId: string, inventoryId: string, quantity: number): boolean => {
    const item = inventory.find(i => i.id === inventoryId);
    if (!item) {
      showToast('Part Not Found', 'Selected inventory item does not exist', 'error');
      return false;
    }
    if (item.availableQty < quantity) {
      showToast('Insufficient Stock', `${item.name} has only ${item.availableQty} units available. Job is blocked.`, 'error');
      updateJobStatus(jobId, 'Waiting for Parts', `Missing stock for ${item.name} (${item.sku})`);
      return false;
    }

    // Reserve part in inventory
    setInventory(prev =>
      prev.map(i => {
        if (i.id !== inventoryId) return i;
        const newReserved = i.reservedQty + quantity;
        return { ...i, reservedQty: newReserved, availableQty: i.onHandQty - newReserved };
      })
    );

    // Add to job parts
    setJobs(prev =>
      prev.map(j => {
        if (j.id !== jobId) return j;
        const existingPart = j.partsUsed.find(p => p.inventoryId === inventoryId);
        let updatedParts = [];
        if (existingPart) {
          updatedParts = j.partsUsed.map(p =>
            p.inventoryId === inventoryId ? { ...p, quantity: p.quantity + quantity } : p
          );
        } else {
          updatedParts = [
            ...j.partsUsed,
            {
              inventoryId,
              sku: item.sku,
              name: item.name,
              quantity,
              unitCost: item.purchaseCost,
              unitPrice: item.sellingPrice,
              reserved: true,
              consumed: false,
            },
          ];
        }
        return {
          ...j,
          partsUsed: updatedParts,
          timeline: [
            ...j.timeline,
            {
              id: 'tl-' + Date.now(),
              timestamp: new Date().toISOString(),
              title: 'Part Reserved from Stock',
              description: `${quantity}x ${item.name} reserved for this repair`,
              staffName: currentStaff.name,
            },
          ],
        };
      })
    );

    showToast('Part Reserved', `${quantity}x ${item.name} allocated to Job ${jobId}`, 'success');
    return true;
  };

  const completeRepairAndInvoice = (jobId: string): Invoice => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) throw new Error('Job not found');

    // Mark parts as consumed in inventory & stock movements
    job.partsUsed.forEach(part => {
      setInventory(prev =>
        prev.map(i => {
          if (i.id !== part.inventoryId) return i;
          const newOnHand = Math.max(0, i.onHandQty - part.quantity);
          const newReserved = Math.max(0, i.reservedQty - part.quantity);
          return {
            ...i,
            onHandQty: newOnHand,
            reservedQty: newReserved,
            availableQty: newOnHand - newReserved,
          };
        })
      );

      const newMov: StockMovement = {
        id: 'MOV-' + Date.now() + '-' + Math.floor(Math.random() * 100),
        itemId: part.inventoryId,
        itemSku: part.sku,
        itemName: part.name,
        type: 'Job Consumption',
        quantity: -part.quantity,
        balanceAfter: 0,
        referenceNumber: job.jobCardNumber,
        date: new Date().toISOString(),
        performedBy: currentStaff.name,
        notes: `Installed and consumed in Job Card #${job.jobCardNumber}`,
      };
      setStockMovements(prev => [newMov, ...prev]);
    });

    // Create Invoice
    const invoiceNumber = `INV-2026-${String(invoices.length + 51).padStart(3, '0')}`;
    const subtotal = job.estimate.confirmedPrice || job.estimate.total;
    const taxAmount = (subtotal * job.estimate.taxRate) / 100;
    const grandTotal = subtotal + taxAmount;

    const newInvoice: Invoice = {
      id: invoiceNumber,
      invoiceNumber,
      type: 'Repair Job',
      customerName: job.customerName,
      customerPhone: job.customerPhone,
      customerAddress: job.customerAddress,
      date: new Date().toISOString().slice(0, 10),
      dueDate: new Date().toISOString().slice(0, 10),
      relatedJobId: job.id,
      items: [
        ...job.partsUsed.map(p => ({
          id: 'item-' + Math.random().toString(36).substr(2, 6),
          description: p.name,
          quantity: p.quantity,
          unitPrice: p.unitPrice,
          amount: p.unitPrice * p.quantity,
          type: 'Part' as const,
        })),
        {
          id: 'item-labour',
          description: `Repair Service & Technical Labour (${job.diagnosis || 'Diagnostic & Installation'})`,
          quantity: 1,
          unitPrice: job.estimate.labourCost || 1500,
          amount: job.estimate.labourCost || 1500,
          type: 'Labour' as const,
        },
      ],
      subtotal,
      discount: job.estimate.discount || 0,
      taxRate: job.estimate.taxRate || 18,
      taxAmount,
      grandTotal,
      amountPaid: 0,
      balanceDue: grandTotal,
      paymentStatus: 'Unpaid',
      payments: [],
      tallyExported: false,
      notes: `${job.warrantyMonths} Months shop repair warranty. Device ${job.deviceBrand} ${job.deviceModel}`,
    };

    setInvoices(prev => [newInvoice, ...prev]);

    // Update job status to Ready for Pickup
    setJobs(prev =>
      prev.map(j => {
        if (j.id !== jobId) return j;
        return {
          ...j,
          status: 'Ready for Pickup',
          invoiceSummary: {
            invoiceId: newInvoice.id,
            invoiceNumber: newInvoice.invoiceNumber,
            subtotal,
            partsCost: j.estimate.partsCost,
            labourCost: j.estimate.labourCost,
            travelFee: j.estimate.pickupFee,
            discount: j.estimate.discount,
            taxAmount,
            total: grandTotal,
            amountPaid: 0,
            balanceDue: grandTotal,
            paymentStatus: 'Unpaid',
          },
          timeline: [
            ...j.timeline,
            {
              id: 'tl-' + Date.now(),
              timestamp: new Date().toISOString(),
              title: 'Repair Completed & Invoice Generated',
              description: `Quality check passed. Invoice #${invoiceNumber} issued for ₹${grandTotal}. Ready for customer pickup.`,
              staffName: currentStaff.name,
              badgeType: 'success' as const,
            },
          ],
        };
      })
    );

    showToast('Repair Completed', `Invoice #${invoiceNumber} created. Device is ready for pickup!`, 'success');
    return newInvoice;
  };

  const handoverDevice = (jobId: string, remarks?: string) => {
    setJobs(prev =>
      prev.map(j => {
        if (j.id !== jobId) return j;
        return {
          ...j,
          status: 'Completed',
          handoverAcknowledgment: {
            acknowledged: true,
            handedOverBy: currentStaff.name,
            handedOverAt: new Date().toISOString(),
            customerRemarks: remarks || 'Device tested and handed over to customer in working condition.',
          },
          timeline: [
            ...j.timeline,
            {
              id: 'tl-' + Date.now(),
              timestamp: new Date().toISOString(),
              title: 'Device Handed Over to Customer',
              description: `Customer acknowledgment recorded by ${currentStaff.name}. Repair completed.`,
              staffName: currentStaff.name,
              badgeType: 'success' as const,
            },
          ],
        };
      })
    );
    showToast('Handover Recorded', `Job ${jobId} marked as fully Completed`, 'success');
  };

  // 4. Inventory
  const addInventoryItem = (data: Omit<InventoryItem, 'id' | 'availableQty'>) => {
    const id = 'INV-' + String(inventory.length + 1).padStart(3, '0');
    const newItem: InventoryItem = {
      ...data,
      id,
      availableQty: data.onHandQty - (data.reservedQty || 0),
    };
    setInventory(prev => [newItem, ...prev]);
    showToast('Item Added', `${newItem.name} added to inventory with SKU ${newItem.sku}`, 'success');
  };

  const adjustStock = (itemId: string, delta: number, reason: StockMovement['type'], notes: string) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;
    const newOnHand = Math.max(0, item.onHandQty + delta);
    const newAvail = Math.max(0, newOnHand - item.reservedQty);

    setInventory(prev =>
      prev.map(i => (i.id === itemId ? { ...i, onHandQty: newOnHand, availableQty: newAvail } : i))
    );

    const newMov: StockMovement = {
      id: 'MOV-' + Date.now(),
      itemId,
      itemSku: item.sku,
      itemName: item.name,
      type: reason,
      quantity: delta,
      balanceAfter: newOnHand,
      referenceNumber: 'ADJ-' + Date.now().toString().slice(-4),
      date: new Date().toISOString(),
      performedBy: currentStaff.name,
      notes,
    };
    setStockMovements(prev => [newMov, ...prev]);
    showToast('Stock Adjusted', `Stock for ${item.name} updated by ${delta > 0 ? '+' : ''}${delta}`, 'info');
  };

  // 5. Resale Devices
  const addResaleDevice = (data: Omit<ResaleDevice, 'id' | 'sku' | 'acquiredDate' | 'totalRefurbCost'>) => {
    const id = 'RES-' + String(resaleDevices.length + 1).padStart(3, '0');
    const sku = `RSL-${data.brand.slice(0, 3).toUpperCase()}-${data.model.replace(/\s+/g, '')}-${data.storage.replace(/\s+/g, '')}`;
    const totalRefurb = (data.refurbPartsCost || 0) + (data.refurbLabourCost || 0);

    const newDevice: ResaleDevice = {
      ...data,
      id,
      sku,
      totalRefurbCost: totalRefurb,
      acquiredDate: new Date().toISOString().slice(0, 10),
    };
    setResaleDevices(prev => [newDevice, ...prev]);
    showToast('Resale Device Added', `${newDevice.brand} ${newDevice.model} (${newDevice.conditionGrade}) logged`, 'success');
  };

  const updateResaleStatus = (id: string, status: ResaleStatus, refurbPartsCost?: number, refurbLabourCost?: number) => {
    setResaleDevices(prev =>
      prev.map(d => {
        if (d.id !== id) return d;
        const pCost = refurbPartsCost !== undefined ? refurbPartsCost : d.refurbPartsCost;
        const lCost = refurbLabourCost !== undefined ? refurbLabourCost : d.refurbLabourCost;
        return {
          ...d,
          status,
          refurbPartsCost: pCost,
          refurbLabourCost: lCost,
          totalRefurbCost: pCost + lCost,
        };
      })
    );
    showToast('Resale Status Updated', `Device ${id} is now ${status}`, 'info');
  };

  const sellResaleDevice = (
    resaleId: string,
    salePrice: number,
    customerName: string,
    customerPhone: string,
    paymentMethod: PaymentMethod
  ): Invoice => {
    const dev = resaleDevices.find(d => d.id === resaleId);
    if (!dev) throw new Error('Device not found');

    const invoiceNumber = `INV-2026-${String(invoices.length + 51).padStart(3, '0')}`;
    const taxAmount = (salePrice * 18) / 100;
    const grandTotal = salePrice + taxAmount;

    const newInvoice: Invoice = {
      id: invoiceNumber,
      invoiceNumber,
      type: 'Resale Device Sale',
      customerName,
      customerPhone,
      date: new Date().toISOString().slice(0, 10),
      dueDate: new Date().toISOString().slice(0, 10),
      relatedResaleId: resaleId,
      items: [
        {
          id: 'resale-item-1',
          description: `Certified Pre-owned ${dev.brand} ${dev.model} (${dev.storage} ${dev.color}) - ${dev.conditionGrade}`,
          quantity: 1,
          unitPrice: salePrice,
          amount: salePrice,
          type: 'Device',
        },
      ],
      subtotal: salePrice,
      discount: 0,
      taxRate: 18,
      taxAmount,
      grandTotal,
      amountPaid: grandTotal,
      balanceDue: 0,
      paymentStatus: 'Paid',
      payments: [
        {
          id: 'pay-' + Date.now(),
          date: new Date().toISOString(),
          amount: grandTotal,
          method: paymentMethod,
          transactionRef: 'POS-RESALE-' + Date.now().toString().slice(-5),
          recordedBy: currentStaff.name,
        },
      ],
      tallyExported: false,
      notes: `${dev.warrantyDays} Days Shop Warranty. IMEI: ${dev.imeiSerial}`,
    };

    setInvoices(prev => [newInvoice, ...prev]);
    setResaleDevices(prev =>
      prev.map(d =>
        d.id === resaleId
          ? {
              ...d,
              status: 'Sold',
              salePrice,
              soldDate: new Date().toISOString().slice(0, 10),
              soldToCustomer: customerName,
              invoiceId: invoiceNumber,
            }
          : d
      )
    );

    showToast('Resale Sold', `${dev.brand} ${dev.model} sold for ₹${salePrice}. Invoice #${invoiceNumber} issued.`, 'success');
    return newInvoice;
  };

  // 6. Purchase Orders & Stock Receiving
  const addPurchaseOrder = (data: Omit<PurchaseOrder, 'id' | 'poNumber' | 'totalCost'>) => {
    const poNumber = `PO-2026-${String(purchaseOrders.length + 4).padStart(3, '0')}`;
    const totalCost = data.subtotal + data.freightAndLandedCost;
    const newPO: PurchaseOrder = {
      ...data,
      id: poNumber,
      poNumber,
      totalCost,
      amountPaid: data.amountPaid || 0,
      balanceDue: totalCost - (data.amountPaid || 0),
    };
    setPurchaseOrders(prev => [newPO, ...prev]);
    showToast('Purchase Order Created', `PO #${poNumber} generated for ${data.supplierName}`, 'success');
  };

  const receivePurchaseOrderStock = (
    poId: string,
    receivedMap: Record<string, number>,
    actualFreightLanded?: number
  ) => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) return;

    // Update inventory for received items
    po.items.forEach(item => {
      const qtyReceived = receivedMap[item.itemId] || 0;
      if (qtyReceived > 0) {
        setInventory(prev =>
          prev.map(inv => {
            if (inv.id !== item.itemId) return inv;
            const newOnHand = inv.onHandQty + qtyReceived;
            return {
              ...inv,
              onHandQty: newOnHand,
              availableQty: newOnHand - inv.reservedQty,
              lastRestockedDate: new Date().toISOString().slice(0, 10),
            };
          })
        );

        // Record stock movement
        const newMov: StockMovement = {
          id: 'MOV-' + Date.now() + '-' + Math.floor(Math.random() * 100),
          itemId: item.itemId,
          itemSku: item.sku,
          itemName: item.itemName,
          type: 'Purchase Inward',
          quantity: qtyReceived,
          balanceAfter: 0,
          referenceNumber: po.poNumber,
          date: new Date().toISOString(),
          performedBy: currentStaff.name,
          notes: `Stock received against Purchase Order #${po.poNumber} from ${po.supplierName}`,
        };
        setStockMovements(prev => [newMov, ...prev]);
      }
    });

    // Update PO status
    setPurchaseOrders(prev =>
      prev.map(p => {
        if (p.id !== poId) return p;
        const updatedItems = p.items.map(item => ({
          ...item,
          receivedQty: item.receivedQty + (receivedMap[item.itemId] || 0),
        }));
        const allReceived = updatedItems.every(i => i.receivedQty >= i.orderQty);
        return {
          ...p,
          status: allReceived ? 'Received' : 'Partially Received',
          items: updatedItems,
          freightAndLandedCost: actualFreightLanded !== undefined ? actualFreightLanded : p.freightAndLandedCost,
        };
      })
    );

    showToast('Stock Received', `Inventory restocked from PO #${po.poNumber}. Stock levels updated!`, 'success');
  };

  // 7. Suppliers
  const addSupplier = (data: Omit<Supplier, 'id'>) => {
    const id = 'SUP-' + String(suppliers.length + 1).padStart(2, '0');
    setSuppliers(prev => [...prev, { ...data, id }]);
    showToast('Supplier Added', `${data.name} added to vendor directory`, 'success');
  };

  // 8. Invoices & Billing
  const createInvoice = (data: Omit<Invoice, 'id' | 'invoiceNumber'>): Invoice => {
    const invoiceNumber = `INV-2026-${String(invoices.length + 51).padStart(3, '0')}`;
    const newInvoice: Invoice = {
      ...data,
      id: invoiceNumber,
      invoiceNumber,
    };
    setInvoices(prev => [newInvoice, ...prev]);
    showToast('Invoice Created', `Tax Invoice #${invoiceNumber} issued for ₹${data.grandTotal}`, 'success');
    return newInvoice;
  };

  const recordPayment = (invoiceId: string, amount: number, method: PaymentMethod, ref?: string) => {
    setInvoices(prev =>
      prev.map(inv => {
        if (inv.id !== invoiceId) return inv;
        const newPaid = inv.amountPaid + amount;
        const newBalance = Math.max(0, inv.grandTotal - newPaid);
        const newStatus = newBalance === 0 ? 'Paid' : 'Partial';
        const newPayment = {
          id: 'pay-' + Date.now(),
          date: new Date().toISOString(),
          amount,
          method,
          transactionRef: ref || 'MANUAL-REC',
          recordedBy: currentStaff.name,
        };
        return {
          ...inv,
          amountPaid: newPaid,
          balanceDue: newBalance,
          paymentStatus: newStatus,
          payments: [...inv.payments, newPayment],
        };
      })
    );
    showToast('Payment Recorded', `Received ₹${amount} via ${method} for Invoice #${invoiceId}`, 'success');
  };

  // 9. Expenses
  const addExpense = (data: Omit<Expense, 'id' | 'expenseNumber'>) => {
    const expenseNumber = `EXP-2026-${String(expenses.length + 10).padStart(3, '0')}`;
    const newExp: Expense = {
      ...data,
      id: expenseNumber,
      expenseNumber,
    };
    setExpenses(prev => [newExp, ...prev]);
    showToast('Expense Recorded', `Recorded ${data.category} expense of ₹${data.amount}`, 'info');
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    showToast('Expense Removed', `Expense ${id} deleted`, 'info');
  };

  // 10. Customers
  const addCustomer = (data: Omit<Customer, 'id' | 'totalVisits' | 'totalSpent' | 'outstandingBalance' | 'registeredDate'>) => {
    const id = 'CUST-' + String(customers.length + 1).padStart(3, '0');
    const newCust: Customer = {
      ...data,
      id,
      totalVisits: 1,
      totalSpent: 0,
      outstandingBalance: 0,
      registeredDate: new Date().toISOString().slice(0, 10),
    };
    setCustomers(prev => [...prev, newCust]);
    showToast('Customer Created', `Profile for ${data.name} saved`, 'success');
  };

  const toggleCustomerReviewRequested = (customerId: string) => {
    setCustomers(prev =>
      prev.map(c => (c.id === customerId ? { ...c, reviewRequested: !c.reviewRequested } : c))
    );
  };

  // 11. Warranty Claims
  const addWarrantyClaim = (data: Omit<WarrantyClaim, 'id' | 'claimNumber' | 'claimDate'>) => {
    const claimNumber = `CLM-2026-${String(warrantyClaims.length + 2).padStart(3, '0')}`;
    const newClaim: WarrantyClaim = {
      ...data,
      id: claimNumber,
      claimNumber,
      claimDate: new Date().toISOString(),
    };
    setWarrantyClaims(prev => [newClaim, ...prev]);
    showToast('Warranty Claim Logged', `Claim #${claimNumber} logged for ${data.customerName}`, 'warning');
  };

  const updateWarrantyClaimStatus = (id: string, status: WarrantyClaim['status'], actionTaken?: string) => {
    setWarrantyClaims(prev =>
      prev.map(c =>
        c.id === id
          ? {
              ...c,
              status,
              actionTaken: actionTaken || c.actionTaken,
              resolvedDate: status === 'Resolved' ? new Date().toISOString() : c.resolvedDate,
            }
          : c
      )
    );
    showToast('Claim Updated', `Warranty Claim #${id} marked as ${status}`, 'info');
  };

  // 12. Settings
  const updateSettings = (newSettings: Partial<ShopSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    showToast('Settings Saved', 'Shop configurations updated successfully', 'success');
  };

  // 13. Interactive Demo Scenarios
  const triggerDemoFlow = (flow: 'full_repair' | 'stock_blocker' | 'po_receive' | 'resale_lifecycle' | 'rent_expense') => {
    switch (flow) {
      case 'full_repair': {
        // Run full click demo: create booking -> convert to job -> approve -> reserve part -> complete & invoice -> payment
        const bkg = addBooking({
          customerName: 'Vivek Shinde (Live Demo)',
          customerPhone: '+91 98229 44332',
          deviceBrand: 'Apple',
          deviceModel: 'iPhone 13',
          faultDescription: 'Broken OLED display and battery degradation',
          preferredDate: new Date().toISOString().slice(0, 10),
          preferredTimeSlot: '12:00 PM',
          serviceMode: 'Shop Walk-in',
          source: 'Walk-in',
          status: 'Confirmed',
          assignedStaffId: 'staff-3',
          assignedStaffName: 'Amit Patil',
          travelCharge: 0,
          handoverStatus: 'At Workshop',
          notes: 'Interactive end-to-end demo execution',
        });
        const job = convertBookingToJobCard(bkg.id);
        approveEstimate(job.id);
        addJobPart(job.id, 'INV-001', 1);
        assignJobMachine(job.id, 'MCH-03', '12:00 PM - 01:00 PM');
        updateJobStatus(job.id, 'Repairing', 'Amit Patil started display lamination on YMJ OCA machine');
        setTimeout(() => {
          updateJobStatus(job.id, 'Quality Check', 'OLED display bonding verified');
          toggleQualityCheckItem(job.id, job.qualityChecklist[0]?.id || 'qc-c1');
          const inv = completeRepairAndInvoice(job.id);
          recordPayment(inv.id, inv.grandTotal, 'UPI', 'DEMO-FLOW-TXN');
          handoverDevice(job.id, 'Customer thrilled with instant turnaround!');
        }, 1200);
        break;
      }
      case 'stock_blocker': {
        // Trigger a repair attempting to reserve out-of-stock item
        const job = addRepairJob({
          customerName: 'Rajesh Mehra (Stock Blocker Demo)',
          customerPhone: '+91 97654 11223',
          deviceBrand: 'OnePlus',
          deviceModel: 'Open (Fold)',
          reportedFault: 'Cracked inner foldable display',
          conditionPhotos: [],
          physicalCondition: {
            bodyScratches: false,
            crackedScreen: true,
            backGlassBroken: false,
            liquidDamage: false,
            powerOn: true,
            cameraWorking: true,
            touchWorking: false,
            speakerWorking: true,
            notes: 'Foldable display glass shattered',
          },
          accessoriesReceived: ['Device only'],
          intakeDate: new Date().toISOString(),
          promisedDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
          technicianId: 'staff-2',
          technicianName: 'Rahul Jadhav',
          priority: 'Urgent',
          status: 'Diagnosing',
          diagnosis: 'Foldable inner screen assembly replacement required.',
          internalNotes: 'Checking inventory for OnePlus Open screen...',
          customerNotes: 'Awaiting stock confirmation.',
          estimate: {
            id: 'EST-BLK-1',
            revisionNumber: 1,
            initialIndicativePrice: 31000,
            confirmedPrice: 31000,
            partsCost: 22000,
            labourCost: 9000,
            pickupFee: 0,
            discount: 0,
            taxRate: 18,
            taxAmount: 5580,
            total: 36580,
            estimatedCompletionDate: new Date().toISOString(),
            status: 'Approved',
          },
          partsUsed: [],
          qualityChecklist: [],
          warrantyMonths: 3,
        });
        // Try to allocate out-of-stock item (INV-004)
        addJobPart(job.id, 'INV-004', 1);
        break;
      }
      case 'po_receive': {
        // Restock OnePlus Fold screen from PO-2026-002
        receivePurchaseOrderStock('PO-2026-002', { 'INV-004': 2, 'INV-005': 10 });
        break;
      }
      case 'resale_lifecycle': {
        // Acquire phone -> refurbish -> sell
        addResaleDevice({
          brand: 'Apple',
          model: 'iPhone 12',
          storage: '128 GB',
          color: 'Product Red',
          conditionGrade: 'Good (Grade B)',
          imeiSerial: '358911002348123',
          batteryHealth: 82,
          acquisitionSource: 'Exchange Deal (Pimpri Counter)',
          purchaseCost: 18000,
          refurbPartsCost: 1100,
          refurbLabourCost: 400,
          askingPrice: 24500,
          warrantyDays: 90,
          status: 'Ready for Sale',
          notes: 'Battery replaced with OEM unit. Display polished.',
        });
        break;
      }
      case 'rent_expense': {
        // Add immediate rent/salary expense to see profit update
        addExpense({
          date: new Date().toISOString().slice(0, 10),
          category: 'Rent',
          description: 'Pimpri Shop Additional Storage Room Rent (September)',
          amount: 8000,
          paymentMethod: 'UPI',
          paymentStatus: 'Paid',
          payee: 'Sai Complex Society',
          recurrence: 'Monthly',
          enteredBy: currentStaff.name,
          notes: 'Space for machine backup parts & stock storage.',
        });
        break;
      }
    }
  };

  return (
    <CRMContext.Provider
      value={{
        theme,
        toggleTheme,
        setThemeMode,
        staff,
        currentStaff,
        setCurrentStaff,
        machines,
        updateMachineStatus,
        bookings,
        addBooking,
        updateBookingStatus,
        convertBookingToJobCard,
        jobs,
        selectedJob,
        setSelectedJob,
        addRepairJob,
        updateJobStatus,
        updateJobEstimate,
        approveEstimate,
        rejectEstimate,
        assignJobMachine,
        assignJobTechnician,
        toggleQualityCheckItem,
        addJobPart,
        completeRepairAndInvoice,
        handoverDevice,
        inventory,
        stockMovements,
        addInventoryItem,
        adjustStock,
        resaleDevices,
        addResaleDevice,
        updateResaleStatus,
        sellResaleDevice,
        purchaseOrders,
        addPurchaseOrder,
        receivePurchaseOrderStock,
        suppliers,
        addSupplier,
        invoices,
        createInvoice,
        recordPayment,
        expenses,
        addExpense,
        deleteExpense,
        customers,
        addCustomer,
        toggleCustomerReviewRequested,
        warrantyClaims,
        addWarrantyClaim,
        updateWarrantyClaimStatus,
        settings,
        updateSettings,
        toasts,
        showToast,
        dismissToast,
        triggerDemoFlow,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) throw new Error('useCRM must be used within a CRMProvider');
  return context;
};
