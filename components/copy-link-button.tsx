import { toast } from '@/hooks/use-toast'
import React from 'react'

type Props = {
  url: string
}

const CopyLinkButton = ({ url }: Props) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast({
        title: 'Ссылка на вишлист скопирована',
      })
    } catch (error) {
      console.log(error)
      toast({
        variant: 'destructive',
        title: 'Не удалось скопировать ссылку. Попробуйте еще раз.',
      })
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center "
    >
      <span>Скопировать ссылку</span>
    </button>
  )
}

export default CopyLinkButton
