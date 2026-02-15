import {create} from 'zustand';
import {useAuthStore} from './auth-store';
import {
  VEHICLE_BOOKING_PERMISSIONS,
  PRODUCTION_RUN_PERMISSIONS,
  PRODUCTION_OUTPUT_PERMISSIONS,
  BATCH_PERMISSIONS,
  INVENTORY_PERMISSIONS,
  FISH_PURCHASE_PERMISSIONS,
} from '../permissions';

interface PermissionStore {
  // Check if user has a specific permission
  hasPermission: (permission: string) => boolean;

  // Check if user has any of the provided permissions
  hasAnyPermission: (permissions: string[]) => boolean;

  // Check if user has all of the provided permissions
  hasAllPermissions: (permissions: string[]) => boolean;

  // Load permissions for impersonation
  loadPermissions: (permissions: string[]) => void;

  // ===== IMPERSONATION PERMISSIONS =====
  canImpersonateUsers: () => boolean;

  // ===== VEHICLE BOOKING PERMISSIONS =====
  // Dashboard access
  canAccessVehicleBookings: () => boolean;
  canCreateVehicleBooking: () => boolean;
  canViewVehicleBookingReports: () => boolean;

  // Actions
  canEditVehicleBooking: () => boolean;
  canDeleteVehicleBooking: () => boolean;
  canReceiveVehicle: () => boolean;
  canRejectVehicle: () => boolean;
  canExitVehicle: () => boolean;
  canUnreceiveVehicle: () => boolean;
  canApproveVehicle: () => boolean;
  canOverrideDailyLimit: () => boolean;
  canManageDailyLimits: () => boolean;
  canExportVehicleBookingReports: () => boolean;
  canToggleVehicleBookingSettings: () => boolean;

  // Bill attachments
  canViewBillAttachments: () => boolean;
  canUploadBillAttachments: () => boolean;
  canDeleteBillAttachments: () => boolean;

  // ===== PRODUCTION RUN PERMISSIONS =====
  canAccessProductionRuns: () => boolean;
  canCreateProductionRun: () => boolean;
  canStartProductionRun: () => boolean;
  canCompleteProductionRun: () => boolean;
  canHandoverShift: () => boolean;
  canManageOperators: () => boolean;
  canRecordParameters: () => boolean;
  canViewProductionStats: () => boolean;

  // ===== PRODUCTION OUTPUT PERMISSIONS =====
  canAccessProductionOutputs: () => boolean;
  canCreateProductionOutput: () => boolean;

  // ===== BATCH PERMISSIONS =====
  canAccessBatches: () => boolean;
  canCreateBatch: () => boolean;

  // ===== INVENTORY PERMISSIONS =====
  canAccessInventory: () => boolean;
  canCreateInventoryAdjustment: () => boolean;

  // ===== FISH PURCHASE PERMISSIONS =====
  canAccessFishPurchases: () => boolean;
  canCreateFishPurchase: () => boolean;
  canViewSuppliers: () => boolean;

  // Get user permissions
  getUserPermissions: () => string[];
  getUserRoles: () => string[];
}

