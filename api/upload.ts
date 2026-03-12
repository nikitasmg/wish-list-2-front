import api from '@/lib/api'

export async function uploadImage(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const result = await api.post<{ url: string }, FormData>('upload', fd)
  return result.url
}
