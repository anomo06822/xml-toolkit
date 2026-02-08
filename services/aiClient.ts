import { getGeminiToken } from './storage';

export type GeminiProvider = 'electron-backend' | 'direct-sdk';

export interface GeminiGenerateResult {
  provider: GeminiProvider;
  text: string;
}

interface GeminiGenerateRequest {
  model: string;
  contents: string;
}

const tryElectronBackend = async (request: GeminiGenerateRequest): Promise<GeminiGenerateResult | null> => {
  if (typeof window === 'undefined' || !window.electronAPI?.isElectron) {
    return null;
  }

  const response = await window.electronAPI.backend.generate(request);
  if (!response.ok) {
    const message = response.error || `Desktop backend request failed (${response.status ?? 'unknown'})`;
    throw new Error(message);
  }

  return {
    provider: 'electron-backend',
    text: response.text || ''
  };
};

const generateFromSdk = async (request: GeminiGenerateRequest): Promise<GeminiGenerateResult> => {
  const apiKey = getGeminiToken().trim();
  if (!apiKey) {
    throw new Error('Gemini token is missing. Please set it in Settings > AI, or configure VITE_GEMINI_API_KEY.');
  }

  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: request.model,
    contents: request.contents
  });

  return {
    provider: 'direct-sdk',
    text: response.text || ''
  };
};

export const generateGeminiContent = async (request: GeminiGenerateRequest): Promise<GeminiGenerateResult> => {
  try {
    const desktopResult = await tryElectronBackend(request);
    if (desktopResult) {
      return desktopResult;
    }
  } catch (error) {
    const tokenAvailable = getGeminiToken().trim().length > 0;
    if (!tokenAvailable) {
      throw error;
    }
  }

  return generateFromSdk(request);
};
