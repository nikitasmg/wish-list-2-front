'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React, { useState } from 'react'

type Props = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

// Accepts: +7XXXXXXXXXX, 8XXXXXXXXXX, +7 (XXX) XXX-XX-XX, +7 XXX XXX XX XX, etc.
const PHONE_RE = /^(\+7|8)[\s\-()]?(\d[\s\-()]?){9,10}\d$/

function validatePhone(value: string): string | null {
  if (!value) return null
  return PHONE_RE.test(value.replace(/\s/g, '')) ? null : 'Введите корректный номер телефона'
}

export function ContactBlockEditor({ data, onChange }: Props) {
  const name = (data.name as string) ?? ''
  const role = (data.role as string) ?? ''
  const phone = (data.phone as string) ?? ''
  const telegram = (data.telegram as string) ?? ''

  const [phoneError, setPhoneError] = useState<string | null>(null)

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
        <Input
          placeholder="+7 999 123 45 67"
          value={phone}
          onChange={(e) => {
            set('phone', e.target.value)
            if (phoneError) setPhoneError(validatePhone(e.target.value))
          }}
          onBlur={(e) => setPhoneError(validatePhone(e.target.value))}
          className={phoneError ? 'border-destructive focus-visible:ring-destructive' : ''}
        />
        {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Telegram</Label>
        <Input placeholder="@username" value={telegram} onChange={(e) => set('telegram', e.target.value)} />
      </div>
    </div>
  )
}
