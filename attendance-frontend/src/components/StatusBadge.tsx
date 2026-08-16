import { SafetyStatus } from '../types';
import { getStatusLabel } from '../utils/attendance';

interface StatusBadgeProps {
  status: SafetyStatus;
  size?: 'sm' | 'md' | 'lg';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const configs = {
    SAFE: {
      dotBg: 'bg-emerald-400',
      pingBg: 'bg-emerald-400',
      text: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]',
    },
    WARNING: {
      dotBg: 'bg-amber-400',
      pingBg: 'bg-amber-400',
      text: 'text-amber-400',
      badgeBg: 'bg-amber-500/10 border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]',
    },
    DANGER: {
      dotBg: 'bg-rose-400',
      pingBg: 'bg-rose-400',
      text: 'text-rose-400',
      badgeBg: 'bg-rose-500/10 border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.15)]',
    },
  };

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
    lg: 'text-sm px-3.5 py-1.5 gap-2.5',
  };

  const config = configs[status] || configs.SAFE;

  return (
    <span className={`inline-flex items-center rounded-full font-medium border ${config.badgeBg} ${config.text} ${sizeClasses[size]} tracking-tight transition-all`}>
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.pingBg} opacity-75`} />
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.dotBg}`} />
      </span>
      <span className="font-semibold">{getStatusLabel(status)}</span>
    </span>
  );
}
