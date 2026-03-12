'use client'

import { uploadImage } from '@/api/upload'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, UploadIcon } from 'lucide-react'
import React, { useRef, useState } from 'react'

export type ImageUploadValue =
  | { type: 'file'; value: File }   // kept for type compatibility, no longer emitted
  | { type: 'url'; value: string }

type Props = {
  label?: string
  onChange: (value: ImageUploadValue | null) => void
  previewUrl?: string
}

export function ImageUpload({ label = 'Обложка', onChange, previewUrl }: Props) {
  const [preview, setPreview] = useState<string | undefined>(previewUrl)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    // Show blob preview immediately for snappy UX
    const blobUrl = URL.createObjectURL(file)
    setPreview(blobUrl)
    setIsUploading(true)
    setUploadError(null)

    try {
      const realUrl = await uploadImage(file)
      URL.revokeObjectURL(blobUrl)
      setPreview(realUrl)
      onChange({ type: 'url', value: realUrl })
    } catch {
      URL.revokeObjectURL(blobUrl)
      setPreview(undefined)
      setUploadError('Ошибка загрузки. Попробуйте ещё раз.')
      onChange(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (isUploading) return
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleFile(file)
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isUploading) return
    const url = e.target.value.trim()
    if (url) {
      setPreview(url)
      onChange({ type: 'url', value: url })
    } else {
      setPreview(undefined)
      onChange(null)
    }
  }

  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      {/* Preview */}
      {preview && (
        <div className="relative w-full h-40 rounded-lg overflow-hidden border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="preview" className="w-full h-full object-cover" />
          {isUploading && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={28} />
            </div>
          )}
        </div>
      )}

      {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isUploading
            ? 'border-border opacity-50 cursor-not-allowed'
            : 'border-border cursor-pointer hover:border-primary'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => { if (!isUploading) inputRef.current?.click() }}
      >
        {isUploading ? (
          <Loader2 className="mx-auto mb-2 text-muted-foreground animate-spin" size={24} />
        ) : (
          <UploadIcon className="mx-auto mb-2 text-muted-foreground" size={24} />
        )}
        <p className="text-sm text-muted-foreground">
          {isUploading ? 'Загружается...' : 'Перетащи или нажми для выбора файла'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">JPG, PNG до 2MB</p>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            if (file.size > 2 * 1024 * 1024) {
              alert('Файл должен быть менее 2MB')
              return
            }
            handleFile(file)
          }}
        />
      </div>

      {/* OR divider */}
      <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
        <span className="relative z-10 bg-background px-2 text-muted-foreground">или</span>
      </div>

      {/* URL input */}
      <Input
        placeholder="https://example.com/image.jpg"
        onChange={handleUrlChange}
        disabled={isUploading}
        defaultValue={previewUrl && !previewUrl.startsWith('blob:') ? previewUrl : ''}
      />
    </div>
  )
}
