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
  status: "booked" | "received" | "exited" | "rejected"
  rejection_reason?: string
  entry_date: string
  entry_datetime: string
  received_at?: string
  rejected_at?: string
  exited_at?: string
  created_at: string
  updated_at: string
  created_by?: number
  received_by?: number
  rejected_by?: number
  exited_by?: number

  // Permissions
  can_edit: boolean
  can_delete: boolean
  can_receive: boolean
  can_reject: boolean
  can_exit: boolean
  can_unreceive: boolean
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
  total_booked_boxes: number
  total_received_boxes: number
  remaining_capacity_boxes: number
  capacity_used_percent: number
  can_override: boolean
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
  status?: "all" | "booked" | "received" | "exited" | "rejected"
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
  received_box_count: number
  notes?: string
}

export interface RejectBookingRequest {
  rejection_reason: string
  rejection_notes?: string
}

export interface BulkActionRequest {
  ids: number[]
  action: "receive" | "reject" | "exit" | "delete"
  data?: ReceiveBookingRequest | RejectBookingRequest
}

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
