'use client'

import { uploadImage } from '@/api/upload'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { checkImageFile, formatMb, isHeic } from '@/shared/image'
import { isAxiosError } from 'axios'
import { ImageIcon, Trash2, UploadIcon } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

export type ImageUploadValue =
  | { type: 'file'; value: File }   // kept for type compatibility, no longer emitted
  | { type: 'url'; value: string }

type Props = {
  label?: string
  onChange: (value: ImageUploadValue | null) => void
  onUploadingChange?: (uploading: boolean) => void
  previewUrl?: string
  /** Ловить Ctrl+V на всей странице — для формы подарка, где фото одно. */
  pasteAnywhere?: boolean
}

type State =
  | { kind: 'empty' }
  | { kind: 'uploading'; loaded: number; total: number }
  | { kind: 'error'; message: string; name?: string; size?: number }
  | { kind: 'done' }

/**
 * Загрузка картинки по макету «Загрузка картинок»: перетаскивание, выбор
 * файла и Ctrl+V; прогресс с отменой; понятная ошибка; обрезка рамкой — свободно,
 * 1:1, 4:3, 16:9. HEIC переводится в JPEG браузером — бэк его не принимает, а на
 * айфоне фото чаще всего именно в нём.
 */
export function ImageUpload({ label = 'Обложка', onChange, onUploadingChange, previewUrl, pasteAnywhere }: Props) {
  const [preview, setPreview] = useState<string | undefined>(previewUrl || undefined)
  const [state, setState] = useState<State>(previewUrl ? { kind: 'done' } : { kind: 'empty' })
  const [dragging, setDragging] = useState(false)
  // Адрес для обрезки: свой файл, если он ещё в памяти, — у него нет
  // проблем с CORS, иначе загруженная картинка.
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [byLink, setByLink] = useState(false)
  const source = useRef<Blob | null>(null)
  const abort = useRef<AbortController | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const uploading = state.kind === 'uploading'

  useEffect(() => { onUploadingChange?.(uploading) }, [uploading, onUploadingChange])

  const upload = async (blob: Blob, name: string) => {
    const controller = new AbortController()
    abort.current = controller
    const local = URL.createObjectURL(blob)
    setPreview(local)
    setState({ kind: 'uploading', loaded: 0, total: blob.size })
    try {
      const file = blob instanceof File ? blob : new File([blob], name, { type: blob.type })
      const url = await uploadImage(file, {
        signal: controller.signal,
        onProgress: (loaded, total) => setState({ kind: 'uploading', loaded, total: total || blob.size }),
      })
      source.current = blob
      setPreview(url)
      setState({ kind: 'done' })
      onChange({ type: 'url', value: url })
    } catch (error) {
      setPreview(previewUrl || undefined)
      if (isAxiosError(error) && error.code === 'ERR_CANCELED') {
        setState(previewUrl ? { kind: 'done' } : { kind: 'empty' })
      } else {
        setState({ kind: 'error', message: 'Не загрузилось. Попробуйте ещё раз', name, size: blob.size })
      }
    } finally {
      URL.revokeObjectURL(local)
      abort.current = null
    }
  }

  const take = async (file: File) => {
    const problem = checkImageFile(file)
    if (problem) { setState({ kind: 'error', message: problem, name: file.name, size: file.size }); return }
    if (isHeic(file)) {
      const jpeg = await heicToJpeg(file)
      if (!jpeg) { setState({ kind: 'error', message: 'Этот браузер не открывает HEIC — сохраните фото как JPG', name: file.name, size: file.size }); return }
      return upload(jpeg, file.name.replace(/\.hei[cf]$/i, '.jpg'))
    }
    return upload(file, file.name)
  }

  // Ctrl+V: скриншот или скопированная картинка сразу уходит в загрузку.
  useEffect(() => {
    if (!pasteAnywhere) return
    const onPaste = (event: ClipboardEvent) => {
      const file = Array.from(event.clipboardData?.files ?? []).find(f => f.type.startsWith('image/'))
      if (!file || uploading) return
      event.preventDefault()
      void take(file)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  })

  const clear = () => { setPreview(undefined); source.current = null; setState({ kind: 'empty' }); onChange(null) }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}

      {state.kind === 'done' && preview ? (
        <div className="space-y-2">
          <div className="relative h-40 overflow-hidden rounded-control-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="flex gap-1.5">
            <Button type="button" size="sm" variant="outline" onClick={() => setCropSrc(source.current ? URL.createObjectURL(source.current) : preview)}>Обрезать</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()}>Заменить</Button>
            <Button type="button" size="icon" variant="ghost" className="ml-auto h-9 w-9" aria-label="Удалить фото" onClick={clear}><Trash2 size={15} aria-hidden /></Button>
          </div>
        </div>
      ) : state.kind === 'uploading' ? (
        <div className="relative flex h-40 flex-col items-center justify-center gap-2 overflow-hidden rounded-control-lg border bg-muted/40 p-4 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview && <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30 blur-sm" />}
          <span className="relative text-title font-extrabold tabular-nums">{Math.round(state.loaded / Math.max(1, state.total) * 100)}%</span>
          <span className="relative h-1.5 w-40 overflow-hidden rounded-full bg-border">
            <span className="block h-full bg-primary transition-[width]" style={{ width: `${state.loaded / Math.max(1, state.total) * 100}%` }} />
          </span>
          <span className="relative text-caption text-muted-foreground">Загрузка · {formatMb(state.loaded)} из {formatMb(state.total)} МБ</span>
          <Button type="button" size="sm" variant="ghost" className="relative" onClick={() => abort.current?.abort()}>Отменить</Button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-label={`${label}: выберите файл или перетащите сюда`}
          onClick={() => inputRef.current?.click()}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click() } }}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const file = e.dataTransfer.files?.[0]; if (file) void take(file) }}
          onPaste={e => { const file = Array.from(e.clipboardData.files).find(f => f.type.startsWith('image/')); if (file) { e.preventDefault(); void take(file) } }}
          className={cn(
            'flex h-40 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-control-lg border-2 border-dashed p-4 text-center transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            dragging ? 'border-primary bg-primary/5' : state.kind === 'error' ? 'border-destructive/60' : 'hover:border-primary/60',
          )}
        >
          {dragging ? (
            <><UploadIcon size={22} className="text-primary" aria-hidden /><span className="text-body-sm font-semibold">Отпустите файл</span></>
          ) : state.kind === 'error' ? (
            <>
              <span className="text-body-sm font-semibold text-destructive">{state.message}</span>
              {state.name && <span className="text-caption text-muted-foreground">{state.name}{state.size ? ` · ${formatMb(state.size)} МБ` : ''}</span>}
              <span className="text-caption font-semibold text-primary">Выбрать другой</span>
            </>
          ) : (
            <>
              <ImageIcon size={22} className="text-muted-foreground" aria-hidden />
              <span className="text-body-sm"><b>Выберите файл</b> или перетащите сюда</span>
              <span className="text-caption text-muted-foreground">JPG, PNG, WEBP, HEIC до 10 МБ · можно Ctrl + V</span>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
        className="hidden"
        onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) void take(file) }}
      />

      {!uploading && (byLink
        ? <Input
            placeholder="https://example.com/photo.jpg"
            aria-label="Ссылка на картинку"
            defaultValue={previewUrl && !previewUrl.startsWith('blob:') ? previewUrl : ''}
            onChange={e => {
              const url = e.target.value.trim()
              if (url) { setPreview(url); source.current = null; setState({ kind: 'done' }); onChange({ type: 'url', value: url }) }
              else clear()
            }}
          />
        : <button type="button" onClick={() => setByLink(true)} className="text-caption text-muted-foreground hover:text-foreground">или вставить ссылкой</button>)}

      {cropSrc && (
        <CropDialog
          src={cropSrc}
          onClose={() => setCropSrc(null)}
          onDone={blob => { setCropSrc(null); void upload(blob, 'crop.jpg') }}
        />
      )}
    </div>
  )
}

