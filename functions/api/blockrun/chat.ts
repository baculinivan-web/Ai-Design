export interface Env {
  // BlockRun uses a wallet key for x402 micropayments.
  // Set as a secret/environment variable in Cloudflare Pages.
  BLOCKRUN_WALLET_KEY: string;

  // Optional: comma-separated list of allowed Origins for browser requests.
  // Example: "https://your-site.pages.dev,https://your-domain.com"
  // If unset, requests are allowed from any origin (not recommended).
  ALLOWED_ORIGINS?: string;
}

function getCorsHeaders(request: Request, env: Env): Headers {
  const headers = new Headers();
  const origin = request.headers.get('Origin');

  if (!origin) return headers;

  const allowed = (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // If no allowlist is configured, allow any origin.
  // Better: set ALLOWED_ORIGINS to your site origins.
  const allowOrigin =
    allowed.length === 0 || allowed.includes('*') || allowed.includes(origin)
      ? origin
      : null;

  if (!allowOrigin) return headers;

  headers.set('Access-Control-Allow-Origin', allowOrigin);
  headers.set('Vary', 'Origin');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'content-type');
  headers.set('Access-Control-Max-Age', '86400');
  return headers;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const cors = getCorsHeaders(request, env);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  if (request.method !== 'POST') {
    const headers = new Headers(cors);
    headers.set('Allow', 'POST, OPTIONS');
    return new Response('Method Not Allowed', { status: 405, headers });
  }

  if (!env.BLOCKRUN_WALLET_KEY) {
    return new Response('Missing BLOCKRUN_WALLET_KEY', { status: 500 });
  }

  const upstream = await fetch('https://blockrun.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.BLOCKRUN_WALLET_KEY}`,
    },
    // Stream through without reading the body.
    body: request.body,
  });

  const headers = new Headers(upstream.headers);
  for (const [k, v] of cors.entries()) headers.set(k, v);

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
};
