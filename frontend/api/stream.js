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

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'ANHAD-Radio/5.0',
        'Icy-MetaData': '1',
        'Connection': 'keep-alive',
      },
      // Edge runtime supports streaming responses
    });

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
    return new Response('Stream fetch failed: ' + err.message, { status: 502 });
  }
}
