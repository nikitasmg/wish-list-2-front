'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React from 'react'

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function ContactBlockEditor({ data, onChange }: Props) {
  const name = (data.name as string) ?? ''
  const role = (data.role as string) ?? ''
  const phone = (data.phone as string) ?? ''
  const telegram = (data.telegram as string) ?? ''

  const set = (field: string, value: string) => onChange({ ...data, [field]: value })

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Имя</Label>
        <Input placeholder="Иван Иванов" value={name} onChange={(e) => set('name', e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Роль / описание</Label>
        <Input placeholder="Организатор" value={role} onChange={(e) => set('role', e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Телефон</Label>
        <Input placeholder="+7 999 123 45 67" value={phone} onChange={(e) => set('phone', e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Telegram</Label>
        <Input placeholder="@username" value={telegram} onChange={(e) => set('telegram', e.target.value)} />
      </div>
    </div>
  )
}
