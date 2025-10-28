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
} as const

export type VehicleBookingPermission = typeof VEHICLE_BOOKING_PERMISSIONS[keyof typeof VEHICLE_BOOKING_PERMISSIONS]

// Permission groups for easier management
export const PERMISSION_GROUPS = {
  BASIC_USER: [
    VEHICLE_BOOKING_PERMISSIONS.VIEW,
  ],
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
  ADMIN: [
    ...Object.values(VEHICLE_BOOKING_PERMISSIONS),
  ],
} as const