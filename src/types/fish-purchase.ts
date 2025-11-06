// Fish Purchase Types - Copied from erp-web and adapted for mobile
// Source: erp-web/resources/js/types.ts

import type { Contact, Address, Media, Bank } from "./shared";
import type { Payment, PaymentAccount } from "./payment";

/**
 * Fish Species
 */
export interface FishSpecies {
  id: number;
  name: string;
  name_ar?: string;
  code?: string;
}

/**
 * Fish Purchase Status
 */
export type FishPurchaseStatus =
  | "draft"
  | "pending"
  | "approved"
  | "paid"
  | "closed"
  | "rejected";

/**
 * Fish Box Weight (array of individual box weights)
 */
export type FishBoxWeight = number[];

/**
 * Fish Purchase Item
 */
export interface FishPurchaseItem {
  id?: number | string; // Optional for form usage, can be string or number
  fish_purchase_id?: number;
  fish_species_id: number;
  rate: number;
  fish_count?: string;
  box_count: number;
  net_weight?: number; // Optional for form usage, calculated
  net_amount?: number; // Optional for form usage, calculated
  average_box_weight?: number; // Optional for form usage, calculated
  box_weights: number[];
  remarks?: string;
  fish_species?: FishSpecies;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fish Purchase Permissions
 */
export interface FishPurchasePermissions {
  can_edit: boolean;
  can_approve: boolean;
  can_add_details: boolean;
  can_edit_details: boolean;
  can_create_bill: boolean;
  can_create_production: boolean;
}

/**
 * Fish Purchase Production
 */
export interface FishPurchaseProduction {
  id: number;
  name: string;
  fish_purchase_id: number;
  fish_weight: number;
  fish_meal_weight: number;
  fish_meal_bag_weight: number;
  fish_meal_bag_count: number;
  fish_meal_bag_count_left: number;
  fish_oil_weight: number;
  fish_oil_bag_weight: number;
  date: string;
  remarks?: string;
  purchase?: FishPurchase;
}

/**
 * Advance Payment Info
 */
export interface AdvancePaymentInfo {
  total_advance: number;
  successful_advance: number;
  pending_advance: number;
  has_pending: boolean;
}

/**
 * Bill Document (simplified for mobile)
 */
export interface BillDocument {
  id: number;
  bill_number: string;
  date: string;
  due_date?: string;
  status: string;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  payments?: Payment[];
  created_at: string;
}

/**
 * Pricing (simplified for mobile)
 */
export interface Pricing {
  id: number;
  total: number;
  paid: number;
  balance: number;
  currency: string;
}

/**
 * Main Fish Purchase Interface
 */
export interface FishPurchase {
  id: number;
  bill_id?: number;
  bill?: BillDocument;
  biller_id?: number;
  fish_location_id: number;
  contact_id?: number;
  bank_id?: number;
  agent_id?: number;
  vehicle_booking_id?: number;
  account_number?: string;
  bill_number: string;
  contact_name: string;
  contact_number: string;
  vehicle_number: string;
  driver_name: string;
  driver_number?: string;
  remarks?: string;
  vehicle_time_in?: string;
  vehicle_time_out?: string;
  loading_time_in?: string;
  loading_time_out?: string;
  weights?: FishBoxWeight[];
  items?: FishPurchaseItem[];
  total_boxes: number;
  total_weight: number;
  total_amount: number;
  advance_amount?: number;
  balance_amount: number;
  available_weight?: number;
  advance_payment_info?: AdvancePaymentInfo;
  supplier?: Contact;
  agent?: Contact;
  created_at: string;
  updated_at?: string;
  status: FishPurchaseStatus;
  location?: Address;
  production?: FishPurchaseProduction;
  pricing?: Pricing;
  media?: Media[];
  date: string;
  date_formatted?: string;
  permissions?: FishPurchasePermissions;
  payment_accounts?: PaymentAccount[];
}

// ============= Request/Response Types for API =============

/**
 * Create Fish Purchase Request
 */
export interface CreateFishPurchaseRequest {
  contact_id?: number;
  contact_name: string;
  contact_number: string;
  bank_id?: number;
  agent_id?: number;
  vehicle_booking_id?: number;
  account_number?: string;
  fish_location_id: number;
  bill_number: string;
  vehicle_number: string;
  driver_name: string;
  driver_number?: string;
  date?: string;
  vehicle_time_in?: string;
  vehicle_time_out?: string;
  loading_time_in?: string;
  loading_time_out?: string;
  remarks?: string;
  items: CreateFishPurchaseItemRequest[];
}

/**
 * Create Fish Purchase Item Request
 */
export interface CreateFishPurchaseItemRequest {
  fish_species_id: number;
  box_count: number;
  box_weights: number[];
  rate: number;
  fish_count?: string;
  remarks?: string;
}

/**
 * Update Fish Purchase Request
 */
export type UpdateFishPurchaseRequest = Partial<CreateFishPurchaseRequest>

/**
 * Fish Purchase Filters for List/Search
 */
export interface FishPurchaseFilters {
  search?: string;
  status?: "all" | FishPurchaseStatus;
  date_from?: string;
  date_to?: string;
  supplier_id?: number;
  location_id?: number;
  page?: number;
  per_page?: number;
}

// PaginatedResponse and ApiResponse are imported from "./shared"

/**
 * Fish Purchase Settings
 */
export interface FishPurchaseSettings {
  bill_number: string;
  default_box_weight_kg: number;
  fish_purchase_prefix: string;
}

/**
 * Update Status Request
 */
export interface UpdateStatusRequest {
  status: FishPurchaseStatus;
  reason?: string;
  notes?: string;
}

/**
 * Fish Purchase Summary Stats (for list view)
 */
export interface FishPurchaseStats {
  total_purchases: number;
  total_amount: number;
  total_weight: number;
  total_boxes: number;
  pending_count: number;
  approved_count: number;
  draft_count: number;
}

// ============= Form Field Types (for React Hook Form) =============

/**
 * Fish Purchase Form Data (used in multi-step form)
 */
export interface FishPurchaseFormData {
  // Step 1: Supplier
  contact_id?: number;
  contact_name: string;
  contact_number: string;
  bank_id?: number;
  account_number?: string;

