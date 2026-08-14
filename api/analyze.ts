/**
 * POST /api/analyze
 *
 * 키·몸무게·전신 사진을 받아 Gemini로 체형을 분석하고 스타일 추천을 돌려줍니다.
 * API 키는 이 서버리스 함수 안에만 존재합니다 — 브라우저로 절대 내려가지 않습니다.
 *
 * 응답 모양은 src/types.ts 의 StyleResult 와 대응합니다. 서버리스 함수는 프론트와
 * 별도로 번들되므로, 빌드 결합을 만들지 않으려고 타입을 여기서 다시 선언합니다.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const MODEL = 'gemini-3.6-flash';

// 프론트에서 긴 변 1024px로 줄여 보내므로 실제로는 한참 아래입니다.
// 인라인 이미지는 요청 전체가 20MB 제한이라 여유를 두고 막습니다.
const MAX_BASE64_BYTES = 8 * 1024 * 1024;

const LIMITS = {
  height: { min: 50, max: 300 },
  weight: { min: 20, max: 300 }
} as const;

/** src/i18n/translations.ts 의 Locale과 같은 값입니다. 번들이 분리되어 있어 여기서 다시 선언합니다. */
type Locale = 'ko' | 'en';

const DEFAULT_LOCALE: Locale = 'ko';

function toLocale(value: unknown): Locale {
  return value === 'en' || value === 'ko' ? value : DEFAULT_LOCALE;
}

/** 사용자에게 그대로 보이는 문구. 요청에 실려 온 언어로 골라 보냅니다. */
const MESSAGES = {
  ko: {
    methodNotAllowed: 'POST 요청만 지원합니다.',
    misconfigured: '서버 설정이 완료되지 않았습니다.',
    badRequest: '요청 형식이 올바르지 않습니다.',
    emptyBody: '요청 본문이 비어 있습니다.',
    range: (name: string, min: number, max: number) =>
      `${name} 값이 올바르지 않습니다 (${min}~${max}).`,
    photoRequired: '사진이 필요합니다.',
    photoTooLarge: '사진 용량이 너무 큽니다.',
    photoBadType: '이미지 형식이 올바르지 않습니다.',
    noResult: '분석 결과를 받지 못했습니다. 다시 시도해 주세요.',
    rateLimited: '요청이 많아 잠시 후 다시 시도해 주세요.',
    upstreamRejected: '분석 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    upstreamUnreachable: '분석 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    failed: '분석 중 문제가 발생했습니다.'
  },
  en: {
    methodNotAllowed: 'Only POST requests are supported.',
    misconfigured: 'The server is not fully configured.',
    badRequest: 'The request format is invalid.',
    emptyBody: 'The request body is empty.',
    range: (name: string, min: number, max: number) =>
      `The ${name} value is out of range (${min}–${max}).`,
    photoRequired: 'A photo is required.',
    photoTooLarge: 'The photo is too large.',
    photoBadType: 'The image format is invalid.',
    noResult: "We couldn't get an analysis result. Please try again.",
    rateLimited: 'Too many requests right now. Please try again shortly.',
    upstreamRejected: "We couldn't process the analysis request. Please try again shortly.",
    upstreamUnreachable: "We couldn't reach the analysis service. Please try again shortly.",
    failed: 'Something went wrong during the analysis.'
  }
} as const;

interface AnalyzeInput {
  height: number;
  weight: number;
  base64: string;
  mimeType: string;
  /** 생략하면 한국어. 구버전 클라이언트가 보내지 않아도 동작해야 합니다. */
  locale?: Locale;
}

interface Recommendation {
  category: string;
  name: string;
  reason: string;
}

interface StyleResult {
  bodyType: string;
  summary: string;
  fitKeyword: string;
  moodKeyword: string;
  styleGuide: string;
  outfitPrompt: string;
  recommendations: Recommendation[];
}

/**
 * 모델이 반드시 이 모양으로만 답하도록 강제하는 스키마.
 * 예시와 언어 지시가 언어마다 달라야 해서 locale을 받아 만듭니다.
 */
