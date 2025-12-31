'use client';

import React, {useState, useRef} from 'react';
import {FileText, Upload, Camera, Eye, X, Loader2, Lock} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {toast} from 'sonner';
import {useTranslations} from 'next-intl';
import {vehicleBookingService} from '@/lib/services/vehicle-booking';
import {
  validateFile,
  formatFileSize,
  getMimeTypeFromFileName,
} from '@/lib/utils/file-helpers';
import {usePermissions} from '@/lib/stores/permission-store';
import type {VehicleBooking, Media} from '@/types/vehicle-booking';

interface CompactBillAttachmentsProps {
  vehicle: VehicleBooking;
  onUpdate: (updatedVehicle: VehicleBooking) => void;
  onPreview?: (attachment: Media) => void;
}

export function CompactBillAttachments({
  vehicle,
  onUpdate,
  onPreview,
}: CompactBillAttachmentsProps) {
  const t = useTranslations('vehicleBooking.billAttachments');
  const permissions = usePermissions();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const attachments = vehicle.bill_attachments || [];

  // Check if user can view bill attachments
  if (!permissions.canViewBillAttachments()) {
    return null;
  }

  // Check if vehicle status allows bill attachments (business logic)
  const canShowBillAttachments =
    vehicle.status === 'offloaded' || vehicle.status === 'exited';
  const canUploadBills =
    canShowBillAttachments && permissions.canUploadBillAttachments();

  // If status doesn't allow bill attachments, don't show anything
  if (!canShowBillAttachments) {
    return null;
  }

  const handleFileUpload = async (file: File) => {
    // Fix for camera photos: normalize MIME type if missing or incorrect
    let processedFile = file;
    if (
      !file.type ||
      file.type === 'application/octet-stream' ||
      file.type === ''
    ) {
      const inferredMimeType = getMimeTypeFromFileName(file.name);

      // Create a new File object with corrected MIME type
      processedFile = new File([file], file.name, {
        type: inferredMimeType,
        lastModified: file.lastModified,
      });
    }

    const validationError = validateFile(processedFile);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsUploading(true);
    setUploadingFile(processedFile.name);

    try {
      const updatedVehicle = await vehicleBookingService.uploadMedia(
        vehicle.id,
        processedFile
      );
      onUpdate(updatedVehicle);
      toast.success(t('uploadSuccess'));
    } catch {
      toast.error(t('uploadError'));
    } finally {
      setIsUploading(false);
      setUploadingFile(null);
      // Reset file inputs
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      const updatedVehicle = await vehicleBookingService.deleteMedia(id);
      onUpdate(updatedVehicle);
      toast.success(t('deleteSuccess'));
    } catch {
      toast.error(t('deleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  const handlePreview = (attachment: Media) => {
    if (onPreview) {
      onPreview(attachment);
    } else {
      // Fallback to opening in new tab
      window.open(attachment.url, '_blank');
    }
  };

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
        <div className="flex items-center gap-2 rounded-lg border bg-blue-50 p-2">
          <Loader2 className="size-3 animate-spin text-blue-600" />
          <span className="flex-1 truncate text-xs text-blue-800">
            {t('uploading', {fileName: uploadingFile})}
          </span>
        </div>
      )}

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="max-h-32 space-y-1.5 overflow-y-auto">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className={`bg-muted/30 flex items-center gap-2 rounded-lg border p-2 ${deletingId === attachment.id ? 'opacity-50' : ''} `}
            >
              <FileText className="text-muted-foreground size-3 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium">
                  {attachment.file_name || attachment.name}
                </div>
                <div className="text-muted-foreground text-xs">
                  {formatFileSize(attachment.size)}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePreview(attachment)}
                  className="hover:bg-muted rounded p-1 transition-colors"
                  aria-label={t('preview')}
                >
                  <Eye className="text-muted-foreground size-3" />
                </button>
                {permissions.canDeleteBillAttachments() && (
                  <button
                    onClick={() => handleDelete(attachment.id)}
                    disabled={deletingId === attachment.id}
                    className="hover:bg-muted rounded p-1 transition-colors"
                    aria-label={t('delete')}
                  >
                    <X className="text-muted-foreground size-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Buttons - Only show for offloaded/exited vehicles */}
      {canUploadBills ? (
        <div className="space-y-2 pt-1">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="h-8 flex-1 text-xs"
            >
              <Upload className="mr-1 size-3" />
              {t('uploadButton')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isUploading}
              className="h-8 flex-1 text-xs"
            >
              <Camera className="mr-1 size-3" />
              {t('cameraButton')}
            </Button>
          </div>
        </div>
      ) : attachments.length === 0 ? (
        <div className="text-muted-foreground bg-muted/20 flex items-center justify-center gap-2 rounded-lg p-3 text-xs">
          <Lock className="size-3" />
          <span>Bills can be uploaded after offloading is complete</span>
        </div>
      ) : null}
    </div>
  );
}
