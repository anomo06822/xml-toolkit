const { app, BrowserWindow, Menu, Tray, globalShortcut, ipcMain, nativeImage, shell } = require('electron');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const BACKEND_URL = process.env.ELECTRON_BACKEND_URL || 'http://127.0.0.1:5188';
const BACKEND_DEV_FLAG = process.env.ELECTRON_BACKEND_DEV === '1';
const BACKEND_DISABLED = process.env.ELECTRON_DISABLE_BACKEND === '1';
const DEFAULT_WAKEUP_SHORTCUT = process.env.ELECTRON_GLOBAL_SHORTCUT || 'CommandOrControl+Shift+Space';
const OPEN_DEVTOOLS = process.env.ELECTRON_OPEN_DEVTOOLS === '1';

let backendProcess = null;
let mainWindowRef = null;
let statusTray = null;
let wakeupShortcut = DEFAULT_WAKEUP_SHORTCUT;

const getIndexHtmlPath = () => path.join(app.getAppPath(), 'dist', 'index.html');

const getBackendExecutablePath = () => {
  const executableName = process.platform === 'win32' ? 'DataToolkit.Api.exe' : 'DataToolkit.Api';
  const platformFolder = process.platform === 'win32' ? 'win' : process.platform === 'darwin' ? 'mac' : 'linux';
  const executablePath = path.join(process.resourcesPath, 'backend', platformFolder, executableName);
  return fs.existsSync(executablePath) ? executablePath : null;
};

const getBackendRunning = () => Boolean(backendProcess && !backendProcess.killed);

const getTrayBackendStatus = () => {
  if (BACKEND_DISABLED) return 'disabled';
  return getBackendRunning() ? 'running' : 'stopped';
};

const getTrayIcon = () => {
  if (process.platform === 'darwin') {
    const icon = nativeImage.createFromNamedImage('NSStatusAvailable', []);
    icon.setTemplateImage(true);
    return icon;
  }
  return nativeImage.createEmpty();
};

const wakeupMainWindow = async () => {
  if (!mainWindowRef || mainWindowRef.isDestroyed()) {
    await createWindow();
    return;
  }

  if (mainWindowRef.isMinimized()) {
    mainWindowRef.restore();
  }
  mainWindowRef.show();
  mainWindowRef.focus();
};

