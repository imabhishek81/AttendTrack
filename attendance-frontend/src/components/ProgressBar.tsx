import { getProgressBarColor } from '../utils/attendance';

interface ProgressBarProps {
  percentage: number;
  required: number;
  height?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
}

export default function ProgressBar({ 
  percentage, 
  required, 
  height = 'md', 
  showLabel = false,
  animated = true 
}: ProgressBarProps) {
  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const barColor = getProgressBarColor(percentage, required);
  const clampedWidth = Math.min(Math.max(percentage, 0), 100);

  return (
    <div className="w-full">
      <div className={`progress-bar-container ${heightClasses[height]}`}>
        <div
          className={`progress-bar-fill ${barColor} ${heightClasses[height]}`}
          style={{
            '--progress-width': `${clampedWidth}%`,
            width: animated ? undefined : `${clampedWidth}%`,
          } as React.CSSProperties}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1">
          <span className="text-xs text-surface-500">{percentage.toFixed(1)}%</span>
          <span className="text-xs text-surface-500">Required: {required}%</span>
        </div>
      )}
    </div>
  );
}
