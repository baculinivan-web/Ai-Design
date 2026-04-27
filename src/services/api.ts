import type { GenerateRequest, GenerateResponse, AppError } from '../types';

// Use a relative URL so it works on Cloudflare Pages (Functions) and locally.
const CLAWROUTER_URL = '/v1/chat/completions';
const MODELS_URL = '/v1/models';

export type ModelInfo = {
  id: string;
  name: string;
  provider: string;
};

export const FREE_MODELS = [
  { id: 'nvidia/gpt-oss-120b', name: 'GPT-OSS 120B' },
  { id: 'nvidia/gpt-oss-20b', name: 'GPT-OSS 20B' },
  { id: 'nvidia/deepseek-v3.2', name: 'DeepSeek V3.2' },
  { id: 'nvidia/qwen3-coder-480b', name: 'Qwen3 Coder 480B' },
  { id: 'nvidia/glm-4.7', name: 'GLM 4.7' },
  { id: 'nvidia/llama-4-maverick', name: 'Llama 4 Maverick' },
  { id: 'nvidia/qwen3-next-80b-a3b-thinking', name: 'Qwen3 Next 80B' },
  { id: 'nvidia/mistral-small-4-119b', name: 'Mistral Small 4 119B' },
] as const;

export type ModelId = string;

export async function fetchAvailableModels(): Promise<ModelInfo[]> {
  try {
    const response = await fetch(MODELS_URL);
    if (!response.ok) throw new Error('Failed to fetch models');
    const data = await response.json();
    return data.models || [];
  } catch (error) {
    console.error('Error fetching models:', error);
    // Fallback to FREE_MODELS if API fails
    return FREE_MODELS.map(m => ({ ...m, provider: 'blockrun' }));
  }
}

