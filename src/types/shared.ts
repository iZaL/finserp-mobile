// Shared types used across the application

/**
 * Media/File Upload
 */
export interface Media {
  id: number;
  name: string;
  file_name: string;
  mime_type: string;
  size: number;
  url: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Contact (Customer, Supplier, Agent, etc.)
 */
export interface Contact {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  type?: string;
  enabled?: boolean;
  created_at?: string;
  updated_at?: string;
  bank_account?: BankAccount;
}

/**
 * Bank
 */
export interface Bank {
  id: number;
  name: string;
  code?: string;
  swift_code?: string;
  country_id?: number;
  enabled?: boolean;
}

/**
 * Bank Account
 */
export interface BankAccount {
  id: number;
  bank_id: number;
  account_number: string;
  account_name?: string;
  iban?: string;
  contact_id?: number;
  bank?: Bank;
}

/**
 * Address/Location
 */
export interface Address {
  id: number;
  name: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  type?: string;
  enabled?: boolean;
  latitude?: number;
  longitude?: number;
}

/**
 * User
 */
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role?: string;
  permissions?: string[];
}

/**
 * Pagination Meta
 */
export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * API Response Wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

/**
 * Date Range Filter
 */
export interface DateRangeFilter {
  from?: string;
  to?: string;
}

/**
 * Common Filter Options
 */
export interface BaseFilters {
  search?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

/**
 * Select Option (for dropdowns)
 */
export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

/**
 * Status Badge Colors
 */
export type StatusColor =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "info";