/** HEIC → JPEG силами браузера (Safari умеет, остальные — нет). */
async function heicToJpeg(file: File): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file)
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0)
    return await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9))
  } catch {
    return null
  }
}

/** «Свободно» — рамку тянут за любой угол, пропорция не держится. */
const ASPECTS: [string, number | undefined][] = [['Свободно', undefined], ['1:1', 1], ['4:3', 4 / 3], ['16:9', 16 / 9]]

/** Рамка на 90% картинки по центру — с пропорцией или во всю картинку. */
function startCrop(image: HTMLImageElement, aspect?: number): Crop {
  if (!aspect) return { unit: '%', x: 5, y: 5, width: 90, height: 90 }
  return centerCrop(makeAspectCrop({ unit: '%', width: 90 }, aspect, image.width, image.height), image.width, image.height)
}

/**
 * Обрезка: картинка целиком в окне постоянного размера, рамку двигают и
 * тянут за углы — масштаб задаёт сама рамка. Режет canvas на клиенте и
 * загружает результат как новый файл.
 */
function CropDialog({ src, onClose, onDone }: { src: string; onClose: () => void; onDone: (blob: Blob) => void }) {
  const [aspect, setAspect] = useState(ASPECTS[2])
  const [crop, setCrop] = useState<Crop>()
  const [failed, setFailed] = useState(false)
  const image = useRef<HTMLImageElement>(null)

  const finish = () => {
    const node = image.current
    if (!node || !crop) return
    // Рамка хранится в процентах: пересчёт в пиксели исходника не зависит от
    // того, насколько картинка уменьшена в окне.
    const rect = {
      x: Math.round(crop.x / 100 * node.naturalWidth),
      y: Math.round(crop.y / 100 * node.naturalHeight),
      width: Math.max(1, Math.round(crop.width / 100 * node.naturalWidth)),
      height: Math.max(1, Math.round(crop.height / 100 * node.naturalHeight)),
    }
    try {
      const canvas = document.createElement('canvas')
      canvas.width = rect.width
      canvas.height = rect.height
      canvas.getContext('2d')?.drawImage(node, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height)
      canvas.toBlob(blob => { if (blob) onDone(blob); else setFailed(true) }, 'image/jpeg', 0.9)
    } catch {
      // Картинка с чужого домена без CORS «пачкает» canvas — вырезать нельзя.
      setFailed(true)
    }
  }

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="max-w-3xl space-y-4">
        <DialogTitle>Обрезка</DialogTitle>
        {/* Высота окна постоянная: смена пропорции меняет рамку, а не размер модалки. */}
        <div className="flex h-[56vh] items-center justify-center overflow-hidden rounded-control-lg bg-muted">
          <ReactCrop
            crop={crop}
            aspect={aspect[1]}
            keepSelection
            ruleOfThirds
            minWidth={32}
            minHeight={32}
            onChange={(_, percent) => setCrop(percent)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={image}
              src={src}
              alt=""
              crossOrigin="anonymous"
              draggable={false}
              onLoad={e => setCrop(startCrop(e.currentTarget, aspect[1]))}
              onError={() => setFailed(true)}
              className="block max-h-[56vh] max-w-full select-none"
            />
          </ReactCrop>
        </div>
        <div role="group" aria-label="Пропорция" className="flex flex-wrap justify-center gap-1.5">
          {ASPECTS.map(a => (
            <Button
              key={a[0]}
              type="button"
              size="sm"
              variant={aspect[0] === a[0] ? 'default' : 'outline'}
              onClick={() => { setAspect(a); if (image.current && a[1]) setCrop(startCrop(image.current, a[1])) }}
            >
              {a[0]}
            </Button>
          ))}
        </div>
        <p className="text-center text-caption text-muted-foreground">Двигайте рамку и тяните её за углы.</p>
        {failed && <p className="text-body-sm text-destructive">Эту картинку не получится обрезать — загрузите её файлом.</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Отмена</Button>
          <Button type="button" onClick={finish} disabled={!crop}>Готово</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
