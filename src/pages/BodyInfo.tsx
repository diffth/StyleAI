import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { useSession } from '../context/SessionContext';
import { useI18n } from '../i18n/LocaleContext';
import type { Translatable } from '../i18n/translations';
import { validateField } from '../lib/validation';

export default function BodyInfo() {
  const navigate = useNavigate();
  const { session, setBody } = useSession();
  const { t } = useI18n();

  const [height, setHeight] = useState(session.height?.toString() ?? '');
  const [weight, setWeight] = useState(session.weight?.toString() ?? '');
  // 문장이 아니라 키를 들고 있어야 언어를 바꿨을 때 에러 문구도 같이 바뀝니다.
  const [errors, setErrors] = useState<{ height?: Translatable; weight?: Translatable }>({});

  function handleNext() {
    const heightError = validateField('height', height);
    const weightError = validateField('weight', weight);

    if (heightError || weightError) {
      setErrors({ height: heightError ?? undefined, weight: weightError ?? undefined });
      document.getElementById(heightError ? 'height' : 'weight')?.focus();
      return;
    }

    setBody(Number(height), Number(weight));
    navigate('/upload');
  }

  return (
    <div className="flex min-h-svh flex-col bg-surface font-body-md text-on-surface">
      <TopBar backTo="/" />

      <div className="h-1 w-full bg-surface-container-low">
        <div className="gold-line w-1/3" />
      </div>

      <main className="mx-auto flex w-full max-w-[1200px] flex-grow flex-col items-center px-margin-mobile pt-16 pb-32 md:pt-24 short:pt-8 short:pb-8">
        <div className="mb-12 w-full max-w-md text-left">
          <span className="mb-4 block font-label-md text-label-md uppercase tracking-widest text-on-tertiary-container">
            {t('bodyInfo.step')}
          </span>
          <h2 className="mb-2 whitespace-pre-line font-headline-lg-mobile text-headline-lg-mobile text-primary md:font-headline-lg md:text-headline-lg">
            {t('bodyInfo.title')}
          </h2>
          <p className="font-body-md text-on-surface-variant opacity-70">{t('bodyInfo.desc')}</p>
        </div>

        <div className="w-full max-w-md space-y-10">
          <Field
            id="height"
            label={t('bodyInfo.height.label')}
            unit="CM"
            placeholder="175"
            value={height}
            error={errors.height && t(errors.height.key, errors.height.params)}
            onChange={(v) => {
              setHeight(v);
              setErrors((e) => ({ ...e, height: undefined }));
            }}
          />
          <Field
            id="weight"
            label={t('bodyInfo.weight.label')}
            unit="KG"
            placeholder="70"
            value={weight}
            error={errors.weight && t(errors.weight.key, errors.weight.params)}
            onChange={(v) => {
              setWeight(v);
              setErrors((e) => ({ ...e, weight: undefined }));
            }}
          />
        </div>

        {/* 장식용 카드입니다. 고정 비율(aspect-16/9)을 주면 세로가 모자란 화면에서
            flex가 카드를 눌러 안쪽 문구가 테두리 밖으로 새어 나갔습니다.
            내용에 맞는 높이로 두고 shrink-0으로 눌리지 않게 고정합니다.
            폭이 넓어도 세로가 짧으면(1024×768 등) 이 카드가 입력 필드를 화면 밖으로 밀어내므로
            세로 여유가 확인된 화면에서만 내보냅니다. */}
        <div className="mt-auto hidden w-full max-w-md shrink-0 pt-16 roomy:block">
          <div className="flex items-center justify-center border border-outline-variant bg-surface-container-lowest p-8">
            <div className="text-center">
              <span
                className="material-symbols-outlined mb-4 text-4xl text-outline"
                aria-hidden="true"
              >
                straighten
              </span>
              <p className="font-label-md text-label-md italic text-secondary">
                {t('bodyInfo.quote')}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 세로가 좁은 화면에서는 고정을 풀어 문서 흐름에 둡니다. 그대로 두면 입력 필드를 덮습니다. */}
      <footer className="fixed bottom-0 left-0 z-40 w-full bg-surface/80 p-margin-mobile backdrop-blur-md short:static short:bg-surface">
        <div className="mx-auto max-w-md">
          <button
            type="button"
            onClick={handleNext}
            className="w-full bg-primary py-5 font-label-md text-label-md uppercase tracking-[0.2em] text-on-primary transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
          >
            {t('bodyInfo.next')}
          </button>
        </div>
      </footer>
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  unit: string;
  placeholder: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

function Field({ id, label, unit, placeholder, value, error, onChange }: FieldProps) {
  return (
    <div className="flex flex-col">
      <label
        htmlFor={id}
        className="mb-1 font-label-sm text-label-sm uppercase tracking-wider text-secondary"
      >
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="atelier-input w-full font-headline-md text-headline-md text-primary"
        />
        <span className="absolute right-0 font-label-md text-label-md text-outline">{unit}</span>
      </div>
      {error && <p className="mt-2 font-label-sm text-label-sm text-error">{error}</p>}
    </div>
  );
}
