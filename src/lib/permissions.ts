// Vehicle Booking Permissions - Based on actual backend permissions
export const VEHICLE_BOOKING_PERMISSIONS = {
  // Basic CRUD
  VIEW_ANY: 'viewAny-fish-purchase-vehicle',
  VIEW: 'view-fish-purchase-vehicle',
  CREATE: 'create-fish-purchase-vehicle',
  EDIT: 'edit-fish-purchase-vehicle',
  DELETE: 'delete-fish-purchase-vehicle',

  // Vehicle Actions
  RECEIVE: 'receive-fish-purchase-vehicle',
  UNRECEIVE: 'unreceive-fish-purchase-vehicle',
  EXIT: 'exit-fish-purchase-vehicle',
  REJECT: 'reject-fish-purchase-vehicle',

  // Approval Workflow
  APPROVE: 'approve-vehicle-booking',

  // Administrative
  OVERRIDE_DAILY_LIMIT: 'override-daily-limit',
  MANAGE_DAILY_LIMITS: 'manage-daily-limits',

  // Reporting
  VIEW_REPORTS: 'view-fish-purchase-vehicle-reports',
  EXPORT_REPORTS: 'export-fish-purchase-vehicle-reports',

  // Notifications
  RECEIVE_LIMIT_ALERTS: 'receive-limit-alerts',
  RECEIVE_WHATSAPP_NOTIFICATIONS: 'receive-whatsapp-vehicle-notifications',
  RECEIVE_WHATSAPP_CAPACITY_ALERTS: 'receive-whatsapp-capacity-alerts',
  RECEIVE_WHATSAPP_REJECTIONS: 'receive-whatsapp-rejections',

  // Bill Attachments
  VIEW_BILL_ATTACHMENTS: 'view-vehicle-bill-attachments',
  UPLOAD_BILL_ATTACHMENTS: 'upload-vehicle-bill-attachments',
  DELETE_BILL_ATTACHMENTS: 'delete-vehicle-bill-attachments',

  // System Settings
  TOGGLE_VEHICLE_BOOKING: 'toggle-vehicle-booking',
  TOGGLE_VEHICLE_BOOKING_APPROVAL: 'toggle-vehicle-booking-approval',
  TOGGLE_VEHICLE_BOOKING_OVERRIDE: 'toggle-vehicle-booking-override',
} as const;

export type VehicleBookingPermission =
  (typeof VEHICLE_BOOKING_PERMISSIONS)[keyof typeof VEHICLE_BOOKING_PERMISSIONS];

// Production Run Permissions - Based on backend permissions
export const PRODUCTION_RUN_PERMISSIONS = {
  // Basic CRUD
  VIEW_ANY: 'viewAny-production-runs',
  VIEW: 'view-production-runs',
  CREATE: 'create-production-runs',
  EDIT: 'edit-production-runs',
  DELETE: 'delete-production-runs',

  // Run Actions
  START: 'start-production-runs',
  COMPLETE: 'complete-production-runs',
  CANCEL: 'cancel-production-runs',

  // Shift Management (these may need to be created in backend)
  HANDOVER_SHIFT: 'handover-production-shift',
  MANAGE_OPERATORS: 'manage-production-operators',

  // Parameters (these may need to be created in backend)
  RECORD_PARAMETERS: 'record-production-parameters',
  VIEW_PARAMETERS: 'view-production-parameters',

  // Stats/Analytics - for managers to see fish input, yield percentages
  VIEW_STATS: 'view-production-stats',
} as const;

export type ProductionRunPermission =
  (typeof PRODUCTION_RUN_PERMISSIONS)[keyof typeof PRODUCTION_RUN_PERMISSIONS];

// Production Output Permissions - Based on backend permissions
export const PRODUCTION_OUTPUT_PERMISSIONS = {
  VIEW_ANY: 'viewAny-production-outputs',
  VIEW: 'view-production-outputs',
  CREATE: 'create-production-outputs',
  EDIT: 'edit-production-outputs',
  DELETE: 'delete-production-outputs',
  CONFIRM: 'confirm-production-outputs',
  VOID: 'void-production-outputs',
} as const;

export type ProductionOutputPermission =
  (typeof PRODUCTION_OUTPUT_PERMISSIONS)[keyof typeof PRODUCTION_OUTPUT_PERMISSIONS];

// Production Batch Permissions - Based on backend ProductionBatchPolicy
export const BATCH_PERMISSIONS = {
  VIEW_ANY: 'viewAny-batch',
  VIEW: 'view-batch',
  CREATE: 'create-batch',
  EDIT: 'edit-batch',
  DELETE: 'delete-batch',
} as const;

