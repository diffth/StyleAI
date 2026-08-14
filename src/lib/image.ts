import type { Photo } from '../types';
import type { TranslationKey } from '../i18n/translations';

// Gemini는 이미지를 768px 타일로 쪼개 타일당 과금합니다.
// 긴 변 1024px이면 실루엣 판독에는 충분하면서 타일 수를 2~3장으로 묶어둘 수 있습니다.
const MAX_EDGE = 1024;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const JPEG_QUALITY = 0.85;

/** 실패 시 화면에서 번역할 문구 키를 담아 던집니다. */
export class ImageError extends Error {
  constructor(readonly key: TranslationKey) {
    super(key);
    this.name = 'ImageError';
  }
}

/** 파일을 검증하고 긴 변 1024px JPEG으로 줄여 base64로 돌려줍니다. */
export function readImage(file: File): Promise<Photo> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new ImageError('image.notImage'));
    }
    if (file.size > MAX_FILE_BYTES) {
      return reject(new ImageError('image.tooLarge'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new ImageError('image.unreadable'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new ImageError('image.unopenable'));
      img.onload = () => {
        try {
          resolve(toResizedJpeg(img));
        } catch {
          reject(new ImageError('image.failed'));
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function toResizedJpeg(img: HTMLImageElement): Photo {
  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context unavailable');

  // 투명 PNG가 검게 변하지 않도록 흰 배경을 먼저 깝니다.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  return {
    base64: dataUrl.slice(dataUrl.indexOf(',') + 1),
    mimeType: 'image/jpeg',
    width,
    height
  };
}

/**
 * 저장된 base64 이미지를 <img src>에 넣을 수 있는 형태로 되돌립니다.
 * 업로드 사진(Photo)과 생성된 아이템 사진(ItemImage) 모두 같은 두 필드만 있으면 됩니다.
 */
export function toDataUrl(image: { base64: string; mimeType: string }): string {
  return `data:${image.mimeType};base64,${image.base64}`;
}