  // Step 2: Details
  bill_number: string;
  vehicle_number: string;
  driver_name: string;
  driver_number?: string;
  fish_location_id: number;
  agent_id?: number;
  date: string;
  vehicle_time_in?: string;
  vehicle_time_out?: string;
  loading_time_in?: string;
  loading_time_out?: string;
  remarks?: string;

  // Step 3: Items
  items: FishPurchaseItemFormData[];
}

/**
 * Fish Purchase Item Form Data
 */
export interface FishPurchaseItemFormData {
  id?: number | string; // Local ID for React keys
  fish_species_id: number;
  box_count: number;
  box_weights: number[];
  rate: number;
  fish_count?: string;
  remarks?: string;
  // Calculated fields (readonly)
  average_box_weight?: number;
  net_weight?: number;
  net_amount?: number;
}

// ============= Helper Types =============

/**
 * Fish Purchase List Item (optimized for list views)
 */
export interface FishPurchaseListItem {
  id: number;
  bill_number: string;
  contact_name: string;
  vehicle_number: string;
  driver_name: string;
  total_boxes: number;
  total_weight: number;
  total_amount: number;
  status: FishPurchaseStatus;
  date: string;
  date_formatted?: string;
  location?: {
    id: number;
    name: string;
  };
}

/**
 * Supplier with Bank Details (for supplier selector)
 */
export interface SupplierWithBank extends Contact {
  bank_account?: {
    id: number;
    bank_id: number;
    account_number: string;
    bank?: Bank;
  };
}

/**
 * Form Step IDs
 */
export type FishPurchaseFormStep = "supplier" | "details" | "items" | "review";

/**
 * Form Validation Errors
 */
export interface FishPurchaseFormErrors {
  supplier?: Record<string, string>;
  details?: Record<string, string>;
  items?: Record<string, Record<string, string>>; // Indexed by item ID
  general?: string;
}
