import { useEffect, useState } from 'react';
import { SafetyStatus } from '../types';

interface CircularProgressProps {
  percentage: number;
  status: SafetyStatus;
  size?: number;
  strokeWidth?: number;
}

export default function CircularProgress({
  percentage,
  status,
  size = 160,
  strokeWidth = 10
}: CircularProgressProps) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPercentage / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPercentage(percentage), 150);
    return () => clearTimeout(timer);
  }, [percentage]);

  const colors = {
    SAFE: { stroke: '#10b981', glow: 'rgba(16, 185, 129, 0.25)', bg: 'rgba(16, 185, 129, 0.06)' },
    WARNING: { stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.25)', bg: 'rgba(245, 158, 11, 0.06)' },
    DANGER: { stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.25)', bg: 'rgba(239, 68, 68, 0.06)' },
  }[status];

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Outer glow pulse */}
      <div
        className="absolute rounded-full"
        style={{
          width: size + 20,
          height: size + 20,
          background: `radial-gradient(circle, ${colors.bg}, transparent 70%)`,
        }}
      />

      <svg width={size} height={size} className="circular-progress relative">
        <defs>
          {/* Gradient for the progress arc */}
          <linearGradient id={`progress-grad-${status}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.stroke} />
            <stop offset="100%" stopColor={status === 'SAFE' ? '#34d399' : status === 'WARNING' ? '#fbbf24' : '#f87171'} />
          </linearGradient>
          {/* Glow filter */}
          <filter id={`glow-${status}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.04)"
          strokeWidth={strokeWidth}
        />

        {/* Track markers — subtle tick marks at 25%, 50%, 75% */}
        {[25, 50, 75].map(tick => {
          const angle = (tick / 100) * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          const x = size / 2 + (radius) * Math.cos(rad);
          const y = size / 2 + (radius) * Math.sin(rad);
          return (
            <circle
              key={tick}
              cx={x}
              cy={y}
              r={1.5}
              fill="rgba(255, 255, 255, 0.08)"
            />
          );
        })}

        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#progress-grad-${status})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          filter={`url(#glow-${status})`}
          style={{
            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: `drop-shadow(0 0 8px ${colors.glow})`,
          }}
        />

        {/* End cap dot */}
        {animatedPercentage > 0 && (
          <circle
            cx={size / 2 + radius * Math.cos(((animatedPercentage / 100) * 360 - 90) * Math.PI / 180)}
            cy={size / 2 + radius * Math.sin(((animatedPercentage / 100) * 360 - 90) * Math.PI / 180)}
            r={strokeWidth / 2 + 1}
            fill={colors.stroke}
            style={{
              transition: 'all 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: `drop-shadow(0 0 4px ${colors.glow})`,
            }}
          />
        )}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white tracking-tight">
          {animatedPercentage.toFixed(1)}
          <span className="text-lg text-surface-400 font-normal">%</span>
        </span>
        <span className="text-[11px] text-surface-500 mt-0.5 font-medium uppercase tracking-wider">
          Overall
        </span>
      </div>
    </div>
  );
}
