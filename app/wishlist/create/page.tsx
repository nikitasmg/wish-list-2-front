'use client'
import { CreateForm } from '@/app/wishlist/components/create-form'

export default function Page() {
  return (
    <>
      <h2 className='text-4xl mb-5'>Создайте свой новый вишлист</h2>
      <CreateForm/>
    </>
  )
}