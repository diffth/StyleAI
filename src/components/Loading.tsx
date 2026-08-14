import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/LocaleContext';
import type { TranslationKey } from '../i18n/translations';

/**
 * 분석은 보통 15~25초 걸립니다. 그동안 화면이 멈춘 것처럼 보이면 안 되므로
 * 단계 문구를 바꿔가며 진행 중이라는 신호를 계속 줍니다.
 */
const STEP_KEYS: TranslationKey[] = [
  'loading.step.1',
  'loading.step.2',
  'loading.step.3',
  'loading.step.4',
  'loading.step.5'
];

const EXPECTED_MS = 25_000;

export default function Loading() {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();

    const tick = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      // 예상 시간을 넘겨도 100%로 채우지 않습니다 — 다 됐다고 거짓말하지 않기 위해서입니다.
      setProgress(Math.min(95, (elapsed / EXPECTED_MS) * 100));
      setStep(Math.min(STEP_KEYS.length - 1, Math.floor(elapsed / 5000)));
    }, 250);

    return () => clearInterval(tick);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-surface px-margin-mobile py-10">
      <span className="mb-8 font-label-md text-label-md uppercase tracking-[0.3em] text-on-tertiary-container">
        {t('loading.label')}
      </span>

      <h2 className="mb-6 whitespace-pre-line text-center font-headline-lg-mobile text-headline-lg-mobile leading-tight text-primary md:font-headline-lg md:text-headline-lg">
        {t('loading.title')}
      </h2>

      <p
        key={step}
        className="mb-10 h-6 font-body-md text-on-surface-variant opacity-70"
        aria-live="polite"
      >
        {t(STEP_KEYS[step])}
      </p>

      <div className="h-px w-full max-w-xs overflow-hidden bg-outline-variant">
        <div
          className="h-full bg-primary transition-[width] duration-300 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="mt-8 font-label-sm text-label-sm text-secondary">{t('loading.note')}</p>
    </div>
  );
}