const SYSTEM_PROMPT = `You are a world-class graphic designer specializing in bold, eye-catching poster designs. Create stunning HTML/CSS designs that POP.

CRITICAL RULES:
1. Return ONLY valid HTML code - no markdown, no code blocks, no explanations, NO thinking text
2. Start with <!DOCTYPE html> and end with </html>
3. Include all CSS in a <style> tag inside <head>
4. NO JavaScript, NO external links, NO images from internet
5. Use BOLD colors, LARGE typography, and STRONG visual hierarchy
6. Make it 800px wide, suitable for printing
7. Use CSS shapes, gradients, and patterns to create visual interest
8. Be DRAMATIC and CREATIVE - avoid boring layouts
9. Use a .canvas container div with fixed dimensions
10. Make designs that would stop someone scrolling - high contrast, big impact

DESIGN PRINCIPLES:
- Use 2-3 bold colors maximum
- Typography should be HUGE and confident
- Create visual rhythm with spacing
- Use geometric shapes and patterns
- Add subtle textures with CSS gradients
- Make the main message IMPOSSIBLE to miss

EXAMPLE DESIGN:

User prompt: "create an invite for my garage sale. address - LA, Lite drive, home 3. time 11th of june 2026, 11am to 6pm. ratio - 1:1"

Generated HTML:
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Garage Sale Invite</title>
<style>
:root {--bg-color: #f4f1ea;--accent-color: #2c2c2c;--text-main: #3d3d3d;--border-style: 1.5px solid #2c2c2c;}
body {margin: 0;display: flex;justify-content: center;align-items: center;min-height: 100vh;background-color: #e0e0e0;font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;-webkit-font-smoothing: antialiased;}
.canvas {width: 800px;height: 800px;background-color: var(--bg-color);position: relative;box-shadow: 0 20px 50px rgba(0,0,0,0.15);overflow: hidden;display: flex;flex-direction: column;padding: 60px;box-sizing: border-box;color: var(--text-main);}
.canvas::before {content: '';position: absolute;top: 0; left: 0; right: 0; bottom: 0;background-image: radial-gradient(#d1ccc0 1px, transparent 1px);background-size: 30px 30px;opacity: 0.3;z-index: 0;}
.content {position: relative;z-index: 1;height: 100%;display: flex;flex-direction: column;justify-content: space-between;border: var(--border-style);padding: 40px;}
header {display: flex;justify-content: space-between;align-items: flex-start;}
.tag {background: var(--accent-color);color: white;padding: 8px 16px;font-size: 14px;font-weight: 700;letter-spacing: 2px;text-transform: uppercase;}
.year {font-size: 18px;font-weight: 300;letter-spacing: 4px;}
.main-title {margin: 40px 0;}
h1 {font-size: 110px;line-height: 0.85;margin: 0;text-transform: uppercase;font-weight: 900;letter-spacing: -4px;color: var(--accent-color);}
.subtitle {font-size: 24px;font-weight: 500;margin-top: 10px;letter-spacing: 1px;}
.info-grid {display: grid;grid-template-columns: 1fr 1fr;gap: 20px;margin-top: auto;}
.info-block {border-top: var(--border-style);padding-top: 15px;}
.label {font-size: 12px;text-transform: uppercase;letter-spacing: 2px;font-weight: 700;margin-bottom: 8px;display: block;}
.value {font-size: 22px;font-weight: 400;line-height: 1.4;}
.footer-note {margin-top: 30px;font-size: 14px;font-style: italic;opacity: 0.8;text-align: center;border-top: 1px solid rgba(0,0,0,0.1);padding-top: 20px;}
.circle-stamp {position: absolute;right: -20px;top: 50%;transform: translateY(-50%) rotate(15deg);width: 150px;height: 150px;border: 2px dashed var(--accent-color);border-radius: 50%;display: flex;justify-content: center;align-items: center;text-align: center;font-size: 14px;font-weight: 800;padding: 10px;opacity: 0.2;}
</style>
</head>
<body>
<div class="canvas">
<div class="content">
<header><div class="tag">Exclusive Entry</div><div class="year">20 / 26</div></header>
<div class="main-title"><h1>Garage<br>Sale.</h1><div class="subtitle">One day only. Everything must go.</div></div>
<div class="circle-stamp">VINTAGE / TECH<br>BOOKS / DECOR</div>
<div class="info-grid">
<div class="info-block"><span class="label">Date & Time</span><div class="value"><strong>June 11, 2026</strong><br>11:00 AM — 06:00 PM</div></div>
<div class="info-block"><span class="label">Location</span><div class="value">Lite Drive, Home 3<br>Los Angeles, CA</div></div>
</div>
<div class="footer-note">Furniture, electronics, and rare finds. Coffee and snacks will be served.</div>
</div>
</div>
</body>
</html>

Now create a BOLD, EYE-CATCHING HTML design for the user's request. Make it STUNNING.`;

export async function generateDesign(request: GenerateRequest, modelId: ModelId): Promise<GenerateResponse> {
  try {
    const response = await fetch(CLAWROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: request.prompt }
        ],
        temperature: 0.7,
        max_tokens: 8192,
      }),
    });

    if (!response.ok) {
      const error: AppError = {
        code: 'API_ERROR',
        message: `API error: ${response.status} ${response.statusText}`,
      };
      throw error;
    }

    const data = await response.json();
    console.log('API Response:', data);
    
    let html = data.choices?.[0]?.message?.content;

    if (!html) {
      const error: AppError = {
        code: 'API_ERROR',
        message: 'No content in response',
      };
      throw error;
    }

    // Remove markdown code blocks if present
    html = html.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Remove thinking tokens (for reasoning models like DeepSeek)
    html = html.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    html = html.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim();
    
    // Find the start of HTML - look for <!DOCTYPE (case insensitive)
    const doctypeIndex = html.toLowerCase().indexOf('<!doctype');
    if (doctypeIndex !== -1) {
      html = html.substring(doctypeIndex);
    }
    
    // Find the end of HTML
    const htmlEndIndex = html.toLowerCase().lastIndexOf('</html>');
    if (htmlEndIndex !== -1) {
      html = html.substring(0, htmlEndIndex + 7);
    }
    
    console.log('Generated HTML:', html.substring(0, 500));

    return { html };
  } catch (error) {
    if ((error as Error).message?.includes('fetch')) {
      const appError: AppError = {
        code: 'NETWORK_ERROR',
        message: 'Network error. Please check your connection.',
      };
      throw appError;
    }
    throw error;
  }
}
