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
  getSoundUrl: (filename) => ipcRenderer.invoke('get-sound-url', filename),
  deleteSound: (filename) => ipcRenderer.invoke('delete-sound', filename),
  
  
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  
  // Event listeners
  onStopAllSounds: (callback) => {
    const subscription = (event) => callback();
    ipcRenderer.on('stop-all-sounds', subscription);
    return () => ipcRenderer.removeListener('stop-all-sounds', subscription);
  },
  
  onSoundsChanged: (callback) => {
    const subscription = (event) => callback();
    ipcRenderer.on('sounds-changed', subscription);
    return () => ipcRenderer.removeListener('sounds-changed', subscription);
  }
});
