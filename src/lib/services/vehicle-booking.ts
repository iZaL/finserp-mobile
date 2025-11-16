import { api } from "@/lib/api"
import type {
  VehicleBooking,
  VehicleActivity,
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
  StartOffloadingRequest,
  CompleteOffloadingRequest,
  UpdateControlSettingsRequest,
  BulkActionRequest,
  PaginatedResponse,
  ApiResponse,
  RangeStats,
} from "@/types/vehicle-booking"

export const vehicleBookingService = {
  // Get all bookings with filters and pagination
  getBookings: async (
    filters?: BookingFilters,
    config?: { signal?: AbortSignal }
  ): Promise<PaginatedResponse<VehicleBooking>> => {
    const params = new URLSearchParams()

    if (filters?.search) params.append("search", filters.search)
    if (filters?.status && filters.status !== "all") params.append("status", filters.status)
    if (filters?.date_filter) params.append("date_filter", filters.date_filter)
    if (filters?.date_from) params.append("date_from", filters.date_from)
    if (filters?.date_to) params.append("date_to", filters.date_to)
    if (filters?.page) params.append("page", filters.page.toString())
    if (filters?.per_page) params.append("per_page", filters.per_page.toString())

    const response = await api.get<PaginatedResponse<VehicleBooking>>(
      `/fish-purchase-vehicles?${params.toString()}`,
      config
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

  // Get booking activities (edit history)
  getBookingActivities: async (
    id: number,
    config?: { signal?: AbortSignal }
  ): Promise<VehicleActivity[]> => {
    const response = await api.get<ApiResponse<VehicleActivity[]>>(
      `/fish-purchase-vehicles/${id}/activities`,
      config
    )
    return response.data.data || []
  },

  // Get booking statistics
  getStats: async (
    date?: string,
    config?: { signal?: AbortSignal }
  ): Promise<BookingStats> => {
    const params = date ? `?date=${date}` : ""
    const response = await api.get<ApiResponse<BookingStats>>(
      `/fish-purchase-vehicles/stats${params}`,
      config
    )
    return response.data.data!
  },

  // Get range statistics
  getRangeStats: async (
    dateFrom: string,
    dateTo: string,
    config?: { signal?: AbortSignal }
  ): Promise<RangeStats> => {
    const params = new URLSearchParams()
    params.append("date_from", dateFrom)
    params.append("date_to", dateTo)

    const response = await api.get<ApiResponse<RangeStats>>(
      `/fish-purchase-vehicles/stats/range?${params.toString()}`,
      config
    )
    return response.data.data!
  },

  // Get daily capacity info
  getDailyCapacity: async (
    date?: string,
    config?: { signal?: AbortSignal }
  ): Promise<DailyCapacity> => {
    const params = date ? `?date=${date}` : ""
    const response = await api.get<ApiResponse<DailyCapacity>>(
      `/fish-purchase-vehicles/daily-capacity${params}`,
      config
    )
    return response.data.data!
  },

  // Get system settings
  getSettings: async (config?: { signal?: AbortSignal }): Promise<VehicleBookingSettings> => {
    const response = await api.get<ApiResponse<VehicleBookingSettings>>(
      `/fish-purchase-vehicles/settings`,
      config
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

  // Start offloading
  startOffloading: async (
    id: number,
    data?: StartOffloadingRequest
  ): Promise<VehicleBooking> => {
    const response = await api.post<ApiResponse<VehicleBooking>>(
      `/fish-purchase-vehicles/${id}/start-offloading`,
      data || {}
    )
    return response.data.data!
  },

  // Complete offloading
  completeOffloading: async (
    id: number,
    data: CompleteOffloadingRequest
  ): Promise<VehicleBooking> => {
    const response = await api.post<ApiResponse<VehicleBooking>>(
      `/fish-purchase-vehicles/${id}/complete-offloading`,
      data
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

  // Upload media attachment
  uploadMedia: async (vehicleId: number, file: File): Promise<VehicleBooking> => {
    const formData = new FormData()
    formData.append('files[]', file)
    formData.append('model_type', 'fish_purchase_vehicle')
    formData.append('model_id', vehicleId.toString())
    formData.append('collection_name', 'vehicle_bills')

    // Use normal API endpoint
    const response = await api.post<ApiResponse<VehicleBooking>>(
      '/media',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data.data!
  },

  // Delete media attachment
  deleteMedia: async (mediaId: number): Promise<VehicleBooking> => {
    const response = await api.delete<ApiResponse<VehicleBooking>>(
      `/media/${mediaId}`
    )
    return response.data.data!
  },

  // Get bills gallery
  getBillsGallery: async (
    filters?: {
      search?: string;
      page?: number;
      file_type?: 'all' | 'images' | 'pdfs';
      status?: string;
      date_from?: string;
      date_to?: string;
      entry_date_from?: string;
      entry_date_to?: string;
    },
    config?: { signal?: AbortSignal }
  ): Promise<PaginatedResponse<VehicleBooking>> => {
    const params = new URLSearchParams()

    if (filters?.search) params.append('search', filters.search)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.file_type && filters.file_type !== 'all') params.append('file_type', filters.file_type)
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status)
    if (filters?.date_from) params.append('date_from', filters.date_from)
    if (filters?.date_to) params.append('date_to', filters.date_to)
    if (filters?.entry_date_from) params.append('entry_date_from', filters.entry_date_from)
    if (filters?.entry_date_to) params.append('entry_date_to', filters.entry_date_to)

    const response = await api.get<PaginatedResponse<VehicleBooking>>(
      `/fish-purchase-vehicles/bills?${params.toString()}`,
      config
    )
    return response.data
  },

  // Export reports
  exportReportPdf: async (
    dateFrom: string,
    dateTo: string,
    status: string = 'all'
  ): Promise<Blob> => {
    const params = new URLSearchParams({
      start_date: dateFrom,
      end_date: dateTo,
      status,
      format: 'pdf'
    })

    const response = await api.get(
      `/fish-purchase-vehicles/reports/export-pdf?${params.toString()}`,
      { responseType: 'blob' }
    )
    return response.data
  },

  exportReportExcel: async (
    dateFrom: string,
    dateTo: string,
    status: string = 'all'
  ): Promise<Blob> => {
    const params = new URLSearchParams({
      start_date: dateFrom,
      end_date: dateTo,
      status,
      format: 'excel'
    })

    const response = await api.get(
      `/fish-purchase-vehicles/reports/export-excel?${params.toString()}`,
      { responseType: 'blob' }
    )
    return response.data
  },
}
