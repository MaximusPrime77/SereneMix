const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getSounds: () => ipcRenderer.invoke('get-sounds'),
  saveSoundMetadata: (filename, data) => ipcRenderer.invoke('save-sound-metadata', filename, data),
  addSound: () => ipcRenderer.invoke('add-sound-dialog'),
  addCover: (soundFilename) => ipcRenderer.invoke('add-cover-dialog', soundFilename),
  openFolder: () => ipcRenderer.send('open-folder'),
  openExternal: (url) => ipcRenderer.send('open-external', url),
  getStartupSettings: () => ipcRenderer.invoke('get-startup-settings'),
  setStartupSettings: (openAtLogin) => ipcRenderer.invoke('set-startup-settings', openAtLogin),
  deleteSound: (filename) => ipcRenderer.invoke('delete-sound', filename),
  setLanguage: (lang) => ipcRenderer.send('set-language', lang),
  
  // Professional New IPCs
  toggleMiniMode: () => ipcRenderer.invoke('toggle-mini-mode'),
  exportMixes: (mixesData) => ipcRenderer.invoke('export-mixes-dialog', mixesData),
  importMixes: () => ipcRenderer.invoke('import-mixes-dialog'),
  
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  
  // Event listeners
  onStopAllSounds: (callback) => {
    const subscription = () => callback();
    ipcRenderer.on('stop-all-sounds', subscription);
    return () => ipcRenderer.removeListener('stop-all-sounds', subscription);
  },
  
  onSoundsChanged: (callback) => {
    const subscription = () => callback();
    ipcRenderer.on('sounds-changed', subscription);
    return () => ipcRenderer.removeListener('sounds-changed', subscription);
  },

  onWindowStateChanged: (callback) => {
    const subscription = (event, state) => callback(state);
    ipcRenderer.on('window-state-changed', subscription);
    return () => ipcRenderer.removeListener('window-state-changed', subscription);
  },

  onToggleGlobalPlay: (callback) => {
    const subscription = () => callback();
    ipcRenderer.on('toggle-global-play', subscription);
    return () => ipcRenderer.removeListener('toggle-global-play', subscription);
  },

  onMiniModeChanged: (callback) => {
    const subscription = (event, isMini) => callback(isMini);
    ipcRenderer.on('mini-mode-changed', subscription);
    return () => ipcRenderer.removeListener('mini-mode-changed', subscription);
  }
});