export const usePermissionStore = create<PermissionStore>((set, get) => ({
  hasPermission: (permission: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return false;

    // Super admin bypass - Laravel Gate::before grants all permissions
    // but they may not be listed in permission_names
    const adminRoles = ['super_admin', 'super-admin', 'admin'];
    if (user.role_names?.some((role) => adminRoles.includes(role))) {
      return true;
    }
    if (user.roles?.some((role) => adminRoles.includes(role.name))) {
      return true;
    }

    // Check direct permissions
    if (user.permission_names?.includes(permission)) {
      return true;
    }

    // Check all permissions (includes team/tenant-scoped permissions)
    if (user.all_permission_names?.includes(permission)) {
      return true;
    }

    // Check permissions via roles
    if (user.permissions?.some((p) => p.name === permission)) {
      return true;
    }

    return false;
  },

  hasAnyPermission: (permissions: string[]) => {
    return permissions.some((permission) => get().hasPermission(permission));
  },

  hasAllPermissions: (permissions: string[]) => {
    return permissions.every((permission) => get().hasPermission(permission));
  },

  loadPermissions: (permissions: string[]) => {
    // This is called when impersonation changes user
    // The permissions are already loaded in the auth store user
    // This method exists for consistency and potential future use
    const user = useAuthStore.getState().user;
    if (user) {
      useAuthStore.setState({
        user: {
          ...user,
          permission_names: permissions,
        },
      });
    }
  },

  // ===== IMPERSONATION PERMISSIONS =====
  canImpersonateUsers: () => {
    return get().hasPermission('impersonate-users');
  },

  // ===== VEHICLE BOOKING PERMISSIONS =====
  canAccessVehicleBookings: () => {
    return get().hasAnyPermission([
      VEHICLE_BOOKING_PERMISSIONS.VIEW_ANY,
      VEHICLE_BOOKING_PERMISSIONS.VIEW,
    ]);
  },

  canCreateVehicleBooking: () => {
    return get().hasPermission(VEHICLE_BOOKING_PERMISSIONS.CREATE);
  },

  canViewVehicleBookingReports: () => {
    return get().hasPermission(VEHICLE_BOOKING_PERMISSIONS.VIEW_REPORTS);
  },

  canEditVehicleBooking: () => {
    return get().hasPermission(VEHICLE_BOOKING_PERMISSIONS.EDIT);
  },

  canDeleteVehicleBooking: () => {
    return get().hasPermission(VEHICLE_BOOKING_PERMISSIONS.DELETE);
  },

  canReceiveVehicle: () => {
    return get().hasPermission(VEHICLE_BOOKING_PERMISSIONS.RECEIVE);
  },

  canRejectVehicle: () => {
    return get().hasPermission(VEHICLE_BOOKING_PERMISSIONS.REJECT);
  },

  canExitVehicle: () => {
    return get().hasPermission(VEHICLE_BOOKING_PERMISSIONS.EXIT);
  },

  canUnreceiveVehicle: () => {
    return get().hasPermission(VEHICLE_BOOKING_PERMISSIONS.UNRECEIVE);
  },

  canApproveVehicle: () => {
    return get().hasPermission(VEHICLE_BOOKING_PERMISSIONS.APPROVE);
  },

  canOverrideDailyLimit: () => {
    return get().hasPermission(
      VEHICLE_BOOKING_PERMISSIONS.OVERRIDE_DAILY_LIMIT
    );
  },

  canManageDailyLimits: () => {
    return get().hasPermission(VEHICLE_BOOKING_PERMISSIONS.MANAGE_DAILY_LIMITS);
  },

  canExportVehicleBookingReports: () => {
    return get().hasPermission(VEHICLE_BOOKING_PERMISSIONS.EXPORT_REPORTS);
  },

  canToggleVehicleBookingSettings: () => {
    return get().hasAnyPermission([
      VEHICLE_BOOKING_PERMISSIONS.TOGGLE_VEHICLE_BOOKING,
      VEHICLE_BOOKING_PERMISSIONS.TOGGLE_VEHICLE_BOOKING_APPROVAL,
      VEHICLE_BOOKING_PERMISSIONS.TOGGLE_VEHICLE_BOOKING_OVERRIDE,
    ]);
  },

  // Bill attachment methods
  canViewBillAttachments: () => {
    return get().hasPermission(
      VEHICLE_BOOKING_PERMISSIONS.VIEW_BILL_ATTACHMENTS
    );
  },

  canUploadBillAttachments: () => {
    return get().hasPermission(
      VEHICLE_BOOKING_PERMISSIONS.UPLOAD_BILL_ATTACHMENTS
    );
  },

  canDeleteBillAttachments: () => {
    return get().hasPermission(
      VEHICLE_BOOKING_PERMISSIONS.DELETE_BILL_ATTACHMENTS
    );
  },

  // ===== PRODUCTION RUN PERMISSIONS =====
  canAccessProductionRuns: () => {
    return get().hasAnyPermission([
      PRODUCTION_RUN_PERMISSIONS.VIEW_ANY,
      PRODUCTION_RUN_PERMISSIONS.VIEW,
    ]);
  },

  canCreateProductionRun: () => {
    return get().hasPermission(PRODUCTION_RUN_PERMISSIONS.CREATE);
  },

  canStartProductionRun: () => {
    return get().hasPermission(PRODUCTION_RUN_PERMISSIONS.START);
  },

  canCompleteProductionRun: () => {
    return get().hasPermission(PRODUCTION_RUN_PERMISSIONS.COMPLETE);
  },

  canHandoverShift: () => {
    return get().hasPermission(PRODUCTION_RUN_PERMISSIONS.HANDOVER_SHIFT);
  },

  canManageOperators: () => {
    return get().hasPermission(PRODUCTION_RUN_PERMISSIONS.MANAGE_OPERATORS);
  },

  canRecordParameters: () => {
    return get().hasPermission(PRODUCTION_RUN_PERMISSIONS.RECORD_PARAMETERS);
  },

  canViewProductionStats: () => {
    return get().hasPermission(PRODUCTION_RUN_PERMISSIONS.VIEW_STATS);
  },

  // ===== PRODUCTION OUTPUT PERMISSIONS =====
  canAccessProductionOutputs: () => {
    return get().hasAnyPermission([
      PRODUCTION_OUTPUT_PERMISSIONS.VIEW_ANY,
      PRODUCTION_OUTPUT_PERMISSIONS.VIEW,
    ]);
  },

  canCreateProductionOutput: () => {
    return get().hasPermission(PRODUCTION_OUTPUT_PERMISSIONS.CREATE);
  },

  // ===== BATCH PERMISSIONS =====
  canAccessBatches: () => {
    return get().hasAnyPermission([
      BATCH_PERMISSIONS.VIEW_ANY,
      BATCH_PERMISSIONS.VIEW,
    ]);
  },

  canCreateBatch: () => {
    return get().hasPermission(BATCH_PERMISSIONS.CREATE);
  },

  // ===== INVENTORY PERMISSIONS =====
  canAccessInventory: () => {
    return get().hasAnyPermission([
      INVENTORY_PERMISSIONS.VIEW_ANY_ITEM,
      INVENTORY_PERMISSIONS.VIEW_ITEM,
      INVENTORY_PERMISSIONS.VIEW_ANY_WAREHOUSE,
      INVENTORY_PERMISSIONS.VIEW_WAREHOUSE,
    ]);
  },

  canCreateInventoryAdjustment: () => {
    return get().hasPermission(INVENTORY_PERMISSIONS.CREATE_ADJUSTMENT);
  },

  // ===== FISH PURCHASE PERMISSIONS =====
  canAccessFishPurchases: () => {
    return get().hasAnyPermission([
      FISH_PURCHASE_PERMISSIONS.VIEW_ANY,
      FISH_PURCHASE_PERMISSIONS.VIEW,
    ]);
  },

  canCreateFishPurchase: () => {
    return get().hasPermission(FISH_PURCHASE_PERMISSIONS.CREATE);
  },

  canViewSuppliers: () => {
    return get().hasPermission(FISH_PURCHASE_PERMISSIONS.VIEW_SUPPLIERS);
  },

  getUserPermissions: () => {
    const user = useAuthStore.getState().user;
    return user?.permission_names || [];
  },

  getUserRoles: () => {
    const user = useAuthStore.getState().user;
    return user?.role_names || [];
  },
}));

// Custom hook for easier permission checking
export const usePermissions = () => {
  const store = usePermissionStore();
  return store;
};
