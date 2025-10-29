export interface Media {
  id: number
  name: string
  file_name: string
  mime_type: string
  size: number
  url: string
  created_at: string
}

export interface VehicleBooking {
  id: number
  vehicle_number: string
  box_count: number
  box_weight_kg?: number
  weight_tons: number
  actual_box_count?: number
  driver_name?: string
  driver_phone?: string
  supplier_name?: string
  supplier_phone?: string
  notes?: string
  status: "pending" | "booked" | "received" | "offloading" | "offloaded" | "exited" | "rejected"
  rejection_reason?: string
  rejection_notes?: string
  entry_date: string
  entry_datetime: string
  received_at?: string
  offloading_started_at?: string
  offloading_completed_at?: string
  rejected_at?: string
  exited_at?: string
  created_at: string
  updated_at: string
  created_by?: number
  received_by?: number
  offloaded_by?: number
  rejected_by?: number
  exited_by?: number
  created_by_name?: string
  received_by_name?: string
  offloaded_by_name?: string
  rejected_by_name?: string
  exited_by_name?: string
  approved_by_name?: string

  // Approval fields
  approval_status?: "pending" | "approved" | "rejected" | null
  approved_by?: number
  approved_at?: string
  approval_notes?: string

  // Bill attachments
  bill_attachments?: Media[]

  // Permissions
  can_edit: boolean
  can_delete: boolean
  can_receive: boolean
  can_start_offloading: boolean
  can_complete_offloading: boolean
  can_reject: boolean
  can_exit: boolean
  can_unreceive: boolean
  can_approve: boolean
  is_pending_approval: boolean
}

export interface VehicleActivity {
  id: number
  vehicle_id: number
  action: "created" | "updated" | "edited" | "received" | "unreceived" | "offloading_started" | "offloading_completed" | "exited" | "rejected" | "deleted" | "approved" | "approval_rejected"
  old_values?: Record<string, string | number | boolean | null>
  new_values?: Record<string, string | number | boolean | null>
  user_id?: number
  user?: {
    id: number
    name: string
    email: string
  }
  ip_address?: string
  user_agent?: string
  formatted_changes: string
  created_at: string
  updated_at: string
}

export interface BookingStats {
  total_vehicles: number
  booked_vehicles: number
  received_vehicles: number
  exited_vehicles: number
  rejected_vehicles: number
  total_boxes: number
  total_boxes_processed: number
  total_tons: number
  received_boxes: number
  received_tons: number
  remaining_capacity: number
  remaining_tons_capacity: number | null
  progress_percentage: number
  completion_rate: number
  avg_boxes_per_vehicle: number
  is_over_allocated: boolean
  overdue_vehicles: number
  avg_wait_time_hours: number
  avg_factory_time_hours: number
  avg_queue_time_minutes: number
  yesterday_change_percentage: number
  template_accuracy_percentage: number
  overdue_count: number
  completion_rate_percentage: number
  rejection_rate_percentage: number
  avg_processing_time_hours: number
  total_tons_processed: number
}

export interface DailyCapacity {
  date: string
  daily_limit_boxes: number
  daily_limit_tons: number | null
  total_booked_boxes: number
  total_received_boxes: number
  remaining_capacity_boxes: number
  capacity_used_percent: number
  can_override: boolean

  // Status counts (backend-calculated) - Updated field names
  pending_count: number
  booked_count: number
  in_progress_count: number        // NEW: replaces misleading received_count
  completed_count: number          // NEW: offloaded + exited vehicles
  actual_received_count: number    // NEW: just received status vehicles
  exited_count: number
  rejected_count: number

  // Legacy field for backward compatibility (will be removed in future)
  received_count: number

  // Box breakdowns by status (backend-calculated)
  pending_boxes: number
  booked_boxes: number
  received_boxes: number
  offloading_boxes: number
  offloaded_boxes: number
  exited_boxes: number
  rejected_boxes: number

