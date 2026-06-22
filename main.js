const { app, BrowserWindow, Tray, Menu, ipcMain, dialog, shell, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let appTray;
const isPackaged = app.isPackaged;
const EXE_DIR = path.dirname(process.execPath);

const SOUNDS_DIR = isPackaged
  ? path.join(EXE_DIR, 'SereneMix_Data')
  : path.resolve('C:/Users/MAXIMUS/PROJECTS/Huzur_Sesleri');

const METADATA_PATH = path.join(SOUNDS_DIR, 'metadata.json');
const COVERS_DIR = path.join(SOUNDS_DIR, 'covers');

// Ensure directories exist
if (!fs.existsSync(SOUNDS_DIR)) {
  fs.mkdirSync(SOUNDS_DIR, { recursive: true });
}
if (!fs.existsSync(COVERS_DIR)) {
  fs.mkdirSync(COVERS_DIR, { recursive: true });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 980,
    height: 680,
    minWidth: 800,
    minHeight: 550,
    frame: false, // Frameless for premium borderless look
    transparent: true,
    hasShadow: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // Necessary to play local sound files
    },
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'tray_icon.png');
  
  // Always recreate icon to guarantee it is never corrupted on disk
  createDefaultIcon(iconPath);

  const icon = nativeImage.createFromPath(iconPath);
  appTray = new Tray(icon);
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'SereneMix', enabled: false },
    { type: 'separator' },
    { label: 'Göster / Gizle', click: () => toggleWindow() },
    { label: 'Tüm Sesleri Durdur', click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('stop-all-sounds');
        }
      }
    },
    { type: 'separator' },
    { label: 'Çıkış', click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);

  appTray.setToolTip('SereneMix');
  appTray.setContextMenu(contextMenu);

  appTray.on('double-click', () => {
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

// 32x32 transparent PNG icon with a white soundwave/speaker symbol
function createDefaultIcon(filePath) {
  const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gYUDg4XNSsBSwAAAcFJREFUWMPtlztv00AYhp8zEoc0kSp1QEIsQAwMSAwsDEgsqtShUiUsLMjfsP8AEhISYmFiYWJgYWDo0IEhSpU6tCEhDkmcx+HZqbEdYhsnQOrZrn38PM/7vud9cx1e+ZfK92sAh12/P79bAIed/sB11eXz+sW69N5fAzi4BqBqBqqaVbU6p/rXz6P19f18mXwXfAB9AM9T9x0gB46B5Urr2FkP3AOvUus20EutE2eD1Dr7L8y8mY0dPAeWyq2+szVnC+C05tQ5Z1Nnz/6FeTtr4E55YQ4sOmc7zjZz9sp1b3YV2AY2K472nC05WwU2XfdmV4EZYLmsVbOznf43M/N2p4EnwFLJ1cDOeql1WnOaWWgDeAJslF1q1pxtAOv/wrydtYF7wL1yrgX3gXvOpuk2sA5MypmZWT/dfmZeL1tXgAnQVc4dAPfTfALMV/rZc7YFTIC2c/YOeJjmvXJuArTT/N517sE9O1sDXmfe7oCnwFPnvAbO/zPzkZ09AV4D56XWbWAEvAKeyvMpcF5pdZ1NUmvjNfD8p9Y3gZfAc+/9c+D5Lzvvvfe+895777333nvvvff/+rX+AEXy+u13F+72AAAAAElFTkSuQmCC';
  fs.writeFileSync(filePath, Buffer.from(base64Png, 'base64'));
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  createTray();
  startWatcher();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
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

// IPC Communication handlers
ipcMain.handle('get-sounds', async () => {
  try {
    const files = fs.readdirSync(SOUNDS_DIR);
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac'];
    
    // Read metadata
    let metadata = {};
    if (fs.existsSync(METADATA_PATH)) {
      try {
        metadata = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf-8'));
      } catch (err) {
        console.error('Metadata parsing error:', err);
      }
    }

    const soundList = [];

    files.forEach(file => {
      const ext = path.extname(file).toLowerCase();
      if (audioExtensions.includes(ext)) {
        const fileMetadata = metadata[file] || {};
        
        let autoTitle = path.basename(file, ext)
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());

        soundList.push({
          filename: file,
          filePath: path.join(SOUNDS_DIR, file),
          title: fileMetadata.title || autoTitle,
          cover: fileMetadata.cover || null,
          category: fileMetadata.category || 'Genel',
          volume: fileMetadata.volume !== undefined ? fileMetadata.volume : 0.5,
          color: fileMetadata.color || getRandomGradient()
        });
      }
    });

    return { success: true, sounds: soundList };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Save sound metadata
ipcMain.handle('save-sound-metadata', async (event, filename, data) => {
  try {
    let metadata = {};
    if (fs.existsSync(METADATA_PATH)) {
      try {
        metadata = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf-8'));
      } catch (e) {}
    }

    metadata[filename] = {
      ...(metadata[filename] || {}),
      ...data
    };

    fs.writeFileSync(METADATA_PATH, JSON.stringify(metadata, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Add sound file from dialog
ipcMain.handle('add-sound-dialog', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Ses Dosyaları', extensions: ['mp3', 'wav', 'ogg', 'm4a', 'flac'] }
      ]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const srcPath = result.filePaths[0];
    const filename = path.basename(srcPath);
    const destPath = path.join(SOUNDS_DIR, filename);

    fs.copyFileSync(srcPath, destPath);

    return { success: true, filename: filename };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Add cover image from dialog
ipcMain.handle('add-cover-dialog', async (event, soundFilename) => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Resim Dosyaları', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] }
      ]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const srcPath = result.filePaths[0];
    const ext = path.extname(srcPath);
    const coverFilename = `${path.basename(soundFilename, path.extname(soundFilename))}_cover${ext}`;
    const destPath = path.join(COVERS_DIR, coverFilename);

    fs.copyFileSync(srcPath, destPath);

    // Save cover association in metadata
    let metadata = {};
    if (fs.existsSync(METADATA_PATH)) {
      try {
        metadata = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf-8'));
      } catch (e) {}
    }

    metadata[soundFilename] = {
      ...(metadata[soundFilename] || {}),
      cover: `covers/${coverFilename}`
    };

    fs.writeFileSync(METADATA_PATH, JSON.stringify(metadata, null, 2), 'utf-8');

    return { success: true, coverPath: `covers/${coverFilename}` };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Window controls
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.hide(); // Minimize to tray
});

ipcMain.on('open-folder', () => {
  shell.openPath(SOUNDS_DIR);
});

ipcMain.on('open-external', (event, url) => {
  shell.openExternal(url);
});

// Startup login settings
ipcMain.handle('get-startup-settings', () => {
  return app.getLoginItemSettings().openAtLogin;
});

ipcMain.handle('set-startup-settings', (event, openAtLogin) => {
  app.setLoginItemSettings({
    openAtLogin: openAtLogin,
    path: app.getPath('exe')
  });
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
