/**
 * ANHAD Gurbani Radio — Stream Proxy API
 * ──────────────────────────────────────
 * Proxies HTTP Icecast/SHOUTcast radio streams over HTTPS
 * so that the Vercel PWA (https) can play gurbanisewa.org streams (http).
 *
 * Usage: GET /api/stream?url=http://radio.gurbanisewa.org:8000/stream
 *
 * Deployed as a Vercel Edge Function (streaming support).
 */
export const config = { runtime: 'edge' };

const ALLOWED_HOSTS = [
  'radio.gurbanisewa.org',
  'sgpc.net',
  'live.sgpc.net',
  'play.sikhnet.com',
  'www.sikhnet.com',
];

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new Response('Missing ?url= parameter', { status: 400 });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
  } catch (e) {
    return new Response('Invalid URL', { status: 400 });
  }

  // Security: only allow whitelisted Gurbani radio hosts
  const isAllowed = ALLOWED_HOSTS.some(h => parsedUrl.hostname === h || parsedUrl.hostname.endsWith('.' + h));
  if (!isAllowed) {
    return new Response('Host not allowed: ' + parsedUrl.hostname, { status: 403 });
  }

  // Use AbortController with 8-second timeout to fail fast if stream is offline
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'ANHAD-Radio/5.0',
        'Icy-MetaData': '1',
        'Connection': 'keep-alive',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = upstream.headers.get('content-type') || 'audio/mpeg';
    const responseHeaders = new Headers({
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Cache-Control': 'no-cache, no-store',
      'Transfer-Encoding': 'chunked',
    });

    // Forward ICY metadata headers if present
    for (const [key, value] of upstream.headers.entries()) {
      if (key.toLowerCase().startsWith('icy-')) {
        responseHeaders.set(key, value);
      }
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return new Response('Stream timeout: upstream did not respond in 8s (stream may be offline)', { status: 504 });
    }
    return new Response('Stream fetch failed: ' + err.message, { status: 502 });
  }
}
