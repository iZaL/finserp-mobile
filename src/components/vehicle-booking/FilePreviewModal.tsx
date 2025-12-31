import React from 'react';
import Image from 'next/image';
import {X, Download, Share2} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {formatFileSize} from '@/lib/utils/file-helpers';
import type {Media} from '@/types/vehicle-booking';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachment: Media | null;
}

export function FilePreviewModal({
  isOpen,
  onClose,
  attachment,
}: FilePreviewModalProps) {
  if (!attachment) return null;

  const isPdf = attachment.mime_type === 'application/pdf';
  const isImage = attachment.mime_type?.startsWith('image/');

  const handleDownload = () => {
    window.open(attachment.url, '_blank');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: attachment.file_name || attachment.name,
          text: `Check out this file: ${attachment.file_name || attachment.name}`,
          url: attachment.url,
        });
      } catch {
        // User canceled or sharing failed - both are fine, do nothing
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="flex h-[90vh] max-w-4xl flex-col overflow-hidden p-0 sm:h-[90vh]"
        aria-describedby="file-preview-description"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{attachment.file_name || attachment.name}</DialogTitle>
          <p id="file-preview-description">
            Preview of {attachment.file_name || attachment.name}
          </p>
        </DialogHeader>
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 p-3 sm:p-4 dark:border-slate-700 dark:from-slate-900/50 dark:to-slate-800/50">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold text-slate-900 sm:text-lg dark:text-slate-100">
              {attachment.file_name || attachment.name}
            </h2>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                {formatFileSize(attachment.size)}
              </span>
              <span className="text-xs text-slate-400 sm:text-sm dark:text-slate-500">
                •
              </span>
              <span className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                {new Date(attachment.created_at).toLocaleDateString('en-GB')}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="ml-2 flex items-center gap-1 sm:ml-4 sm:gap-2">
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700 sm:size-10"
                onClick={handleShare}
              >
                <Share2 className="size-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-green-600 hover:bg-green-50 hover:text-green-700 sm:size-10"
              onClick={handleDownload}
            >
              <Download className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-red-600 hover:bg-red-50 hover:text-red-700 sm:size-10"
              onClick={onClose}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 p-2 sm:p-4 dark:from-slate-900/50 dark:to-slate-800/50">
          {isPdf ? (
            <iframe
              src={attachment.url}
              className="h-full min-h-[50vh] w-full rounded-lg shadow-sm"
              title={attachment.file_name || attachment.name}
            />
          ) : isImage ? (
            <div className="relative flex h-full min-h-[50vh] items-center justify-center">
              <Image
                src={attachment.url}
                alt={attachment.file_name || attachment.name}
                fill
                className="rounded-lg object-contain shadow-sm"
              />
            </div>
          ) : (
            <div className="flex h-full min-h-[50vh] flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-slate-200/50 dark:bg-slate-700/50">
                <Download className="h-12 w-12 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="mb-2 text-lg font-medium text-slate-900 dark:text-slate-100">
                Preview not available
              </p>
              <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                This file type cannot be previewed in the browser
              </p>
              <Button onClick={handleDownload}>Download File</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
