export type ThemeMode = 'dark' | 'light';

export type JobStatus =
  | 'Received'
  | 'Diagnosing'
  | 'Awaiting Customer Approval'
  | 'Waiting for Parts'
  | 'Queued'
  | 'Repairing'
  | 'Quality Check'
  | 'Ready for Pickup'
  | 'Completed'
  | 'Cancelled'
  | 'Unrepairable';

export type BookingSource =
  | 'Walk-in'
  | 'Call'
  | 'Pickup Request'
  | 'Doorstep Visit'
  | 'Website';

export type ServiceMode =
  | 'Shop Walk-in'
  | 'Doorstep Service'
  | 'Pickup & Delivery';

export type BookingStatus =
  | 'Pending'
  | 'Confirmed'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled'
  | 'Converted to Job';

export type EstimateStatus =
  | 'Draft'
  | 'Sent'
  | 'Approved'
  | 'Rejected'
  | 'Revised';

export type PaymentStatus =
  | 'Unpaid'
  | 'Partial'
  | 'Paid'
  | 'Refunded';

export type PaymentMethod =
  | 'Cash'
  | 'UPI'
  | 'Card'
  | 'Bank Transfer'
  | 'Mixed';

export type QualityGrade =
  | 'OEM Original'
  | 'Original Refurbished'
  | 'High Quality Aftermarket'
  | 'Standard Compatible';

export type ResaleStatus =
  | 'Acquired'
  | 'Inspecting'
  | 'Refurbishing'
  | 'Ready for Sale'
  | 'Sold'
  | 'Returned';

export type ResaleCondition =
  | 'Like New (Grade A+)'
  | 'Excellent (Grade A)'
  | 'Good (Grade B)'
  | 'Fair (Grade C)';

export type ExpenseCategory =
  | 'Staff Salaries'
  | 'Technician Incentives'
  | 'Rent'
  | 'Electricity'
  | 'Internet & Phone'
  | 'Machine Maintenance'
  | 'Transport & Fuel'
  | 'Packaging & Consumables'
  | 'Marketing & Signage'
  | 'Software & Tools'
  | 'Tea & Office Misc'
  | 'Custom';

export type RecurrenceType =
  | 'None (One-time)'
  | 'Daily'
  | 'Weekly'
  | 'Monthly'
  | 'Quarterly'
  | 'Yearly';

export interface Staff {
  id: string;
  name: string;
  role: 'Owner' | 'Manager' | 'Senior Technician' | 'Junior Technician' | 'Reception & Delivery';
  phone: string;
  email: string;
  specialization: string;
  activeJobsCount: number;
  completedJobsMonth: number;
  avatarColor: string;
}

export type StaffMember = Staff;

export interface Machine {
  id: string;
  name: string;
  type: string;
  purpose: string;
  status: 'Available' | 'In Use' | 'Maintenance';
  currentJobId?: string;
  currentJobNumber?: string;
  operatorId?: string;
  operatorName?: string;
  currentSlot?: string;
  maintenanceNote?: string;
  lastServicedDate: string;
  nextServiceDue: string;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerPhone: string;
  deviceBrand: string;
  deviceModel: string;
  faultDescription: string;
  preferredDate: string;
  preferredTimeSlot: string;
  serviceMode: ServiceMode;
  address?: string;
  source: BookingSource;
  status: BookingStatus;
  assignedStaffId?: string;
  assignedStaffName?: string;
  travelCharge: number;
  pickupTime?: string;
  returnTime?: string;
  handoverStatus: 'Not Picked Up' | 'Picked Up & In Transit' | 'At Workshop' | 'Returned to Customer';
  jobCardId?: string;
  notes?: string;
  createdAt: string;
}

export interface Estimate {
  id: string;
  revisionNumber: number;
  initialIndicativePrice: number;
  confirmedPrice: number;
  partsCost: number;
  labourCost: number;
  pickupFee: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  estimatedCompletionDate: string;
  status: EstimateStatus;
  approvedAt?: string;
  approvedByCustomer?: boolean;
  notes?: string;
}

export interface JobPart {
  inventoryId: string;
  sku: string;
  name: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  reserved: boolean;
  consumed: boolean;
}

export interface QualityCheckItem {
  id: string;
  item: string;
  checked: boolean;
  checkedBy?: string;
  checkedAt?: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  staffName: string;
  badgeType?: 'info' | 'success' | 'warning' | 'error';
}

