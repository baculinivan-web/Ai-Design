export type Theme = 'dark' | 'light';

export interface DesignState {
  status: 'idle' | 'generating' | 'converting' | 'ready' | 'error';
  prompt: string;
  html: string | null;
  image: string | null;
  error: string | null;
}

export interface AppError {
  code: string;
  message: string;
}

export interface GenerateRequest {
  prompt: string;
  systemPrompt: string;
}

export interface GenerateResponse {
  html: string;
}
