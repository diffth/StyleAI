import { Link } from 'react-router-dom';
import LanguageToggle from '../components/LanguageToggle';
import { useI18n } from '../i18n/LocaleContext';
import type { TranslationKey } from '../i18n/translations';

/** 원래 자리에 있던 스톡 사진 대신, 실제로 하는 일을 설명하는 카드로 채웁니다. */
const FEATURES: { icon: string; title: TranslationKey; desc: TranslationKey }[] = [
  {
    icon: 'straighten',
    title: 'landing.feature.body.title',
    desc: 'landing.feature.body.desc'
  },
  {
    icon: 'checkroom',
    title: 'landing.feature.silhouette.title',
    desc: 'landing.feature.silhouette.desc'
  },
  {
    icon: 'auto_awesome',
    title: 'landing.feature.fitting.title',
    desc: 'landing.feature.fitting.desc'
  }
];

export default function Landing() {
  const { t } = useI18n();

  return (
    <div className="bg-background font-body-md text-on-surface">
      <header className="fixed top-0 left-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface px-margin-mobile md:px-margin-desktop">
        <div className="flex items-center gap-4">
          <h1 className="font-headline-md text-headline-md font-bold tracking-tight text-primary">
            StyleAI
          </h1>
        </div>
        <nav className="hidden gap-8 md:flex">
          <Link
            to="/"
            className="font-label-md text-label-md font-bold text-primary transition-opacity hover:opacity-80"
          >
            {t('nav.home')}
          </Link>
          <Link
            to="/input"
            className="font-label-md text-label-md text-secondary transition-opacity hover:opacity-80"
          >
            {t('nav.analysis')}
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-outline bg-outline-variant">
            <span className="material-symbols-outlined text-secondary" aria-hidden="true">
              person
            </span>
          </div>
        </div>
      </header>

      {/* Hero */}
      {/* h-screen(100vh)은 모바일 브라우저 UI 높이를 포함해 콘텐츠가 잘립니다. svh를 씁니다. */}
      <main className="relative flex min-h-svh w-full flex-col items-start justify-center overflow-hidden">
        {/* 채우기(cover)와 전체 보이기(contain)의 전환은 화면 종횡비에 달려 있어
            index.css의 .hero-photo / .hero-backdrop에서 함께 다룹니다. */}
        <div className="hero-backdrop absolute inset-0 z-0">
          <div className="hero-photo absolute inset-0" />
          <div className="hero-overlay absolute inset-0" />
        </div>

        <div className="relative z-10 mx-auto mt-16 w-full max-w-[1200px] px-margin-mobile md:px-margin-desktop">
          <div className="max-w-2xl space-y-6">
            <h2 className="whitespace-pre-line font-headline-lg-mobile text-headline-lg-mobile leading-tight text-white md:font-display-lg md:text-display-lg">
              {t('landing.hero.title')}
            </h2>
            <p className="font-body-lg text-body-lg text-white/90">{t('landing.hero.subtitle')}</p>
            <div className="pt-8">
              <Link
                to="/input"
                className="inline-block border border-white bg-white px-10 py-5 font-label-md text-label-md uppercase tracking-widest text-primary transition-all duration-200 hover:bg-opacity-90 active:scale-95"
              >
                {t('landing.hero.cta')}
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute right-margin-mobile bottom-12 z-10 hidden md:right-margin-desktop md:block">
          <div className="flex flex-col items-end space-y-4 border-r border-white/30 pr-6">
            <span className="font-label-sm text-label-sm uppercase tracking-tighter text-white/40">
              {t('landing.collection.label')}
            </span>
            <span className="font-headline-md text-headline-md tracking-widest text-white">
              {t('landing.collection.value')}
            </span>
          </div>
        </div>
      </main>

      {/* Methodology */}
      <section className="overflow-hidden bg-surface px-margin-mobile py-20 md:px-margin-desktop md:py-32">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-8 md:grid-cols-12">
          <div className="space-y-8 md:col-span-5">
            <span className="block font-label-md text-label-md uppercase tracking-widest text-on-tertiary-container">
              {t('landing.method.label')}
            </span>
            <h3 className="whitespace-pre-line font-headline-lg text-headline-lg leading-tight text-primary">
              {t('landing.method.title')}
            </h3>
            <p className="font-body-md text-body-md leading-relaxed text-secondary">
              {t('landing.method.desc')}
            </p>
            <div className="flex items-center gap-6 pt-4">
              <div className="h-px w-12 bg-primary" />
              <Link
                to="/input"
                className="font-label-md text-label-md uppercase tracking-widest text-primary transition-opacity hover:opacity-70"
              >
                {t('landing.method.cta')}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:col-span-7">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex flex-col border border-outline-variant bg-surface-container-lowest p-6"
              >
                <span
                  className="material-symbols-outlined mb-4 text-3xl text-primary"
                  aria-hidden="true"
                >
                  {f.icon}
                </span>
                <p className="mb-2 font-label-md text-label-md uppercase tracking-widest text-primary">
                  {t(f.title)}
                </p>
                <p className="font-body-md text-body-md leading-relaxed text-secondary">
                  {t(f.desc)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
