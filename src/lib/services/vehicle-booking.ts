import { api } from "@/lib/api"
import type {
  VehicleBooking,
  BookingStats,
  DailyCapacity,
  VehicleBookingSettings,
  VehicleTemplate,
  BookingFilters,
  CreateBookingRequest,
  UpdateBookingRequest,
  ReceiveBookingRequest,
  RejectBookingRequest,
  ApproveBookingRequest,
  RejectApprovalRequest,
  UpdateControlSettingsRequest,
  BulkActionRequest,
  PaginatedResponse,
  ApiResponse,
} from "@/types/vehicle-booking"

export const vehicleBookingService = {
  // Get all bookings with filters and pagination
  getBookings: async (
    filters?: BookingFilters
  ): Promise<PaginatedResponse<VehicleBooking>> => {
    const params = new URLSearchParams()

    if (filters?.search) params.append("search", filters.search)
    if (filters?.status && filters.status !== "all") params.append("status", filters.status)
    if (filters?.date_filter) params.append("date_filter", filters.date_filter)
    if (filters?.start_date) params.append("start_date", filters.start_date)
    if (filters?.end_date) params.append("end_date", filters.end_date)
    if (filters?.date_from) params.append("date_from", filters.date_from)
    if (filters?.date_to) params.append("date_to", filters.date_to)
    if (filters?.page) params.append("page", filters.page.toString())
    if (filters?.per_page) params.append("per_page", filters.per_page.toString())

    const response = await api.get<PaginatedResponse<VehicleBooking>>(
      `/fish-purchase-vehicles?${params.toString()}`
    )
    return response.data
  },

  // Get booking by ID
  getBooking: async (id: number): Promise<VehicleBooking> => {
    const response = await api.get<ApiResponse<VehicleBooking>>(
      `/fish-purchase-vehicles/${id}`
    )
    return response.data.data!
  },

  // Get booking statistics
  getStats: async (date?: string): Promise<BookingStats> => {
    const params = date ? `?date=${date}` : ""
    const response = await api.get<ApiResponse<BookingStats>>(
      `/fish-purchase-vehicles/stats${params}`
    )
    return response.data.data!
  },

  // Get daily capacity info
  getDailyCapacity: async (date?: string): Promise<DailyCapacity> => {
    const params = date ? `?date=${date}` : ""
    const response = await api.get<ApiResponse<DailyCapacity>>(
      `/fish-purchase-vehicles/daily-capacity${params}`
    )
    return response.data.data!
  },

  // Get system settings
  getSettings: async (): Promise<VehicleBookingSettings> => {
    const response = await api.get<ApiResponse<VehicleBookingSettings>>(
      `/fish-purchase-vehicles/settings`
    )
    return response.data.data!
  },

  // Get vehicle suggestions/templates
  getSuggestions: async (query: string): Promise<VehicleTemplate[]> => {
    const response = await api.get<ApiResponse<VehicleTemplate[]>>(
      `/fish-purchase-vehicles/suggestions?query=${encodeURIComponent(query)}`
    )
    return response.data.data || []
  },

  // Get quick picks (frequently used vehicles)
  getQuickPicks: async (): Promise<VehicleTemplate[]> => {
    const response = await api.get<ApiResponse<VehicleTemplate[]>>(
      `/fish-purchase-vehicles/quick-picks`
    )
    return response.data.data || []
  },

  // Create new booking
  createBooking: async (data: CreateBookingRequest): Promise<VehicleBooking> => {
    const response = await api.post<ApiResponse<VehicleBooking>>(
      `/fish-purchase-vehicles`,
      data
    )
    return response.data.data!
  },

  // Update booking
  updateBooking: async (
    id: number,
    data: UpdateBookingRequest
  ): Promise<VehicleBooking> => {
    const response = await api.put<ApiResponse<VehicleBooking>>(
      `/fish-purchase-vehicles/${id}`,
      data
    )
    return response.data.data!
  },

  // Delete booking
  deleteBooking: async (id: number): Promise<void> => {
    await api.delete(`/fish-purchase-vehicles/${id}`)
  },

  // Receive vehicle
  receiveVehicle: async (
    id: number,
    data: ReceiveBookingRequest
  ): Promise<VehicleBooking> => {
    const response = await api.post<ApiResponse<VehicleBooking>>(
      `/fish-purchase-vehicles/${id}/receive`,
      data
    )
    return response.data.data!
  },

  // Reject vehicle
  rejectVehicle: async (
    id: number,
    data: RejectBookingRequest
  ): Promise<VehicleBooking> => {
    const response = await api.post<ApiResponse<VehicleBooking>>(
      `/fish-purchase-vehicles/${id}/reject`,
      data
    )
    return response.data.data!
  },

  // Exit vehicle
  exitVehicle: async (id: number): Promise<VehicleBooking> => {
    const response = await api.post<ApiResponse<VehicleBooking>>(
      `/fish-purchase-vehicles/${id}/exit`
    )
    return response.data.data!
  },

  // Undo receive (unreceive)
  unreceiveVehicle: async (id: number): Promise<VehicleBooking> => {
    const response = await api.post<ApiResponse<VehicleBooking>>(
      `/fish-purchase-vehicles/${id}/unreceive`
    )
    return response.data.data!
  },

  // Approve vehicle booking
  approveVehicle: async (
    id: number,
    data?: ApproveBookingRequest
  ): Promise<VehicleBooking> => {
    const response = await api.post<ApiResponse<VehicleBooking>>(
      `/fish-purchase-vehicles/${id}/approve`,
      data || {}
    )
    return response.data.data!
  },

  // Reject vehicle booking approval
  rejectApproval: async (
    id: number,
    data: RejectApprovalRequest
  ): Promise<VehicleBooking> => {
    const response = await api.post<ApiResponse<VehicleBooking>>(
      `/fish-purchase-vehicles/${id}/reject-approval`,
      data
    )
    return response.data.data!
  },

  // Bulk actions
  bulkAction: async (data: BulkActionRequest): Promise<void> => {
    await api.post(`/fish-purchase-vehicles/bulk-action`, data)
  },

  // Update daily limit
  updateDailyLimit: async (date: string, limit: number): Promise<DailyCapacity> => {
    const response = await api.post<ApiResponse<DailyCapacity>>(
      `/fish-purchase-vehicles/daily-limit`,
      { date, limit }
    )
    return response.data.data!
  },

  // Update control settings
  updateControlSettings: async (
    data: UpdateControlSettingsRequest
  ): Promise<VehicleBookingSettings> => {
    const response = await api.put<ApiResponse<VehicleBookingSettings>>(
      `/fish-purchase-vehicles/control-settings`,
      data
    )
    return response.data.data!
  },
}
