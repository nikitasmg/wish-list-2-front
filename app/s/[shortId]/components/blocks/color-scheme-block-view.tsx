import { Block } from '@/shared/types'
import { useEffect } from 'react'
import React from 'react'

export function ColorSchemeBlockView({ block }: { block: Block }) {
  const scheme = block.data.scheme as string
  useEffect(() => {
    if (!scheme || typeof window === 'undefined') return
    document.body.classList.add(scheme)
    return () => { document.body.classList.remove(scheme) }
  }, [scheme])
  return null
}
