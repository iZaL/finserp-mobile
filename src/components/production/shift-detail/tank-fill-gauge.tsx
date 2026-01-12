'use client';

import {useEffect, useState} from 'react';
import {cn} from '@/lib/utils';
import {formatWeightCompact} from '@/lib/utils/weight';
import {Droplet} from 'lucide-react';

interface TankFillGaugeProps {
  tankCapacity: number;
  fillCycles: number;
  totalQuantity: number;
  className?: string;
}

function Tank({fillPercentage}: {fillPercentage: number}) {
  const [animatedFill, setAnimatedFill] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedFill(fillPercentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [fillPercentage]);

  return (
    <div className="relative mx-auto" style={{width: '120px', height: '140px'}}>
      {/* Tank outline */}
      <svg viewBox="0 0 100 120" className="size-full">
        <defs>
          {/* Liquid gradient */}
          <linearGradient id="liquidGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>

          {/* Tank mask */}
          <clipPath id="tankMask">
            <path d="M 20 15 Q 20 5, 30 5 L 70 5 Q 80 5, 80 15 L 80 100 Q 80 115, 65 115 L 35 115 Q 20 115, 20 100 Z" />
          </clipPath>

          {/* Wave pattern */}
          <pattern
            id="wavePattern"
            x="0"
            y="0"
            width="200"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 0 10 Q 25 0, 50 10 T 100 10 T 150 10 T 200 10"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2"
              opacity="0.5"
            >
              <animate
                attributeName="d"
                dur="2s"
                repeatCount="indefinite"
                values="M 0 10 Q 25 0, 50 10 T 100 10 T 150 10 T 200 10;
                        M 0 10 Q 25 20, 50 10 T 100 10 T 150 10 T 200 10;
                        M 0 10 Q 25 0, 50 10 T 100 10 T 150 10 T 200 10"
              />
            </path>
          </pattern>
        </defs>

        {/* Tank body */}
        <path
          d="M 20 15 Q 20 5, 30 5 L 70 5 Q 80 5, 80 15 L 80 100 Q 80 115, 65 115 L 35 115 Q 20 115, 20 100 Z"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="3"
          className="dark:stroke-slate-600"
        />

        {/* Liquid fill */}
        <g clipPath="url(#tankMask)">
          <rect
            x="20"
            y={115 - (animatedFill / 100) * 110}
            width="60"
            height={(animatedFill / 100) * 110 + 5}
            fill="url(#liquidGradient)"
            className="transition-all duration-1000 ease-out"
          />

          {/* Animated wave on top of liquid */}
          {animatedFill > 0 && (
            <g
              transform={`translate(0, ${115 - (animatedFill / 100) * 110 - 10})`}
            >
              <rect
                x="20"
                y="0"
                width="60"
                height="20"
                fill="url(#wavePattern)"
              />
            </g>
          )}
        </g>

        {/* Tank cap */}
        <ellipse
          cx="50"
          cy="5"
          rx="20"
          ry="4"
          fill="#64748b"
          className="dark:fill-slate-500"
        />

        {/* Tank legs */}
        <rect x="25" y="115" width="8" height="5" rx="1" fill="#64748b" />
        <rect x="67" y="115" width="8" height="5" rx="1" fill="#64748b" />
      </svg>

      {/* Fill percentage label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold text-cyan-700 dark:text-cyan-400">
          {Math.round(animatedFill)}%
        </span>
      </div>
    </div>
  );
}

export function TankFillGauge({
  tankCapacity,
  fillCycles,
  totalQuantity,
  className,
}: TankFillGaugeProps) {
  // Calculate current fill percentage (partial fill of current cycle)
  const completedQuantity = fillCycles * tankCapacity;
  const currentFill = totalQuantity - completedQuantity;
  const currentFillPercentage =
    tankCapacity > 0 ? Math.min(100, (currentFill / tankCapacity) * 100) : 0;

  return (
    <div className={cn('rounded-xl bg-cyan-500/5 p-4', className)}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-cyan-500/20 p-2">
            <Droplet className="size-5 text-cyan-600" />
          </div>
          <div>
            <h4 className="font-semibold">Fish Oil Tank</h4>
            <p className="text-muted-foreground text-xs">
              {tankCapacity > 0
                ? `${formatWeightCompact(tankCapacity)} capacity`
                : 'Variable capacity'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-cyan-600">{fillCycles}</p>
          <p className="text-muted-foreground text-xs">
            fill{fillCycles !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Tank visualization */}
      <div className="mb-4 flex justify-center">
        <Tank
          fillPercentage={
            currentFillPercentage > 0
              ? currentFillPercentage
              : fillCycles > 0
                ? 100
                : 0
          }
        />
      </div>

      {/* Stats */}
      <div className="border-t border-cyan-500/20 pt-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total Quantity</span>
          <span className="font-semibold">
            {formatWeightCompact(totalQuantity)}
          </span>
        </div>
        {fillCycles > 0 && tankCapacity > 0 && (
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Per Fill</span>
            <span className="font-medium">
              {formatWeightCompact(tankCapacity)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
