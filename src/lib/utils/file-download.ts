/**
 * Utility functions for handling file downloads in the browser
 */

export interface DownloadOptions {
  filename: string
  mimeType: string
}

/**
 * Download a blob as a file
 */
export function downloadFile(blob: Blob, filename: string, mimeType: string): void {
  // Create blob URL
  const url = window.URL.createObjectURL(new Blob([blob], { type: mimeType }))

  // Create temporary anchor element
  const link = document.createElement('a')
  link.href = url
  link.download = filename

  // Append to body, click, and remove
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up blob URL
  window.URL.revokeObjectURL(url)
}

/**
 * Download text content as a file
 */
export function downloadTextFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType })
  downloadFile(blob, filename, mimeType)
}

/**
 * Download JSON data as a CSV file
 */
export function downloadCSV(data: Record<string, unknown>[], filename: string): void {
  if (!data || data.length === 0) {
    throw new Error('No data to export')
  }

  // Get headers from first object keys
  const headers = Object.keys(data[0])

  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row =>
      headers.map(header => {
        const value = row[header]
        // Escape quotes and wrap in quotes if contains comma or quote
        const stringValue = String(value ?? '')
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      }).join(',')
    )
  ].join('\n')

  downloadTextFile(csvContent, filename, 'text/csv')
}

/**
 * Generate filename with timestamp
 */
export function generateTimestampedFilename(prefix: string, extension: string): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
  return `${prefix}_${timestamp}.${extension}`
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}