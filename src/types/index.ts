export type Theme = 'dark' | 'light';

export interface DesignItem {
  id: string;
  image: string;
  html: string;
  title: string;
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  designs: DesignItem[];
  createdAt: number;
  updatedAt: number;
}

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
