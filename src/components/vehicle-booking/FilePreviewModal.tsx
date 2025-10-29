import React from 'react'
import Image from 'next/image'
import { X, Download, Share2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatFileSize } from '@/lib/utils/file-helpers'
import type { Media } from '@/types/vehicle-booking'

interface FilePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  attachment: Media | null
}

export function FilePreviewModal({ isOpen, onClose, attachment }: FilePreviewModalProps) {
  if (!attachment) return null

  const isPdf = attachment.mime_type === 'application/pdf'
  const isImage = attachment.mime_type?.startsWith('image/')

  const handleDownload = () => {
    window.open(attachment.url, '_blank')
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: attachment.file_name || attachment.name,
          text: `Check out this file: ${attachment.file_name || attachment.name}`,
          url: attachment.url
        })
      } catch {
        // User canceled or sharing failed - both are fine, do nothing
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-4xl h-[90vh] sm:h-[90vh] p-0 overflow-hidden flex flex-col"
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
        <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 border-slate-200 dark:border-slate-700 shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
              {attachment.file_name || attachment.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {formatFileSize(attachment.size)}
              </span>
              <span className="text-xs sm:text-sm text-slate-400 dark:text-slate-500">•</span>
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {new Date(attachment.created_at).toLocaleDateString('en-GB')}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2 ml-2 sm:ml-4">
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8 sm:size-10 hover:bg-blue-50 text-blue-600 hover:text-blue-700"
                onClick={handleShare}
              >
                <Share2 className="size-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-8 sm:size-10 hover:bg-green-50 text-green-600 hover:text-green-700"
              onClick={handleDownload}
            >
              <Download className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 sm:size-10 hover:bg-red-50 text-red-600 hover:text-red-700"
              onClick={onClose}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 p-2 sm:p-4 min-h-0">
          {isPdf ? (
            <iframe
              src={attachment.url}
              className="w-full h-full min-h-[50vh] rounded-lg shadow-sm"
              title={attachment.file_name || attachment.name}
            />
          ) : isImage ? (
            <div className="flex items-center justify-center min-h-[50vh] h-full relative">
              <Image
                src={attachment.url}
                alt={attachment.file_name || attachment.name}
                fill
                className="object-contain rounded-lg shadow-sm"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center">
              <div className="w-24 h-24 rounded-full bg-slate-200/50 dark:bg-slate-700/50 flex items-center justify-center mb-4">
                <Download className="w-12 h-12 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                Preview not available
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                This file type cannot be previewed in the browser
              </p>
              <Button onClick={handleDownload}>
                Download File
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}