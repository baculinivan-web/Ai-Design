import { Env } from './chat/completions';

const FREE_MODELS = [
  { id: 'nvidia/gpt-oss-120b', name: 'GPT-OSS 120B' },
  { id: 'nvidia/gpt-oss-20b', name: 'GPT-OSS 20B' },
  { id: 'nvidia/deepseek-v3.2', name: 'DeepSeek V3.2' },
  { id: 'nvidia/qwen3-coder-480b', name: 'Qwen3 Coder 480B' },
  { id: 'nvidia/glm-4.7', name: 'GLM 4.7' },
  { id: 'nvidia/llama-4-maverick', name: 'Llama 4 Maverick' },
  { id: 'nvidia/qwen3-next-80b-a3b-thinking', name: 'Qwen3 Next 80B' },
  { id: 'nvidia/mistral-small-4-119b', name: 'Mistral Small 4 119B' },
];

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
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'content-type');
  headers.set('Access-Control-Max-Age', '86400');
  return headers;
}

function parseModelsConfig(env: Env): any[] {
  let config = env.MODELS_CONFIG;
  if (!config) return [];
  
  // Remove accidental outer quotes if user copied them from examples
  config = config.trim();
  if ((config.startsWith("'") && config.endsWith("'")) || (config.startsWith('"') && config.endsWith('"'))) {
    config = config.slice(1, -1);
  }

  try {
    const parsed = JSON.parse(config);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export const onRequest = async (context: any) => {
  const { request, env } = context as { request: Request; env: Env };
  const cors = getCorsHeaders(request, env);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  if (request.method !== 'GET') {
    const headers = new Headers(cors);
    headers.set('Allow', 'GET, OPTIONS');
    return new Response('Method Not Allowed', { status: 405, headers });
  }

  const customModels = parseModelsConfig(env);
  const blockrunModels = env.BLOCKRUN_WALLET_KEY 
    ? FREE_MODELS.map(m => ({ ...m, provider: 'blockrun' }))
    : [];
  
  const allModels = [...blockrunModels, ...customModels];

  return new Response(JSON.stringify({ models: allModels }), {
    status: 200,
    headers: {
      ...Object.fromEntries(cors.entries()),
      'Content-Type': 'application/json',
    },
  });
};
