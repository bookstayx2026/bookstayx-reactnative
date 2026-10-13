import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  colorType?: 'accent' | 'blue' | 'emerald' | 'rose' | 'amber' | 'purple' | 'slate';
  badge?: string;
  onClick?: () => void;
  clickable?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  colorType = 'slate',
  badge,
  onClick,
  clickable = false,
}) => {
  const getColorStyles = () => {
    switch (colorType) {
      case 'accent':
        return {
          iconBg: 'bg-[#F5ED31]/30 text-amber-800 dark:bg-[#DAFC08]/20 dark:text-[#DAFC08]',
          border: 'hover:border-[#F5ED31] dark:hover:border-[#DAFC08]/50 hover:shadow-glow-yellow dark:hover:shadow-glow-lime',
          accentPill: 'bg-[#F5ED31]/30 text-amber-900 dark:bg-[#DAFC08]/20 dark:text-[#DAFC08] border border-amber-500/30 dark:border-[#DAFC08]/40',
        };
      case 'blue':
        return {
          iconBg: 'bg-[#547BDE]/20 text-[#547BDE] dark:bg-[#547BDE]/25 dark:text-[#8AA8F8]',
          border: 'hover:border-[#547BDE] dark:hover:border-[#547BDE]/60 hover:shadow-glow-blue',
          accentPill: 'bg-[#547BDE]/20 text-[#547BDE] dark:bg-[#547BDE]/25 dark:text-[#8AA8F8] border border-[#547BDE]/40',
        };
      case 'emerald':
        return {
          iconBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
          border: 'hover:border-emerald-400 dark:hover:border-emerald-500/50',
          accentPill: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30',
        };
      case 'rose':
        return {
          iconBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
          border: 'hover:border-rose-400 dark:hover:border-rose-500/50',
          accentPill: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30',
        };
      case 'amber':
        return {
          iconBg: 'bg-[#FF934F]/25 text-amber-800 dark:bg-[#FF934F]/20 dark:text-[#FF934F]',
          border: 'hover:border-[#FF934F] dark:hover:border-[#FF934F]/50 hover:shadow-glow-orange',
          accentPill: 'bg-[#FF934F]/25 text-amber-900 dark:bg-[#FF934F]/20 dark:text-[#FF934F] border border-amber-500/30',
        };
      case 'purple':
        return {
          iconBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
          border: 'hover:border-purple-400 dark:hover:border-purple-500/50',
          accentPill: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30',
        };
      default:
        return {
          iconBg: 'bg-white/60 text-gray-700 dark:bg-white/10 dark:text-gray-300',
          border: 'hover:border-gray-400 dark:hover:border-gray-500',
          accentPill: 'bg-white/60 text-gray-700 dark:bg-white/10 dark:text-gray-300 border border-black/10 dark:border-white/10',
        };
    }
  };

  const styles = getColorStyles();

  return (
    <div
      onClick={onClick}
      className={`p-3.5 sm:p-4 rounded-2xl glass-card transition-all duration-200 border border-black/5 dark:border-white/10 ${styles.border} ${
        clickable || onClick ? 'cursor-pointer active:scale-[0.98] hover:shadow-md' : ''
      }`}
    >
      {/* Top row: Title + compact Icon */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[#5E5E5E] dark:text-gray-400 truncate">
          {title}
        </p>
        <div className={`p-1.5 sm:p-2 rounded-xl ${styles.iconBg} flex-shrink-0 shadow-xs`}>
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.4]" />
        </div>
      </div>

      {/* Middle row: Big Metric Value + Badge */}
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span className="text-xl sm:text-2xl font-black tracking-tight text-[#0D0C0B] dark:text-white">
          {value}
        </span>
        {badge && (
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${styles.accentPill}`}>
            {badge}
          </span>
        )}
      </div>

      {/* Bottom row: Subtitle */}
      {subtitle && (
        <p className="text-[10px] sm:text-[11px] text-[#5E5E5E] dark:text-gray-400 mt-1 truncate font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
};
