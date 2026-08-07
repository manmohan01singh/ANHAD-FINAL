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
  'radio.sikhnet.com',   // HTTPS proxy streams — no port restrictions
  'play.sikhnet.com',
  'www.sikhnet.com',
  'r2.dev',
  'pub-525228169e0c44e38a67c306ba1a458c.r2.dev',
  'pub-8bf31fc1f2a44451b40a3ded7e07fac2.r2.dev'
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

  // Use AbortController with 12-second timeout to fail fast if stream is offline
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const fetchHeaders = {
      'User-Agent': 'ANHAD-Radio/5.0',
      'Icy-MetaData': '0',
      'Connection': 'keep-alive',
    };
    if (req.headers.get('range')) {
      fetchHeaders['Range'] = req.headers.get('range');
    }

    const upstream = await fetch(targetUrl, {
      headers: fetchHeaders,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = upstream.headers.get('content-type') || 'audio/mpeg';
    const responseHeaders = new Headers({
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Range',
      'Cache-Control': 'no-cache, no-store',
      'Accept-Ranges': 'bytes',
    });

    if (upstream.headers.get('content-range')) {
      responseHeaders.set('Content-Range', upstream.headers.get('content-range'));
    }
    if (upstream.headers.get('content-length')) {
      responseHeaders.set('Content-Length', upstream.headers.get('content-length'));
    }

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
