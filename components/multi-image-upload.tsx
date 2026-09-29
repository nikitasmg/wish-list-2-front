'use client'

import { uploadImage } from '@/api/upload'
import { Label } from '@/components/ui/label'
import { Loader2, UploadIcon, X } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

type Props = {
  label?: string
  value: string[]
  onChange: (urls: string[]) => void
  onUploadingChange?: (uploading: boolean) => void
}

export function MultiImageUpload({ label = 'Картинки', value, onChange, onUploadingChange }: Props) {
  const [pendingCount, setPendingCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isUploading = pendingCount > 0

  useEffect(() => {
    onUploadingChange?.(isUploading)
  }, [isUploading, onUploadingChange])

  const handleFiles = async (files: FileList) => {
    const list = Array.from(files)
    setPendingCount(list.length)
    setError(null)
    try {
      const uploaded: string[] = []
      for (const file of list) {
        if (file.size > 10 * 1024 * 1024) {
          setError('Файл должен быть менее 10MB')
          continue
        }
        uploaded.push(await uploadImage(file))
      }
      onChange([...value, ...uploaded])
    } catch {
      setError('Ошибка загрузки. Попробуйте ещё раз.')
    } finally {
      setPendingCount(0)
    }
  }

  const removeAt = (i: number) => onChange(value.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      {(value.length > 0 || pendingCount > 0) && (
        <div className="grid grid-cols-3 gap-2">
          {value.map((url, i) => (
            <div key={url + i} className="relative h-24 rounded-lg overflow-hidden border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5"
                aria-label="Удалить"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          {Array.from({ length: pendingCount }).map((_, i) => (
            <div key={`skeleton-${i}`} className="relative h-24 rounded-lg overflow-hidden border bg-muted animate-pulse">
              <Loader2 className="absolute inset-0 m-auto text-muted-foreground animate-spin" size={20} />
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isUploading ? 'border-border opacity-50 cursor-not-allowed' : 'border-border cursor-pointer hover:border-primary'
        }`}
        onClick={() => { if (!isUploading) inputRef.current?.click() }}
      >
        {isUploading
          ? <Loader2 className="mx-auto mb-2 text-muted-foreground animate-spin" size={24} />
          : <UploadIcon className="mx-auto mb-2 text-muted-foreground" size={24} />}
        <p className="text-sm text-muted-foreground">
          {isUploading ? 'Загружается...' : 'Перетащи или нажми — можно несколько'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">JPG, PNG до 10MB</p>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files) }}
        />
      </div>
    </div>
  )
}
