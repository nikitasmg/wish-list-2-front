'use client'

import { useApiGetPresentById } from '@/api/present'
import { useParams } from 'next/navigation'
import { CreateEditForm } from '../../components/create-edit-form'
import * as React from 'react'

export default function Page() {
  const {  presentId } = useParams()
  const { data } = useApiGetPresentById(presentId as string)
  const present = data?.data

  if (!present) {
    return null
  }
  return (
    <>
      <h2 className="text-4xl mb-5">Добавьте новый подарок</h2>
      <CreateEditForm edit present={present}/>
    </>
  )
}