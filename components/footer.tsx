import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

export const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground py-2">
      <div className="mx-auto flex items-center justify-between container px-4 text-center w-full">
        <div className="flex-col border-t border-secondary/20 text-xs md:text-xl">
          <p>Делаем мечты реальностью с 2025 года</p>
        </div>
        <div>
          <Image src="/logo-transparent.png" className="dark:hidden dark:scale-0 dark:absolute" alt="logo" width={180}
                 height={50} />
          <Image src="/logo-transparent-dark.png"
                 className="hidden dark:block absolute scale-0 dark:scale-100 dark:relative" alt="logo" width={180}
                 height={50} />
        </div>
        <Link className="underline text-xs md:text-lg" href="/">
          Пользовательское соглашение
        </Link>
      </div>
    </footer>
  )
}