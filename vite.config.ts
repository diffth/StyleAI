import { defineConfig, loadEnv } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * 개발 서버에서 /api/* 를 서버리스 함수로 연결합니다.
 * 이게 없으면 `npm run dev`로는 분석 요청이 404가 나서
 * 로컬에서 전체 흐름을 돌려보려면 vercel CLI가 필요해집니다.
 * 배포 환경에서는 Vercel이 api/ 를 직접 처리하므로 이 플러그인은 빠집니다.
 */
function apiDevServer(): Plugin {
  return {
    name: 'stylelist:api-dev-server',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // api/ 아래 파일명을 그대로 경로로 씁니다 — Vercel이 배포 환경에서 하는 것과 같은 규칙입니다.
        const route = req.url?.match(/^\/api\/([a-z0-9-]+)(?:[/?]|$)/)?.[1];
        if (!route) return next();

        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const raw = Buffer.concat(chunks).toString('utf8');

        let body: unknown;
        if (raw) {
          try {
            body = JSON.parse(raw);
          } catch {
            body = raw;
          }
        }

        // Vercel의 res 인터페이스를 노드 기본 응답 객체 위에 얇게 흉내 냅니다.
        const shim = {
          status(code: number) {
            res.statusCode = code;
            return shim;
          },
          json(payload: unknown) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify(payload));
            return shim;
          },
          setHeader(key: string, value: string) {
            res.setHeader(key, value);
            return shim;
          }
        };

        try {
          const mod = await server.ssrLoadModule(`/api/${route}.ts`);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const handler = mod.default as (rq: any, rs: any) => Promise<unknown>;
          await handler({ method: req.method, body, headers: req.headers }, shim);
        } catch (err) {
          server.config.logger.error(`[api-dev] ${String(err)}`);
          if (!res.writableEnded) {
            const ko =
              typeof body === 'object' && body !== null
                ? (body as { locale?: unknown }).locale !== 'en'
                : true;
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(
              JSON.stringify({
                error: ko
                  ? '개발 서버에서 함수를 실행하지 못했습니다.'
                  : 'The dev server could not run the function.'
              })
            );
          }
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  // .env.local의 GEMINI_API_KEY를 개발 서버 프로세스에 넣어줍니다.
  // VITE_ 접두사가 없으므로 클라이언트 번들에는 절대 포함되지 않습니다.
  const env = loadEnv(mode, process.cwd(), '');
  if (env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;

  return {
    plugins: [react(), tailwindcss(), apiDevServer()]
  };
});