export type BatchPermission =
  (typeof BATCH_PERMISSIONS)[keyof typeof BATCH_PERMISSIONS];

// Inventory Permissions - Based on backend permissions
export const INVENTORY_PERMISSIONS = {
  VIEW_ANY_ITEM: 'viewAny-inventory-item',
  VIEW_ITEM: 'view-inventory-item',
  CREATE_ITEM: 'create-inventory-item',
  EDIT_ITEM: 'edit-inventory-item',
  DELETE_ITEM: 'delete-inventory-item',
  VIEW_ANY_WAREHOUSE: 'viewAny-inventory-warehouse',
  VIEW_WAREHOUSE: 'view-inventory-warehouse',
  VIEW_ANY_ADJUSTMENT: 'viewAny-inventory-adjustment',
  VIEW_ADJUSTMENT: 'view-inventory-adjustment',
  CREATE_ADJUSTMENT: 'create-inventory-adjustment',
} as const;

export type InventoryPermission =
  (typeof INVENTORY_PERMISSIONS)[keyof typeof INVENTORY_PERMISSIONS];

// Fish Purchase Permissions - Based on backend FishPurchasePermissionSeeder
export const FISH_PURCHASE_PERMISSIONS = {
  VIEW_ANY: 'viewAny-fish-purchase',
  VIEW: 'view-fish-purchase',
  CREATE: 'create-fish-purchase',
  EDIT: 'edit-fish-purchase',
  DELETE: 'delete-fish-purchase',
  CREATE_BILL: 'create-fish-purchase-bill',
  APPROVE: 'approve-fish-purchase',
  CREATE_PRODUCTION: 'create-fish-purchase-production',
  VIEW_SUPPLIERS: 'view-fish-suppliers',
  VIEW_BILLS: 'view-fish-bills',
  VIEW_STATS: 'view-fish-purchase-stats',
  CREATE_PAYMENT: 'create-fish-purchase-payment',
  UPDATE_PAYMENT: 'update-fish-purchase-payment',
  UPDATE_STATUS: 'update-fish-purchase-status',
} as const;

export type FishPurchasePermission =
  (typeof FISH_PURCHASE_PERMISSIONS)[keyof typeof FISH_PURCHASE_PERMISSIONS];

// Permission groups for easier management
export const PERMISSION_GROUPS = {
  BASIC_USER: [VEHICLE_BOOKING_PERMISSIONS.VIEW],
  OPERATOR: [
    VEHICLE_BOOKING_PERMISSIONS.VIEW_ANY,
    VEHICLE_BOOKING_PERMISSIONS.VIEW,
    VEHICLE_BOOKING_PERMISSIONS.CREATE,
    VEHICLE_BOOKING_PERMISSIONS.EDIT,
    VEHICLE_BOOKING_PERMISSIONS.RECEIVE,
    VEHICLE_BOOKING_PERMISSIONS.REJECT,
    VEHICLE_BOOKING_PERMISSIONS.EXIT,
    VEHICLE_BOOKING_PERMISSIONS.VIEW_BILL_ATTACHMENTS,
    VEHICLE_BOOKING_PERMISSIONS.UPLOAD_BILL_ATTACHMENTS,
  ],
  SUPERVISOR: [
    VEHICLE_BOOKING_PERMISSIONS.VIEW_ANY,
    VEHICLE_BOOKING_PERMISSIONS.VIEW,
    VEHICLE_BOOKING_PERMISSIONS.CREATE,
    VEHICLE_BOOKING_PERMISSIONS.EDIT,
    VEHICLE_BOOKING_PERMISSIONS.DELETE,
    VEHICLE_BOOKING_PERMISSIONS.RECEIVE,
    VEHICLE_BOOKING_PERMISSIONS.UNRECEIVE,
    VEHICLE_BOOKING_PERMISSIONS.REJECT,
    VEHICLE_BOOKING_PERMISSIONS.EXIT,
    VEHICLE_BOOKING_PERMISSIONS.APPROVE,
    VEHICLE_BOOKING_PERMISSIONS.VIEW_REPORTS,
    VEHICLE_BOOKING_PERMISSIONS.VIEW_BILL_ATTACHMENTS,
    VEHICLE_BOOKING_PERMISSIONS.UPLOAD_BILL_ATTACHMENTS,
    VEHICLE_BOOKING_PERMISSIONS.DELETE_BILL_ATTACHMENTS,
  ],
  ADMIN: [...Object.values(VEHICLE_BOOKING_PERMISSIONS)],
} as const;
