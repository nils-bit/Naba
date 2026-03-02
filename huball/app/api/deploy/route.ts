import { NextRequest } from 'next/server';
import { sessionStore } from '@/lib/session-store';
import { zipThemeFromMemory } from '@/lib/zip-from-memory';
import { HubSpotApiClient } from '@/src/deployer/api-client';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const { sessionId, token, portalId } = await request.json();

  if (!sessionId || !token || !portalId) {
    return new Response(JSON.stringify({ error: 'Missing sessionId, token, or portalId' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const session = sessionStore.get(sessionId);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Session expired or not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const client = new HubSpotApiClient(token, portalId);
        const { theme, themeName } = session;

        // ZIP theme from memory
        send('progress', { message: 'Creating theme ZIP...' });
        const zipBuffer = await zipThemeFromMemory(theme, themeName);

        // Upload ZIP
        const zipPath = `${themeName}.zip`;
        send('progress', { message: 'Uploading to HubSpot...' });
        await client.uploadZip(zipPath, zipBuffer);

        // Extract
        send('progress', { message: 'Extracting theme files...' });
        await client.extractZip(zipPath);

        // Poll for completion
        send('progress', { message: 'Waiting for extraction to complete...' });
        const checkPath = `${themeName}/theme.json`;
        const timeout = 300000;
        const start = Date.now();

        while (Date.now() - start < timeout) {
          try {
            await client.validateFile('draft', checkPath);
            break;
          } catch {
            await new Promise((resolve) => setTimeout(resolve, 3000));
          }
        }

        const designManagerUrl = `https://app.hubspot.com/design-manager/${portalId}`;

        send('complete', {
          designManagerUrl,
          themeName,
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
