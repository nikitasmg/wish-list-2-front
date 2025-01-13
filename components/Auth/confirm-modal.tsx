import { ModalBase } from '@/components/modal-base'
import * as React from 'react'

type Props = {
  children: React.ReactNode
};
export const ConfirmModal = ({children}: Props) => {
  return (
    <ModalBase title="Вы уверены, что хотите выйти?" trigger={children} description={""}>
      <div>123</div>
    </ModalBase>
  )
}