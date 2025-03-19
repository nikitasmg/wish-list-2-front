import { z } from 'zod'

export const fileSchema = (edit?: boolean) => z.any()
  .refine(file => {
    if (edit) {
      return true
    }
    return !!file
  }, { message: 'Обложка обязательна' })
  .refine(file => {
    if (file) {
      return file instanceof File && file.size <= 2 * 1024 * 1024
    }
    return true
  }, {
    message: 'Файл должен быть менее 2MB',
  })