const refreshTrayMenu = () => {
  if (!statusTray) {
    return;
  }

  const backendStatus = getTrayBackendStatus();
  const menu = Menu.buildFromTemplate([
    { label: 'DataToolkit', enabled: false },
    { type: 'separator' },
    { label: `Wakeup Shortcut: ${wakeupShortcut}`, enabled: false },
    { label: `Backend: ${backendStatus}`, enabled: false },
    { type: 'separator' },
    {
      label: 'Open',
      click: () => {
        void wakeupMainWindow();
      }
    },
    {
      label: 'Hide',
      click: () => {
        if (mainWindowRef && !mainWindowRef.isDestroyed()) {
          mainWindowRef.hide();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit()
    }
  ]);

  statusTray.setContextMenu(menu);
  statusTray.setToolTip('DataToolkit');
  if (process.platform === 'darwin') {
    statusTray.setTitle('DT');
  }
};

const createStatusTray = () => {
  if (statusTray || process.platform !== 'darwin') {
    return;
  }

  statusTray = new Tray(getTrayIcon());
  statusTray.on('double-click', () => {
    void wakeupMainWindow();
  });
  refreshTrayMenu();
};

const registerWakeupShortcut = (accelerator) => {
  const target = String(accelerator || '').trim();
  if (!target) {
    return { ok: false, error: 'Shortcut cannot be empty.' };
  }

  if (target === wakeupShortcut && globalShortcut.isRegistered(target)) {
    return { ok: true, accelerator: target };
  }

  let registered = false;
  try {
    registered = globalShortcut.register(target, () => {
      void wakeupMainWindow();
    });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Invalid accelerator format.'
    };
  }

  if (!registered) {
    return {
      ok: false,
      error: 'Shortcut already in use or unavailable on this system.'
    };
  }

  if (wakeupShortcut !== target && globalShortcut.isRegistered(wakeupShortcut)) {
    globalShortcut.unregister(wakeupShortcut);
  }

  wakeupShortcut = target;
  refreshTrayMenu();
  return { ok: true, accelerator: wakeupShortcut };
};

const startBackend = () => {
  if (BACKEND_DISABLED || backendProcess) {
    return;
  }

  if (!app.isPackaged) {
    if (!BACKEND_DEV_FLAG) {
      return;
    }

    const projectPath = path.join(app.getAppPath(), 'backend', 'DataToolkit.Api', 'DataToolkit.Api.csproj');
    backendProcess = spawn(
      'dotnet',
      ['run', '--project', projectPath, '--urls', BACKEND_URL],
      {
        cwd: app.getAppPath(),
        env: { ...process.env, ASPNETCORE_URLS: BACKEND_URL },
        stdio: 'inherit'
      }
    );
    refreshTrayMenu();
    return;
  }

  const executablePath = getBackendExecutablePath();
  if (!executablePath) {
    return;
  }

  backendProcess = spawn(executablePath, [], {
    env: { ...process.env, ASPNETCORE_URLS: BACKEND_URL },
    stdio: 'ignore'
  });
  refreshTrayMenu();
};

const stopBackend = () => {
  if (!backendProcess || backendProcess.killed) {
    return;
  }
  backendProcess.kill();
  backendProcess = null;
  refreshTrayMenu();
};

const createWindow = async () => {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 760,
    backgroundColor: '#0b1220',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  mainWindowRef = mainWindow;

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('did-fail-load', (_event, code, description, validatedURL) => {
    console.error('Renderer failed to load:', { code, description, validatedURL });
  });
  mainWindow.on('closed', () => {
    if (mainWindowRef === mainWindow) {
      mainWindowRef = null;
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    await mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
    return;
  }

  await mainWindow.loadFile(getIndexHtmlPath());
  if (OPEN_DEVTOOLS) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
};

const callBackend = async (route, body) => {
  const request = await fetch(`${BACKEND_URL}${route}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const contentType = request.headers.get('content-type') || '';
  const data = contentType.includes('json')
    ? await request.json()
    : { error: await request.text() };

  if (!request.ok) {
    return {
      ok: false,
      status: request.status,
      error: data.error || data.detail || 'Backend request failed'
    };
  }

  return {
    ok: true,
    status: request.status,
    ...data
  };
};

ipcMain.handle('backend:health', async () => {
  try {
    return await callBackend('/health');
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Backend unreachable'
    };
  }
});

ipcMain.handle('backend:generate', async (_event, payload) => {
  if (!payload || !payload.model || !payload.contents) {
    return { ok: false, error: 'model and contents are required' };
  }

  try {
    return await callBackend('/api/ai/generate', payload);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Backend unreachable'
    };
  }
});

ipcMain.handle('shell:openExternal', async (_event, targetUrl) => {
  if (typeof targetUrl === 'string' && targetUrl.startsWith('http')) {
    await shell.openExternal(targetUrl);
  }
});

ipcMain.handle('desktop:getSettings', async () => {
  return {
    wakeupShortcut,
    backendUrl: BACKEND_URL,
    backendRunning: getBackendRunning(),
    platform: process.platform
  };
});

ipcMain.handle('desktop:setWakeupShortcut', async (_event, accelerator) => {
  return registerWakeupShortcut(accelerator);
});

ipcMain.handle('desktop:wakeup', async () => {
  await wakeupMainWindow();
  return { ok: true };
});

app.whenReady().then(async () => {
  createStatusTray();
  const shortcutResult = registerWakeupShortcut(wakeupShortcut);
  if (!shortcutResult.ok) {
    console.error('Failed to register wakeup shortcut:', shortcutResult.error);
  }

  startBackend();
  await createWindow();
  refreshTrayMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    } else {
      void wakeupMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  globalShortcut.unregisterAll();
  if (statusTray) {
    statusTray.destroy();
    statusTray = null;
  }
  stopBackend();
});
