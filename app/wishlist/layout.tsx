import { Header } from '@/components/Header'
import * as React from 'react'

export default function Layout({
                                 children,
                               }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      {children}
    </>
  )
}
