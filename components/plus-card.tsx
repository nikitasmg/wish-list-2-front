import { useRouter } from 'next/navigation'
import * as React from 'react'

type Props = {
  link: string
};

export const PlusCard = ({ link }: Props) => {
  const navigate = useRouter()
  return (
    <div
      className="w-full h-[50px] mb-4 bg-accent flex justify-center items-center text-5xl text-primary rounded-full border-primary border cursor-pointer"
      onClick={() => navigate.push(link)}
    >
      +
    </div>
  )
}