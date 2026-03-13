import { Block } from '@/shared/types'
import React from 'react'

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    // YouTube
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      const videoId = u.hostname.includes('youtu.be')
        ? u.pathname.slice(1)
        : u.searchParams.get('v')
      if (videoId) return `https://www.youtube.com/embed/${videoId}`
    }
    // VK Video
    if ((u.hostname.includes('vk.com') || u.hostname.includes('vkvideo.ru')) && u.pathname.includes('video')) {
      const match = u.pathname.match(/video(-?\d+)_(\d+)/)
      if (match) return `https://vk.com/video_ext.php?oid=${match[1]}&id=${match[2]}`
    }
  } catch {
    // invalid URL
  }
  return null
}

export function VideoBlockView({ block }: { block: Block }) {
  const url = block.data.url as string | undefined
  const caption = block.data.caption as string | undefined

  if (!url) return null

  const embedUrl = getEmbedUrl(url)

  if (!embedUrl) {
    return (
      <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground text-center">
        Неподдерживаемая ссылка на видео
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
      {caption && (
        <p className="text-sm text-muted-foreground text-center">{caption}</p>
      )}
    </div>
  )
}
