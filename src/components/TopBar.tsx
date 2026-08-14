import { Link, useNavigate } from 'react-router-dom';
import LanguageToggle from './LanguageToggle';
import { useI18n } from '../i18n/LocaleContext';

interface TopBarProps {
  /** 지정하지 않으면 브라우저 히스토리 뒤로 갑니다. */
  backTo?: string;
  showBack?: boolean;
}

export default function TopBar({ backTo, showBack = true }: TopBarProps) {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface px-margin-mobile md:px-margin-desktop">
      {showBack ? (
        <button
          type="button"
          aria-label={t('nav.back')}
          onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
          className="flex items-center justify-center transition-opacity hover:opacity-80"
        >
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
      ) : (
        <span className="w-6" />
      )}

      <Link
        to="/"
        className="font-headline-md text-headline-md font-bold tracking-tight text-primary"
      >
        StyleAI
      </Link>

      <div className="flex items-center gap-3">
        <LanguageToggle />
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-outline-variant bg-surface-container">
          <span className="material-symbols-outlined text-secondary" aria-hidden="true">
            person
          </span>
        </div>
      </div>
    </header>
  );
}
