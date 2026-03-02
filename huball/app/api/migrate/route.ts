import { NextRequest } from 'next/server';
import { runPipeline } from '@/src/pipeline';
import { sessionStore } from '@/lib/session-store';
import { randomUUID } from 'crypto';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const { url, themeName } = await request.json();

  try {
    new URL(url);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid URL' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  const sessionId = randomUUID();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const result = await runPipeline({
          url,
          themeName,
          onProgress: (progress) => {
            send('progress', progress);
          },
        });

        sessionStore.set(sessionId, {
          theme: result.theme,
          designSystem: result.designSystem,
          crawlResult: result.crawlResult,
          themeName: result.themeName,
          createdAt: Date.now(),
        });

        send('complete', {
          sessionId,
          themeName: result.themeName,
          designSystem: result.designSystem,
          components: result.components.map((c) => ({
            type: c.type,
            headings: c.headings,
          })),
          moduleCount: result.theme.modules.length,
          templateCount: result.theme.templates.length,
          moduleNames: result.theme.modules.map((m) => m.label),
          moduleDirNames: result.theme.modules.map((m) => m.dirName),
          templateNames: result.theme.templates.map((t) => t.filename),
        });
      } catch (err) {
        send('error', {
          message: err instanceof Error ? err.message : String(err),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
