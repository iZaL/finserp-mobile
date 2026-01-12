'use client';

import {cn} from '@/lib/utils';
import {formatWeightCompact} from '@/lib/utils/weight';
import {Truck, Factory, Package, Droplet} from 'lucide-react';

interface ProductionFlowVisualProps {
  fishInputKg: number;
  fishmealOutputKg: number;
  fishOilOutputKg: number;
  vehicleCount: number;
  isActive?: boolean;
  className?: string;
}

export function ProductionFlowVisual({
  fishInputKg,
  fishmealOutputKg,
  fishOilOutputKg,
  vehicleCount,
  isActive = false,
  className,
}: ProductionFlowVisualProps) {
  const mealYield =
    fishInputKg > 0 ? (fishmealOutputKg / fishInputKg) * 100 : 0;
  const oilYield = fishInputKg > 0 ? (fishOilOutputKg / fishInputKg) * 100 : 0;

  return (
    <div className={cn('relative', className)}>
      {/* Horizontal flow layout */}
      <div className="flex items-center justify-between px-2">
        {/* Input Section */}
        <div className="flex flex-col items-center">
          <div
            className={cn(
              'flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg',
              isActive && 'animate-pulse'
            )}
          >
            <Truck className="size-6 text-white" />
          </div>
          <div className="mt-2 text-center">
            <p className="text-sm font-bold text-blue-600">
              {formatWeightCompact(fishInputKg)}
            </p>
            <p className="text-muted-foreground text-[10px]">
              {vehicleCount} vehicle{vehicleCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Flow arrows to center */}
        <div className="mx-2 flex-1">
          <svg viewBox="0 0 100 20" className="h-5 w-full">
            <defs>
              <linearGradient
                id="flowGradient1"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>
            </defs>
            <path
              d="M 0 10 L 90 10"
              fill="none"
              stroke="url(#flowGradient1)"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.4"
            />
            <polygon points="90,5 100,10 90,15" fill="#475569" opacity="0.6" />
            {isActive && (
              <circle r="4" fill="#3b82f6">
                <animateMotion
                  dur="1.5s"
                  repeatCount="indefinite"
                  path="M 0 10 L 90 10"
                />
              </circle>
            )}
          </svg>
        </div>

        {/* Processing Center */}
        <div className="flex flex-col items-center">
          <div
            className={cn(
              'relative flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-700 shadow-lg'
            )}
          >
            {isActive && (
              <div className="absolute inset-0 animate-ping rounded-full bg-slate-500 opacity-20" />
            )}
            <Factory className="size-7 text-white" />
          </div>
          <p className="text-muted-foreground mt-2 text-[10px]">Processing</p>
        </div>

        {/* Flow arrows from center - split to two outputs */}
        <div className="mx-2 flex flex-1 flex-col gap-1">
          {/* To Fishmeal */}
          <svg viewBox="0 0 100 20" className="h-4 w-full">
            <defs>
              <linearGradient
                id="flowGradient2"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#475569" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
            <path
              d="M 0 15 Q 50 15, 90 5"
              fill="none"
              stroke="url(#flowGradient2)"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.4"
            />
            <polygon points="88,0 100,5 90,10" fill="#f59e0b" opacity="0.6" />
            {isActive && (
              <circle r="3" fill="#f59e0b">
                <animateMotion
                  dur="1.2s"
                  repeatCount="indefinite"
                  path="M 0 15 Q 50 15, 90 5"
                />
              </circle>
            )}
          </svg>
          {/* To Fish Oil */}
          <svg viewBox="0 0 100 20" className="h-4 w-full">
            <defs>
              <linearGradient
                id="flowGradient3"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#475569" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            <path
              d="M 0 5 Q 50 5, 90 15"
              fill="none"
              stroke="url(#flowGradient3)"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.4"
            />
            <polygon points="88,10 100,15 90,20" fill="#06b6d4" opacity="0.6" />
            {isActive && (
              <circle r="3" fill="#06b6d4">
                <animateMotion
                  dur="1.2s"
                  repeatCount="indefinite"
                  path="M 0 5 Q 50 5, 90 15"
                />
              </circle>
            )}
          </svg>
        </div>

        {/* Output Section - stacked */}
        <div className="flex flex-col gap-3">
          {/* Fishmeal */}
          <div className="flex items-center gap-2">
            <div className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500 shadow-md">
              <Package className="size-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-xs leading-tight font-bold text-amber-600">
                {formatWeightCompact(fishmealOutputKg)}
              </p>
              <p className="text-muted-foreground text-[9px]">
                {mealYield.toFixed(0)}% yield
              </p>
            </div>
          </div>
          {/* Fish Oil */}
          <div className="flex items-center gap-2">
            <div className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-sky-500 shadow-md">
              <Droplet className="size-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-xs leading-tight font-bold text-cyan-600">
                {formatWeightCompact(fishOilOutputKg)}
              </p>
              <p className="text-muted-foreground text-[9px]">
                {oilYield.toFixed(0)}% yield
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
