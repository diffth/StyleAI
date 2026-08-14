import type { Locale } from './i18n/translations';

/** 리사이즈까지 끝난 업로드 사진. base64는 data URL 접두사 없는 순수 값입니다. */
export interface Photo {
  base64: string;
  mimeType: string;
  width: number;
  height: number;
}

export interface Recommendation {
  category: string;
  name: string;
  reason: string;
  /** 이미지 생성에 쓰는 영문 묘사. 구버전 응답에는 없을 수 있어 선택 항목입니다. */
  imagePrompt?: string;
}

/** /api/item-image가 만들어 준 아이템 사진. base64는 data URL 접두사 없는 순수 값입니다. */
export interface ItemImage {
  base64: string;
  mimeType: string;
}

/** /api/analyze 응답. 서버의 JSON Schema와 1:1로 대응합니다. */
export interface StyleResult {
  bodyType: string;
  summary: string;
  fitKeyword: string;
  moodKeyword: string;
  styleGuide: string;
  /** 추천 아이템을 하나의 코디로 갖춰 입은 모습. 구버전 응답에는 없을 수 있습니다. */
  outfitPrompt?: string;
  recommendations: Recommendation[];
}

export interface AnalyzeRequest {
  height: number;
  weight: number;
  base64: string;
  mimeType: string;
  /** 모델이 결과를 어떤 언어로 쓸지, 그리고 서버 에러 문구를 어떤 언어로 돌려줄지 결정합니다. */
  locale: Locale;
}

export interface SessionState {
  height: number | null;
  weight: number | null;
  photo: Photo | null;
  result: StyleResult | null;
  /** result가 어떤 언어로 생성됐는지. 현재 언어와 다르면 결과 화면에서 다시 분석합니다. */
  resultLocale: Locale | null;
  /** 추천 아이템의 생성 사진. imagePrompt를 키로 씁니다. 결과가 바뀌면 함께 버립니다. */
  itemImages: Record<string, ItemImage>;
}

export type FieldName = 'height' | 'weight';
