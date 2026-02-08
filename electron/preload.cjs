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
    wakeup: () => ipcRenderer.invoke('desktop:wakeup')
  },
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url)
});
