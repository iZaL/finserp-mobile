"use client"

import React, { useState, useRef } from 'react'
import { FileText, Upload, Camera, Eye, X, Loader2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { vehicleBookingService } from '@/lib/services/vehicle-booking'
import { validateFile, formatFileSize } from '@/lib/utils/file-helpers'
import { usePermissions } from '@/lib/stores/permission-store'
import type { VehicleBooking, Media } from '@/types/vehicle-booking'

interface CompactBillAttachmentsProps {
  vehicle: VehicleBooking
  onUpdate: (updatedVehicle: VehicleBooking) => void
  onPreview?: (attachment: Media) => void
}

export function CompactBillAttachments({
  vehicle,
  onUpdate,
  onPreview
}: CompactBillAttachmentsProps) {
  const t = useTranslations('vehicleBooking.billAttachments')
  const permissions = usePermissions()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const attachments = vehicle.bill_attachments || []

  // Check if user can view bill attachments
  if (!permissions.canViewBillAttachments()) {
    return null
  }

  const handleFileUpload = async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      toast.error(validationError)
      return
    }

    setIsUploading(true)
    setUploadingFile(file.name)

    try {
      const updatedVehicle = await vehicleBookingService.uploadMedia(vehicle.id, file)
      onUpdate(updatedVehicle)
      toast.success(t('uploadSuccess'))
    } catch (error) {
      toast.error(t('uploadError'))
    } finally {
      setIsUploading(false)
      setUploadingFile(null)
      // Reset file inputs
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (cameraInputRef.current) cameraInputRef.current.value = ''
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      const updatedVehicle = await vehicleBookingService.deleteMedia(id)
      onUpdate(updatedVehicle)
      toast.success(t('deleteSuccess'))
    } catch (error) {
      toast.error(t('deleteError'))
    } finally {
      setDeletingId(null)
    }
  }

  const handlePreview = (attachment: Media) => {
    if (onPreview) {
      onPreview(attachment)
    } else {
      // Fallback to opening in new tab
      window.open(attachment.url, '_blank')
    }
  }

  return (
    <div className="space-y-2">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Progress */}
      {isUploading && uploadingFile && (
        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border">
          <Loader2 className="size-3 animate-spin text-blue-600" />
          <span className="text-xs text-blue-800 flex-1 truncate">
            {t('uploading', { fileName: uploadingFile })}
          </span>
        </div>
      )}

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-1.5 max-h-32 overflow-y-auto">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className={`
                flex items-center gap-2 p-2 rounded-lg border bg-muted/30
                ${deletingId === attachment.id ? 'opacity-50' : ''}
              `}
            >
              <FileText className="size-3 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">
                  {attachment.file_name || attachment.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.size)}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePreview(attachment)}
                  className="p-1 hover:bg-muted rounded transition-colors"
                  aria-label={t('preview')}
                >
                  <Eye className="size-3 text-muted-foreground" />
                </button>
                {permissions.canDeleteBillAttachments() && (
                  <button
                    onClick={() => handleDelete(attachment.id)}
                    disabled={deletingId === attachment.id}
                    className="p-1 hover:bg-muted rounded transition-colors"
                    aria-label={t('delete')}
                  >
                    <X className="size-3 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Buttons */}
      {permissions.canUploadBillAttachments() ? (
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1 h-8 text-xs"
          >
            <Upload className="size-3 mr-1" />
            {t('uploadButton')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1 h-8 text-xs"
          >
            <Camera className="size-3 mr-1" />
            {t('cameraButton')}
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 p-3 text-xs text-muted-foreground bg-muted/20 rounded-lg">
          <Lock className="size-3" />
          <span>Upload permission required</span>
        </div>
      )}

      {/* Empty State */}
      {attachments.length === 0 && !isUploading && (
        <div className="text-xs text-muted-foreground p-2 border rounded-lg bg-muted/20 text-center">
          {t('noBillAttachments')}
        </div>
      )}
    </div>
  )
}