/**
 * Status color utilities for consistent status badge styling
 * Centralizes status-to-color mapping to avoid duplication
 */

type StatusColorMap = Record<string, string>

/**
 * Vehicle booking status colors
 */
const vehicleStatusColors: StatusColorMap = {
  booked: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  received: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  offloading: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  offloaded: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
  exited: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800",
  pending_approval: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
}

/**
 * Fish purchase status colors
 */
const fishPurchaseStatusColors: StatusColorMap = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
}

/**
 * Payment status colors
 */
const paymentStatusColors: StatusColorMap = {
  success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  partial: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
}

/**
 * Default status color (fallback)
 */
const defaultStatusColor = "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700"

/**
 * Get Tailwind classes for vehicle booking status badge
 * @param status - Vehicle booking status
 * @returns Tailwind CSS classes for the status badge
 */
export function getVehicleStatusColor(status: string): string {
  return vehicleStatusColors[status.toLowerCase()] || defaultStatusColor
}

/**
 * Get Tailwind classes for fish purchase status badge
 * @param status - Fish purchase status
 * @returns Tailwind CSS classes for the status badge
 */
export function getFishPurchaseStatusColor(status: string): string {
  return fishPurchaseStatusColors[status.toLowerCase()] || defaultStatusColor
}

/**
 * Get Tailwind classes for payment status badge
 * @param status - Payment status
 * @returns Tailwind CSS classes for the status badge
 */
export function getPaymentStatusColor(status: string): string {
  return paymentStatusColors[status.toLowerCase()] || defaultStatusColor
}

/**
 * Generic status color getter
 * @param status - Status string
 * @param colorMap - Custom color mapping
 * @returns Tailwind CSS classes for the status badge
 */
export function getStatusColor(
  status: string,
  colorMap?: StatusColorMap
): string {
  if (colorMap) {
    return colorMap[status.toLowerCase()] || defaultStatusColor
  }
  return defaultStatusColor
}
