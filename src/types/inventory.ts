// Inventory Movement Types for Mobile App

import type {Warehouse, ProductionProductType} from './production-output';

/**
 * Warehouse Stock for a Product Type
 */
export interface WarehouseStock {
  id: number;
  name: string;
  code?: string;
  quantity: number;
}

/**
 * Product Type Stock (grouped by product type)
 */
export interface ProductTypeStock {
  id: number;
  name: string;
  code: string;
  total_quantity: number;
  unit: string;
  warehouses: WarehouseStock[];
}

/**
 * Batch Stock - represents a single batch with inventory
 */
export interface BatchStock {
  id: number;
  batch_code: string;
  batch_name?: string;
  inventory_item_id: number;
  warehouse_id: number;
  warehouse_name: string;
  product_type_id: number;
  product_type: string;
  product_type_code?: string;
  quantity: number;
  unit: string;
  production_date?: string;
  status: string;
  // Package info for batches that can be packaged
  can_be_packaged?: boolean;
  package_count?: number;
  weight_per_package?: number;
  package_type_name?: string;
}

/**
 * Inventory Movement Type
 */
export type InventoryMovementType =
  | 'transfer_in'
  | 'transfer_out'
  | 'adjustment_add'
  | 'adjustment_sub'
  | 'production_output';

/**
 * Adjustment Reason
 */
export type AdjustmentReason =
  | 'variance'
  | 'damaged'
  | 'expired'
  | 'count'
  | 'other';

/**
 * Adjustment Type
 */
export type AdjustmentType = 'ADDITION' | 'SUBTRACTION';

/**
 * Inventory Movement
 */
export interface InventoryMovement {
  id: number;
  type: InventoryMovementType;
  product_type: {
    id: number;
    name: string;
    code?: string;
  };
  warehouse: {
    id: number;
    name: string;
  };
  source_warehouse?: {
    id: number;
    name: string;
  } | null;
  quantity: number;
  reason?: string;
  notes?: string;
  reference_number?: string;
  transfer_reference?: string;
  created_at: string;
  created_at_formatted?: string;
  user?: {
    id: number;
    name: string;
  };
}

/**
 * Movement Filters
 */
export interface MovementFilters {
  date_from?: string;
  date_to?: string;
  product_type_id?: number;
  warehouse_id?: number;
  movement_type?: InventoryMovementType | 'all';
  page?: number;
  per_page?: number;
}

/**
 * Transfer Request (creates paired adjustments) - OLD product type based
 */
export interface TransferRequest {
  production_product_type_id: number;
  source_warehouse_id: number;
  destination_warehouse_id: number;
  quantity: number;
  notes?: string;
}

/**
 * Batch Transfer Request - NEW batch-level transfer
 */
export interface BatchTransferRequest {
  batch_id: number;
  from_warehouse_id: number;
  to_warehouse_id: number;
  quantity: number;
  notes?: string;
}

/**
 * Adjustment Request - OLD product type based
 */
export interface AdjustmentRequest {
  production_product_type_id: number;
  warehouse_id: number;
  type: AdjustmentType;
  quantity: number;
  reason: AdjustmentReason | string;
  notes?: string;
}

/**
 * Batch Adjustment Request - NEW batch-level adjustment
 */
export interface BatchAdjustmentRequest {
  batch_id: number;
  type: 'addition' | 'subtraction';
  quantity: number;
  reason: string;
  notes?: string;
}

/**
 * Inventory Form Data (dropdowns for transfer/adjustment forms)
 */
export interface InventoryFormData {
  product_types: ProductionProductType[];
  warehouses: Warehouse[];
}

/**
 * API Response Types
 */
export interface ProductTypeStockApiResponse {
  success: boolean;
  data: ProductTypeStock[];
}

export interface InventoryMovementsApiResponse {
  success: boolean;
  data: InventoryMovement[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number | null;
    to: number | null;
  };
}

export interface InventoryFormDataApiResponse {
  success: boolean;
  data: InventoryFormData;
}

export interface TransferApiResponse {
  success: boolean;
  data: {
    source_adjustment: InventoryMovement;
    destination_adjustment: InventoryMovement;
    transfer_reference: string;
  };
  message?: string;
}

export interface AdjustmentApiResponse {
  success: boolean;
  data: InventoryMovement;
  message?: string;
}

/**
 * Batch Movement - unified movement history for batch inventory
 */
export interface BatchMovement {
  id: number;
  type: 'transfer_in' | 'transfer_out' | 'adjustment' | 'production';
  adjustment_type: 'addition' | 'subtraction';
  batch_id: number | null;
  batch_code: string;
  product_type: string;
  quantity: number;
  warehouse_id: number;
  warehouse_name: string;
  reason?: string;
  description?: string;
  notes?: string;
  date: string;
  created_at: string;
}

/**
 * Batch Stock API Response
 */
export interface BatchStockApiResponse {
  data: BatchStock[];
}

/**
 * Single Batch API Response
 */
export interface SingleBatchApiResponse {
  data: BatchStock & {
    is_fully_consumed: boolean;
  };
}

/**
 * Batch Transfer API Response
 */
export interface BatchTransferApiResponse {
  success: boolean;
  message: string;
  data: {
    batch_id: number;
    transfer_reference: string;
    quantity_transferred: number;
    new_warehouse_id: number;
    new_warehouse_name: string;
  };
}

/**
 * Batch Adjustment API Response
 */
export interface BatchAdjustmentApiResponse {
  success: boolean;
  message: string;
  data: {
    batch_id: number;
    type: 'addition' | 'subtraction';
    quantity_adjusted: number;
    new_stock: number;
  };
}

/**
 * Batch Movements API Response
 */
export interface BatchMovementsApiResponse {
  data: BatchMovement[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

/**
 * Movement Filters for Batch Inventory
 */
export interface BatchMovementFilters {
  warehouse_id?: number;
  from_date?: string;
  to_date?: string;
  page?: number;
  per_page?: number;
}
