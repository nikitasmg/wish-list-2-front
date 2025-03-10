import { useApiGetMe } from '@/api/user'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { Wishlist } from '@/shared/types'
import { Copy, Share2 } from 'lucide-react'
import * as React from 'react'

type Props = {
  wishlist: Wishlist
}

export const ShareButtons = ({ wishlist }: Props) => {
  const { data } = useApiGetMe()

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: wishlist.title,
          url: `https://get-my-wishlist.ru/${data?.user?.id}/${wishlist.id}`,
        });
      } catch (error) {
        console.error('Ошибка при попытке поделиться:', error);
      }
    } else {
      console.error('API обмена не поддерживается на этом устройстве.');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`https://get-my-wishlist.ru/${data?.user?.id}/${wishlist.id}`)
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
    <div className="flex flex-col gap-5 md:flex-row mb-2">
      <Button size="lg" onClick={handleShare}>Поделиться <Share2 /></Button>
      <Button size="lg" variant='outline' onClick={handleCopy}>Скопировать ссылку <Copy /> </Button>
    </div>
  )
}