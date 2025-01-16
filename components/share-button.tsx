import { cn } from '@/lib/utils'
import React from 'react'

type Props = {
  title: string
  url: string
  cover?: string
  className?: string
}

const ShareButton = ({ title, url, className, cover, children }: Props & React.PropsWithChildren) => {
  const handleShare = async () => {
    if (navigator.share) {
      // let file: File[] | undefined = undefined;
      // if (cover) {
      //   file = [await createFileFromUrl(cover, 'Обложка')];  // Дождитесь завершения
      // }
      try {
        await navigator.share({
          title: title,
          url: url,
          // files: file,
          // text: 'Тескст после ссылки',
        });
      } catch (error) {
        console.error('Ошибка при попытке поделиться:', error);
      }
    } else {
      console.error('API обмена не поддерживается на этом устройстве.');
    }
  };


  return (
    <button
      onClick={handleShare}
      className={cn('flex items-center justify-between rounded w-full', className)}
    >
      {children}
    </button>
  )
}

export default ShareButton
