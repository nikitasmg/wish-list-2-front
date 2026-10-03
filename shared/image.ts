/** Лимит бэка на загрузку. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024

type FileLike = { name: string; type: string; size?: number }

export function isHeic(file: Pick<FileLike, 'name' | 'type'>): boolean {
  return /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name)
}

/** Текст ошибки для человека или null, если файл подходит. */
export function checkImageFile(file: FileLike): string | null {
  const known = /^image\/(jpeg|png|webp|gif)$/i.test(file.type) || isHeic(file) || /\.(jpe?g|png|webp)$/i.test(file.name)
  if (!known) return 'Подойдёт фото в JPG, PNG, WEBP или HEIC'
  if ((file.size ?? 0) > MAX_IMAGE_BYTES) return 'Файл больше 10 МБ'
  return null
}

/** «2,4» — мегабайты с одним знаком, как в макете. */
export function formatMb(bytes: number): string {
  return (Math.round(bytes / 1024 / 1024 * 10) / 10).toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

export type Rect = { x: number; y: number; width: number; height: number }

/** Наибольшая рамка нужной пропорции по центру картинки. */
export function centerCrop(width: number, height: number, aspect: number): Rect {
  return cropRect(width, height, aspect, 1, 0.5, 0.5)
}

/**
 * Рамка обрезки: zoom ≥ 1 уменьшает рамку, focusX/focusY от 0 до 1 — куда
 * она сдвинута. Рамка всегда целиком внутри картинки.
 */
export function cropRect(width: number, height: number, aspect: number, zoom: number, focusX: number, focusY: number): Rect {
  let w = width
  let h = width / aspect
  if (h > height) { h = height; w = height * aspect }
  w = Math.round(w / Math.max(1, zoom))
  h = Math.round(h / Math.max(1, zoom))
  const clamp = (v: number) => Math.min(1, Math.max(0, v))
  return { x: Math.round((width - w) * clamp(focusX)), y: Math.round((height - h) * clamp(focusY)), width: w, height: h }
}
