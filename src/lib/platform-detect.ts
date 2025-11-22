/**
 * Platform detection utilities for PWA installation guidance
 */

export type Platform = 'ios-safari' | 'android-chrome' | 'desktop' | 'other'

export interface PlatformInfo {
  platform: Platform
  isStandalone: boolean
  canInstall: boolean
  browserName: string
}

/**
 * Detects the current platform and browser
 */
export function detectPlatform(): PlatformInfo {
  if (typeof window === 'undefined') {
    return {
      platform: 'other',
      isStandalone: false,
      canInstall: false,
      browserName: 'unknown',
    }
  }

  const userAgent = window.navigator.userAgent.toLowerCase()
  const isIOS = /iphone|ipad|ipod/.test(userAgent)
  const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent)
  const isChrome = /chrome|crios/.test(userAgent)
  const isAndroid = /android/.test(userAgent)

  // Check if running in standalone mode (already installed)
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true

  let platform: Platform
  let browserName: string
  let canInstall: boolean

  if (isIOS && isSafari) {
    platform = 'ios-safari'
    browserName = 'Safari'
    // iOS Safari can install but doesn't support beforeinstallprompt
    canInstall = !isStandalone
  } else if (isAndroid && isChrome) {
    platform = 'android-chrome'
    browserName = 'Chrome'
    // Android Chrome supports beforeinstallprompt
    canInstall = !isStandalone
  } else if (!isIOS && !isAndroid) {
    platform = 'desktop'
    browserName = isChrome ? 'Chrome' : isSafari ? 'Safari' : 'Browser'
    canInstall = isChrome && !isStandalone
  } else {
    platform = 'other'
    browserName = 'Browser'
    canInstall = false
  }

  return {
    platform,
    isStandalone,
    canInstall,
    browserName,
  }
}

/**
 * Check if the device is iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false
  const userAgent = window.navigator.userAgent.toLowerCase()
  return /iphone|ipad|ipod/.test(userAgent)
}

/**
 * Check if the device is Android
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false
  const userAgent = window.navigator.userAgent.toLowerCase()
  return /android/.test(userAgent)
}

/**
 * Check if app is running in standalone mode (installed)
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  )
}
