export {};

declare global {
  interface ElectronBackendResponse {
    ok: boolean;
    status?: number;
    text?: string;
    error?: string;
  }

  interface ElectronBackendGenerateRequest {
    model: string;
    contents: string;
  }

  interface ElectronDesktopSettings {
    wakeupShortcut: string;
    backendUrl: string;
    backendRunning: boolean;
    platform: string;
    appVersion: string;
  }

  interface ElectronAiConfigState {
    configured: boolean;
    configPath: string;
    source: 'os-protected' | 'legacy-file' | 'none';
  }

  interface ElectronAiConfigMutationResult extends ElectronAiConfigState {
    ok: boolean;
    error?: string;
  }

  interface ElectronShortcutResult {
    ok: boolean;
    accelerator?: string;
    error?: string;
  }

  interface ElectronUpdaterState {
    status: string;
    message: string;
    progress: number;
    currentVersion: string;
    availableVersion: string | null;
  }

  interface ElectronUpdaterActionResult {
    ok: boolean;
    message?: string;
  }

  interface Window {
    electronAPI?: {
      isElectron: boolean;
      backend: {
        health: () => Promise<ElectronBackendResponse>;
        generate: (payload: ElectronBackendGenerateRequest) => Promise<ElectronBackendResponse>;
      };
      desktop: {
        getSettings: () => Promise<ElectronDesktopSettings>;
        getAiConfig: () => Promise<ElectronAiConfigState>;
        saveAiConfig: (payload: { geminiApiKey: string }) => Promise<ElectronAiConfigMutationResult>;
        clearAiConfig: () => Promise<ElectronAiConfigMutationResult>;
        setWakeupShortcut: (accelerator: string) => Promise<ElectronShortcutResult>;
        wakeup: () => Promise<{ ok: boolean }>;
        getUpdaterState: () => Promise<ElectronUpdaterState>;
        checkForUpdates: () => Promise<ElectronUpdaterActionResult>;
        downloadUpdate: () => Promise<ElectronUpdaterActionResult>;
        quitAndInstall: () => Promise<ElectronUpdaterActionResult>;
        onUpdaterEvent: (
          handler: (event: { type: string; payload: ElectronUpdaterState }) => void
        ) => () => void;
      };
      openExternal: (url: string) => Promise<void>;
    };
  }
}
