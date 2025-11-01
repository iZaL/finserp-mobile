import { z } from "zod";

/**
 * Fish Purchase Item Schema
 */
export const fishPurchaseItemSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(), // Local ID for React keys
  fish_species_id: z.number({
    required_error: "Please select a fish species",
    invalid_type_error: "Fish species is required",
  }).min(1, "Please select a fish species"),
  box_count: z.number({
    required_error: "Box count is required",
    invalid_type_error: "Box count must be a number",
  }).min(1, "Box count must be at least 1"),
  box_weights: z.array(z.number().min(0.1, "Box weight must be at least 0.1 kg"))
    .min(1, "At least one box weight is required"),
  rate: z.number({
    required_error: "Rate is required",
    invalid_type_error: "Rate must be a number",
  }).min(0.001, "Rate must be greater than 0"),
  fish_count: z.string().optional(),
  remarks: z.string().optional(),
  // Calculated fields (will be computed, not validated)
  average_box_weight: z.number().optional(),
  net_weight: z.number().optional(),
  net_amount: z.number().optional(),
});

/**
 * Supplier Step Schema
 */
export const supplierStepSchema = z.object({
  contact_id: z.number().optional(),
  contact_name: z.string()
    .min(1, "Supplier name is required")
    .min(2, "Supplier name must be at least 2 characters"),
  contact_number: z.string()
    .min(1, "Contact number is required")
    .min(8, "Contact number must be at least 8 digits"),
  bank_id: z.number().optional(),
  account_number: z.string().optional(),
});

/**
 * Purchase Details Step Schema
 */
export const purchaseDetailsStepSchema = z.object({
  bill_number: z.string()
    .min(1, "Bill number is required"),
  vehicle_number: z.string()
    .min(1, "Vehicle number is required")
    .min(2, "Vehicle number must be at least 2 characters"),
  driver_name: z.string()
    .min(1, "Driver name is required")
    .min(2, "Driver name must be at least 2 characters"),
  driver_number: z.string().optional(),
  fish_location_id: z.number({
    required_error: "Location is required",
    invalid_type_error: "Please select a location",
  }).min(1, "Please select a location"),
  agent_id: z.number().optional(),
  date: z.string()
    .min(1, "Date is required"),
  vehicle_time_in: z.string().optional(),
  vehicle_time_out: z.string().optional(),
  loading_time_in: z.string().optional(),
  loading_time_out: z.string().optional(),
  remarks: z.string().optional(),
});

/**
 * Fish Items Step Schema
 */
export const fishItemsStepSchema = z.object({
  items: z.array(fishPurchaseItemSchema)
    .min(1, "At least one fish item is required"),
});

/**
 * Complete Fish Purchase Form Schema
 */
export const fishPurchaseFormSchema = z.object({
  // Supplier fields
  contact_id: z.number().optional(),
  contact_name: z.string()
    .min(1, "Supplier name is required")
    .min(2, "Supplier name must be at least 2 characters"),
  contact_number: z.string()
    .min(1, "Contact number is required")
    .min(8, "Contact number must be at least 8 digits"),
  bank_id: z.number().optional(),
  account_number: z.string().optional(),

  // Purchase details fields
  bill_number: z.string()
    .min(1, "Bill number is required"),
  vehicle_number: z.string()
    .min(1, "Vehicle number is required")
    .min(2, "Vehicle number must be at least 2 characters"),
  driver_name: z.string()
    .min(1, "Driver name is required")
    .min(2, "Driver name must be at least 2 characters"),
  driver_number: z.string().optional(),
  fish_location_id: z.number({
    required_error: "Location is required",
    invalid_type_error: "Please select a location",
  }).min(1, "Please select a location"),
  agent_id: z.number().optional(),
  date: z.string()
    .min(1, "Date is required"),
  vehicle_time_in: z.string().optional(),
  vehicle_time_out: z.string().optional(),
  loading_time_in: z.string().optional(),
  loading_time_out: z.string().optional(),
  remarks: z.string().optional(),

  // Fish items
  items: z.array(fishPurchaseItemSchema)
    .min(1, "At least one fish item is required"),
}).refine(
  (data) => {
    // Custom validation: if vehicle_time_in and vehicle_time_out are both provided,
    // time_out should be after time_in
    if (data.vehicle_time_in && data.vehicle_time_out) {
      const timeIn = new Date(data.vehicle_time_in);
      const timeOut = new Date(data.vehicle_time_out);
      return timeOut > timeIn;
    }
    return true;
  },
  {
    message: "Vehicle time out must be after vehicle time in",
    path: ["vehicle_time_out"],
  }
).refine(
  (data) => {
    // Custom validation: if loading_time_in and loading_time_out are both provided,
    // time_out should be after time_in
    if (data.loading_time_in && data.loading_time_out) {
      const timeIn = new Date(data.loading_time_in);
      const timeOut = new Date(data.loading_time_out);
      return timeOut > timeIn;
    }
    return true;
  },
  {
    message: "Loading time out must be after loading time in",
    path: ["loading_time_out"],
  }
);

/**
 * Update Fish Purchase Status Schema
 */
export const updateStatusSchema = z.object({
  status: z.enum(["draft", "pending", "approved", "paid", "closed", "rejected"], {
    required_error: "Status is required",
  }),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Quick Create Fish Purchase Schema (from vehicle booking)
 */
export const quickCreateFromBookingSchema = fishPurchaseFormSchema.partial({
  vehicle_number: true,
  driver_name: true,
  driver_number: true,
});

// Export types derived from schemas
export type FishPurchaseItemFormData = z.infer<typeof fishPurchaseItemSchema>;
export type SupplierStepFormData = z.infer<typeof supplierStepSchema>;
export type PurchaseDetailsStepFormData = z.infer<typeof purchaseDetailsStepSchema>;
export type FishItemsStepFormData = z.infer<typeof fishItemsStepSchema>;
export type FishPurchaseFormData = z.infer<typeof fishPurchaseFormSchema>;
export type UpdateStatusFormData = z.infer<typeof updateStatusSchema>;

/**
 * Helper function to validate a single step
 */
export function validateStep(
  step: "supplier" | "details" | "items",
  data: Partial<FishPurchaseFormData>
): { success: boolean; errors?: Record<string, string> } {
  let schema: z.ZodSchema;

  switch (step) {
    case "supplier":
      schema = supplierStepSchema;
      break;
    case "details":
      schema = purchaseDetailsStepSchema;
      break;
    case "items":
      schema = fishItemsStepSchema;
      break;
    default:
      return { success: false, errors: { general: "Invalid step" } };
  }

  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true };
  }

  // Convert Zod errors to flat error object
  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join(".");
    errors[path] = err.message;
  });

  return { success: false, errors };
}

/**
 * Helper function to validate fish item
 */
export function validateFishItem(
  item: Partial<FishPurchaseItemFormData>
): { success: boolean; errors?: Record<string, string> } {
  const result = fishPurchaseItemSchema.safeParse(item);

  if (result.success) {
    return { success: true };
  }

  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join(".");
    errors[path] = err.message;
  });

  return { success: false, errors };
}
