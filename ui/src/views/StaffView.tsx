import React from 'react';
import { useCRM } from '../context/CRMContext';
import { StaffMember, RepairJob } from '../types';
import { Phone, Mail } from 'lucide-react';

export const StaffView: React.FC = () => {
  const { staff, jobs, currentStaff, setCurrentStaff, showToast } = useCRM();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Staff Roster &amp; Technician Workloads
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            5–6 shop team members: Master technicians, reception intake, and doorstep pickup dispatch
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-[#202020] px-3 py-1.5 rounded-xl border border-gray-200 dark:border-[#333]">
            Active Logged In Staff: <strong className="text-gray-900 dark:text-white">{currentStaff.name}</strong>
          </span>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map((member: StaffMember) => {
          const isCurrent = member.id === currentStaff.id;
          const assignedJobs = jobs.filter(
            (j: RepairJob) => j.technicianId === member.id && j.status !== 'Completed' && j.status !== 'Cancelled'
          );

          return (
            <div
              key={member.id}
              className={`p-5 rounded-3xl glass-card transition space-y-4 ${
                isCurrent
                  ? 'border-[#F5ED31] dark:border-[#DAFC08] shadow-glow-yellow dark:shadow-glow-lime'
                  : 'hover:border-[#F5ED31]/50 dark:hover:border-[#DAFC08]/40'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-base text-black shadow-sm"
                    style={{ backgroundColor: member.avatarColor }}
                  >
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                      {member.name}
                    </h3>
                    <span className="text-[11px] font-bold text-amber-600 dark:text-[#DAFC08] bg-[#F5ED31]/20 dark:bg-[#DAFC08]/20 px-2.5 py-0.5 rounded-full inline-block mt-0.5">
                      {member.role}
                    </span>
                  </div>
                </div>

                {isCurrent && (
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500">
                    Active Session
                  </span>
                )}
              </div>

              {/* Specialization & Contact */}
              <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300 glass-panel p-3 rounded-2xl">
                <p className="font-semibold text-gray-900 dark:text-white">
                  Specialization: {member.specialization}
                </p>
                <p className="flex items-center gap-1.5 text-[11px] text-gray-500 font-mono">
                  <Phone className="w-3.5 h-3.5 text-[#547BDE]" />
                  <span>{member.phone}</span>
                </p>
                <p className="flex items-center gap-1.5 text-[11px] text-gray-500">
                  <Mail className="w-3.5 h-3.5 text-[#FF934F]" />
                  <span>{member.email}</span>
                </p>
              </div>

              {/* Workload Stats */}
              <div className="grid grid-cols-2 gap-2 text-xs text-center">
                <div className="p-2.5 rounded-xl glass-panel">
                  <span className="text-gray-400 text-[10px] uppercase font-bold block">Active Jobs Queue</span>
                  <span className="text-base font-extrabold text-[#FF934F] dark:text-[#DAFC08]">
                    {assignedJobs.length}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl glass-panel">
                  <span className="text-gray-400 text-[10px] uppercase font-bold block">This Month Completed</span>
                  <span className="text-base font-extrabold text-emerald-500">
                    {member.completedJobsMonth}
                  </span>
                </div>
              </div>

              {/* Switch Session Button */}
              <div className="pt-2 border-t border-black/5 dark:border-white/5 flex justify-end">
                <button
                  onClick={() => {
                    setCurrentStaff(member);
                    showToast('Switched User', `Now operating as ${member.name}`, 'info');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    isCurrent
                      ? 'glass-panel text-gray-400 cursor-default'
                      : 'glass-panel hover:border-[#F5ED31] dark:hover:border-[#DAFC08] text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {isCurrent ? 'Current Session' : 'Switch to this User'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
