import type { FieldName } from '../types';
import type { Translatable } from '../i18n/translations';

export const LIMITS: Record<FieldName, { min: number; max: number; required: Translatable }> = {
  height: { min: 50, max: 300, required: { key: 'validation.height.required' } },
  weight: { min: 20, max: 300, required: { key: 'validation.weight.required' } }
};

/**
 * 통과하면 null, 실패하면 화면에서 번역할 키를 돌려줍니다.
 * 검증 시점과 렌더링 시점의 언어가 다를 수 있으므로 여기서 문장을 확정하지 않습니다.
 */
export function validateField(name: FieldName, raw: string): Translatable | null {
  const limit = LIMITS[name];
  const value = raw.trim();

  if (!value) return limit.required;

  const num = Number(value);
  if (!Number.isFinite(num)) return { key: 'validation.number' };
  if (num < limit.min || num > limit.max) {
    return { key: 'validation.range', params: { min: limit.min, max: limit.max } };
  }
  return null;
}
