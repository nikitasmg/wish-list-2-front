import api from '@/lib/api'

/**
 * Загрузка картинки. onProgress — для полоски «2,4 из 3,8 МБ», signal —
 * для кнопки «Отменить».
 */
export async function uploadImage(file: File, options: { onProgress?: (loaded: number, total: number) => void; signal?: AbortSignal } = {}): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const result = await api.post<{ url: string }, FormData>('upload', fd, {
    signal: options.signal,
    onUploadProgress: event => options.onProgress?.(event.loaded, event.total ?? file.size),
  })
  return result.url
}
