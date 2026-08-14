import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/LocaleContext';

interface ErrorStateProps {
  /** 이미 현재 언어로 번역된 문구입니다. */
  message: string;
  onRetry: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    // fixed라 내용이 넘치면 잘려서 버튼에 손이 닿지 않습니다. 짧은 화면을 위해 스크롤을 열어둡니다.
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-surface px-margin-mobile py-10 text-center">
      <span className="material-symbols-outlined mb-6 text-4xl text-error" aria-hidden="true">
        error
      </span>

      <h2 className="mb-4 font-headline-lg-mobile text-headline-lg-mobile text-primary">
        {t('error.title')}
      </h2>

      <p className="mb-10 max-w-md font-body-md text-on-surface-variant">{message}</p>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="w-full bg-primary py-4 font-label-md text-label-md uppercase tracking-widest text-on-primary transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
        >
          {t('error.retry')}
        </button>
        <button
          type="button"
          onClick={() => navigate('/upload')}
          className="w-full border border-outline-variant py-4 font-label-md text-label-md uppercase tracking-widest text-primary transition-colors duration-200 hover:bg-surface-container"
        >
          {t('error.repick')}
        </button>
      </div>
    </div>
  );
}
