import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

export const Logo = () => {
  return (
    <Link href="/">
      <Image src='/logo.png' alt='logo' width={120} height={55} />
    </Link>
  )
}