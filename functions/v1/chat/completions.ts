export interface Env {
  BLOCKRUN_WALLET_KEY: string;
  ALLOWED_ORIGINS?: string;

  // Optional: custom AI providers and models
  PROVIDERS_CONFIG?: string; // JSON: { [name]: { base_url, api_key_env } }
  MODELS_CONFIG?: string;    // JSON: Array<{ id, name, provider }>

  // Specific provider keys (referenced via api_key_env in PROVIDERS_CONFIG)
  OPENROUTER_API_KEY?: string;
  OPENAI_API_KEY?: string;

  // Optional: default model when request asks for auto routing.
  // Example: "deepseek/deepseek-chat"
  DEFAULT_MODEL?: string;
}

function getCorsHeaders(request: Request, env: Env): Headers {
  const headers = new Headers();
  const origin = request.headers.get('Origin');
  if (!origin) return headers;

  const allowed = (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

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

function parseProvidersConfig(env: Env): Record<string, any> {
  let config = env.PROVIDERS_CONFIG;
  if (!config) return {};

  config = config.trim();
  if ((config.startsWith("'") && config.endsWith("'")) || (config.startsWith('"') && config.endsWith('"'))) {
    config = config.slice(1, -1);
  }

  try {
    return JSON.parse(config);
  } catch {
    return {};
  }
}

function parseModelsConfig(env: Env): any[] {
  let config = env.MODELS_CONFIG;
  if (!config) return [];

  config = config.trim();
  if ((config.startsWith("'") && config.endsWith("'")) || (config.startsWith('"') && config.endsWith('"'))) {
    config = config.slice(1, -1);
  }

  try {
    const parsed = JSON.parse(config);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function findCustomModel(modelId: string, modelsConfig: any[]): any {
  return modelsConfig.find((m) => m.id === modelId) || null;
}


function extractTextFromMessages(messages: any): string {
  if (!Array.isArray(messages)) return '';

  let out = '';
  for (const m of messages) {
    const c = m?.content;
    if (typeof c === 'string') {
      out += c + '\n';
      continue;
    }

    // Support OpenAI-style content parts.
    if (Array.isArray(c)) {
      for (const part of c) {
        const t = part?.text;
        if (typeof t === 'string') out += t + '\n';
      }
    }
  }
  return out.trim();
}

function looksLikeCode(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes('```') ||
    t.includes('import ') ||
    t.includes('export ') ||
    t.includes('function ') ||
    t.includes('const ') ||
    t.includes('class ') ||
    t.includes('typescript') ||
    t.includes('react') ||
    t.includes('vite')
  );
}

function looksLikeHardReasoning(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes('prove') ||
    t.includes('theorem') ||
    t.includes('докажи') ||
    t.includes('теорем') ||
    t.includes('математ') ||
    t.includes('logic') ||
    t.includes('proof')
  );
}

function pickModel(payload: any, env: Env): { model: string; reason: string } {
  const requested = payload?.model;

  // If the caller already picked a concrete model, respect it.
  if (typeof requested === 'string' && requested.includes('/')) {
    return { model: requested, reason: 'explicit' };
  }

  const text = extractTextFromMessages(payload?.messages);
  const len = text.length;

  const defaultModel = env.DEFAULT_MODEL?.trim() || 'deepseek/deepseek-chat';

  if (looksLikeHardReasoning(text)) {
    return { model: 'deepseek/deepseek-reasoner', reason: 'reasoning' };
  }

  if (looksLikeCode(text)) {
    // Cheap and strong for general coding.
    return { model: 'deepseek/deepseek-chat', reason: 'coding' };
  }

  if (len <= 240) {
    // Free tier model for short/simple prompts.
    return { model: 'nvidia/gpt-oss-20b', reason: 'short' };
  }

  if (len >= 6000) {
    // Large context: use a cheap long-context model.
    return { model: 'google/gemini-2.5-flash-lite', reason: 'long-context' };
  }

  return { model: defaultModel, reason: 'default' };
}

export const onRequest = async (context: any) => {
  const { request, env } = context as { request: Request; env: Env };

  const cors = getCorsHeaders(request, env);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  if (request.method !== 'POST') {
    const headers = new Headers(cors);
    headers.set('Allow', 'POST, OPTIONS');
    return new Response('Method Not Allowed', { status: 405, headers });
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return new Response('Invalid JSON body', { status: 400, headers: cors });
  }

  const modelsConfig = parseModelsConfig(env);
  const providersConfig = parseProvidersConfig(env);
  const customModel = payload.model ? findCustomModel(payload.model, modelsConfig) : null;

  if (customModel) {
    const provider = providersConfig[customModel.provider];
    if (!provider) {
      return new Response(`Missing provider config for ${customModel.provider}`, { status: 500, headers: cors });
    }

    const apiKey = (env as any)[provider.api_key_env];
    if (!apiKey) {
      return new Response(`Missing API key for provider ${customModel.provider}`, { status: 500, headers: cors });
    }

    let baseUrl = provider.base_url;
    // Normalize base_url: ensure it includes /v1 if it looks like a root OpenAI/OpenRouter URL
    if (baseUrl.includes('api.openai.com') || baseUrl.includes('openrouter.ai')) {
      if (!baseUrl.includes('/v1')) {
        baseUrl = baseUrl.endsWith('/') ? `${baseUrl}v1` : `${baseUrl}/v1`;
      }
    }

    if (!baseUrl.endsWith('/chat/completions')) {
      baseUrl = baseUrl.endsWith('/') ? `${baseUrl}chat/completions` : `${baseUrl}/chat/completions`;
    }

    const upstream = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const headers = new Headers(upstream.headers);
    for (const [k, v] of cors.entries()) headers.set(k, v);
    headers.set('x-router-provider', customModel.provider);
    headers.set('x-router-model', payload.model);
    headers.set('x-router-reason', 'custom');

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  }

  // Fallback to Blockrun logic
  if (!env.BLOCKRUN_WALLET_KEY) {
    return new Response('Missing BLOCKRUN_WALLET_KEY', { status: 500, headers: cors });
  }

  const { model, reason } = pickModel(payload, env);
  payload.model = model;

  const upstream = await fetch('https://blockrun.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.BLOCKRUN_WALLET_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const headers = new Headers(upstream.headers);
  for (const [k, v] of cors.entries()) headers.set(k, v);
  headers.set('x-router-provider', 'blockrun');
  headers.set('x-router-model', model);
  headers.set('x-router-reason', reason);

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
};
