'use client'
import { useEffect, useState } from 'react'
import { LockKeyhole } from 'lucide-react'
import { Button } from '@/components/ui/button'
export function SecretBlockView({ revealAt }: { revealAt: string }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => { setNow(Date.now()); const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer) }, [])
  const seconds = now === null ? null : Math.max(0, Math.floor((new Date(revealAt).getTime() - now) / 1000))
  return <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed bg-muted/30 p-8 text-center"><LockKeyhole className="text-primary" /><p className="font-semibold">Пока это секрет</p>{seconds === 0 ? <Button onClick={() => window.location.reload()}>Открыть сюрприз</Button> : <p className="text-sm text-muted-foreground">{seconds === null ? 'Откроется на празднике' : `${Math.floor(seconds / 86400)} дн. ${Math.floor(seconds / 3600) % 24} ч. ${Math.floor(seconds / 60) % 60} мин.`}</p>}</div>
}
