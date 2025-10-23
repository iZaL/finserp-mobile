import { create } from 'zustand'
import { useAuthStore } from './auth-store'
import { VEHICLE_BOOKING_PERMISSIONS } from '../permissions'

interface PermissionStore {
  // Check if user has a specific permission
  hasPermission: (permission: string) => boolean

  // Check if user has any of the provided permissions
  hasAnyPermission: (permissions: string[]) => boolean

  // Check if user has all of the provided permissions
  hasAllPermissions: (permissions: string[]) => boolean

  // Vehicle booking specific permission checks
  canCreateVehicleBooking: () => boolean
  canEditVehicleBooking: () => boolean
  canDeleteVehicleBooking: () => boolean
  canReceiveVehicle: () => boolean
  canRejectVehicle: () => boolean
  canExitVehicle: () => boolean
  canUnreceiveVehicle: () => boolean
  canApproveVehicle: () => boolean
  canOverrideDailyLimit: () => boolean
  canManageDailyLimits: () => boolean
  canViewReports: () => boolean
  canExportReports: () => boolean
  canToggleSettings: () => boolean

  // Get user permissions
  getUserPermissions: () => string[]
  getUserRoles: () => string[]
}

export const usePermissionStore = create<PermissionStore>((set, get) => ({
  hasPermission: (permission: string) => {
    const user = useAuthStore.getState().user
    if (!user) return false

    // Check direct permissions
    if (user.permission_names?.includes(permission)) {
      return true
    }

    // Check permissions via roles
    if (user.permissions?.some(p => p.name === permission)) {
      return true
    }

    return false
  },

  hasAnyPermission: (permissions: string[]) => {
    return permissions.some(permission => get().hasPermission(permission))
  },

  hasAllPermissions: (permissions: string[]) => {
    return permissions.every(permission => get().hasPermission(permission))
  },

  // Vehicle booking specific methods
  canCreateVehicleBooking: () => {
    return get().hasPermission(VEHICLE_BOOKING_PERMISSIONS.CREATE)
  },

  canEditVehicleBooking: () => {
    return get().hasPermission(VEHICLE_BOOKING_PERMISSIONS.EDIT)
  },

  canDeleteVehicleBooking: () => {
    return get().hasPermission(VEHICLE_BOOKING_PERMISSIONS.DELETE)
  },

  canReceiveVehicle: () => {
    return get().hasPermission(VEHICLE_BOOKING_PERMISSIONS.RECEIVE)
  },

  canRejectVehicle: () => {
    return get().hasPermission(VEHICLE_BOOKING_PERMISSIONS.REJECT)
  },

  canExitVehicle: () => {
    return get().hasPermission(VEHICLE_BOOKING_PERMISSIONS.EXIT)
  },

  canUnreceiveVehicle: () => {
    return get().hasPermission(VEHICLE_BOOKING_PERMISSIONS.UNRECEIVE)
  },

  canApproveVehicle: () => {
    return get().hasPermission(VEHICLE_BOOKING_PERMISSIONS.APPROVE)
  },

  canOverrideDailyLimit: () => {
    return get().hasPermission(VEHICLE_BOOKING_PERMISSIONS.OVERRIDE_DAILY_LIMIT)
  },

  canManageDailyLimits: () => {
    return get().hasPermission(VEHICLE_BOOKING_PERMISSIONS.MANAGE_DAILY_LIMITS)
  },

  canViewReports: () => {
    return get().hasPermission(VEHICLE_BOOKING_PERMISSIONS.VIEW_REPORTS)
  },

  canExportReports: () => {
    return get().hasPermission(VEHICLE_BOOKING_PERMISSIONS.EXPORT_REPORTS)
  },

  canToggleSettings: () => {
    return get().hasAnyPermission([
      VEHICLE_BOOKING_PERMISSIONS.TOGGLE_VEHICLE_BOOKING,
      VEHICLE_BOOKING_PERMISSIONS.TOGGLE_VEHICLE_BOOKING_APPROVAL,
      VEHICLE_BOOKING_PERMISSIONS.TOGGLE_VEHICLE_BOOKING_OVERRIDE,
    ])
  },

  getUserPermissions: () => {
    const user = useAuthStore.getState().user
    return user?.permission_names || []
  },

  getUserRoles: () => {
    const user = useAuthStore.getState().user
    return user?.role_names || []
  },
}))

// Custom hook for easier permission checking
export const usePermissions = () => {
  const store = usePermissionStore()

  return {
    ...store,
    // Convenience method for checking vehicle booking permissions
    checkVehicleBookingAccess: () => {
      return store.hasAnyPermission([
        VEHICLE_BOOKING_PERMISSIONS.VIEW_ANY,
        VEHICLE_BOOKING_PERMISSIONS.VIEW,
      ])
    },
  }
}