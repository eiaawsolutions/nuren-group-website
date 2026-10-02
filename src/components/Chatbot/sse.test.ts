import { describe, it, expect } from 'vitest';
import { readSse } from './sse';
import type { SseEvent } from './sse';

function streamOf(chunks: Array<string | Uint8Array>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(typeof chunk === 'string' ? encoder.encode(chunk) : chunk);
      controller.close();
    },
  });
}

async function collect(stream: ReadableStream<Uint8Array>): Promise<SseEvent[]> {
  const events: SseEvent[] = [];
  for await (const event of readSse(stream)) events.push(event);
  return events;
}

describe('readSse', () => {
  it('parses named events with JSON data', async () => {
    expect(await collect(streamOf(['event: delta\ndata: {"text":"Hi"}\n\n']))).toEqual([
      { event: 'delta', data: '{"text":"Hi"}' },
    ]);
  });

  it('reassembles events split across chunks', async () => {
    const events = await collect(streamOf(['event: del', 'ta\ndata: {"te', 'xt":"Hi"}\n', '\nevent: done\ndata: {}\n\n']));
    expect(events).toEqual([
      { event: 'delta', data: '{"text":"Hi"}' },
      { event: 'done', data: '{}' },
    ]);
  });

  it('keeps multi-byte characters intact when a chunk splits them', async () => {
    const bytes = new TextEncoder().encode('event: delta\ndata: {"text":"你好"}\n\n');
    const splitAt = bytes.indexOf(0xe4) + 1; // inside the first Chinese character
    const events = await collect(streamOf([bytes.slice(0, splitAt), bytes.slice(splitAt)]));
    expect(JSON.parse(events[0].data).text).toBe('你好');
  });

  it('joins multi-line data, ignores comments and defaults the event name', async () => {
    expect(await collect(streamOf([': keep-alive\ndata: a\ndata: b\n\n']))).toEqual([{ event: 'message', data: 'a\nb' }]);
  });

  it('accepts CRLF line endings', async () => {
    expect(await collect(streamOf(['event: done\r\ndata: {}\r\n\r\n']))).toEqual([{ event: 'done', data: '{}' }]);
  });

  it('delivers a final event even without a trailing blank line', async () => {
    expect(await collect(streamOf(['event: done\ndata: {}']))).toEqual([{ event: 'done', data: '{}' }]);
  });
});
