// Minimal Server-Sent Events reader for a fetch() response body. EventSource
// can't POST, and Nura's chat endpoint takes the conversation as a POST body.

export interface SseEvent {
  event: string;
  data: string;
}

function parseBlock(block: string): SseEvent | null {
  let event = 'message';
  const data: string[] = [];
  for (const line of block.split('\n')) {
    if (!line || line.startsWith(':')) continue; // blank or comment (keep-alive)
    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? '' : line.slice(colon + 1);
    if (value.startsWith(' ')) value = value.slice(1);
    if (field === 'event') event = value;
    else if (field === 'data') data.push(value);
  }
  return data.length ? { event, data: data.join('\n') } : null;
}

export async function* readSse(body: ReadableStream<Uint8Array>): AsyncGenerator<SseEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finished = false;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      // stream: true keeps a multi-byte character split across chunks intact.
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      // Normalise CRLF, but leave a trailing \r until we see whether \n follows.
      buffer = buffer.replace(/\r\n|\r(?!$)/g, '\n');

      let boundary = buffer.indexOf('\n\n');
      while (boundary !== -1) {
        const event = parseBlock(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
        if (event) yield event;
        boundary = buffer.indexOf('\n\n');
      }
      if (done) break;
    }
    finished = true;
    const last = parseBlock(buffer.replace(/\r/g, '\n'));
    if (last) yield last;
  } finally {
    // If the caller stopped early, cancel the body so the connection is released.
    if (finished) reader.releaseLock();
    else await reader.cancel().catch(() => undefined);
  }
}
