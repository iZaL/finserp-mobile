/**
 * Yield calculation utilities for fishmeal factory
 *
 * Yield = (Output Weight / Input Weight) x 100
 *
 * Note: Expected yields are fetched from DB (product_types table)
 * The constants below are only fallbacks if DB data is unavailable
 */

export type YieldStatus = 'good' | 'warning' | 'bad';

export interface YieldRange {
  min: number;
  max: number;
  expected: number;
}

export interface YieldResult {
  percentage: number;
  status: YieldStatus;
  label: string;
}

// Fallback yield ranges (only used if DB data unavailable)
export const FISHMEAL_YIELD: YieldRange = {
  min: 19,
  max: 22,
  expected: 20,
};

export const FISH_OIL_YIELD: YieldRange = {
  min: 5,
  max: 8,
  expected: 6,
};

export const TOTAL_YIELD: YieldRange = {
  min: 24,
  max: 30,
  expected: 26,
};

/**
 * Calculate yield percentage
 * @param outputKg - Output weight in kg
 * @param inputKg - Input weight in kg (fish offloaded)
 * @returns Yield percentage (0-100)
 */
export function calculateYield(outputKg: number, inputKg: number): number {
  if (inputKg <= 0) return 0;
  return (outputKg / inputKg) * 100;
}

/**
 * Determine yield status based on range
 * @param percentage - Yield percentage
 * @param range - Expected yield range
 * @param higherIsBetter - If true, exceeding max is still 'good' (e.g., for fish oil)
 * @returns Status: 'good' | 'warning' | 'bad'
 */
export function getYieldStatus(
  percentage: number,
  range: YieldRange,
  higherIsBetter: boolean = false
): YieldStatus {
  // Within expected range is always good
  if (percentage >= range.min && percentage <= range.max) {
    return 'good';
  }

  // Above max: good if higher is better, otherwise check warning buffer
  if (percentage > range.max) {
    if (higherIsBetter) {
      return 'good';
    }
    // Within 2% above max = warning
    const warningBuffer = 2;
    if (percentage <= range.max + warningBuffer) {
      return 'warning';
    }
    return 'bad';
  }

  // Below min: check warning buffer
  const warningBuffer = 2;
  if (percentage >= range.min - warningBuffer) {
    return 'warning';
  }

  return 'bad';
}

/**
 * Get status color class for yield
 */
export function getYieldStatusColor(status: YieldStatus): string {
  switch (status) {
    case 'good':
      return 'text-emerald-600 dark:text-emerald-400';
    case 'warning':
      return 'text-amber-600 dark:text-amber-400';
    case 'bad':
      return 'text-red-600 dark:text-red-400';
  }
}

/**
 * Get status background color class for yield
 */
export function getYieldStatusBgColor(status: YieldStatus): string {
  switch (status) {
    case 'good':
      return 'bg-emerald-500';
    case 'warning':
      return 'bg-amber-500';
    case 'bad':
      return 'bg-red-500';
  }
}

/**
 * Get yield analysis for a product type
 */
export function analyzeYield(
  outputKg: number,
  inputKg: number,
  range: YieldRange
): YieldResult {
  const percentage = calculateYield(outputKg, inputKg);
  const status = getYieldStatus(percentage, range);

  let label: string;
  if (status === 'good') {
    label = 'Within expected range';
  } else if (status === 'warning') {
    label =
      percentage < range.min
        ? 'Slightly below expected'
        : 'Slightly above expected';
  } else {
    label = percentage < range.min ? 'Below expected' : 'Above expected';
  }

  return {percentage, status, label};
}

/**
 * Format yield percentage for display
 */
export function formatYieldPercentage(
  percentage: number,
  decimals: number = 1
): string {
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Calculate all yields for a shift/run
 */
export interface ShiftYieldAnalysis {
  fishInput: number; // kg
  fishmealOutput: number; // kg
  fishOilOutput: number; // kg
  totalOutput: number; // kg
  fishmealYield: YieldResult;
  fishOilYield: YieldResult;
  totalYield: YieldResult;
}

export function analyzeShiftYields(
  fishInputKg: number,
  fishmealOutputKg: number,
  fishOilOutputKg: number,
  customRanges?: {
    fishmeal?: YieldRange;
    fishOil?: YieldRange;
    total?: YieldRange;
  }
): ShiftYieldAnalysis {
  const totalOutput = fishmealOutputKg + fishOilOutputKg;

  const fishmealRange = customRanges?.fishmeal || FISHMEAL_YIELD;
  const fishOilRange = customRanges?.fishOil || FISH_OIL_YIELD;
  const totalRange = customRanges?.total || TOTAL_YIELD;

  return {
    fishInput: fishInputKg,
    fishmealOutput: fishmealOutputKg,
    fishOilOutput: fishOilOutputKg,
    totalOutput,
    fishmealYield: analyzeYield(fishmealOutputKg, fishInputKg, fishmealRange),
    fishOilYield: analyzeYield(fishOilOutputKg, fishInputKg, fishOilRange),
    totalYield: analyzeYield(totalOutput, fishInputKg, totalRange),
  };
}

/**
 * Get progress bar percentage (capped at 100%)
 * For display purposes, we show progress relative to expected maximum
 */
export function getYieldProgressPercent(
  percentage: number,
  range: YieldRange
): number {
  // Use max + buffer as the full scale
  const maxScale = range.max + 5;
  return Math.min((percentage / maxScale) * 100, 100);
}

/**
 * Calculate total yield from fishmeal and fish oil outputs
 * @param fishmealOutputKg - Fishmeal output in kg
 * @param fishOilOutputKg - Fish oil output in kg
 * @param fishInputKg - Fish input in kg
 * @returns Total yield percentage
 */
export function calculateTotalYield(
  fishmealOutputKg: number,
  fishOilOutputKg: number,
  fishInputKg: number
): number {
  const totalOutput = fishmealOutputKg + fishOilOutputKg;
  return calculateYield(totalOutput, fishInputKg);
}
