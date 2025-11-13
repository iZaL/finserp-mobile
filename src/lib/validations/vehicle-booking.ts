/**
 * Vehicle Booking Validation Schemas
 *
 * Zod schemas for validating vehicle booking forms and API requests.
 * Ensures type-safety and consistent validation across the application.
 */

import { z } from "zod"
import { REJECTION_REASONS } from "@/types/vehicle-booking"

/**
 * Phone number validation regex (supports international formats)
 * Examples: +968 12345678, 12345678, +1-234-567-8900
 */
const phoneRegex = /^[\d\s\-+()]+$/

/**
 * Vehicle number validation
 * Allows alphanumeric characters, spaces, and common separators
 */
const vehicleNumberRegex = /^[A-Za-z0-9\s\-/]+$/

/**
 * Create Vehicle Booking Schema
 */
export const createVehicleBookingSchema = z.object({
  vehicle_number: z
    .string()
    .min(1, "Vehicle number is required")
    .max(50, "Vehicle number must be less than 50 characters")
    .regex(vehicleNumberRegex, "Vehicle number contains invalid characters")
    .transform((val) => val.trim().toUpperCase()),

  box_count: z
    .number({ message: "Box count must be a number" })
    .int("Box count must be a whole number")
    .min(1, "Box count must be at least 1")
    .max(10000, "Box count cannot exceed 10,000"),

  box_weight_kg: z
    .number({ message: "Box weight must be a number" })
    .positive("Box weight must be positive")
    .max(1000, "Box weight cannot exceed 1,000 kg"),

  driver_name: z
    .string()
    .max(100, "Driver name must be less than 100 characters")
    .optional()
    .transform((val) => val?.trim() || undefined),

  driver_phone: z
    .string()
    .max(20, "Driver phone must be less than 20 characters")
    .regex(phoneRegex, "Invalid phone number format")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val?.trim() ? val.trim() : undefined)),

  supplier_name: z
    .string()
    .max(100, "Supplier name must be less than 100 characters")
    .optional()
    .transform((val) => val?.trim() || undefined),

  supplier_phone: z
    .string()
    .max(20, "Supplier phone must be less than 20 characters")
    .regex(phoneRegex, "Invalid phone number format")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val?.trim() ? val.trim() : undefined)),

  notes: z
    .string()
    .max(1000, "Notes must be less than 1,000 characters")
    .optional()
    .transform((val) => val?.trim() || undefined),

  allow_override: z.boolean().optional().default(false),
})

/**
 * Update Vehicle Booking Schema
 * All fields are optional for updates
 */
export const updateVehicleBookingSchema = createVehicleBookingSchema.partial()

/**
 * Receive Vehicle Schema
 */
export const receiveVehicleSchema = z.object({
  notes: z
    .string()
    .max(1000, "Notes must be less than 1,000 characters")
    .optional()
    .transform((val) => val?.trim() || undefined),
})

/**
 * Reject Vehicle Schema
 */
export const rejectVehicleSchema = z
  .object({
    rejection_reason: z
      .enum(REJECTION_REASONS as unknown as [string, ...string[]], {
        message: "Rejection reason is required",
      }),

    rejection_notes: z
      .string()
      .max(500, "Rejection notes must be less than 500 characters")
      .optional()
      .transform((val) => val?.trim() || undefined),
  })
  .refine(
    (data) => {
      // If reason is "Other", notes are required
      if (data.rejection_reason === "Other") {
        return !!data.rejection_notes?.trim()
      }
      return true
    },
    {
      message: "Additional notes are required when selecting 'Other' as rejection reason",
      path: ["rejection_notes"],
    }
  )

/**
 * Approve Vehicle Schema
 */
export const approveVehicleSchema = z.object({
  notes: z
    .string()
    .max(1000, "Notes must be less than 1,000 characters")
    .optional()
    .transform((val) => val?.trim() || undefined),
})

/**
 * Reject Approval Schema
 */
export const rejectApprovalSchema = z.object({
  notes: z
    .string()
    .min(1, "Notes are required when rejecting approval")
    .max(500, "Notes must be less than 500 characters")
    .transform((val) => val.trim()),
})

/**
 * Start Offloading Schema
 * No additional data needed
 */
export const startOffloadingSchema = z.object({})

/**
 * Complete Offloading Schema
 */
export const completeOffloadingSchema = z.object({
  actual_box_count: z
    .number({ message: "Actual box count must be a number" })
    .int("Actual box count must be a whole number")
    .min(0, "Actual box count cannot be negative")
    .max(10000, "Actual box count cannot exceed 10,000"),

  notes: z
    .string()
    .max(1000, "Notes must be less than 1,000 characters")
    .optional()
    .transform((val) => val?.trim() || undefined),
})

/**
 * Exit Vehicle Schema
 */
export const exitVehicleSchema = z.object({
  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional()
    .transform((val) => val?.trim() || undefined),
})

/**
 * Update Daily Limit Schema
 */
export const updateDailyLimitSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),

  daily_limit_boxes: z
    .number({ message: "Daily box limit must be a number" })
    .int("Daily box limit must be a whole number")
    .min(0, "Daily box limit cannot be negative")
    .max(100000, "Daily box limit cannot exceed 100,000"),

  daily_limit_tons: z
    .number({ message: "Daily ton limit must be a number" })
    .positive("Daily ton limit must be positive")
    .max(10000, "Daily ton limit cannot exceed 10,000 tons")
    .nullable()
    .optional(),
})

/**
 * Bulk Action Schema
 */
export const bulkActionSchema = z.object({
  vehicle_ids: z
    .array(z.number().int().positive())
    .min(1, "At least one vehicle must be selected")
    .max(100, "Cannot perform bulk action on more than 100 vehicles at once"),

  action: z.enum(["receive", "unreceive", "reject", "exit", "delete"], {
    message: "Action is required",
  }),

  data: z
    .union([receiveVehicleSchema, rejectVehicleSchema])
    .optional(),
})

/**
 * Type exports for use with react-hook-form
 */
export type CreateVehicleBookingInput = z.infer<typeof createVehicleBookingSchema>
export type UpdateVehicleBookingInput = z.infer<typeof updateVehicleBookingSchema>
export type ReceiveVehicleInput = z.infer<typeof receiveVehicleSchema>
export type RejectVehicleInput = z.infer<typeof rejectVehicleSchema>
export type ApproveVehicleInput = z.infer<typeof approveVehicleSchema>
export type RejectApprovalInput = z.infer<typeof rejectApprovalSchema>
export type StartOffloadingInput = z.infer<typeof startOffloadingSchema>
export type CompleteOffloadingInput = z.infer<typeof completeOffloadingSchema>
export type ExitVehicleInput = z.infer<typeof exitVehicleSchema>
export type UpdateDailyLimitInput = z.infer<typeof updateDailyLimitSchema>
export type BulkActionInput = z.infer<typeof bulkActionSchema>
