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
    const timer = setTimeout(() => setAnimatedPercentage(percentage), 200);
    return () => clearTimeout(timer);
  }, [percentage]);

  const colors = {
    SAFE: {
      stroke: '#10b981',
      strokeEnd: '#34d399',
      glow: 'rgba(16, 185, 129, 0.3)',
      bg: 'rgba(16, 185, 129, 0.05)',
      ring: 'rgba(16, 185, 129, 0.08)',
    },
    WARNING: {
      stroke: '#f59e0b',
      strokeEnd: '#fbbf24',
      glow: 'rgba(245, 158, 11, 0.3)',
      bg: 'rgba(245, 158, 11, 0.05)',
      ring: 'rgba(245, 158, 11, 0.08)',
    },
    DANGER: {
      stroke: '#ef4444',
      strokeEnd: '#f87171',
      glow: 'rgba(239, 68, 68, 0.3)',
      bg: 'rgba(239, 68, 68, 0.05)',
      ring: 'rgba(239, 68, 68, 0.08)',
    },
  }[status];

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Outer ambient glow — breathing */}
      <div
        className="absolute rounded-full animate-breathe"
        style={{
          width: size + 30,
          height: size + 30,
          background: `radial-gradient(circle, ${colors.bg}, transparent 65%)`,
        }}
      />

      {/* Secondary subtle ring */}
      <div
        className="absolute rounded-full"
        style={{
          width: size + 8,
          height: size + 8,
          border: `1px solid ${colors.ring}`,
        }}
      />

      <svg width={size} height={size} className="circular-progress relative">
        <defs>
          {/* Gradient for the progress arc */}
          <linearGradient id={`progress-grad-${status}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.stroke} />
            <stop offset="100%" stopColor={colors.strokeEnd} />
          </linearGradient>
          {/* Glow filter */}
          <filter id={`glow-${status}`}>
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
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
          stroke="rgba(255, 255, 255, 0.03)"
          strokeWidth={strokeWidth}
        />

        {/* Tick marks at 25%, 50%, 75% */}
        {[25, 50, 75].map(tick => {
          const angle = (tick / 100) * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          const x = size / 2 + radius * Math.cos(rad);
          const y = size / 2 + radius * Math.sin(rad);
          return (
            <circle
              key={tick}
              cx={x}
              cy={y}
              r={1.5}
              fill="rgba(255, 255, 255, 0.06)"
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
            transition: 'stroke-dashoffset 1.8s cubic-bezier(0.19, 1, 0.22, 1)',
            filter: `drop-shadow(0 0 10px ${colors.glow})`,
          }}
        />

        {/* End cap dot */}
        {animatedPercentage > 0 && (
          <circle
            cx={size / 2 + radius * Math.cos(((animatedPercentage / 100) * 360 - 90) * Math.PI / 180)}
            cy={size / 2 + radius * Math.sin(((animatedPercentage / 100) * 360 - 90) * Math.PI / 180)}
            r={strokeWidth / 2 + 1.5}
            fill={colors.stroke}
            style={{
              transition: 'all 1.8s cubic-bezier(0.19, 1, 0.22, 1)',
              filter: `drop-shadow(0 0 6px ${colors.glow})`,
            }}
          />
        )}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white tracking-tight">
          {animatedPercentage.toFixed(1)}
          <span className="text-lg text-surface-400 font-normal ml-0.5">%</span>
        </span>
        <span className="text-[10px] text-surface-500 mt-1 font-semibold uppercase tracking-[0.12em]">
          Overall
        </span>
      </div>
    </div>
  );
}
