/**
 * Weight formatting utilities
 * All weights are displayed in TON by default for consistency
 */

/**
 * Convert kg to TON
 */
export function kgToTon(kg: number): number {
  return kg / 1000;
}

/**
 * Convert TON to kg
 */
export function tonToKg(ton: number): number {
  return ton * 1000;
}

/**
 * Format weight in TON with specified decimal places
 * @param kg - Weight in kilograms
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string like "20.5 TON"
 */
export function formatWeightTon(kg: number, decimals: number = 1): string {
  const ton = kgToTon(kg);
  return `${ton.toFixed(decimals)} TON`;
}

/**
 * Format weight in TON without unit suffix
 * @param kg - Weight in kilograms
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted number string like "20.5"
 */
export function formatWeightTonValue(kg: number, decimals: number = 1): string {
  const ton = kgToTon(kg);
  return ton.toFixed(decimals);
}

/**
 * Format weight in kg with thousand separators
 * @param kg - Weight in kilograms
 * @returns Formatted string like "20,000 kg"
 */
export function formatWeightKg(kg: number): string {
  return `${kg.toLocaleString('en-US')} kg`;
}

/**
 * Format weight in kg without unit suffix
 * @param kg - Weight in kilograms
 * @returns Formatted number string like "20,000"
 */
export function formatWeightKgValue(kg: number): string {
  return kg.toLocaleString('en-US');
}

/**
 * Format weight with smart unit selection (TON for large, kg for small)
 * Note: This is available but we prefer TON everywhere for consistency
 * @param kg - Weight in kilograms
 * @param threshold - Threshold in kg to switch to TON (default: 1000)
 */
export function formatWeightSmart(
  kg: number,
  threshold: number = 1000
): string {
  if (kg >= threshold) {
    return formatWeightTon(kg);
  }
  return formatWeightKg(kg);
}

/**
 * Format bags with weight
 * @param bags - Number of bags
 * @param bagWeight - Weight per bag in kg (default: 1250)
 * @returns Formatted string like "16 bags (20.0 TON)"
 */
export function formatBagsWithWeight(
  bags: number,
  bagWeight: number = 1250
): string {
  const totalKg = bags * bagWeight;
  return `${bags} bags (${formatWeightTon(totalKg)})`;
}

/**
 * Format bags count with bag size
 * @param bags - Number of bags
 * @param bagWeight - Weight per bag in kg
 * @returns Formatted string like "16 x 1250kg bags"
 */
export function formatBagsDetailed(bags: number, bagWeight: number): string {
  return `${bags} x ${bagWeight}kg bags`;
}

/**
 * Parse weight from various formats to kg
 * @param value - Weight value
 * @param unit - Unit ('kg', 'ton', 'tons', 't')
 * @returns Weight in kg
 */
export function parseWeightToKg(
  value: number,
  unit: 'kg' | 'ton' | 'tons' | 't' = 'kg'
): number {
  switch (unit.toLowerCase()) {
    case 'ton':
    case 'tons':
    case 't':
      return tonToKg(value);
    case 'kg':
    default:
      return value;
  }
}

/**
 * Format compact weight for tight spaces
 * @param kg - Weight in kilograms
 * @returns Short format like "20.5T"
 */
export function formatWeightCompact(kg: number): string {
  const ton = kgToTon(kg);
  if (ton >= 1) {
    return `${ton.toFixed(1)}T`;
  }
  return `${kg.toFixed(0)}kg`;
}
