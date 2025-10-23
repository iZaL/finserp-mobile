"use client"

import { ReactNode } from 'react'
import { usePermissions } from '@/lib/stores/permission-store'
import { AlertTriangle, Lock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from '@/i18n/navigation'

interface PermissionGuardProps {
  permissions: string | string[]
  requireAll?: boolean
  fallback?: ReactNode
  showAccessDenied?: boolean
  children: ReactNode
}

export function PermissionGuard({
  permissions,
  requireAll = false,
  fallback,
  showAccessDenied = true,
  children,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()
  const router = useRouter()

  const permissionArray = Array.isArray(permissions) ? permissions : [permissions]

  let hasAccess = false

  if (requireAll) {
    hasAccess = hasAllPermissions(permissionArray)
  } else {
    hasAccess = hasAnyPermission(permissionArray)
  }

  if (hasAccess) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  if (!showAccessDenied) {
    return null
  }

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <Lock className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You don't have permission to access this feature. Please contact your administrator if you believe this is an error.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-500">
            <AlertTriangle className="h-3 w-3" />
            <span>Required permissions: {permissionArray.join(', ')}</span>
          </div>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="w-full"
          >
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Convenience component for vehicle booking access
export function VehicleBookingGuard({ children }: { children: ReactNode }) {
  return (
    <PermissionGuard permissions={['viewAny-fish-purchase-vehicle', 'view-fish-purchase-vehicle']}>
      {children}
    </PermissionGuard>
  )
}