function buildSchema(locale: Locale) {
  const ko = locale === 'ko';
  return {
    type: 'object',
    properties: {
      bodyType: {
        type: 'string',
        description: ko
          ? '체형 유형의 한글 명칭. 예: 모래시계형, 삼각형, 역삼각형, 직사각형, 타원형'
          : 'The body type name in English. e.g. Hourglass, Triangle, Inverted Triangle, Rectangle, Oval'
      },
      summary: {
        type: 'string',
        description: ko
          ? '체형의 특징과 장점을 설명하는 2~3문장. 존중하는 어조로 작성.'
          : "2-3 sentences in English describing the body type's characteristics and strengths, in a respectful tone."
      },
      fitKeyword: {
        type: 'string',
        description: '어울리는 핏을 나타내는 영문 키워드 2~3단어. 예: Structured & Defined'
      },
      moodKeyword: {
        type: 'string',
        description: '어울리는 무드를 나타내는 영문 키워드 2~3단어. 예: Elegant Editorial'
      },
      styleGuide: {
        type: 'string',
        description: ko
          ? '어떤 실루엣과 아이템이 왜 어울리는지 설명하는 3~4문장'
          : '3-4 sentences in English explaining which silhouettes and items suit this body type, and why'
      },
      // 아이템 이미지와 같은 이유로 영문입니다. 아래 recommendations와 같은 옷들을 가리켜야 합니다.
      outfitPrompt: {
        type: 'string',
        description:
          'A short English phrase describing the recommended items worn together as ONE complete coordinated outfit, for an image generator: the key garments with their colours and fabrics. No people, no brand names, no text. e.g. "charcoal wool blazer over an ivory silk blouse with high-waisted wide-leg trousers and a slim black leather belt"'
      },
      recommendations: {
        type: 'array',
        description: ko ? '추천 아이템 4~5개' : '4-5 recommended items',
        items: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'OUTER, TOP, BOTTOM, DRESS, ACCESSORY 중 하나 / one of these exact values'
            },
            name: {
              type: 'string',
              description: ko
                ? '아이템을 설명하는 일반 명칭. 예: 하이웨이스트 테일러드 트라우저'
                : 'A generic name describing the item, in English. e.g. High-waisted tailored trousers'
            },
            reason: {
              type: 'string',
              description: ko
                ? '이 체형에 어울리는 이유 1~2문장'
                : '1-2 sentences in English on why it suits this body type'
            },
            // 이미지 생성기는 영어를 가장 정확하게 알아듣습니다. 화면 언어와 무관하게 영문으로 받습니다.
            imagePrompt: {
              type: 'string',
              description:
                'A short English phrase describing ONLY this garment for an image generator: silhouette, fabric, and colour. No people, no brand names, no text. e.g. "high-waisted wide-leg wool trousers in charcoal grey"'
            }
          },
          required: ['category', 'name', 'reason', 'imagePrompt']
        }
      }
    },
    required: [
      'bodyType',
      'summary',
      'fitKeyword',
      'moodKeyword',
      'styleGuide',
      'outfitPrompt',
      'recommendations'
    ]
  };
}

const PROMPTS = {
  ko: (height: number, weight: number) =>
    [
      '당신은 체형 분석에 능한 전문 퍼스널 스타일리스트입니다.',
      `고객의 키는 ${height}cm, 몸무게는 ${weight}kg입니다.`,
      '첨부된 전신 사진에서 어깨·허리·골반의 상대적인 비율과 전체 실루엣을 관찰하고,',
      '수치 정보와 함께 종합해 체형 유형을 판단한 뒤 어울리는 스타일을 추천하세요.',
      '',
      '작성 지침:',
      '- 모든 텍스트는 한국어로 작성합니다. 단 fitKeyword와 moodKeyword는 영문입니다.',
      '- 고객을 존중하는 어조로 쓰고, 체형의 장점을 살리는 방향으로 제안합니다.',
      '- 외모를 평가하거나 체중 감량을 권하지 않습니다.',
      '- 실존하는 브랜드명, 상품명, 가격은 절대 지어내지 마세요. 일반적인 아이템 명칭만 사용합니다.',
      '- outfitPrompt에는 추천한 아이템들을 하나의 코디로 함께 갖춰 입은 모습을 영문으로 묘사합니다.',
      '- 사진에서 실루엣을 판단하기 어렵다면 키와 몸무게 정보를 근거로 분석하세요.'
    ].join('\n'),
  en: (height: number, weight: number) =>
    [
      'You are an expert personal stylist skilled at body-shape analysis.',
      `The client is ${height}cm tall and weighs ${weight}kg.`,
      'Observe the relative proportions of the shoulders, waist, and hips and the overall silhouette',
      'in the attached full-body photo, combine that with the measurements to determine the body type,',
      'and recommend styles that suit them.',
      '',
      'Writing guidelines:',
      '- Write every text field in English, including fitKeyword and moodKeyword.',
      "- Use a respectful tone and frame suggestions around the body type's strengths.",
      '- Do not judge appearance or suggest weight loss.',
      '- Never invent real brand names, product names, or prices. Use generic item names only.',
      '- In outfitPrompt, describe the recommended items worn together as one complete coordinated look.',
      '- If the silhouette is hard to read from the photo, base the analysis on height and weight.'
    ].join('\n')
} as const;

