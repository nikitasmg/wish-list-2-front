'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { QrCode } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { useRef } from 'react'

/** QR-код ссылки-приглашения: распечатать в офисе или показать с экрана. */
export function InviteQr({ link, title }: { link: string; title: string }) {
  const box = useRef<HTMLDivElement>(null)

  const download = () => {
    const canvas = box.current?.querySelector('canvas')
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = 'santa-qr.png'
    a.click()
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full"><QrCode aria-hidden />QR-код для офиса</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>QR-код приглашения</DialogTitle>
          <DialogDescription>Наведите камеру телефона — откроется комната «{title}».</DialogDescription>
        </DialogHeader>
        <div ref={box} className="mx-auto rounded-card bg-white p-4">
          <QRCodeCanvas value={link} size={240} marginSize={2} title={`Приглашение в комнату «${title}»`} />
        </div>
        <Button onClick={download}>Скачать PNG</Button>
      </DialogContent>
    </Dialog>
  )
}
