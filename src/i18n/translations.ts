/**
 * 화면에 보이는 모든 문구를 한곳에 모읍니다.
 * 새 문구를 ko에 추가하면 en에도 넣어야 타입 검사를 통과합니다 — 번역 누락이 컴파일 에러로 잡힙니다.
 *
 * 줄바꿈은 \n으로 두고 렌더링 쪽에서 whitespace-pre-line으로 처리합니다.
 * 언어마다 끊어 읽는 위치가 다르기 때문에 <br />를 JSX에 박아두지 않습니다.
 */

export const LOCALES = ['ko', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

const ko = {
  // ---- 공통 ----
  'lang.switch': '언어 선택',
  'lang.ko': '한국어',
  'lang.en': 'English',

  'app.title': 'StyleAI | 당신만을 위한 AI 스타일리스트',

  'nav.home': 'Home',
  'nav.analysis': 'Analysis',
  'nav.back': '이전 단계로',
  'nav.profile': '프로필',
  'nav.search': '검색',
  'nav.result': '분석 결과',
  'nav.comingSoon': '준비 중입니다',

  // ---- 랜딩 ----
  'landing.hero.title': '당신만을 위한\nAI 스타일리스트',
  'landing.hero.subtitle': '데이터로 완성하는 가장 나다운 스타일',
  'landing.hero.cta': '시작하기',
  'landing.collection.label': 'Current Collection',
  'landing.collection.value': 'WINTER 24',

  'landing.method.label': 'The Methodology',
  'landing.method.title': '개인화된 패션 데이터\n알고리즘의 정점',
  'landing.method.desc':
    '당신의 체형과 선호도를 분석해 어울리는 실루엣을 제안합니다. 복잡한 선택의 과정은 생략하고, 오직 당신의 가치에 집중하세요.',
  'landing.method.cta': '분석 시작하기',

  'landing.feature.body.title': '체형 분석',
  'landing.feature.body.desc': '키·몸무게와 전신 사진에서 어깨와 골반의 비율을 읽어냅니다.',
  'landing.feature.silhouette.title': '실루엣 추천',
  'landing.feature.silhouette.desc': '장점을 살리는 핏과 무드를 이유와 함께 제안합니다.',
  'landing.feature.fitting.title': 'AI 피팅',
  'landing.feature.fitting.desc': '카테고리별 아이템을 정리해 바로 참고할 수 있게 보여줍니다.',

  // ---- 1단계: 신체 정보 ----
  'bodyInfo.step': 'Step 01 / 03',
  'bodyInfo.title': '당신의 신체 정보를\n입력해 주세요.',
  'bodyInfo.desc': 'AI가 당신의 체형에 가장 잘 어울리는 핏을 분석하기 위해 필요합니다.',
  'bodyInfo.height.label': '키 (cm)',
  'bodyInfo.weight.label': '몸무게 (kg)',
  'bodyInfo.quote': '"정확한 수치는 더 정교한 스타일 큐레이션의 시작입니다."',
  'bodyInfo.next': '다음으로',

  // ---- 2단계: 사진 업로드 ----
  'upload.step.current': 'STEP 02',
  'upload.step.total': '03',
  'upload.title': '전신 사진을 업로드해주세요',
  'upload.desc':
    '업로드하신 사진은 체형 분석을 위해 AI 서비스(Google Gemini)로 전송되며, 분석이 끝나면 서버에 저장되지 않습니다. 인공지능이 실루엣을 인식할 수 있도록 가이드를 확인해 주세요.',
  'upload.dropzone.idle': '사진 선택 또는 드래그',
  'upload.dropzone.busy': '사진을 처리하는 중...',
  'upload.dropzone.formats': 'JPG, PNG (최대 10MB)',
  'upload.guide':
    '밝은 곳에서 정면을 응시하고, 팔과 다리가 몸에서 살짝 떨어진 자세로 촬영된 사진이 가장 정확하게 분석됩니다.',
  'upload.previewAlt': '업로드한 사진 미리보기',
  'upload.change': '다른 사진 고르기',
  'upload.submit': '분석 시작하기',

  // ---- 3단계: 분석 중 ----
  'loading.label': 'Analyzing',
  'loading.title': 'AI가 당신의 체형을\n분석하고 있습니다',
  'loading.step.1': '사진에서 실루엣을 읽고 있습니다',
  'loading.step.2': '어깨와 골반의 비율을 계산하고 있습니다',
  'loading.step.3': '체형 유형을 판단하고 있습니다',
  'loading.step.4': '어울리는 실루엣을 고르고 있습니다',
  'loading.step.5': '추천 아이템을 정리하고 있습니다',
  'loading.note': '보통 20초 내외가 걸립니다',

  // ---- 결과 ----
  'result.label': 'Analysis Result',
  'result.bodyType.lead': '당신의 체형은',
  'result.bodyType.tail': ' 입니다.',
  'result.fit': 'FIT',
  'result.mood': 'MOOD',
  'result.photoAlt': '업로드한 전신 사진',
  'result.styleGuide.title': '"당신에게는 이런 핏이 잘 어울려요"',
  'result.recommendations.title': '추천 스타일',
  'result.featured.badge': 'ESSENTIAL LOOK',
  'result.item.imageAlt': '{name} 이미지',
  'result.item.imagePending': '아이템 이미지를 만들고 있습니다',
  'result.item.imageNote': 'AI가 만든 참고 이미지입니다',
  'result.outfit.label': '전체 코디',
  'result.outfit.imageAlt': '추천 아이템을 함께 갖춰 입은 전체 코디 이미지',
  'result.outfit.imagePending': '전체 코디 이미지를 만들고 있습니다',

  // ---- 오류 ----
  'error.title': '분석하지 못했습니다',
  'error.retry': '다시 시도',
  'error.repick': '사진 다시 고르기',
  'error.generic': '분석 중 문제가 발생했습니다. 다시 시도해 주세요.',
  'error.network': '네트워크에 연결하지 못했습니다. 연결 상태를 확인해 주세요.',
  'error.failed': '분석에 실패했습니다. 잠시 후 다시 시도해 주세요.',
  'error.malformed': '분석 결과를 이해하지 못했습니다. 다시 시도해 주세요.',

  // ---- 입력 검증 ----
  'validation.height.required': '키를 입력해 주세요.',
  'validation.weight.required': '몸무게를 입력해 주세요.',
  'validation.number': '숫자만 입력할 수 있습니다.',
  'validation.range': '{min} ~ {max} 사이로 입력해 주세요.',

  // ---- 이미지 처리 ----
  'image.notImage': '이미지 파일만 업로드할 수 있습니다.',
  'image.tooLarge': '10MB 이하의 사진을 올려주세요.',
  'image.unreadable': '사진을 읽지 못했습니다.',
  'image.unopenable': '사진을 열지 못했습니다. 다른 파일을 시도해 주세요.',
  'image.failed': '사진을 처리하지 못했습니다.'
} as const;

export type TranslationKey = keyof typeof ko;

const en: Record<TranslationKey, string> = {
  // ---- Common ----
  'lang.switch': 'Select language',
  'lang.ko': '한국어',
  'lang.en': 'English',

  'app.title': 'StyleAI | Your Personal AI Stylist',

  'nav.home': 'Home',
  'nav.analysis': 'Analysis',
  'nav.back': 'Go back',
  'nav.profile': 'Profile',
  'nav.search': 'Search',
  'nav.result': 'Analysis result',
  'nav.comingSoon': 'Coming soon',

  // ---- Landing ----
  'landing.hero.title': 'Your Personal\nAI Stylist',
  'landing.hero.subtitle': 'The most authentic you, shaped by data',
  'landing.hero.cta': 'Get Started',
  'landing.collection.label': 'Current Collection',
  'landing.collection.value': 'WINTER 24',

  'landing.method.label': 'The Methodology',
  'landing.method.title': 'Personalized fashion data,\nan algorithm perfected',
  'landing.method.desc':
    'We read your proportions and preferences, then propose the silhouettes that suit you. Skip the endless deliberation and focus on what matters — you.',
  'landing.method.cta': 'Start Analysis',

  'landing.feature.body.title': 'Body Analysis',
  'landing.feature.body.desc':
    'We read your shoulder-to-hip proportions from your height, weight, and full-body photo.',
  'landing.feature.silhouette.title': 'Silhouette Picks',
  'landing.feature.silhouette.desc':
    'We suggest the fits and moods that play to your strengths, and explain why.',
  'landing.feature.fitting.title': 'AI Fitting',
  'landing.feature.fitting.desc':
    'Items are organized by category so you can put them to use right away.',

  // ---- Step 1: Body info ----
  'bodyInfo.step': 'Step 01 / 03',
  'bodyInfo.title': 'Tell us about\nyour measurements.',
  'bodyInfo.desc': 'The AI needs these to find the fit that suits your body best.',
  'bodyInfo.height.label': 'Height (cm)',
  'bodyInfo.weight.label': 'Weight (kg)',
  'bodyInfo.quote': '"Accurate numbers are where a finer curation begins."',
  'bodyInfo.next': 'Continue',

  // ---- Step 2: Photo upload ----
  'upload.step.current': 'STEP 02',
  'upload.step.total': '03',
  'upload.title': 'Upload a full-body photo',
  'upload.desc':
    'Your photo is sent to an AI service (Google Gemini) for body-shape analysis and is not stored on our servers afterwards. Check the guidance below so the AI can read your silhouette clearly.',
  'upload.dropzone.idle': 'Choose a photo or drag it here',
  'upload.dropzone.busy': 'Processing your photo...',
  'upload.dropzone.formats': 'JPG, PNG (up to 10MB)',
  'upload.guide':
    'Photos taken in good light, facing forward, with arms and legs held slightly away from the body give the most accurate analysis.',
  'upload.previewAlt': 'Preview of the uploaded photo',
  'upload.change': 'Choose a different photo',
  'upload.submit': 'Start Analysis',

  // ---- Step 3: Analyzing ----
  'loading.label': 'Analyzing',
  'loading.title': 'The AI is analyzing\nyour body shape',
  'loading.step.1': 'Reading the silhouette in your photo',
  'loading.step.2': 'Measuring shoulder and hip proportions',
  'loading.step.3': 'Determining your body type',
  'loading.step.4': 'Selecting silhouettes that suit you',
  'loading.step.5': 'Putting your recommendations together',
  'loading.note': 'This usually takes about 20 seconds',

  // ---- Result ----
  'result.label': 'Analysis Result',
  'result.bodyType.lead': 'Your body type is',
  'result.bodyType.tail': '.',
  'result.fit': 'FIT',
  'result.mood': 'MOOD',
  'result.photoAlt': 'The full-body photo you uploaded',
  'result.styleGuide.title': '"These are the fits that suit you"',
  'result.recommendations.title': 'Recommended Styles',
  'result.featured.badge': 'ESSENTIAL LOOK',
  'result.item.imageAlt': 'Image of {name}',
  'result.item.imagePending': 'Creating the item image',
  'result.item.imageNote': 'An AI-generated reference image',
  'result.outfit.label': 'THE FULL LOOK',
  'result.outfit.imageAlt': 'The recommended items styled together as one full outfit',
  'result.outfit.imagePending': 'Creating the full outfit image',

  // ---- Errors ----
  'error.title': "We couldn't complete the analysis",
  'error.retry': 'Try Again',
  'error.repick': 'Choose Another Photo',
  'error.generic': 'Something went wrong during the analysis. Please try again.',
  'error.network': "We couldn't reach the network. Please check your connection.",
  'error.failed': 'The analysis failed. Please try again in a moment.',
  'error.malformed': "We couldn't read the analysis result. Please try again.",

  // ---- Validation ----
  'validation.height.required': 'Please enter your height.',
  'validation.weight.required': 'Please enter your weight.',
  'validation.number': 'Numbers only.',
  'validation.range': 'Please enter a value between {min} and {max}.',

  // ---- Image handling ----
  'image.notImage': 'Only image files can be uploaded.',
  'image.tooLarge': 'Please upload a photo of 10MB or less.',
  'image.unreadable': "We couldn't read that photo.",
  'image.unopenable': "We couldn't open that photo. Please try a different file.",
  'image.failed': "We couldn't process that photo."
};

export const translations: Record<Locale, Record<TranslationKey, string>> = { ko, en };

/** t()에 넘길 수 있는, 아직 번역되지 않은 문구. 키와 치환값을 함께 들고 다닙니다. */
export interface Translatable {
  key: TranslationKey;
  params?: Record<string, string | number>;
}

export function translate(
  locale: Locale,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  const template = translations[locale][key];
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match
  );
}