  // Tonnage breakdowns (backend-calculated)
  total_booked_tons: number
  total_received_tons: number
  remaining_capacity_tons: number | null
  pending_tons: number
  booked_tons: number
  received_tons: number
  offloading_tons: number
  offloaded_tons: number
  exited_tons: number
  rejected_tons: number
}

export interface VehicleBookingSettings {
  default_box_weight_kg: number
  vehicle_display_time_limit_hours: number
  vehicle_booking_enabled: boolean
  require_vehicle_booking_approval: boolean
  allow_vehicle_booking_override: boolean
}

export interface VehicleTemplate {
  vehicle_number: string
  box_count: number
  box_weight_kg: number
  weight_tons: number
  frequency: number
  last_used_at: string
}

export interface BookingFilters {
  search?: string
  status?: "all" | "pending" | "booked" | "received" | "offloading" | "offloaded" | "exited" | "rejected"
  date_filter?: "current" | "last_24h" | "last_48h" | "last_week" | "custom"
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
}

export interface CreateBookingRequest {
  vehicle_number: string
  box_count: number
  box_weight_kg: number
  driver_name?: string
  driver_phone?: string
  supplier_name?: string
  supplier_phone?: string
  notes?: string
  allow_override?: boolean
}

export interface UpdateBookingRequest {
  vehicle_number?: string
  box_count?: number
  box_weight_kg?: number
  driver_name?: string
  driver_phone?: string
  supplier_name?: string
  supplier_phone?: string
  notes?: string
}

export interface ReceiveBookingRequest {
  notes?: string
}

export interface RejectBookingRequest {
  rejection_reason: string
  rejection_notes?: string
}

export interface ApproveBookingRequest {
  notes?: string
}

export interface RejectApprovalRequest {
  notes: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface StartOffloadingRequest {
  // No additional data needed for starting offloading
}

export interface CompleteOffloadingRequest {
  actual_box_count: number
  notes?: string
}

export interface UpdateControlSettingsRequest {
  vehicle_booking_enabled?: boolean
  require_vehicle_booking_approval?: boolean
  allow_vehicle_booking_override?: boolean
}

export interface BulkActionRequest {
  vehicle_ids: number[]
  action: "receive" | "unreceive" | "reject" | "exit" | "delete"
  data?: ReceiveBookingRequest | RejectBookingRequest
}

export type StatusFilter = "all" | "pending" | "booked" | "received" | "offloading" | "offloaded" | "exited" | "rejected"

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  errors?: Record<string, string[]>
}

export const REJECTION_REASONS = [
  "Vehicle condition unsatisfactory",
  "Fish quality below standards",
  "Documentation incomplete",
  "Capacity exceeded",
  "Delivery time mismatch",
  "Wrong vehicle arrived",
  "Other"
] as const

export type RejectionReason = typeof REJECTION_REASONS[number]

// Range Stats Types
export interface DailyStats {
  date: string
  booking_count: number
  capacity_percent: number
  avg_wait_hours: number | null
  status_breakdown: {
    booked: number
    received: number
    exited: number
    rejected: number
  }
}

export interface RangeStatsComparison {
  wait_time_change_percent: number
  capacity_change_percent: number
}

export interface RangeStats {
  // Aggregate stats for the range
  total_vehicles: number
  total_boxes: number
  total_tons: number
  completed_vehicles: number
  rejected_vehicles: number

  // Capacity metrics
  avg_capacity_percent: number
  peak_capacity_date: string | null
  peak_capacity_percent: number | null
  low_capacity_date: string | null
  low_capacity_percent: number | null
  over_capacity_days: number

  // Performance metrics
  avg_wait_time_hours: number | null
  avg_processing_time_hours: number | null
  avg_total_cycle_hours: number | null
  completion_rate_percent: number
  rejection_rate_percent: number

  // Daily breakdown (for list/chart)
  daily_stats: DailyStats[]

  // Comparison (optional)
  vs_previous_period?: RangeStatsComparison
}
