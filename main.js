const { app, BrowserWindow, Tray, Menu, ipcMain, dialog, shell, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let appTray;
const isPackaged = app.isPackaged;
const EXE_DIR = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath);

const SOUNDS_DIR = isPackaged
  ? path.join(EXE_DIR, 'SereneMix_Data')
  : path.resolve(__dirname, '..', 'SereneMixSound');

const METADATA_PATH = path.join(SOUNDS_DIR, 'metadata.json');
const COVERS_DIR = path.join(SOUNDS_DIR, 'covers');

// Ensure directories exist
if (!fs.existsSync(SOUNDS_DIR)) {
  fs.mkdirSync(SOUNDS_DIR, { recursive: true });
}
if (!fs.existsSync(COVERS_DIR)) {
  fs.mkdirSync(COVERS_DIR, { recursive: true });
}

function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }
  const files = fs.readdirSync(from);
  for (const file of files) {
    const fromPath = path.join(from, file);
    const toPath = path.join(to, file);
    const stat = fs.statSync(fromPath);
    if (stat.isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      if (!fs.existsSync(toPath)) {
        fs.copyFileSync(fromPath, toPath);
      }
    }
  }
}

function checkAndMigrateSounds() {
  try {
    // Only migrate if we are packaged
    if (!isPackaged) return;

    // Check if SOUNDS_DIR has any audio files
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac'];
    let hasAudio = false;
    if (fs.existsSync(SOUNDS_DIR)) {
      const files = fs.readdirSync(SOUNDS_DIR);
      hasAudio = files.some(file => audioExtensions.includes(path.extname(file).toLowerCase()));
    }

    if (!hasAudio) {
      console.log('SereneMix_Data is empty. Starting sound migration...');
      
      // Candidate 1: The unpacked temp directory (extraFiles location for portable target)
      const tempExtraDir = path.join(path.dirname(process.execPath), 'SereneMix_Data');
      
      // Candidate 2: Dev local directory (fallback)
      const devDir = path.resolve(__dirname, '..', 'SereneMixSound');
      
      let sourceDir = null;
      
      if (fs.existsSync(tempExtraDir)) {
        const tempFiles = fs.readdirSync(tempExtraDir);
        const tempHasAudio = tempFiles.some(file => audioExtensions.includes(path.extname(file).toLowerCase()));
        if (tempHasAudio) {
          sourceDir = tempExtraDir;
        }
      }
      
      if (!sourceDir && fs.existsSync(devDir)) {
        const devFiles = fs.readdirSync(devDir);
        const devHasAudio = devFiles.some(file => audioExtensions.includes(path.extname(file).toLowerCase()));
        if (devHasAudio) {
          sourceDir = devDir;
        }
      }
      
      if (sourceDir) {
        console.log(`Migrating sounds from ${sourceDir} to ${SOUNDS_DIR}`);
        copyFolderSync(sourceDir, SOUNDS_DIR);
        console.log('Migration completed successfully!');
      } else {
        console.log('No default sound source found for migration.');
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
    minWidth: 800,
    minHeight: 600,
    frame: false, // Frameless for premium borderless look
    transparent: false,
    backgroundColor: '#0b0c10',
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

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-state-changed', 'maximized');
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-state-changed', 'restored');
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
    { label: 'SereneMix', enabled: false },
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
  // Use app_icon.png directly as it is packaged in ASAR and visible on both light and dark themes
  const iconPath = path.join(__dirname, 'app_icon.png');
  const icon = nativeImage.createFromPath(iconPath);
  appTray = new Tray(icon);
  
  // Default to English on startup
  updateTrayMenu('en');

  appTray.setToolTip('SereneMix');

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

// Default icon creation function removed because it causes write errors in packaged ASAR environments

// App lifecycle
app.whenReady().then(() => {
  checkAndMigrateSounds();
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
    // Ensure directories exist right before reading (failsafe)
    if (!fs.existsSync(SOUNDS_DIR)) {
      fs.mkdirSync(SOUNDS_DIR, { recursive: true });
    }
    if (!fs.existsSync(COVERS_DIR)) {
      fs.mkdirSync(COVERS_DIR, { recursive: true });
    }
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

// Delete sound file physically and clean its metadata
ipcMain.handle('delete-sound', async (event, filename) => {
  try {
    const filePath = path.join(SOUNDS_DIR, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Read metadata
    let metadata = {};
    if (fs.existsSync(METADATA_PATH)) {
      try {
        metadata = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf-8'));
      } catch (e) {}
    }

    // Delete cover if exists
    if (metadata[filename] && metadata[filename].cover) {
      const coverPath = path.join(SOUNDS_DIR, metadata[filename].cover);
      if (fs.existsSync(coverPath)) {
        try {
          fs.unlinkSync(coverPath);
        } catch (e) {
          console.error('Failed to delete cover file:', e);
        }
      }
    }

    // Delete metadata entry
    delete metadata[filename];
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

ipcMain.on('set-language', (event, lang) => {
  updateTrayMenu(lang);
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
