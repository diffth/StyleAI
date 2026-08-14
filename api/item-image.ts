import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

// imagen-4.0-* 계열은 신규 사용자에게 더 이상 열리지 않아 404를 돌려줍니다.
// 이미지도 analyze.ts와 같은 Interactions API로 만듭니다.
const MODEL = 'gemini-3.1-flash-image';
// 코디 묘사는 아이템 여러 벌을 한 문장에 담아 아이템 하나보다 깁니다.
const MAX_PROMPT_LENGTH = 600;
type Locale = 'ko' | 'en';
/** 옷 한 벌만 찍을지, 갖춰 입은 코디 전체를 찍을지. */
type Kind = 'item' | 'outfit';
/** 목록 썸네일은 100px 아래로 그려집니다. 1K를 받아봐야 버리는 픽셀이고 저장 용량만 먹습니다. */
type Size = '1K' | '512';

function toKind(value: unknown): Kind {
  return value === 'outfit' ? 'outfit' : 'item';
}

function toSize(value: unknown): Size {
  return value === '512' ? '512' : '1K';
}

const MESSAGES = {
  ko: {
    methodNotAllowed: 'POST 요청만 지원합니다.',
    misconfigured: '서버 설정이 완료되지 않았습니다.',
    badRequest: '요청 형식이 올바르지 않습니다.',
    filtered: '이 아이템은 이미지를 만들지 못했습니다.',
    failed: '이미지를 만들지 못했습니다.',
    rateLimited: '요청이 많아 잠시 후 다시 시도해 주세요.'
  },
  en: {
    methodNotAllowed: 'Only POST requests are supported.',
    misconfigured: 'The server is not fully configured.',
    badRequest: 'The request format is invalid.',
    filtered: "We couldn't create an image for this item.",
    failed: "We couldn't create the image.",
    rateLimited: 'Too many requests right now. Please try again shortly.'
  }
} as const;

function toLocale(value: unknown): Locale {
  return value === 'en' || value === 'ko' ? value : 'ko';
}

function buildPrompt(item: string, kind: Kind): string {
  if (kind === 'outfit') {
    return [
      `Editorial fashion catalogue photograph of a complete styled outfit: ${item}.`,
      'The garments layered and styled together as one coordinated look on an invisible mannequin',
      'against a plain light grey studio backdrop.',
      'Soft even lighting, centred composition, the whole look from top to bottom in frame.',
      'No people, no faces, no text, no logos, no props.'
    ].join(' ');
  }

  return [
    `Editorial fashion catalogue photograph of ${item}.`,
    'The garment alone, presented on an invisible mannequin against a plain light grey studio backdrop.',
    'Soft even lighting, centred composition, full item in frame.',
    'No people, no faces, no text, no logos, no props.'
  ].join(' ');
}

export async function generateItemImage(
  item: string,
  kind: Kind = 'item',
  size: Size = '1K'
): Promise<string> {
  const client = new GoogleGenAI({});
  const interaction = await client.interactions.create({
    model: MODEL,
    input: buildPrompt(item, kind),
    response_format: {
      type: 'image',
      mime_type: 'image/jpeg',
      aspect_ratio: '3:4',
      image_size: size
    }
  });

  const bytes = interaction.output_image?.data;
  // 안전 필터에 걸리면 이미지 대신 거절 문구만 돌아옵니다.
  if (!bytes) throw new Error(interaction.output_text ? 'FILTERED' : 'EMPTY_OUTPUT');
  return bytes;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let locale: Locale = req.headers['accept-language']?.toLowerCase().startsWith('ko') ? 'ko' : 'en';

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: MESSAGES[locale].methodNotAllowed });
  }

  let body: unknown = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: MESSAGES[locale].badRequest });
    }
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: MESSAGES[locale].badRequest });
  }

  const input = body as Record<string, unknown>;
  if (input.locale !== undefined) locale = toLocale(input.locale);

  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY가 설정되지 않았습니다.');
    return res.status(500).json({ error: MESSAGES[locale].misconfigured });
  }

  const prompt = typeof input.prompt === 'string' ? input.prompt.trim() : '';
  if (!prompt || prompt.length > MAX_PROMPT_LENGTH) {
    return res.status(400).json({ error: MESSAGES[locale].badRequest });
  }

  try {
    const base64 = await generateItemImage(prompt, toKind(input.kind), toSize(input.size));
    return res.status(200).json({ base64, mimeType: 'image/jpeg' });
  } catch (err) {
    console.error('[item-image] 실패:', err);

    const m = MESSAGES[locale];
    const message = err instanceof Error ? err.message : '';
    if (message === 'FILTERED') return res.status(422).json({ error: m.filtered });
    if (message === 'EMPTY_OUTPUT') return res.status(502).json({ error: m.failed });

    const status =
      typeof (err as { status?: unknown })?.status === 'number'
        ? (err as { status: number }).status
        : null;

    if (status === 429) return res.status(429).json({ error: m.rateLimited });

    return res.status(500).json({ error: m.failed });
  }
}
