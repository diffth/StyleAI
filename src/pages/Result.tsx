import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';
import { useSession } from '../context/SessionContext';
import { useI18n } from '../i18n/LocaleContext';
import type { TranslationKey } from '../i18n/translations';
import { analyze, AnalyzeError, generateItemImage } from '../lib/api';
import { toDataUrl } from '../lib/image';
import type { ItemImage, Recommendation } from '../types';

/** 서버가 만든 문구(text)와 클라이언트에서 번역할 키(key) 중 하나를 담습니다. */
interface Failure {
  key: TranslationKey | null;
  text: string | null;
}

export default function Result() {
  const { session, setResult, setItemImage } = useSession();
  const { height, weight, photo, result, resultLocale, itemImages } = session;
  const { locale, t } = useI18n();

  const [failure, setFailure] = useState<Failure | null>(null);
  const [loading, setLoading] = useState(false);
  const [imagesPending, setImagesPending] = useState(false);
  // StrictMode는 개발 중 이펙트를 두 번 실행합니다.
  // 20초짜리 유료 호출이 두 번 나가지 않도록, 어떤 언어로 호출을 시작했는지 기억합니다.
  const startedForRef = useRef<string | null>(null);
  const imagesStartedRef = useRef<string | null>(null);
  // 이미 만들어 둔 사진을 이펙트 의존성으로 넣으면 한 장 받을 때마다 루프가 다시 돕니다.
  // 최신 값은 ref로만 들여다봅니다.
  const imagesRef = useRef<Record<string, ItemImage>>(itemImages);
  imagesRef.current = itemImages;
  // 컨텍스트가 세션이 바뀔 때마다 새 함수를 주므로, 의존성에 넣으면
  // 사진을 한 장 받을 때마다 cleanup이 돌아 남은 루프가 중단됩니다.
  const setItemImageRef = useRef(setItemImage);
  setItemImageRef.current = setItemImage;

  const run = useCallback(async () => {
    if (height === null || weight === null || !photo) return;

    setLoading(true);
    setFailure(null);
    try {
      const data = await analyze({
        height,
        weight,
        base64: photo.base64,
        mimeType: photo.mimeType,
        locale
      });
      setResult(data, locale);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setFailure(
        err instanceof AnalyzeError
          ? { key: err.key, text: err.text }
          : { key: 'error.generic', text: null }
      );
    } finally {
      setLoading(false);
    }
  }, [height, weight, photo, setResult, locale]);

  // 결과는 모델이 한 언어로 써 내려간 글이라 화면에서 번역할 수 없습니다.
  // 언어를 바꾸면 그 언어로 다시 분석합니다.
  const stale = result !== null && resultLocale !== locale;

  useEffect(() => {
    if (result && !stale) return;
    if (startedForRef.current === locale) return;
    startedForRef.current = locale;
    void run();
  }, [result, stale, locale, run]);

  // 훅은 early return보다 위에 있어야 합니다. 아래쪽 분기에 두면 로딩 렌더와
  // 결과 렌더의 훅 개수가 달라져, 결과가 도착하는 순간 React가 렌더를 중단합니다.
  // 전체 코디를 맨 앞에 둡니다. 한 장만 본다면 그게 가장 쓸모 있는 그림입니다.
  // 크게 그리는 코디·대표만 1K로 받고, 오른쪽 목록 썸네일은 512면 충분합니다.
  const jobs = useMemo(() => {
    if (stale || !result) return [];
    const list: { prompt: string; kind: 'item' | 'outfit'; size: '1K' | '512' }[] = [];
    if (result.outfitPrompt) {
      list.push({ prompt: result.outfitPrompt, kind: 'outfit', size: '1K' });
    }
    result.recommendations.forEach((item, i) => {
      if (item.imagePrompt) {
        list.push({ prompt: item.imagePrompt, kind: 'item', size: i === 0 ? '1K' : '512' });
      }
    });
    return list;
  }, [result, stale]);
  const promptsKey = jobs.map((job) => job.prompt).join('|');

  useEffect(() => {
    if (!promptsKey) return;
    if (imagesStartedRef.current === promptsKey) return;
    imagesStartedRef.current = promptsKey;

    // 추천 개수만큼 이미지 호출이 나갑니다. 한꺼번에 던지면 쿼터에 그대로 부딪히므로
    // 하나씩 만들고, 도착하는 대로 화면에 채웁니다.
    const controller = new AbortController();
    setImagesPending(true);

    void (async () => {
      try {
        for (const { prompt, kind, size } of jobs) {
          if (controller.signal.aborted) return;
          // 앞 화면에서 이미 만들어 둔 사진은 다시 만들지 않습니다.
          if (imagesRef.current[prompt]) continue;

          const image = await generateItemImage(prompt, locale, controller.signal, { kind, size });
          if (image) setItemImageRef.current(prompt, image);
        }
      } catch {
        // 중단된 경우입니다. 개별 실패는 generateItemImage가 null로 흡수합니다.
      } finally {
        if (!controller.signal.aborted) setImagesPending(false);
      }
    })();

    return () => {
      controller.abort();
      // 중단된 실행은 완료로 치지 않습니다. 이걸 남겨두면 StrictMode의 두 번째 실행이
      // "이미 시작했다"고 판단해 그냥 빠져나가, 아무도 사진을 만들지 않습니다.
      if (imagesStartedRef.current === promptsKey) imagesStartedRef.current = null;
    };
    // jobs는 promptsKey와 같은 값에서 만들어지므로 키 하나만 보면 충분합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptsKey, locale]);

  const retry = () => {
    startedForRef.current = locale;
    void run();
  };

  if (height === null || weight === null || !photo) {
    return <Navigate to="/input" replace />;
  }
  if (loading) return <Loading />;
  if (failure) {
    return (
      <ErrorState
        message={failure.text ?? t(failure.key ?? 'error.generic')}
        onRetry={retry}
      />
    );
  }
  if (!result || stale) return <Loading />;

  const [featured, ...rest] = result.recommendations;
  // 아직 만드는 중이면 자리를 잡아 두고, 다 돌고도 못 받은 아이템은 사진 없이 보여줍니다.
  const imageOf = (item: Recommendation) => (item.imagePrompt ? itemImages[item.imagePrompt] : undefined);
  const showImageOf = (item: Recommendation) =>
    Boolean(item.imagePrompt) && (imageOf(item) !== undefined || imagesPending);

  const featuredImage = featured ? imageOf(featured) : undefined;
  const showFeaturedImage = featured ? showImageOf(featured) : false;

  const outfitImage = result.outfitPrompt ? itemImages[result.outfitPrompt] : undefined;
  const showOutfitImage = Boolean(result.outfitPrompt) && (outfitImage !== undefined || imagesPending);

  return (
    <div className="mb-24 overflow-x-hidden bg-surface font-body-md text-on-surface antialiased">
      <TopBar backTo="/upload" />

      <main className="mx-auto max-w-[1200px] px-margin-mobile py-12 md:px-margin-desktop">
        {/* 분석 결과 */}
        <section className="mb-16 md:mb-20">
          {/* DOM 순서가 곧 모바일 순서입니다. 분석 결과가 사진보다 먼저 와야
              첫 화면에서 바로 읽힙니다. 데스크톱은 2열이라 글 왼쪽 / 사진 오른쪽. */}
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12">
            <div>
              <span className="mb-4 block font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">
                {t('result.label')}
              </span>
              <h2 className="mb-6 font-headline-lg-mobile text-headline-lg-mobile leading-tight md:font-headline-lg md:text-headline-lg">
                {t('result.bodyType.lead')}
                <br />
                <span className="border-b-2 border-primary italic text-primary">
                  {result.bodyType}
                </span>
                {t('result.bodyType.tail')}
              </h2>
              <p className="mb-8 max-w-lg font-body-lg text-body-lg text-secondary">
                {result.summary}
              </p>
              <div className="editorial-line mb-8" />
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <span className="h-3 w-3 rounded-full bg-tertiary-fixed" />
                  <span className="font-label-md text-label-md">
                    {t('result.fit')}: {result.fitKeyword}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="h-3 w-3 rounded-full bg-secondary-fixed-dim" />
                  <span className="font-label-md text-label-md">
                    {t('result.mood')}: {result.moodKeyword}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative h-[340px] overflow-hidden bg-surface-container-low md:h-[600px]">
              <img
                src={toDataUrl(photo)}
                alt={t('result.photoAlt')}
                className="h-full w-full object-contain"
              />
              <div className="pointer-events-none absolute inset-0 m-6 border-[12px] border-surface/30" />
            </div>
          </div>
        </section>

        {/* 스타일 가이드 */}
        <section className="mb-16 border-y border-outline-variant bg-surface-container-low px-6 py-12 text-center md:mb-24 md:px-16 md:py-16">
          <h3 className="mb-4 font-headline-md text-headline-md italic">
            {t('result.styleGuide.title')}
          </h3>
          <p className="mx-auto max-w-2xl font-body-md text-body-md leading-relaxed text-on-surface-variant">
            {result.styleGuide}
          </p>
        </section>

        {/* 추천 스타일 */}
        <section className="mb-16 md:mb-24">
          <div className="mb-8 md:mb-12">
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg">
              {t('result.recommendations.title')}
            </h2>
            <div className="mt-4 h-1 w-12 bg-primary" />
          </div>

          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-12 md:gap-8">
            {/* 왼쪽 열을 따로 감싸야 대표 카드와 코디 이미지가 오른쪽 목록 높이에
                끌려 늘어나지 않고 각자 내용만큼만 차지합니다. */}
            <div className="flex flex-col gap-6 md:col-span-7 md:gap-8">
            {featured && (
              <article>
                <div
                  className={`grid grid-cols-1 border border-outline-variant bg-surface-container-lowest ${
                    showFeaturedImage ? 'sm:grid-cols-2' : ''
                  }`}
                >
                  {showFeaturedImage && (
                    <div className="relative aspect-[3/4] overflow-hidden bg-surface-container-low">
                      {featuredImage ? (
                        <img
                          src={toDataUrl(featuredImage)}
                          alt={t('result.item.imageAlt', { name: featured.name })}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full animate-pulse items-center justify-center px-4 text-center">
                          <span className="font-label-sm text-label-sm text-secondary">
                            {t('result.item.imagePending')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col justify-center p-6 md:p-8">
                    <span className="mb-6 inline-block self-start bg-primary px-3 py-1 font-label-sm text-label-sm tracking-tighter text-on-primary">
                      {t('result.featured.badge')}
                    </span>
                    <p className="mb-2 font-label-sm text-label-sm uppercase tracking-widest text-secondary">
                      {featured.category}
                    </p>
                    <h4 className="mb-4 font-headline-md text-headline-md leading-snug">
                      {featured.name}
                    </h4>
                    <p className="font-body-md text-body-md leading-relaxed text-on-surface-variant">
                      {featured.reason}
                    </p>
                    {/* 실제 판매 상품이 아니라 AI가 만든 참고 이미지임을 밝혀 둡니다. */}
                    {featuredImage && (
                      <p className="mt-6 font-label-sm text-label-sm text-outline">
                        {t('result.item.imageNote')}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            )}

              {showOutfitImage && (
                // 대표 카드와 같은 2열 구조로 맞춥니다. 폭 전체에 3:4를 채우면
                // 이미지 하나가 섹션 높이를 두 배로 늘려 오른쪽 목록과 어긋납니다.
                <figure className="grid grid-cols-1 border border-outline-variant bg-surface-container-lowest sm:grid-cols-2">
                  <div className="relative aspect-[3/4] overflow-hidden bg-surface-container-low">
                    {outfitImage ? (
                      <img
                        src={toDataUrl(outfitImage)}
                        alt={t('result.outfit.imageAlt')}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full animate-pulse items-center justify-center px-4 text-center">
                        <span className="font-label-sm text-label-sm text-secondary">
                          {t('result.outfit.imagePending')}
                        </span>
                      </div>
                    )}
                  </div>
                  <figcaption className="flex flex-col justify-center p-6 md:p-8">
                    <span className="mb-4 font-headline-md text-headline-md italic">
                      {t('result.outfit.label')}
                    </span>
                    <p className="font-body-md text-body-md leading-relaxed text-on-surface-variant">
                      {t('result.outfit.imageAlt')}
                    </p>
                    {outfitImage && (
                      <p className="mt-6 font-label-sm text-label-sm text-outline">
                        {t('result.item.imageNote')}
                      </p>
                    )}
                  </figcaption>
                </figure>
              )}
            </div>

            <div className="flex flex-col gap-6 md:col-span-5 md:gap-8">
              {rest.map((item, i) => (
                <RecommendationRow
                  key={`${item.category}-${i}`}
                  item={item}
                  image={imageOf(item)}
                  showImage={showImageOf(item)}
                />
              ))}
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

function RecommendationRow({
  item,
  image,
  showImage
}: {
  item: Recommendation;
  image: ItemImage | undefined;
  showImage: boolean;
}) {
  const { t } = useI18n();

  return (
    <article className="flex gap-4 border-b border-outline-variant pb-6">
      {showImage && (
        // 목록은 폭이 좁아 대표 카드처럼 크게 넣으면 글이 밀립니다.
        // 고정 폭 썸네일로 두고 비율만 맞춥니다.
        <div className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden bg-surface-container-low sm:w-24">
          {image ? (
            <img
              src={toDataUrl(image)}
              alt={t('result.item.imageAlt', { name: item.name })}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full animate-pulse bg-surface-container" />
          )}
        </div>
      )}

      <div className="flex flex-col">
        <p className="mb-1 font-label-sm text-label-sm uppercase tracking-widest text-secondary">
          {item.category}
        </p>
        <h5 className="mb-2 font-body-lg text-body-lg font-bold">{item.name}</h5>
        <p className="font-body-md text-body-md text-on-surface-variant">{item.reason}</p>
      </div>
    </article>
  );
}
