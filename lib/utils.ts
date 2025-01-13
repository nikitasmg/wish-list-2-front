import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type JwtPayload = {
  exp: number,
  id: string,
  username: string
}

export const parseJwt = (token: string): JwtPayload | null => {
  try {
    const payload = token.split('.')[1]; // Получаем вторую часть токена
    if (!payload) {
      throw new Error("Invalid token format");
    }
    const decodedPayload = JSON.parse(atob(payload)); // Декодируем из Base64
    return decodedPayload; // Возвращаем объект payload
  } catch (error) {
    console.error('Не удалось распарсить JWT:', error);
    return null; // В случае ошибки возвращаем null
  }
}

export async function createFileFromUrl(url: string, fileName: string): Promise<File> {
  try {
    // Загружаем данные из URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Ошибка загрузки файла: ${response.statusText}`);
    }

    // Получаем данные как Blob
    const blob = await response.blob();

    // Создаем файл из Blob
    return  new File([blob], fileName, { type: blob.type });
  } catch (error) {
    console.error('Ошибка при создании файла:', error);
    throw error; // Пробрасываем ошибку дальше
  }
}


