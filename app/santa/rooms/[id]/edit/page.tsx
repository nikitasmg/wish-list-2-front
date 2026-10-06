'use client'

import { useApiSantaRoom, useApiUpdateSantaRoom } from '@/api/santa'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { apiErrorMessage, isValidRoomId, roomToFormValues, toRoomInput } from '@/shared/santa'
import { santaHref } from '@/shared/santa-route'
import { isAxiosError } from 'axios'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { RoomForm } from '../../../components/room-form'

export default function EditSantaRoomPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data, isError, error, refetch } = useApiSantaRoom(id)
  const update = useApiUpdateSantaRoom(id)
  const room = data?.data.room

  const notFound = !isValidRoomId(id) || (isAxiosError(error) && error.response?.status === 404)
  if (notFound) return <p className="text-body text-muted-foreground">Комната не найдена.</p>
  if (isError) {
    return (
      <div className="space-y-4">
        <p className="text-body text-muted-foreground">Не удалось загрузить настройки</p>
        <Button variant="secondary" onClick={() => refetch()}>Повторить</Button>
      </div>
    )
  }
  if (!room) return <p className="text-body text-muted-foreground">Загружаем настройки…</p>

  return (
    <div className="space-y-8">
      <div>
        <Link href={santaHref(`/rooms/${id}`)} className="text-body-sm text-muted-foreground hover:text-foreground">← {room.title}</Link>
        <h1 className="mt-2 text-title-lg">Настройки комнаты</h1>
      </div>
      {room.status === 'drawn' ? (
        <p className="text-body text-muted-foreground">Жеребьёвка уже прошла — настройки больше не меняются.</p>
      ) : (
        <RoomForm
          defaultValues={roomToFormValues(room)}
          showOrganizer={false}
          submitLabel="Сохранить"
          pending={update.isPending}
          onSubmit={values => update.mutate(toRoomInput(values), {
            onSuccess: () => router.push(santaHref(`/rooms/${id}`)),
            onError: err => toast({ variant: 'destructive', title: apiErrorMessage(err) }),
          })}
        />
      )}
    </div>
  )
}
