const { app, BrowserWindow, Tray, Menu, ipcMain, dialog, shell, nativeImage, protocol, net, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

// Register custom protocol scheme before app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'media', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, bypassCSP: true } }
]);

let mainWindow;
let appTray;
let isMiniMode = false;
let normalBounds = null;

const isPackaged = app.isPackaged;
const EXE_DIR = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath);

function getSoundsDir() {
  const possiblePaths = [
    path.resolve(EXE_DIR, '..', 'PrimeMixSound'),
    path.resolve(EXE_DIR, '..', 'PrimeMix_Data'),
    path.resolve(__dirname, '..', 'PrimeMixSound'),
    path.resolve(__dirname, '..', 'PrimeMix_Data'),
    path.join(EXE_DIR, 'PrimeMix_Data'),
    path.join(EXE_DIR, 'PrimeMixSound')
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac'];
      try {
        const files = fs.readdirSync(p);
        if (files.some(f => audioExtensions.includes(path.extname(f).toLowerCase()))) {
          return p;
        }
      } catch (e) {}
    }
  }
  return path.resolve(EXE_DIR, '..', 'PrimeMixSound');
}

const SOUNDS_DIR = getSoundsDir();

const METADATA_PATH = path.join(SOUNDS_DIR, 'metadata.json');
const COVERS_DIR = path.join(SOUNDS_DIR, 'covers');

// Ensure directories exist
if (!fs.existsSync(SOUNDS_DIR)) {
  fs.mkdirSync(SOUNDS_DIR, { recursive: true });
}
if (!fs.existsSync(COVERS_DIR)) {
  fs.mkdirSync(COVERS_DIR, { recursive: true });
}

async function copyFolderAsync(from, to) {
  if (!fs.existsSync(to)) {
    await fs.promises.mkdir(to, { recursive: true });
  }
  const files = await fs.promises.readdir(from);
  for (const file of files) {
    const fromPath = path.join(from, file);
    const toPath = path.join(to, file);
    const stat = await fs.promises.stat(fromPath);
    if (stat.isDirectory()) {
      await copyFolderAsync(fromPath, toPath);
    } else {
      if (!fs.existsSync(toPath)) {
        await fs.promises.copyFile(fromPath, toPath);
      }
    }
  }
}

async function checkAndMigrateSounds() {
  try {
    if (!isPackaged) return;

    const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac'];
    let hasAudio = false;
    if (fs.existsSync(SOUNDS_DIR)) {
      const files = await fs.promises.readdir(SOUNDS_DIR);
      hasAudio = files.some(file => audioExtensions.includes(path.extname(file).toLowerCase()));
    }

    if (!hasAudio) {
      console.log('PrimeMix_Data is empty. Starting sound migration...');
      
      const tempExtraDir = path.join(path.dirname(process.execPath), 'PrimeMix_Data');
      const devDir = path.resolve(__dirname, '..', 'PrimeMixSound');
      
      let sourceDir = null;
      if (fs.existsSync(tempExtraDir)) {
        const tempFiles = await fs.promises.readdir(tempExtraDir);
        if (tempFiles.some(file => audioExtensions.includes(path.extname(file).toLowerCase()))) {
          sourceDir = tempExtraDir;
        }
      }
      
      if (!sourceDir && fs.existsSync(devDir)) {
        const devFiles = await fs.promises.readdir(devDir);
        if (devFiles.some(file => audioExtensions.includes(path.extname(file).toLowerCase()))) {
          sourceDir = devDir;
        }
      }
      
      if (sourceDir) {
        await copyFolderAsync(sourceDir, SOUNDS_DIR);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('sounds-changed');
        }
      }
    }
  } catch (error) {
    console.error('Error during sound migration:', error);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1120,
    height: 760,
    minWidth: 340,
    minHeight: 220,
    frame: false,
    transparent: false,
    backgroundColor: '#0b0c10',
    hasShadow: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    },
    show: true
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.on('maximize', () => {
    if (!isMiniMode) mainWindow.webContents.send('window-state-changed', 'maximized');
  });

  mainWindow.on('unmaximize', () => {
    if (!isMiniMode) mainWindow.webContents.send('window-state-changed', 'restored');
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
}

function updateTrayMenu(lang) {
  if (!appTray) return;

  const isTr = lang === 'tr';
  const showHideLabel = isTr ? 'Göster / Gizle' : 'Show / Hide';
  const stopAllLabel = isTr ? 'Tüm Sesleri Durdur' : 'Stop All Sounds';
  const exitLabel = isTr ? 'Çıkış' : 'Exit';

  const contextMenu = Menu.buildFromTemplate([
    { label: 'PrimeMix', enabled: false },
    { type: 'separator' },
    { label: showHideLabel, click: () => toggleWindow() },
    { label: stopAllLabel, click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('stop-all-sounds');
        }
      }
    },
    { type: 'separator' },
    { label: exitLabel, click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);

  appTray.setContextMenu(contextMenu);
}

function createTray() {
  const iconPath = path.join(__dirname, 'app_icon.png');
  const icon = nativeImage.createFromPath(iconPath);
  appTray = new Tray(icon);
  
  updateTrayMenu('en');
  appTray.setToolTip('PrimeMix');

  appTray.on('click', () => {
    toggleWindow();
  });
}

function toggleWindow() {
  if (!mainWindow) return;
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
}

// App lifecycle
app.whenReady().then(() => {
  protocol.handle('media', (request) => {
    let urlPath = request.url.replace(/^media:\/\//, '');
    if (/^[a-zA-Z]\//.test(urlPath)) {
      urlPath = urlPath[0] + ':' + urlPath.slice(1);
    }
    const decodedPath = decodeURIComponent(urlPath);
    return net.fetch(pathToFileURL(decodedPath).toString());
  });

  createWindow();
  createTray();
  startWatcher();

  // Global Shortcuts for Media Play/Pause
  try {
    globalShortcut.register('MediaPlayPause', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('toggle-global-play');
      }
    });
    globalShortcut.register('CommandOrControl+Alt+P', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('toggle-global-play');
      }
    });
  } catch (err) {
    console.error('Global shortcut registration failed:', err);
  }
  
  setTimeout(() => {
    checkAndMigrateSounds();
  }, 50);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Directory Watcher
