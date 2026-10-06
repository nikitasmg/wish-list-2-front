'use client'

import { useApiCreateSantaRoom } from '@/api/santa'
import { useApiGetMyProfile } from '@/api/user'
import { toast } from '@/hooks/use-toast'
import { EMPTY_ROOM_FORM, apiErrorMessage, toRoomInput } from '@/shared/santa'
import { santaHref } from '@/shared/santa-route'
import { useRouter } from 'next/navigation'
import { RoomForm } from '../../components/room-form'

export default function NewSantaRoomPage() {
  const router = useRouter()
  const create = useApiCreateSantaRoom()
  const { data: profile } = useApiGetMyProfile()
  const name = profile?.user?.displayName || profile?.user?.username || ''

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-title-lg">Новая комната</h1>
        <p className="mt-2 text-lead text-muted-foreground">Всё можно поменять до жеребьёвки.</p>
      </div>
      <RoomForm
        // Имя приходит после загрузки профиля — форма пересоздаётся с ним.
        key={name}
        defaultValues={{ ...EMPTY_ROOM_FORM, organizerName: name }}
        showOrganizer
        submitLabel="Создать и получить ссылку"
        pending={create.isPending}
        onSubmit={values => create.mutate(toRoomInput(values), {
          onSuccess: res => router.push(santaHref(`/rooms/${res.data.id}`)),
          onError: err => toast({ variant: 'destructive', title: apiErrorMessage(err) }),
        })}
      />
    </div>
  )
}
