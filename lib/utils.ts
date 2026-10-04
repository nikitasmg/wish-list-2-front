import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Смысловые токены дизайн-системы (docs/design-system.md). Без этой
// настройки twMerge примет `text-body` за цвет и выкинет его рядом с
// `text-primary`.
const RADII = ['xs', 'tag', 'control', 'control-lg', 'card', 'sheet', 'block', 'block-sm']
const CONTROLS = ['control-sm', 'control', 'control-lg', 'control-xl']

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['micro', 'eyebrow', 'caption', 'label', 'body-sm', 'body', 'body-lg', 'lead', 'title-xs', 'title-sm', 'title', 'title-lg', 'display-sm', 'display-md', 'display', 'display-xl'] }],
      rounded: [{ rounded: RADII }],
      'rounded-t': [{ 'rounded-t': RADII }],
      'rounded-b': [{ 'rounded-b': RADII }],
      'rounded-l': [{ 'rounded-l': RADII }],
      'rounded-r': [{ 'rounded-r': RADII }],
      'rounded-tl': [{ 'rounded-tl': RADII }],
      'rounded-tr': [{ 'rounded-tr': RADII }],
      'rounded-bl': [{ 'rounded-bl': RADII }],
      'rounded-br': [{ 'rounded-br': RADII }],
      shadow: [{ shadow: ['float', 'overlay', 'ring', 'drop'] }],
      h: [{ h: CONTROLS }],
      w: [{ w: CONTROLS }],
      size: [{ size: CONTROLS }],
      duration: [{ duration: ['fast', 'base', 'slow'] }],
      ease: [{ ease: ['out-soft'] }],
    },
  },
})

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

// Russian pluralization: pick the correct form for a count.
// forms = [one, few, many], e.g. ['день', 'дня', 'дней'] → 1 день, 2 дня, 5 дней.
export function pluralizeRu(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
  return forms[2]
}

// Extract a short site label from a URL (e.g. "https://www.ozon.ru/x" → "ozon.ru").
// Returns null if the URL can't be parsed.
export function linkHostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
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


