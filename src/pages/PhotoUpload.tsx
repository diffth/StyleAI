import { useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { useSession } from '../context/SessionContext';
import { useI18n } from '../i18n/LocaleContext';
import type { TranslationKey } from '../i18n/translations';
import { ImageError, readImage, toDataUrl } from '../lib/image';

export default function PhotoUpload() {
  const navigate = useNavigate();
  const { session, setPhoto } = useSession();
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  // 1단계를 건너뛰고 들어온 경우 되돌려 보냅니다.
  if (session.height === null || session.weight === null) {
    return <Navigate to="/input" replace />;
  }

  async function accept(file: File) {
    setErrorKey(null);
    setBusy(true);
    try {
      setPhoto(await readImage(file));
    } catch (err) {
      setErrorKey(err instanceof ImageError ? err.key : 'image.failed');
    } finally {
      setBusy(false);
    }
  }

  const preview = session.photo ? toDataUrl(session.photo) : null;

  return (
    // 부모가 화면 높이를 잡고 main은 남는 높이를 채웁니다.
    // 예전에는 양쪽 모두 min-h-screen이라 TopBar 높이만큼 문서가 항상 넘쳐 스크롤이 생겼습니다.
    <div className="flex min-h-svh flex-col bg-surface font-body-md text-on-surface">
      <TopBar backTo="/input" />

      <main className="mx-auto flex w-full max-w-[1200px] flex-grow flex-col px-margin-mobile pt-8 pb-40 md:px-margin-desktop short:pb-8">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2">
            <span className="font-label-md text-label-md text-primary">
              {t('upload.step.current')}
            </span>
            <span className="text-secondary opacity-40">/</span>
            <span className="font-label-md text-label-md text-secondary">
              {t('upload.step.total')}
            </span>
          </div>
          <div className="relative h-[2px] w-full bg-outline-variant">
            <div className="absolute top-0 left-0 h-full w-2/3 bg-primary transition-all duration-700 ease-in-out" />
          </div>
        </div>

        <section className="mb-10">
          <h2 className="mb-3 font-headline-lg-mobile text-headline-lg-mobile text-primary">
            {t('upload.title')}
          </h2>
          <p className="max-w-md font-body-md text-on-surface-variant">{t('upload.desc')}</p>
        </section>

        {/* 드롭존 크기를 여기서 한 번에 정합니다.
            h-0 + flex-grow로 높이를 "남은 공간"으로 확정해야 아래 드롭존의 max-h 퍼센트가 풀립니다.
            다만 그것만 두면 공간이 모자랄 때 영역이 짓눌려 드롭존이 위 문구를 덮으므로,
            min-h로 하한을 두어 그 아래로는 줄지 않고 페이지가 스크롤되게 합니다. */}
        <div className="flex h-0 min-h-[260px] flex-grow flex-col items-center justify-center gap-4">
          <div
            role="button"
            tabIndex={0}
            aria-label={t('upload.dropzone.idle')}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) void accept(file);
            }}
            // 예전에는 화면 높이에서 고정 영역을 뺀 값을 직접 계산해 넣었는데,
            // 그 숫자가 실제 레이아웃과 어긋나면 드롭존이 하단 바 뒤로 파묻혔습니다.
            // 이제는 부모가 남겨준 높이(max-h-full)에 맞추고, 아래 "다른 사진 고르기" 버튼 자리만 비워둡니다.
            className={`group relative flex aspect-[3/4] max-h-[calc(100%-3rem)] w-full max-w-md cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed transition-colors duration-300 ${
              dragging
                ? 'border-primary bg-surface-container-highest'
                : 'border-outline bg-surface-container-low hover:bg-surface-container'
            }`}
          >
            {preview ? (
              <img
                src={preview}
                alt={t('upload.previewAlt')}
                className="absolute inset-0 h-full w-full bg-surface-container-lowest object-contain"
              />
            ) : (
              <div className="relative z-10 flex flex-col items-center p-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-outline-variant bg-surface shadow-sm transition-transform duration-300 group-hover:scale-110">
                  <span
                    className="material-symbols-outlined text-3xl text-primary"
                    aria-hidden="true"
                  >
                    add_a_photo
                  </span>
                </div>
                <p className="mb-1 font-label-md text-label-md text-primary">
                  {busy ? t('upload.dropzone.busy') : t('upload.dropzone.idle')}
                </p>
                <p className="text-xs text-secondary">{t('upload.dropzone.formats')}</p>
              </div>
            )}

            {!preview && (
              <div className="absolute right-0 bottom-6 left-0 px-6">
                <div className="flex items-start gap-3 rounded border border-outline-variant bg-surface/80 p-3 backdrop-blur-sm">
                  <span className="material-symbols-outlined text-sm text-secondary" aria-hidden="true">
                    info
                  </span>
                  <p className="text-left text-[11px] leading-relaxed text-on-surface-variant">
                    {t('upload.guide')}
                  </p>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void accept(file);
                // 같은 파일을 다시 골라도 change가 발생하도록 초기화합니다.
                e.target.value = '';
              }}
            />
          </div>

          {preview && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 font-label-sm text-label-sm uppercase tracking-widest text-secondary underline underline-offset-4 transition-opacity hover:opacity-70"
            >
              {t('upload.change')}
            </button>
          )}
        </div>
      </main>

      {/* 세로가 좁은 화면에서는 고정을 풀어 문서 흐름에 둡니다. 그대로 두면 드롭존을 덮습니다. */}
      <div className="fixed bottom-0 left-0 z-40 flex w-full flex-col items-center gap-3 border-t border-outline-variant bg-surface/90 px-5 py-6 backdrop-blur-md short:static short:bg-surface">
        {errorKey && <p className="font-label-sm text-label-sm text-error">{t(errorKey)}</p>}
        <button
          type="button"
          disabled={!session.photo || busy}
          onClick={() => navigate('/result')}
          className="w-full max-w-md bg-primary py-4 font-label-md text-label-md uppercase tracking-widest text-on-primary transition-all duration-200 enabled:hover:opacity-90 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t('upload.submit')}
        </button>
      </div>
    </div>
  );
}
