export type GeminiProvider = 'electron-backend' | 'http-backend';

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

const generateFromHttpBackend = async (request: GeminiGenerateRequest): Promise<GeminiGenerateResult> => {
  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('json')
    ? await response.json()
    : { error: await response.text() };

  if (!response.ok) {
    throw new Error(payload.error || payload.detail || `Backend request failed (${response.status})`);
  }

  return {
    provider: 'http-backend',
    text: payload.text || ''
  };
};

export const getGeminiSetupHint = (): string => {
  if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
    return 'Set the Gemini API key in Settings > AI and keep the desktop backend running.';
  }

  return 'Configure the backend Gemini API key in backend/DataToolkit.Api/appsettings.Local.json or via DATATOOLKIT_CONFIG_PATH, then make sure /api/ai/generate is reachable.';
};

export const generateGeminiContent = async (request: GeminiGenerateRequest): Promise<GeminiGenerateResult> => {
  const desktopResult = await tryElectronBackend(request);
  if (desktopResult) {
    return desktopResult;
  }

  return generateFromHttpBackend(request);
};
