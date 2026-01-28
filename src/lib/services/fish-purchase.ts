import {api} from '@/lib/api';
import type {
  FishPurchase,
  FishPurchaseFilters,
  FishSpecies,
  FishPurchaseSettings,
  CreateFishPurchaseRequest,
  UpdateFishPurchaseRequest,
  UpdateStatusRequest,
} from '@/types/fish-purchase';
import type {AdvancePaymentRequest} from '@/types/payment';
import type {
  PaginatedResponse,
  ApiResponse,
  Contact,
  Address,
  Bank,
} from '@/types/shared';

export const fishPurchaseService = {
  // Get all fish purchases with filters and pagination
  getFishPurchases: async (
    filters?: FishPurchaseFilters,
    config?: {signal?: AbortSignal}
  ): Promise<PaginatedResponse<FishPurchase>> => {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.status && filters.status !== 'all')
      params.append('status', filters.status);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.supplier_id)
      params.append('supplier_id', filters.supplier_id.toString());
    if (filters?.location_id)
      params.append('location_id', filters.location_id.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.per_page)
      params.append('per_page', filters.per_page.toString());

    const response = await api.get<PaginatedResponse<FishPurchase>>(
      `/fish-purchases?${params.toString()}`,
      config
    );
    return response.data;
  },

  // Get single fish purchase by ID
  getFishPurchase: async (id: number): Promise<FishPurchase> => {
    const response = await api.get<
      ApiResponse<FishPurchase> & {
        payment_accounts?: Array<{id: number; name: string}>;
      }
    >(`/fish-purchases/${id}`);
    // Merge payment_accounts from root into the purchase data
    const purchase = response.data.data!;
    // Always set payment_accounts (default to empty array if not provided)
    purchase.payment_accounts = response.data.payment_accounts || [];
    return purchase;
  },

  // Create new fish purchase
  createFishPurchase: async (
    data: CreateFishPurchaseRequest
  ): Promise<FishPurchase> => {
    const response = await api.post<
      ApiResponse<FishPurchase> & {
        payment_accounts?: Array<{id: number; name: string}>;
      }
    >(`/fish-purchases`, data);
    const purchase = response.data.data!;
    // Always set payment_accounts (default to empty array if not provided)
    purchase.payment_accounts = response.data.payment_accounts || [];
    return purchase;
  },

  // Update existing fish purchase
  updateFishPurchase: async (
    id: number,
    data: UpdateFishPurchaseRequest
  ): Promise<FishPurchase> => {
    const response = await api.put<ApiResponse<FishPurchase>>(
      `/fish-purchases/${id}`,
      data
    );
    return response.data.data!;
  },

  // Delete fish purchase
  deleteFishPurchase: async (id: number): Promise<void> => {
    await api.delete<ApiResponse<null>>(`/fish-purchases/${id}`);
  },

  // Update fish purchase status
  updateStatus: async (
    id: number,
    data: UpdateStatusRequest
  ): Promise<FishPurchase> => {
    const response = await api.post<ApiResponse<FishPurchase>>(
      `/fish-purchases/${id}/update-status`,
      data
    );
    return response.data.data!;
  },

  // Add payment to fish purchase
  addPayment: async (
    id: number,
    data: AdvancePaymentRequest
  ): Promise<FishPurchase> => {
    const response = await api.post<
      ApiResponse<FishPurchase> & {
        payment_accounts?: Array<{id: number; name: string}>;
      }
    >(`/fish-purchases/${id}/payments`, data);
    // Merge payment_accounts from root into the purchase data
    const purchase = response.data.data!;
    // Always set payment_accounts (default to empty array if not provided)
    purchase.payment_accounts = response.data.payment_accounts || [];
    return purchase;
  },

  // Get fish species list
  getFishSpecies: async (config?: {
    signal?: AbortSignal;
  }): Promise<FishSpecies[]> => {
    const response = await api.get<ApiResponse<FishSpecies[]>>(
      `/fish-purchases/fish-species`,
      config
    );
    return response.data.data || [];
  },

  // Get suppliers with bank details
  getSuppliers: async (options?: {
    signal?: AbortSignal;
    limit?: number;
    search?: string;
    selectedSupplierId?: number;
  }): Promise<Contact[]> => {
    const params = new URLSearchParams();
    if (options?.limit) {
      params.append('limit', options.limit.toString());
    }
    if (options?.search) {
      params.append('search', options.search);
    }
    if (options?.selectedSupplierId) {
      params.append(
        'selected_supplier_id',
        options.selectedSupplierId.toString()
      );
    }

    const url = `/fish-purchases/suppliers${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get<ApiResponse<Contact[]>>(url, {
      signal: options?.signal,
    });
    return response.data.data || [];
  },

  // Create a new supplier
  createSupplier: async (data: {
    name: string;
    phone: string;
    bank_id?: number;
    account_number?: string;
  }): Promise<Contact> => {
    const response = await api.post<ApiResponse<Contact>>(
      `/fish-purchases/suppliers`,
      data
    );
    return response.data.data!;
  },

  // Get fish landing sites (locations)
  getLocations: async (config?: {signal?: AbortSignal}): Promise<Address[]> => {
    const response = await api.get<ApiResponse<Address[]>>(
      `/fish-purchases/locations`,
      config
    );
    return response.data.data || [];
  },

  // Create a new location
  createLocation: async (data: {
    name: string;
    city?: string;
  }): Promise<Address> => {
    const response = await api.post<ApiResponse<Address>>(
      `/fish-purchases/locations`,
      data
    );
    return response.data.data!;
  },

  // Get banks list
  getBanks: async (config?: {signal?: AbortSignal}): Promise<Bank[]> => {
    const response = await api.get<ApiResponse<Bank[]>>(
      `/fish-purchases/banks`,
      config
    );
    return response.data.data || [];
  },

  // Get agents list
  getAgents: async (config?: {signal?: AbortSignal}): Promise<Contact[]> => {
    const response = await api.get<ApiResponse<Contact[]>>(
      `/fish-purchases/agents`,
      config
    );
    return response.data.data || [];
  },

  // Get settings (bill number, defaults, etc.)
  getSettings: async (config?: {
    signal?: AbortSignal;
  }): Promise<FishPurchaseSettings> => {
    const response = await api.get<ApiResponse<FishPurchaseSettings>>(
      `/fish-purchases/settings`,
      config
    );
    return response.data.data!;
  },

  // Get all form data in a single request (optimized - replaces 6 separate calls)
  getFormData: async (config?: {
    signal?: AbortSignal;
  }): Promise<{
    fish_species: FishSpecies[];
    suppliers: Contact[];
    locations: Address[];
    banks: Bank[];
    agents: Contact[];
    settings: FishPurchaseSettings;
  }> => {
    const response = await api.get<
      ApiResponse<{
        fish_species: FishSpecies[];
        suppliers: Contact[];
        locations: Address[];
        banks: Bank[];
        agents: Contact[];
        settings: FishPurchaseSettings;
      }>
    >(`/fish-purchases/form-data`, config);
    return response.data.data!;
  },

  // Get vehicle booking data for pre-populating form
  getVehicleBookingData: async (
    vehicleBookingId: number
  ): Promise<{
    vehicle_number: string;
    driver_name: string;
    driver_phone?: string;
    supplier_name: string;
    supplier_phone?: string;
    box_count: number;
    entry_date: string;
  }> => {
    const response = await api.get<
      ApiResponse<{
        vehicle_number: string;
        driver_name: string;
        driver_phone?: string;
        supplier_name: string;
        supplier_phone?: string;
        box_count: number;
        entry_date: string;
      }>
    >(`/fish-purchases/vehicle-booking/${vehicleBookingId}`);
    return response.data.data!;
  },

  // Calculate auto values for fish item
  calculateFishItem: (
    boxCount: number,
    boxWeights: number[],
    rate: number
  ): {
    averageBoxWeight: number;
    netWeight: number;
    netAmount: number;
  } => {
    // Calculate average box weight
    const totalWeight = boxWeights.reduce((sum, weight) => sum + weight, 0);
    const averageBoxWeight =
      boxWeights.length > 0 ? totalWeight / boxWeights.length : 0;

    // Calculate net weight (box count × average weight)
    const netWeight = boxCount * averageBoxWeight;

    // Calculate net amount (net weight × rate)
    const netAmount = netWeight * rate;

    return {
      averageBoxWeight: Math.round(averageBoxWeight * 100) / 100,
      netWeight: Math.round(netWeight * 100) / 100,
      netAmount: Math.round(netAmount * 100) / 100,
    };
  },

  // Calculate totals across all items
  calculateTotals: (
    items: {
      box_count?: number;
      net_weight?: number;
      net_amount?: number;
    }[]
  ): {
    totalBoxes: number;
    totalWeight: number;
    totalAmount: number;
  } => {
    const totalBoxes = items.reduce(
      (sum, item) => sum + (item.box_count || 0),
      0
    );
    const totalWeight = items.reduce(
      (sum, item) => sum + (item.net_weight || 0),
      0
    );
    const totalAmount = items.reduce(
      (sum, item) => sum + (item.net_amount || 0),
      0
    );

    return {
      totalBoxes,
      totalWeight: Math.round(totalWeight * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };
  },
};
