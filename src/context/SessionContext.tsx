import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { ItemImage, Photo, SessionState, StyleResult } from '../types';
import type { Locale } from '../i18n/translations';

const STORAGE_KEY = 'styleai.session';

const EMPTY: SessionState = {
  height: null,
  weight: null,
  photo: null,
  result: null,
  resultLocale: null,
  itemImages: {}
};

interface SessionContextValue {
  session: SessionState;
  setBody: (height: number, weight: number) => void;
  setPhoto: (photo: Photo) => void;
  setResult: (result: StyleResult, locale: Locale) => void;
  setItemImage: (prompt: string, image: ItemImage) => void;
  reset: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * URL이 4개라 새로고침이나 직접 진입이 가능합니다.
 * 그래서 상태는 React가 들고 있되 sessionStorage에도 같이 씁니다.
 */
function loadInitial(): SessionState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>(loadInitial);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // 저장 용량을 넘겨도 화면 동작에는 지장이 없으므로 무시합니다.
    }
  }, [session]);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      // 입력이 실제로 바뀐 경우에만 이전 분석 결과를 버립니다.
      // 그냥 되돌아왔다 나가는 것만으로 20초짜리 재분석이 돌면 곤란합니다.
      setBody: (height, weight) =>
        setSession((s) =>
          s.height === height && s.weight === weight
            ? s
            : { ...s, height, weight, result: null, resultLocale: null, itemImages: {} }
        ),
      setPhoto: (photo) =>
        setSession((s) =>
          s.photo?.base64 === photo.base64 ? s : { ...s, photo, result: null, resultLocale: null, itemImages: {} }
        ),
      setResult: (result, locale) => setSession((s) => ({ ...s, result, resultLocale: locale, itemImages: {} })),
      setItemImage: (prompt, image) =>
        setSession((s) => ({ ...s, itemImages: { ...s.itemImages, [prompt]: image } })),
      reset: () => setSession(EMPTY)
    }),
    [session]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession은 SessionProvider 안에서만 쓸 수 있습니다.');
  return ctx;
}
