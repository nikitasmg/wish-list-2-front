'use client'

import { useApiSantaJoin } from '@/api/santa'
import { useApiGetMyProfile } from '@/api/user'
import { toast } from '@/hooks/use-toast'
import { apiErrorMessage } from '@/shared/santa'
import { ProfileForm } from './profile-form'

export function JoinForm({ slug }: { slug: string }) {
  const { data: profile } = useApiGetMyProfile()
  const join = useApiSantaJoin(slug)
  const name = profile?.user?.displayName || profile?.user?.username || ''

  return (
    <section className="space-y-5 rounded-card border border-border bg-card p-6">
      <h2 className="text-title-sm">Вступить в комнату</h2>
      <ProfileForm
        key={name}
        defaultValues={{ name, wishes: '', wishlistUrl: '' }}
        submitLabel="Вступить"
        pending={join.isPending}
        onSubmit={values => join.mutate(values, {
          onError: err => toast({ variant: 'destructive', title: apiErrorMessage(err) }),
        })}
      />
    </section>
  )
}
