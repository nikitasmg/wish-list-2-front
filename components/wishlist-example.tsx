'use client'
import Image from 'next/image'
import * as React from 'react'

export const WishlistExample = () => {
  return (
    <div
      className="relative w-full md:w-[400px] h-[500px] bg-card text-card-foreground p-6 rounded-2xl shadow-2xl transform md:rotate-2 hover:rotate-0 transition-transform duration-300">
      <Image
        className="rounded-lg border dark:scale-0 dark:absolute"
        src="/screenshots/wishlist-example.png"
        alt="example"
        layout="fill"
        objectFit="contain" />
      <Image
        className="rounded-lg border absolute scale-0 dark:scale-100 dark:relative"
        src="/screenshots/wishlist-example-dark.png"
        alt="example"
        layout="fill"
        objectFit="contain" />
      <div
        className="absolute -bottom-6 right-0 md:-right-6 bg-chart-1 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
        <span className="text-xl">🎉</span>
        <span>Твой стиль!</span>
      </div>
    </div>
  )
}