import type { AnalyzeRequest, ItemImage, StyleResult } from '../types';
import type { Locale, TranslationKey } from '../i18n/translations';

/**
 * 분석 실패를 화면으로 옮기는 에러.
 * 서버가 이미 사용자 언어로 만들어 보낸 문구는 text에, 클라이언트에서 만든 문구는 key에 담깁니다.
 */
export class AnalyzeError extends Error {
  constructor(
    readonly key: TranslationKey | null,
    readonly text: string | null = null
  ) {
    super(text ?? key ?? 'analyze failed');
    this.name = 'AnalyzeError';
  }
}


/**
 * 대표 추천 아이템의 사진을 만들어 옵니다.
 */
export interface ItemImageOptions {
  /** 옷 한 벌인지, 갖춰 입은 코디 전체인지. */
  kind?: 'item' | 'outfit';
  /** 화면에 작게 그리는 사진은 512로 받습니다. 기본은 1K. */
  size?: '1K' | '512';
}

export async function generateItemImage(
  prompt: string,
  locale: Locale,
  signal?: AbortSignal,
  { kind = 'item', size = '1K' }: ItemImageOptions = {}
): Promise<ItemImage | null> {
    try {
    const res = await fetch('/api/item-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, locale, kind, size }),
      signal
    });

    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      console.warn('[item-image] 실패:', res.status, data);
      return null;
    }

    if (
      !data ||
      typeof data !== 'object' ||
      typeof (data as ItemImage).base64 !== 'string' ||
      typeof (data as ItemImage).mimeType !== 'string'
    ) {
      return null;
    }

    return data as ItemImage;
    return null;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    console.warn('[item-image] 요청 실패:', err);
    return null;
  }
}

export async function analyze(body: AnalyzeRequest, signal?: AbortSignal): Promise<StyleResult> {
  let res: Response;
  try {
    res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal
    });
  } catch (err) {
    // 네트워크 단절이나 사용자의 중단 요청
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new AnalyzeError('error.network');
  }

  const data: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    // 서버는 요청에 실린 locale로 안내 문구를 만들어 보냅니다. 그대로 씁니다.
    const message =
      data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
        ? data.error
        : null;
    throw message ? new AnalyzeError(null, message) : new AnalyzeError('error.failed');
  }

  if (!isStyleResult(data)) {
    throw new AnalyzeError('error.malformed');
  }

  return data;
}

/** 서버 응답을 신뢰하지 않고 최소한의 모양은 직접 확인합니다. */
function isStyleResult(value: unknown): value is StyleResult {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.bodyType === 'string' &&
    typeof v.summary === 'string' &&
    typeof v.fitKeyword === 'string' &&
    typeof v.moodKeyword === 'string' &&
    typeof v.styleGuide === 'string' &&
    Array.isArray(v.recommendations)
  );
}
