import { useRouter } from 'next/navigation'
import * as React from 'react'

type Props = {
  link: string
};

export const PlusCard = ({ link }: Props) => {
  const navigate = useRouter()
  return (
    <div
      className="w-full md:w-[250px] h-[300] bg-accent flex justify-center items-center text-5xl text-primary rounded-2xl border-primary border cursor-pointer"
      onClick={() => navigate.push(link)}
    >
      +
    </div>
  )
}