import { Header } from '@/components/header'
import * as React from 'react'

export default function Layout({
                                 children,
                               }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <div className='p-5 max-w-[90rem] mx-auto'>
        {children}
      </div>
    </>
  )
}
