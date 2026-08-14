import { LOCALES } from '../i18n/translations';
import { useI18n } from '../i18n/LocaleContext';

const SHORT: Record<(typeof LOCALES)[number], string> = { ko: 'KO', en: 'EN' };

/**
 * 드롭다운을 쓸 만큼 언어가 많지 않습니다. KO / EN을 나란히 두고 현재 언어만 강조합니다.
 * 어느 쪽으로 바꿀 수 있는지가 한눈에 보여야 눌러볼 마음이 생깁니다.
 */
export default function LanguageToggle({ className = '' }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t('lang.switch')}
      className={`flex items-center gap-1 font-label-sm text-label-sm tracking-widest ${className}`}
    >
      {LOCALES.map((code, i) => (
        <span key={code} className="flex items-center gap-1">
          {i > 0 && <span className="text-outline-variant">/</span>}
          <button
            type="button"
            lang={code}
            aria-pressed={locale === code}
            aria-label={t(code === 'ko' ? 'lang.ko' : 'lang.en')}
            onClick={() => setLocale(code)}
            className={`px-1 py-1 transition-opacity hover:opacity-70 ${
              locale === code ? 'font-bold text-primary underline underline-offset-4' : 'text-secondary opacity-60'
            }`}
          >
            {SHORT[code]}
          </button>
        </span>
      ))}
    </div>
  );
}
