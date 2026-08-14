import { NavLink } from 'react-router-dom';
import { useI18n } from '../i18n/LocaleContext';

/**
 * 원본 목업에는 아이콘 4개가 있었지만 검색·프로필은 구현된 화면이 없습니다.
 * 아무 데도 가지 않는 링크를 두는 대신 눌리지 않는 상태로 표시합니다.
 */
export default function BottomNav() {
  const { t } = useI18n();

  return (
    <nav className="fixed bottom-0 left-0 z-50 flex h-20 w-full items-center justify-around border-t border-outline-variant bg-surface px-margin-mobile">
      <NavLink
        to="/"
        aria-label={t('nav.home')}
        className={({ isActive }) =>
          `flex flex-col items-center justify-center transition-colors ${
            isActive ? 'text-primary' : 'text-secondary opacity-60 hover:text-primary'
          }`
        }
      >
        <span className="material-symbols-outlined">home</span>
      </NavLink>

      <span
        className="flex cursor-not-allowed flex-col items-center justify-center text-secondary opacity-25"
        title={t('nav.comingSoon')}
        aria-label={`${t('nav.search')} — ${t('nav.comingSoon')}`}
        aria-disabled="true"
      >
        <span className="material-symbols-outlined">search</span>
      </span>

      <NavLink
        to="/result"
        aria-label={t('nav.result')}
        className={({ isActive }) =>
          `flex flex-col items-center justify-center transition-all duration-200 ${
            isActive
              ? 'translate-y-[-2px] scale-110 text-primary'
              : 'text-secondary opacity-60 hover:text-primary'
          }`
        }
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
          checkroom
        </span>
      </NavLink>

      <span
        className="flex cursor-not-allowed flex-col items-center justify-center text-secondary opacity-25"
        title={t('nav.comingSoon')}
        aria-label={`${t('nav.profile')} — ${t('nav.comingSoon')}`}
        aria-disabled="true"
      >
        <span className="material-symbols-outlined">person</span>
      </span>
    </nav>
  );
}
