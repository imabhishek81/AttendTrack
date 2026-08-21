import { SafetyStatus } from '../types';
import { getStatusLabel } from '../utils/attendance';

interface StatusBadgeProps {
  status: SafetyStatus;
  size?: 'sm' | 'md' | 'lg';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const configs = {
    SAFE: {
      dot: 'bg-emerald-400',
      ping: 'bg-emerald-400',
      text: 'text-emerald-400',
      badge: 'bg-emerald-500/[0.08] border-emerald-500/[0.18] shadow-[0_0_14px_rgba(16,185,129,0.1)]',
    },
    WARNING: {
      dot: 'bg-amber-400',
      ping: 'bg-amber-400',
      text: 'text-amber-400',
      badge: 'bg-amber-500/[0.08] border-amber-500/[0.18] shadow-[0_0_14px_rgba(245,158,11,0.1)]',
    },
    DANGER: {
      dot: 'bg-rose-400',
      ping: 'bg-rose-400',
      text: 'text-rose-400',
      badge: 'bg-rose-500/[0.08] border-rose-500/[0.18] shadow-[0_0_14px_rgba(244,63,94,0.1)]',
    },
  };

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
    lg: 'text-sm px-3.5 py-1.5 gap-2.5',
  };

  const dotSizes = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5',
  };

  const config = configs[status] || configs.SAFE;

  return (
    <span className={`inline-flex items-center rounded-full font-semibold border ${config.badge} ${config.text} ${sizeClasses[size]} tracking-tight transition-all duration-300`}>
      <span className={`relative flex ${dotSizes[size]} shrink-0`}>
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.ping} opacity-60`} />
        <span className={`relative inline-flex rounded-full ${dotSizes[size]} ${config.dot}`} />
      </span>
      <span>{getStatusLabel(status)}</span>
    </span>
  );
}
