import { JobStatus, PaymentStatus, ResaleStatus, EstimateStatus, BookingStatus } from '../types';

export const formatINR = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
};

export const maskIMEI = (imei: string | undefined | null): string => {
  if (!imei) return '—';
  const clean = imei.trim();
  if (clean.length <= 6) return '••••••';
  const start = clean.slice(0, 4);
  const end = clean.slice(-4);
  return `${start}${'*'.repeat(Math.max(4, clean.length - 8))}${end}`;
};

export const getJobStatusBadge = (status: JobStatus) => {
  switch (status) {
    case 'Received':
      return {
        label: 'Received',
        bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/40',
        dot: 'bg-blue-400',
      };
    case 'Diagnosing':
      return {
        label: 'Diagnosing',
        bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/40',
        dot: 'bg-purple-400 animate-pulse',
      };
    case 'Awaiting Customer Approval':
      return {
        label: 'Approval Pending',
        bg: 'bg-amber-500/15 text-amber-500 border-amber-500/40 dark:bg-amber-500/25 dark:text-amber-300 dark:border-amber-500/50',
        dot: 'bg-amber-400 animate-ping',
      };
    case 'Waiting for Parts':
      return {
        label: 'Waiting Parts',
        bg: 'bg-rose-500/15 text-rose-500 border-rose-500/40 dark:bg-rose-500/25 dark:text-rose-300 dark:border-rose-500/50',
        dot: 'bg-rose-400',
      };
    case 'Queued':
      return {
        label: 'In Queue',
        bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-500/40',
        dot: 'bg-slate-400',
      };
    case 'Repairing':
      return {
        label: 'Repairing',
        bg: 'bg-[#DAFC08]/15 text-[#889d03] border-[#DAFC08]/40 dark:bg-[#DAFC08]/20 dark:text-[#DAFC08] dark:border-[#DAFC08]/50',
        dot: 'bg-[#DAFC08]',
      };
    case 'Quality Check':
      return {
        label: 'Quality Check',
        bg: 'bg-teal-500/10 text-teal-500 border-teal-500/30 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/40',
        dot: 'bg-teal-400',
      };
    case 'Ready for Pickup':
      return {
        label: 'Ready for Pickup',
        bg: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/40 dark:bg-emerald-500/25 dark:text-emerald-300 dark:border-emerald-500/50',
        dot: 'bg-emerald-400',
      };
    case 'Completed':
      return {
        label: 'Completed',
        bg: 'bg-green-500/10 text-green-600 border-green-500/30 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30',
        dot: 'bg-green-500',
      };
    case 'Cancelled':
      return {
        label: 'Cancelled',
        bg: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/30 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
        dot: 'bg-zinc-500',
      };
    case 'Unrepairable':
      return {
        label: 'Unrepairable',
        bg: 'bg-red-500/10 text-red-500 border-red-500/30 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/40',
        dot: 'bg-red-500',
      };
    default:
      return {
        label: status,
        bg: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
        dot: 'bg-zinc-400',
      };
  }
};

export const getPaymentBadge = (status: PaymentStatus) => {
  switch (status) {
    case 'Paid':
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
    case 'Partial':
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30';
    case 'Unpaid':
      return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30';
    case 'Refunded':
      return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30';
    default:
      return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
  }
};

export const getBookingStatusBadge = (status: BookingStatus) => {
  switch (status) {
    case 'Pending':
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30';
    case 'Confirmed':
      return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30';
    case 'In Progress':
      return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30';
    case 'Converted to Job':
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
    case 'Cancelled':
      return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
    default:
      return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
  }
};

export const getResaleStatusBadge = (status: ResaleStatus) => {
  switch (status) {
    case 'Ready for Sale':
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
    case 'Sold':
      return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30';
    case 'Refurbishing':
      return 'bg-[#DAFC08]/15 text-[#889d03] dark:text-[#DAFC08] border border-[#DAFC08]/40';
    case 'Inspecting':
      return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30';
    case 'Acquired':
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30';
    default:
      return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
  }
};
