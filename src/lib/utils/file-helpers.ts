export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export function getFileIcon(mimeType: string): { icon: string; color: string; bgColor: string } {
  if (mimeType === 'application/pdf') {
    return {
      icon: '📄',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  }

  if (mimeType.startsWith('image/')) {
    return {
      icon: '🖼️',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  }

  return {
    icon: '📎',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50'
  }
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

export function truncateFileName(fileName: string, maxLength: number = 30): string {
  if (fileName.length <= maxLength) return fileName

  const extension = fileName.split('.').pop() || ''
  const nameWithoutExt = fileName.slice(0, fileName.lastIndexOf('.'))
  const truncatedName = nameWithoutExt.slice(0, maxLength - extension.length - 4)

  return `${truncatedName}...${extension}`
}

export function validateFile(file: File, maxSize: number = 10 * 1024 * 1024): string | null {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']

  if (!allowedTypes.includes(file.type)) {
    return 'Please select a valid image (JPEG, PNG) or PDF file'
  }

  if (file.size > maxSize) {
    return `File size must be less than ${formatFileSize(maxSize)}`
  }

  return null
}

export function getMimeTypeFromFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const lowerFileName = fileName.toLowerCase()

  switch (ext) {
    case 'pdf':
      return 'application/pdf'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'tmp':
    case 'temp':
    case 'dat':
      // Common camera temporary file extensions - assume JPEG
      return 'image/jpeg'
    default:
      // For unknown extensions, assume it's an image if the filename suggests it
      // This helps with camera uploads that might have generic names
      if (lowerFileName.includes('img') ||
          lowerFileName.includes('image') ||
          lowerFileName.includes('photo') ||
          lowerFileName.includes('camera') ||
          lowerFileName.includes('pic') ||
          lowerFileName.includes('capture') ||
          lowerFileName.includes('snapshot') ||
          lowerFileName.startsWith('dsc') ||      // Digital Still Camera
          lowerFileName.startsWith('p_') ||       // Photo prefix
          lowerFileName.match(/^\d{8}_\d{6}/)) {  // YYYYMMDD_HHMMSS pattern
        return 'image/jpeg' // Default to JPEG for camera images
      }
      return 'application/octet-stream'
  }
}