let watchTimeout = null;
function startWatcher() {
  try {
    fs.watch(SOUNDS_DIR, (eventType, filename) => {
      if (!filename) return;
      const ext = path.extname(filename).toLowerCase();
      const validExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.json'];
      
      if (validExtensions.includes(ext) || filename === 'metadata.json') {
        if (watchTimeout) clearTimeout(watchTimeout);
        watchTimeout = setTimeout(() => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('sounds-changed');
          }
        }, 500);
      }
    });
  } catch (err) {
    console.error('Directory watcher error:', err);
  }
}

// IPC Handlers
ipcMain.handle('get-sounds', async () => {
  try {
    if (!fs.existsSync(SOUNDS_DIR)) {
      await fs.promises.mkdir(SOUNDS_DIR, { recursive: true });
    }
    if (!fs.existsSync(COVERS_DIR)) {
      await fs.promises.mkdir(COVERS_DIR, { recursive: true });
    }
    const files = await fs.promises.readdir(SOUNDS_DIR);
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac'];
    
    let metadata = {};
    if (fs.existsSync(METADATA_PATH)) {
      try {
        const metaContent = await fs.promises.readFile(METADATA_PATH, 'utf-8');
        metadata = JSON.parse(metaContent);
      } catch (err) {}
    }

    const soundList = [];
    files.forEach(file => {
      const ext = path.extname(file).toLowerCase();
      if (audioExtensions.includes(ext)) {
        const fileMetadata = metadata[file] || {};
        let autoTitle = path.basename(file, ext).replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

        soundList.push({
          filename: file,
          filePath: path.join(SOUNDS_DIR, file),
          title: fileMetadata.title || autoTitle,
          cover: fileMetadata.cover || null,
          category: fileMetadata.category || 'Genel',
          volume: fileMetadata.volume !== undefined ? fileMetadata.volume : 1.0,
          color: fileMetadata.color || getRandomGradient()
        });
      }
    });

    return { success: true, sounds: soundList };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-sound-metadata', async (event, filename, data) => {
  try {
    let metadata = {};
    if (fs.existsSync(METADATA_PATH)) {
      try {
        const metaContent = await fs.promises.readFile(METADATA_PATH, 'utf-8');
        metadata = JSON.parse(metaContent);
      } catch (e) {}
    }

    metadata[filename] = { ...(metadata[filename] || {}), ...data };
    await fs.promises.writeFile(METADATA_PATH, JSON.stringify(metadata, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-sound', async (event, filename) => {
  try {
    const filePath = path.join(SOUNDS_DIR, filename);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }

    let metadata = {};
    if (fs.existsSync(METADATA_PATH)) {
      try {
        const metaContent = await fs.promises.readFile(METADATA_PATH, 'utf-8');
        metadata = JSON.parse(metaContent);
      } catch (e) {}
    }

    if (metadata[filename] && metadata[filename].cover) {
      const coverPath = path.join(SOUNDS_DIR, metadata[filename].cover);
      if (fs.existsSync(coverPath)) {
        try { await fs.promises.unlink(coverPath); } catch (e) {}
      }
    }

    delete metadata[filename];
    await fs.promises.writeFile(METADATA_PATH, JSON.stringify(metadata, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('add-sound-dialog', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Ses Dosyaları', extensions: ['mp3', 'wav', 'ogg', 'm4a', 'flac'] }]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const srcPath = result.filePaths[0];
    const filename = path.basename(srcPath);
    const destPath = path.join(SOUNDS_DIR, filename);
    await fs.promises.copyFile(srcPath, destPath);

    return { success: true, filename: filename };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('add-cover-dialog', async (event, soundFilename) => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Resim Dosyaları', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] }]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const srcPath = result.filePaths[0];
    const ext = path.extname(srcPath);
    const coverFilename = `${path.basename(soundFilename, path.extname(soundFilename))}_cover${ext}`;
    const destPath = path.join(COVERS_DIR, coverFilename);

    await fs.promises.copyFile(srcPath, destPath);

    let metadata = {};
    if (fs.existsSync(METADATA_PATH)) {
      try {
        const metaContent = await fs.promises.readFile(METADATA_PATH, 'utf-8');
        metadata = JSON.parse(metaContent);
      } catch (e) {}
    }

    metadata[soundFilename] = { ...(metadata[soundFilename] || {}), cover: `covers/${coverFilename}` };
    await fs.promises.writeFile(METADATA_PATH, JSON.stringify(metadata, null, 2), 'utf-8');

    return { success: true, coverPath: `covers/${coverFilename}` };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Import/Export Mixes Dialogs
ipcMain.handle('export-mixes-dialog', async (event, mixesData) => {
  try {
    const result = await dialog.showSaveDialog({
      title: 'Karışımları Dışa Aktar',
      defaultPath: 'PrimeMix_Karisimlar.json',
      filters: [{ name: 'JSON Dosyaları', extensions: ['json'] }]
    });

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }

    await fs.promises.writeFile(result.filePath, JSON.stringify(mixesData, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('import-mixes-dialog', async () => {
  try {
    const result = await dialog.showOpenDialog({
      title: 'Karışımları İçe Aktar',
      properties: ['openFile'],
      filters: [{ name: 'JSON Dosyaları', extensions: ['json'] }]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const content = await fs.promises.readFile(result.filePaths[0], 'utf-8');
    const importedData = JSON.parse(content);
    return { success: true, data: importedData };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Mini Mode Toggle IPC
ipcMain.handle('toggle-mini-mode', async () => {
  if (!mainWindow) return { success: false };

  isMiniMode = !isMiniMode;

  if (isMiniMode) {
    normalBounds = mainWindow.getBounds();
    mainWindow.setAlwaysOnTop(true, 'floating');
    mainWindow.setBounds({ width: 340, height: 240 });
    mainWindow.setResizable(false);
  } else {
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setResizable(true);
    if (normalBounds) {
      mainWindow.setBounds(normalBounds);
    } else {
      mainWindow.setBounds({ width: 1120, height: 760 });
    }
  }

  mainWindow.webContents.send('mini-mode-changed', isMiniMode);
  return { success: true, isMiniMode: isMiniMode };
});

// Window controls
ipcMain.on('window-minimize', () => { if (mainWindow) mainWindow.minimize(); });
ipcMain.on('window-maximize', () => {
  if (!mainWindow || isMiniMode) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on('window-close', () => { if (mainWindow) mainWindow.hide(); });
ipcMain.on('open-folder', () => { shell.openPath(SOUNDS_DIR); });
ipcMain.on('open-external', (event, url) => { shell.openExternal(url); });
ipcMain.on('set-language', (event, lang) => { updateTrayMenu(lang); });

ipcMain.handle('get-startup-settings', () => { return app.getLoginItemSettings().openAtLogin; });
ipcMain.handle('set-startup-settings', (event, openAtLogin) => {
  app.setLoginItemSettings({ openAtLogin: openAtLogin, path: app.getPath('exe') });
  return { success: true };
});

const gradients = [
  'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
  'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)',
  'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  'linear-gradient(135deg, #fc466b 0%, #3f5efb 100%)',
  'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)'
];

function getRandomGradient() {
  return gradients[Math.floor(Math.random() * gradients.length)];
}