export interface RepairJob {
  id: string;
  jobCardNumber: string;
  bookingId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  deviceBrand: string;
  deviceModel: string;
  imeiSerial?: string;
  passcodePin?: string;
  deviceColor?: string;
  reportedFault: string;
  conditionPhotos: string[];
  physicalCondition: {
    bodyScratches: boolean;
    crackedScreen: boolean;
    backGlassBroken: boolean;
    liquidDamage: boolean;
    powerOn: boolean;
    cameraWorking: boolean;
    touchWorking: boolean;
    speakerWorking: boolean;
    notes: string;
  };
  accessoriesReceived: string[];
  intakeDate: string;
  promisedDate: string;
  technicianId: string;
  technicianName: string;
  priority: 'Normal' | 'High' | 'Urgent';
  status: JobStatus;
  diagnosis: string;
  internalNotes: string;
  customerNotes: string;
  estimate: Estimate;
  partsUsed: JobPart[];
  assignedMachineId?: string;
  machineSlot?: string;
  qualityChecklist: QualityCheckItem[];
  warrantyMonths: number;
  invoiceSummary?: {
    invoiceId?: string;
    invoiceNumber?: string;
    subtotal: number;
    partsCost: number;
    labourCost: number;
    travelFee: number;
    discount: number;
    taxAmount: number;
    total: number;
    amountPaid: number;
    balanceDue: number;
    paymentStatus: PaymentStatus;
  };
  timeline: TimelineEvent[];
  handoverAcknowledgment?: {
    acknowledged: boolean;
    handedOverBy: string;
    handedOverAt: string;
    customerRemarks?: string;
  };
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category:
    | 'Screens & LCD'
    | 'Batteries'
    | 'Charging Ports'
    | 'Cameras'
    | 'Back Glass'
    | 'Flex Cables & ICs'
    | 'Accessories & Cases'
    | 'Chargers & Cables'
    | 'Audio & Wearables'
    | 'Tools & Consumables';
  type: 'Repair Part' | 'Counter Accessory';
  compatibleModels: string[];
  qualityGrade: QualityGrade;
  supplierId: string;
  supplierName: string;
  purchaseCost: number;
  sellingPrice: number;
  onHandQty: number;
  reservedQty: number;
  availableQty: number; // calculated as onHandQty - reservedQty
  reorderLevel: number;
  location: string;
  warrantyDays: number;
  damagedQty: number;
  linkedJobIds?: string[];
  lastRestockedDate: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemSku: string;
  itemName: string;
  type: 'Purchase Inward' | 'Job Consumption' | 'Counter Sale' | 'Adjustment / Audit' | 'Damaged / Return';
  quantity: number;
  balanceAfter: number;
  referenceNumber: string;
  date: string;
  performedBy: string;
  notes: string;
}

export interface ResaleDevice {
  id: string;
  sku: string;
  brand: string;
  model: string;
  storage: string;
  color: string;
  conditionGrade: ResaleCondition;
  imeiSerial: string;
  batteryHealth?: number;
  acquisitionSource: string;
  purchaseCost: number;
  refurbPartsCost: number;
  refurbLabourCost: number;
  totalRefurbCost: number;
  askingPrice: number;
  salePrice?: number;
  warrantyDays: number;
  status: ResaleStatus;
  acquiredDate: string;
  soldDate?: string;
  soldToCustomer?: string;
  invoiceId?: string;
  notes: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  isForeign: boolean;
  outstandingBalance: number;
  leadTimeDays: number;
}

export interface PurchaseOrderItem {
  itemId: string;
  itemName: string;
  sku: string;
  orderQty: number;
  receivedQty: number;
  unitPrice: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  isForeign: boolean;
  currency: string;
  exchangeRate: number;
  orderDate: string;
  expectedDeliveryDate: string;
  status: 'Draft' | 'Sent' | 'Partially Received' | 'Received' | 'Cancelled';
  items: PurchaseOrderItem[];
  subtotal: number;
  freightAndLandedCost: number;
  totalCost: number;
  paymentStatus: 'Unpaid' | 'Partial' | 'Paid';
  amountPaid: number;
  balanceDue: number;
  shipmentReference?: string;
  notes?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  type: 'Part' | 'Labour' | 'Accessory' | 'Device' | 'Service';
}

export interface InvoicePayment {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  transactionRef?: string;
  recordedBy: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'Repair Job' | 'Accessory Counter Sale' | 'Resale Device Sale';
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  customerGstin?: string;
  date: string;
  dueDate: string;
  relatedJobId?: string;
  relatedResaleId?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
  payments: InvoicePayment[];
  tallyExported: boolean;
  tallyVoucherNo?: string;
  notes?: string;
}

export interface Expense {
  id: string;
  expenseNumber: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'Paid' | 'Pending';
  payee: string;
  recurrence: RecurrenceType;
  enteredBy: string;
  receiptNote?: string;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  totalVisits: number;
  totalSpent: number;
  outstandingBalance: number;
  registeredDate: string;
  reviewRequested: boolean;
  notes?: string;
}

export interface WarrantyClaim {
  id: string;
  claimNumber: string;
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  originalJobId?: string;
  customerName: string;
  customerPhone: string;
  deviceModel: string;
  partDescription: string;
  issueReported: string;
  claimDate: string;
  status: 'Pending Review' | 'Approved & Replacing' | 'Resolved' | 'Rejected (Void / Damaged)';
  resolvedDate?: string;
  actionTaken?: string;
  warrantyExpiryDate: string;
}

export interface ShopSettings {
  shopName: string;
  tagline: string;
  address: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  gstNumber: string;
  website: string;
  operatingHours: string;
  defaultWarrantyMonths: number;
  defaultTaxRate: number;
  currencySymbol: string;
  googleReviewUrl: string;
  googleReviewQrText: string;
  tallyLedgerMapping: {
    repairSales: string;
    accessorySales: string;
    resaleSales: string;
    cashAccount: string;
    bankAccount: string;
  };
  theme: ThemeMode;
  serviceCategories: string[];
}
