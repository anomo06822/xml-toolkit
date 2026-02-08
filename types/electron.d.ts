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
  }

  interface ElectronShortcutResult {
    ok: boolean;
    accelerator?: string;
    error?: string;
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
        setWakeupShortcut: (accelerator: string) => Promise<ElectronShortcutResult>;
        wakeup: () => Promise<{ ok: boolean }>;
      };
      openExternal: (url: string) => Promise<void>;
    };
  }
}
