import { SafetyStatus } from '../types';
import { getStatusColor, getStatusEmoji, getStatusLabel, getStatusBgColor } from '../utils/attendance';

interface StatusBadgeProps {
  status: SafetyStatus;
  size?: 'sm' | 'md' | 'lg';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-3 py-1',
    lg: 'text-sm px-4 py-1.5',
  };

  return (
    <span className={`badge ${getStatusBgColor(status)} ${getStatusColor(status)} ${sizeClasses[size]}`}>
      <span>{getStatusEmoji(status)}</span>
      <span>{getStatusLabel(status)}</span>
    </span>
  );
}
