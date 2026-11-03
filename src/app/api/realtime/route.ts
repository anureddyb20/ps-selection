import { NextRequest } from 'next/server';
import { realtimeEmitter } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connect ping
      controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ connected: true, timestamp: Date.now() })}\n\n`));

      const onUpdate = (data: any) => {
        try {
          controller.enqueue(encoder.encode(`event: update\ndata: ${JSON.stringify(data)}\n\n`));
        } catch (err) {
          // Stream might be closed
          realtimeEmitter.off('portal-update', onUpdate);
        }
      };

      realtimeEmitter.on('portal-update', onUpdate);

      // Keepalive heartbeat every 20 seconds
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch (err) {
          clearInterval(heartbeatInterval);
          realtimeEmitter.off('portal-update', onUpdate);
        }
      }, 20000);

      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        realtimeEmitter.off('portal-update', onUpdate);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

