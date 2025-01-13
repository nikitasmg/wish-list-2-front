'use client'

import { CreateEditForm } from '../components/create-edit-form'
import * as React from 'react'

export default function Page() {
  return (
    <>
      <h2 className="text-4xl mb-5">Добавьте новый подарок</h2>
      <CreateEditForm />
    </>
  )
}