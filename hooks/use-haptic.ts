'use client'

import { useCallback, useEffect, useRef } from 'react'

/**
 * Cross-platform haptic feedback.
 * - Android: navigator.vibrate (Vibration API)
 * - iOS 17.4+: programmatic click on <input type="checkbox" switch>
 *   Must be rendered with opacity:0, NOT display:none — otherwise iOS won't fire the haptic.
 */
export function useHaptic() {
  const switchRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (typeof navigator === 'undefined') return
    if (typeof navigator.vibrate === 'function') return // Android handles it at call time

    const input = document.createElement('input')
    input.type = 'checkbox'
    input.setAttribute('switch', '')
    input.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;'
    document.body.appendChild(input)
    switchRef.current = input

    return () => {
      input.remove()
      switchRef.current = null
    }
  }, [])

  return useCallback((duration = 25) => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(duration)
      return
    }
    switchRef.current?.click()
  }, [])
}
