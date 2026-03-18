'use client'

import Image from 'next/image'
import Link from 'next/link'

export const Logo = () => {
  return (
    <Link href="/">
      <Image
        src="/logo-dark.png"
        alt="Просто намекни"
        width={120}
        height={55}
        priority
        className="hidden dark:block"
      />
      <Image
        src="/logo-light.png"
        alt="Просто намекни"
        width={120}
        height={55}
        priority
        className="block dark:hidden"
      />
    </Link>
  )
}
