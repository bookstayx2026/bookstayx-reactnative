import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { Machine, StaffMember, RepairJob } from '../types';
import { formatDate } from '../utils/formatters';
import { Cpu } from 'lucide-react';

export const WorkshopView: React.FC = () => {
  const { machines, updateMachineStatus, jobs, staff, setSelectedJob } = useCRM();

  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [maintenanceNote, setMaintenanceNote] = useState('');

  const handleToggleMaintenance = (m: Machine) => {
    if (m.status === 'Maintenance') {
      updateMachineStatus(m.id, 'Available', '');
    } else {
      updateMachineStatus(m.id, 'Maintenance', maintenanceNote || 'Scheduled preventive maintenance');
    }
    setSelectedMachine(null);
    setMaintenanceNote('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Workshop &amp; Specialized Repair Machines
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Hardware station allocation for 3–4 precision repair machines at Pimpri workshop
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-500/30">
            ● 3 Machines Online
          </span>
          <span className="px-3 py-1 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400 border border-rose-500/30">
            ● 1 Machine in Calibration
          </span>
        </div>
      </div>

      {/* 4 Specialized Machine Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {machines.map((machine: Machine) => {
          const isBusy = machine.status === 'In Use';
          const isMaintenance = machine.status === 'Maintenance';
          const assignedJob = jobs.find((j: RepairJob) => j.id === machine.currentJobId);

          return (
            <div
              key={machine.id}
              className={`p-5 rounded-3xl glass-card transition space-y-4 ${
                isMaintenance
                  ? 'border-rose-500/50'
                  : isBusy
                  ? 'border-[#547BDE]/60'
                  : 'hover:border-[#DAFC08]/50'
              }`}
            >
              {/* Machine Card Top */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                      isMaintenance
                        ? 'bg-rose-500/15 text-rose-500'
                        : isBusy
                        ? 'bg-[#547BDE]/15 text-[#547BDE]'
                        : 'bg-[#DAFC08]/15 text-[#889d03] dark:text-[#DAFC08]'
                    }`}
                  >
                    <Cpu className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                        {machine.name}
                      </h3>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-gray-500">
                        {machine.id}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{machine.type}</p>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                    isMaintenance
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      : isBusy
                      ? 'bg-[#547BDE]/15 text-[#547BDE] dark:text-[#8AA8F8]'
                      : 'bg-[#DAFC08]/20 text-[#889d03] dark:text-[#DAFC08]'
                  }`}
                >
                  {machine.status}
                </span>
              </div>

              {/* Purpose & Description */}
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed glass-panel p-3 rounded-2xl">
                {machine.purpose}
              </p>

              {/* Active Assignment / Slot Info */}
              {isBusy && (
                <div className="p-3.5 rounded-2xl bg-[#547BDE]/10 border border-[#547BDE]/30 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#547BDE] dark:text-[#8AA8F8]">
                      Currently Running Job: #{machine.currentJobNumber}
                    </span>
                    <span className="font-mono text-[11px] text-[#547BDE] dark:text-[#8AA8F8]">
                      Slot: {machine.currentSlot}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300">
                    Operator Tech: <span className="font-semibold">{machine.operatorName}</span>
                    {assignedJob && ` • Device: ${assignedJob.deviceBrand} ${assignedJob.deviceModel}`}
                  </p>
                  {assignedJob && (
                    <button
                      onClick={() => setSelectedJob(assignedJob)}
                      className="text-[11px] font-bold text-[#547BDE] dark:text-[#8AA8F8] hover:underline block pt-1"
                    >
                      Open Associated Job Card →
                    </button>
                  )}
                </div>
              )}

              {isMaintenance && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs space-y-1">
                  <span className="font-bold text-rose-700 dark:text-rose-400 block">
                    Maintenance &amp; Service Note:
                  </span>
                  <p className="text-[11px] text-rose-800 dark:text-rose-300 italic">
                    {machine.maintenanceNote}
                  </p>
                </div>
              )}

              {/* Footer: Service Dates & Action */}
              <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5 text-[11px] text-gray-500">
                <span>
                  Last Serviced: {formatDate(machine.lastServicedDate)} • Next Due: {formatDate(machine.nextServiceDue)}
                </span>
                <button
                  onClick={() => handleToggleMaintenance(machine)}
                  className={`px-3 py-1 rounded-xl font-bold transition text-xs ${
                    isMaintenance
                      ? 'bg-emerald-500 text-white'
                      : 'glass-card hover:border-[#F5ED31] dark:hover:border-[#DAFC08] text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {isMaintenance ? 'Mark Service Done' : 'Schedule Service'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Technician Bench Queue Overview */}
      <div className="p-5 rounded-3xl glass-panel space-y-4">
        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
          Technician Machine &amp; Bench Queue
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {staff
            .filter((s: StaffMember) => s.role.includes('Technician') || s.role === 'Owner')
            .map((tech: StaffMember) => {
              const techJobs = jobs.filter(
                (j: RepairJob) => j.technicianId === tech.id && j.status !== 'Completed' && j.status !== 'Cancelled'
              );
              return (
                <div
                  key={tech.id}
                  className="p-4 rounded-2xl glass-card space-y-2"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-black shadow-sm"
                      style={{ backgroundColor: tech.avatarColor }}
                    >
                      {tech.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-gray-900 dark:text-white">{tech.name}</p>
                      <p className="text-[10px] text-gray-400">{tech.role}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-black/5 dark:border-white/5">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                      Active Queue ({techJobs.length})
                    </span>
                    <div className="space-y-1">
                      {techJobs.length === 0 ? (
                        <p className="text-[11px] text-gray-400 italic">No pending jobs</p>
                      ) : (
                        techJobs.map((j: RepairJob) => (
                          <div
                            key={j.id}
                            onClick={() => setSelectedJob(j)}
                            className="p-1.5 rounded-lg glass-panel cursor-pointer hover:border-[#F5ED31] dark:hover:border-[#DAFC08] text-[11px] flex justify-between"
                          >
                            <span className="font-bold">{j.jobCardNumber}</span>
                            <span className="text-gray-500 truncate max-w-[100px]">{j.deviceModel}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
