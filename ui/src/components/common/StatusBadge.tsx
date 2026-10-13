import React from 'react';
import { JobStatus, BookingStatus, ResaleStatus, PaymentStatus } from '../../types';
import {
  getJobStatusBadge,
  getBookingStatusBadge,
  getResaleStatusBadge,
  getPaymentBadge,
} from '../../utils/formatters';

interface StatusBadgeProps {
  type: 'job' | 'booking' | 'resale' | 'payment';
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, status }) => {
  if (type === 'job') {
    const info = getJobStatusBadge(status as JobStatus);
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${info.bg}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${info.dot}`}></span>
        <span>{info.label}</span>
      </span>
    );
  }

  if (type === 'booking') {
    const cls = getBookingStatusBadge(status as BookingStatus);
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${cls}`}>
        {status}
      </span>
    );
  }

  if (type === 'resale') {
    const cls = getResaleStatusBadge(status as ResaleStatus);
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${cls}`}>
        {status}
      </span>
    );
  }

  if (type === 'payment') {
    const cls = getPaymentBadge(status as PaymentStatus);
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${cls}`}>
        {status}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
      {status}
    </span>
  );
};
