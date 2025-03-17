import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

export const Logo = () => {
  return (
    <Link href="/">
      <Image src='/logo-transparent.png' className='dark:hidden dark:scale-0 dark:absolute' alt='logo' width={130} height={50} />
      <Image src='/logo-transparent-dark.png' className='hidden dark:block absolute scale-0 dark:scale-100 dark:relative' alt='logo' width={130} height={50} />
    </Link>
  )
}