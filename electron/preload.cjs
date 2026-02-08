const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  backend: {
    health: () => ipcRenderer.invoke('backend:health'),
    generate: (payload) => ipcRenderer.invoke('backend:generate', payload)
  },
  desktop: {
    getSettings: () => ipcRenderer.invoke('desktop:getSettings'),
    setWakeupShortcut: (accelerator) => ipcRenderer.invoke('desktop:setWakeupShortcut', accelerator),
    wakeup: () => ipcRenderer.invoke('desktop:wakeup'),
    getUpdaterState: () => ipcRenderer.invoke('desktop:getUpdaterState'),
    checkForUpdates: () => ipcRenderer.invoke('desktop:checkForUpdates'),
    downloadUpdate: () => ipcRenderer.invoke('desktop:downloadUpdate'),
    quitAndInstall: () => ipcRenderer.invoke('desktop:quitAndInstall'),
    onUpdaterEvent: (handler) => {
      const listener = (_event, payload) => handler(payload);
      ipcRenderer.on('desktop:updaterEvent', listener);
      return () => ipcRenderer.removeListener('desktop:updaterEvent', listener);
    }
  },
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url)
});