/** 입력을 검증합니다. 통과하면 null, 실패하면 요청 언어로 된 메시지를 돌려줍니다. */
function validate(body: Record<string, unknown>, locale: Locale): string | null {
  const m = MESSAGES[locale];

  for (const name of ['height', 'weight'] as const) {
    const value = Number(body[name]);
    const limit = LIMITS[name];
    if (!Number.isFinite(value) || value < limit.min || value > limit.max) {
      return m.range(name, limit.min, limit.max);
    }
  }
  const { base64, mimeType } = body;
  if (typeof base64 !== 'string' || !base64) return m.photoRequired;
  if (base64.length > MAX_BASE64_BYTES) return m.photoTooLarge;
  if (typeof mimeType !== 'string' || !mimeType.startsWith('image/')) {
    return m.photoBadType;
  }
  return null;
}

/**
 * 핵심 로직. 핸들러와 분리해 두어 HTTP 없이도 직접 테스트할 수 있습니다.
 */
export async function analyzeStyle({
  height,
  weight,
  base64,
  mimeType,
  locale = DEFAULT_LOCALE
}: AnalyzeInput): Promise<StyleResult> {
  const client = new GoogleGenAI({});

  const interaction = await client.interactions.create({
    model: MODEL,
    input: [
      { type: 'text', text: PROMPTS[locale](height, weight) },
      { type: 'image', data: base64, mime_type: mimeType }
    ],
    response_format: {
      type: 'text',
      mime_type: 'application/json',
      schema: buildSchema(locale)
    }
  });

  const raw = interaction.output_text;
  if (!raw) throw new Error('EMPTY_OUTPUT');

  try {
    return JSON.parse(raw) as StyleResult;
  } catch {
    throw new Error('MALFORMED_OUTPUT');
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 본문을 파싱하기 전에 실패할 수 있으므로, 일단 Accept-Language로 언어를 잡아둡니다.
  let locale: Locale = req.headers['accept-language']?.toLowerCase().startsWith('ko') ? 'ko' : 'en';

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: MESSAGES[locale].methodNotAllowed });
  }

  // 본문을 먼저 읽습니다. 사용자가 화면에서 고른 언어가 거기에 들어 있어서,
  // 아래 오류 문구들을 헤더 추정치가 아니라 실제로 보고 있는 언어로 낼 수 있습니다.
  // Vercel은 application/json을 자동 파싱하지만, 문자열로 오는 경우도 방어합니다.
  let body: unknown = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: MESSAGES[locale].badRequest });
    }
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: MESSAGES[locale].emptyBody });
  }

  const input = body as Record<string, unknown>;
  // 본문에 실린 값이 사용자가 화면에서 고른 언어라 헤더보다 정확합니다.
  // 없으면(구버전 클라이언트) 위에서 잡아둔 헤더 추정치를 그대로 씁니다.
  if (input.locale !== undefined) locale = toLocale(input.locale);

  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY가 설정되지 않았습니다.');
    return res.status(500).json({ error: MESSAGES[locale].misconfigured });
  }

  const invalid = validate(input, locale);
  if (invalid) return res.status(400).json({ error: invalid });

  try {
    const result = await analyzeStyle({
      height: Number(input.height),
      weight: Number(input.weight),
      base64: input.base64 as string,
      mimeType: input.mimeType as string,
      locale
    });
    return res.status(200).json(result);
  } catch (err) {
    // 원본 에러는 서버 로그에만 남기고, 사용자에게는 키·내부 정보가 새지 않는 문구만 보냅니다.
    console.error('[analyze] 실패:', err);

    const m = MESSAGES[locale];
    const message = err instanceof Error ? err.message : '';
    if (message === 'EMPTY_OUTPUT' || message === 'MALFORMED_OUTPUT') {
      return res.status(502).json({ error: m.noResult });
    }

    // SDK가 export하는 ApiError와 실제로 던져지는 APIError는 서로 다른 클래스라
    // instanceof로는 잡히지 않습니다. HTTP 상태 코드로 판별합니다.
    const status =
      typeof (err as { status?: unknown })?.status === 'number'
        ? (err as { status: number }).status
        : null;

    if (status === 429) {
      return res.status(429).json({ error: m.rateLimited });
    }

    // 400/401/403은 대부분 잘못된 API 키나 요청 구성 문제입니다.
    // 입력은 위에서 이미 검증했으므로 사진 탓으로 돌리지 않습니다
    // ("다른 사진으로 시도하세요"라고 안내하면 사용자는 영영 해결하지 못합니다).
    if (status === 400 || status === 401 || status === 403) {
      console.error(
        '[analyze] 상류 API가 요청을 거부했습니다. GEMINI_API_KEY가 유효한지 먼저 확인하세요.'
      );
      return res.status(500).json({ error: m.upstreamRejected });
    }

    if (status !== null) {
      return res.status(502).json({ error: m.upstreamUnreachable });
    }

    return res.status(500).json({ error: m.failed });
  }
}
