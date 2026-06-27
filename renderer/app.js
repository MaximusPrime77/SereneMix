// PrimeMix - Ultimate Enterprise Frontend Logic

// State Management
let sounds = [];
const activeAudio = {}; // filename -> Audio object
let favorites = JSON.parse(localStorage.getItem('primemix_favorites') || '[]');
let currentCategory = 'all';
let searchQuery = '';
let isGlobalPlaying = false;

// Sleep Timer State
let sleepTimer = null;
let sleepTimeRemaining = 0; // seconds

// Pomodoro Focus Timer State
let pomoMode = 'work'; // 'work' or 'break'
let pomoTimeRemaining = 25 * 60; // seconds
let pomoTimer = null;
let isPomoRunning = false;

let selectedSoundForEdit = null;
let isMiniModeActive = false;

// Multi-language State
let currentLanguage = localStorage.getItem('primemix_lang') || localStorage.getItem('serenemix_lang') || 'en';
let translations = {};

// DOM Elements
const btnMinimize = document.getElementById('btn-minimize');
const btnMaximize = document.getElementById('btn-maximize');
const btnClose = document.getElementById('btn-close');
const btnMiniMode = document.getElementById('btn-mini-mode');
const btnExitMini = document.getElementById('btn-exit-mini');
const btnMiniPlayAll = document.getElementById('btn-mini-play-all');
const miniActiveList = document.getElementById('mini-active-list');
const miniModeContainer = document.getElementById('mini-mode-container');
const appContainer = document.getElementById('app-container');

const btnGlobalPlay = document.getElementById('btn-global-play');
const activeSoundsBar = document.getElementById('active-sounds-bar');
const activeSoundsList = document.getElementById('active-sounds-list');
const btnClearAllActive = document.getElementById('btn-clear-all-active');

// Custom Select Dropdown Elements
const timerSelectContainer = document.getElementById('custom-timer-select');
const timerDropdownTrigger = document.getElementById('timer-dropdown-trigger');
const timerTriggerText = document.getElementById('timer-trigger-text');
const timerDropdownOptions = document.getElementById('timer-dropdown-options');
const customOptions = document.querySelectorAll('.custom-option');
const timerDisplay = document.getElementById('timer-display');
const timerTime = document.getElementById('timer-time');
const btnCancelTimer = document.getElementById('btn-cancel-timer');

// Pomodoro Elements
const pomoModeWork = document.getElementById('pomo-mode-work');
const pomoModeBreak = document.getElementById('pomo-mode-break');
const pomodoroTime = document.getElementById('pomodoro-time');
const btnPomoToggle = document.getElementById('btn-pomo-toggle');
const btnPomoReset = document.getElementById('btn-pomo-reset');

const btnAddSound = document.getElementById('btn-add-sound');
const btnOpenFolder = document.getElementById('btn-open-folder');
const btnSaveMix = document.getElementById('btn-save-mix');
const btnImportMixes = document.getElementById('btn-import-mixes');
const btnExportMixes = document.getElementById('btn-export-mixes');
const mixesList = document.getElementById('mixes-list');
const searchInput = document.getElementById('search-input');
const categoryTabs = document.querySelectorAll('.category-tab');
const soundsGrid = document.getElementById('sounds-grid');

// Modal DOM Elements
const editModal = document.getElementById('edit-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnSaveModal = document.getElementById('btn-save-modal');
const editFilename = document.getElementById('edit-filename');
const editTitle = document.getElementById('edit-title');
const editCategory = document.getElementById('edit-category');
const editCoverPreview = document.getElementById('edit-cover-preview');
const btnSelectCover = document.getElementById('btn-select-cover');

const saveMixModal = document.getElementById('save-mix-modal');
const btnCloseMixModal = document.getElementById('btn-close-mix-modal');
const btnConfirmSaveMix = document.getElementById('btn-confirm-save-mix');
const mixNameInput = document.getElementById('mix-name-input');

const catKeyMap = {
  'Doğa': 'cat_nature',
  'Şehir': 'cat_urban',
  'Hayvanlar': 'cat_animals',
  'Müzik': 'cat_music',
  'Enstrümantal': 'cat_enstrumantal',
  'Gürültü': 'cat_noise',
  'Genel': 'cat_other'
};

// Volume debounce: diske yazma işlemi sürükleme bittikten 500ms sonra tetiklenir
const volumeSaveTimers = {};

// Toast & Notification Utilities
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function showConfirm(message, onConfirm) {
  const confirmModal = document.getElementById('confirm-modal');
  const confirmMessage = document.getElementById('confirm-modal-message');
  const btnOk = document.getElementById('btn-confirm-ok');
  const btnCancel = document.getElementById('btn-confirm-cancel');

  if (!confirmModal) {
    if (confirm(message)) onConfirm();
    return;
  }

  confirmMessage.textContent = message;
  confirmModal.classList.remove('hidden');

  const handleOk = () => { cleanup(); onConfirm(); };
  const handleCancel = () => { cleanup(); };
  const cleanup = () => {
    confirmModal.classList.add('hidden');
    btnOk.removeEventListener('click', handleOk);
    btnCancel.removeEventListener('click', handleCancel);
  };

  btnOk.addEventListener('click', handleOk);
  btnCancel.addEventListener('click', handleCancel);
}

function getMediaUrl(filePath) {
  if (!filePath) return '';
  const cleanPath = filePath.replace(/\\/g, '/');
  return `media://${cleanPath}`;
}

function getActivePlayingCount() {
  return Object.values(activeAudio).filter(audio => !audio.paused).length;
}

// Dynamic Ambient Atmosphere Background Adjuster
function updateAmbientAtmosphere() {
  const activeKeys = Object.keys(activeAudio).filter(k => !activeAudio[k].paused);
  if (activeKeys.length === 0) {
    appContainer.style.background = 'radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 60%), radial-gradient(circle at 10% 80%, rgba(16, 185, 129, 0.04) 0%, transparent 50%)';
    return;
  }

  const activeCategories = activeKeys.map(k => {
    const s = sounds.find(snd => snd.filename === k);
    return s ? s.category : '';
  });

  if (activeCategories.includes('Doğa')) {
    appContainer.style.background = 'radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.12) 0%, transparent 60%), radial-gradient(circle at 10% 80%, rgba(59, 130, 246, 0.08) 0%, transparent 50%)';
  } else if (activeCategories.includes('Müzik') || activeCategories.includes('Enstrümantal')) {
    appContainer.style.background = 'radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.14) 0%, transparent 60%), radial-gradient(circle at 10% 80%, rgba(236, 72, 153, 0.08) 0%, transparent 50%)';
  } else if (activeCategories.includes('Şehir') || activeCategories.includes('Gürültü')) {
    appContainer.style.background = 'radial-gradient(circle at 80% 20%, rgba(245, 158, 11, 0.12) 0%, transparent 60%), radial-gradient(circle at 10% 80%, rgba(99, 102, 241, 0.08) 0%, transparent 50%)';
  } else {
    appContainer.style.background = 'radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.12) 0%, transparent 60%), radial-gradient(circle at 10% 80%, rgba(16, 185, 129, 0.08) 0%, transparent 50%)';
  }
}

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
  initWindowControls();
  await loadLanguage(currentLanguage);
  await loadSounds();
  loadSavedMixes();
  loadSettings();
  initEventListeners();
  initPomodoro();
});

// Load Translation Files
async function loadLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem('primemix_lang', lang);

  try {
    const response = await fetch(`./locales/${lang}.json`);
    translations = await response.json();

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[key]) {
        if (el.tagName === 'INPUT') el.placeholder = translations[key];
        else if (el.tagName === 'OPTION') el.textContent = translations[key];
        else {
          const textNode = Array.from(el.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
          if (textNode) textNode.textContent = translations[key];
          else el.textContent = translations[key];
        }
      }
    });

    const btnLangToggle = document.getElementById('btn-lang-toggle');
    if (btnLangToggle) btnLangToggle.textContent = lang.toUpperCase();

    window.api.setLanguage(lang);
    updateGlobalPlayButtonState();
    loadSavedMixes();
    renderSoundsGrid();
    updateActiveSoundsPanel();
  } catch (err) {
    console.error('Failed to load language files:', err);
  }
}

// Window Controls
function initWindowControls() {
  btnMinimize.addEventListener('click', () => window.api.minimize());
  btnMaximize.addEventListener('click', () => window.api.maximize());
  btnClose.addEventListener('click', () => window.api.close());
  btnMiniMode.addEventListener('click', () => window.api.toggleMiniMode());
  btnExitMini.addEventListener('click', () => window.api.toggleMiniMode());

  window.api.onWindowStateChanged((state) => {
    if (state === 'maximized') {
      btnMaximize.innerHTML = `<svg width="10" height="10" viewBox="0 0 10 10"><rect x="1.5" y="3.5" width="5" height="5" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M3.5 3.5V1.5H8.5V6.5H6.5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>`;
      btnMaximize.title = currentLanguage === 'tr' ? 'Aşağı Getir' : 'Restore';
    } else {
      btnMaximize.innerHTML = `<svg width="10" height="10" viewBox="0 0 10 10"><rect x="1.5" y="1.5" width="7" height="7" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>`;
      btnMaximize.title = currentLanguage === 'tr' ? 'Ekranı Kapla' : 'Maximize';
    }
  });

  window.api.onMiniModeChanged((isMini) => {
    isMiniModeActive = isMini;
    if (isMini) {
      appContainer.classList.add('hidden');
      miniModeContainer.classList.remove('hidden');
      updateMiniModePanel();
    } else {
      appContainer.classList.remove('hidden');
      miniModeContainer.classList.add('hidden');
    }
  });
}

async function loadSettings() {
  try {
    const openAtLogin = await window.api.getStartupSettings();
    const chkStartup = document.getElementById('chk-startup');
    if (chkStartup) chkStartup.checked = openAtLogin;
  } catch (err) {
    console.error('Başlangıç ayarı yüklenemedi:', err);
  }
}

async function loadSounds(silent = false) {
  if (!silent) {
    soundsGrid.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>${translations['loading_sounds'] || 'Sesler yükleniyor...'}</p>
      </div>
    `;
  }

  const response = await window.api.getSounds();
  if (response.success) {
    Object.keys(activeAudio).forEach(filename => {
      const stillExists = response.sounds.some(s => s.filename === filename);
      if (!stillExists) {
        activeAudio[filename].pause();
        delete activeAudio[filename];
      }
    });

    sounds = response.sounds;
    renderSoundsGrid();
    updateGlobalPlayButtonState();
  } else {
    if (!silent) {
      soundsGrid.innerHTML = `
        <div class="loading-state">
          <p class="error-text">${translations['load_error'] || 'Sesler yüklenirken bir hata oluştu:'} ${response.error}</p>
        </div>
      `;
    }
  }
}

// Render Sounds Grid with Favorites Support
function renderSoundsGrid() {
  const filtered = sounds.filter(sound => {
    let matchesCategory = false;
    if (currentCategory === 'all') matchesCategory = true;
    else if (currentCategory === 'fav') matchesCategory = favorites.includes(sound.filename);
    else matchesCategory = sound.category === currentCategory;

    const matchesSearch = sound.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          sound.filename.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    soundsGrid.innerHTML = `
      <div class="loading-state">
        <p>${translations['no_sounds_found'] || 'Klasörünüz boş veya aramanızla eşleşen ses bulunamadı.'}</p>
      </div>
    `;
    return;
  }

  soundsGrid.innerHTML = '';
  filtered.forEach(sound => {
    const card = document.createElement('div');
    const isActive = activeAudio[sound.filename] !== undefined;
    const isPaused = isActive && activeAudio[sound.filename].paused;
    const isFav = favorites.includes(sound.filename);

    card.className = `sound-card ${isActive ? 'active' : ''} ${isPaused ? 'paused' : ''}`;
    card.dataset.filename = sound.filename;

    let coverStyle = '';
    if (sound.cover) {
      const fullCoverPath = `${sound.filePath.replace(sound.filename, '')}${sound.cover}`;
      const mediaUrl = getMediaUrl(fullCoverPath);
      coverStyle = `background-image: url('${encodeURI(mediaUrl)}');`;
    } else {
      coverStyle = `background: ${sound.color};`;
    }

    const transKey = catKeyMap[sound.category] || 'cat_other';
    const translatedCategory = translations[transKey] || sound.category;
    const titleKey = `sound_${sound.filename.replace(/\.[^/.]+$/, "")}`;
    const translatedTitle = translations[titleKey] || sound.title;

    card.innerHTML = `
      <div class="eq-container">
        <div class="eq-bar"></div>
        <div class="eq-bar"></div>
        <div class="eq-bar"></div>
      </div>
      <div class="cover-container" style="${coverStyle}">
        <div class="cover-top-left-actions">
          <button class="btn-cover-action btn-card-edit" onclick="openEditModal('${sound.filename}')" title="${translations['customize_sound'] || 'Düzenle'}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </button>
          <button class="btn-cover-action btn-card-delete" onclick="confirmDeleteSound('${sound.filename}')" title="${translations['delete'] || 'Sil'}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
          </button>
        </div>
        <button class="btn-cover-action btn-card-fav ${isFav ? 'active' : ''}" onclick="toggleFavorite('${sound.filename}', event)" title="Favorilere Ekle/Çıkar">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
        <div class="cover-overlay" onclick="toggleSound('${sound.filename}')">
          <button class="play-icon-btn">
            ${isActive && !isPaused ? 
              `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>` : 
              `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`
            }
          </button>
        </div>
      </div>
      <div class="sound-info-container">
        <div class="sound-meta">
          <span class="sound-name" title="${translatedTitle}">${translatedTitle}</span>
          <span class="sound-category">${translatedCategory}</span>
        </div>
      </div>
      <div class="volume-container">
        <svg class="volume-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
        <input type="range" class="volume-slider" min="0" max="1" step="0.01" value="${sound.volume}" oninput="changeSoundVolume('${sound.filename}', this.value)">
      </div>
    `;

    soundsGrid.appendChild(card);
  });
}

// Toggle Favorites
function toggleFavorite(filename, event) {
  if (event) event.stopPropagation();
  const index = favorites.indexOf(filename);
  if (index > -1) {
    favorites.splice(index, 1);
    showToast('Favorilerden çıkarıldı.', 'info');
  } else {
    favorites.push(filename);
    showToast('Favorilere eklendi! ⭐', 'info');
  }
  localStorage.setItem('primemix_favorites', JSON.stringify(favorites));
  renderSoundsGrid();
}

// Fade Helpers for Audio Crossfading
function fadeInAudio(audio, targetVol, duration = 300) {
  audio.volume = 0;
  const steps = 15;
  const stepTime = duration / steps;
  const volStep = targetVol / steps;
  let currentStep = 0;

  const timer = setInterval(() => {
    currentStep++;
    audio.volume = Math.min(targetVol, audio.volume + volStep);
    if (currentStep >= steps) {
      audio.volume = targetVol;
      clearInterval(timer);
    }
  }, stepTime);
}

function fadeOutAudio(audio, onComplete, duration = 250) {
  const initialVol = audio.volume;
  if (initialVol <= 0) {
    if (onComplete) onComplete();
    return;
  }
  const steps = 15;
  const stepTime = duration / steps;
  const volStep = initialVol / steps;
  let currentStep = 0;

  const timer = setInterval(() => {
    currentStep++;
    audio.volume = Math.max(0, audio.volume - volStep);
    if (currentStep >= steps) {
      audio.volume = 0;
      clearInterval(timer);
      if (onComplete) onComplete();
    }
  }, stepTime);
}

// Toggle Sound Play/Pause
async function toggleSound(filename) {
  const sound = sounds.find(s => s.filename === filename);
  if (!sound) return;

  const isCurrentlyActive = activeAudio[filename] !== undefined;
  const isCurrentlyPaused = isCurrentlyActive && activeAudio[filename].paused;

  if (!isCurrentlyActive || isCurrentlyPaused) {
    if (getActivePlayingCount() >= 3) {
      showToast(translations['alert_max_sounds'] || 'Aynı anda en fazla 3 ses çalınabilir.', 'warning');
      return;
    }
  }

  if (isCurrentlyActive) {
    if (isCurrentlyPaused) {
      try {
        await activeAudio[filename].play();
        fadeInAudio(activeAudio[filename], sound.volume);
      } catch (err) {
        showToast(translations['alert_audio_error'] || 'Ses dosyası çalınamadı.', 'error');
        return;
      }
    } else {
      fadeOutAudio(activeAudio[filename], () => {
        activeAudio[filename].pause();
        updateGlobalPlayButtonState();
        renderSoundsGrid();
        updateActiveSoundsPanel();
        updateAmbientAtmosphere();
      });
      return;
    }
  } else {
    const mediaUrl = getMediaUrl(sound.filePath);
    const audio = new Audio(mediaUrl);
    audio.loop = true;
    
    try {
      await audio.play();
      activeAudio[filename] = audio;
      fadeInAudio(audio, sound.volume);
    } catch (err) {
      showToast(translations['alert_audio_error'] || 'Ses dosyası çalınamadı.', 'error');
      return;
    }
  }

  updateGlobalPlayButtonState();
  renderSoundsGrid();
  updateActiveSoundsPanel();
  updateAmbientAtmosphere();
}

function changeSoundVolume(filename, volume) {
  const sound = sounds.find(s => s.filename === filename);
  if (sound) {
    sound.volume = parseFloat(volume);
    if (activeAudio[filename]) activeAudio[filename].volume = sound.volume;
    
    // Slider senkronizasyonu: iki panel arasında anlık güncelleme
    const gridSlider = document.querySelector(`.sound-card[data-filename="${filename}"] .volume-slider`);
    if (gridSlider) gridSlider.value = volume;
    
    const activeSlider = document.querySelector(`.active-sound-item[data-filename="${filename}"] .active-sound-slider`);
    if (activeSlider) activeSlider.value = volume;
    
    // Diske yazma: sürekli sürüklerken değil, durduğunda yaz (debounce 500ms)
    clearTimeout(volumeSaveTimers[filename]);
    volumeSaveTimers[filename] = setTimeout(() => {
      window.api.saveSoundMetadata(filename, { volume: sound.volume });
    }, 500);
  }
}

function updateGlobalPlayButtonState() {
  const playingCount = getActivePlayingCount();
  const totalActiveCount = Object.keys(activeAudio).length;
  
  // 3 durum: (1) çalan var → Tümünü Durdur, (2) hepsi duraklatılmış → Devam Et, (3) hiçbiri yok → Tümünü Çal
  isGlobalPlaying = playingCount > 0;

  const btnText = btnGlobalPlay.querySelector('span');
  const iconPlay = btnGlobalPlay.querySelector('.icon-play');
  const iconPause = btnGlobalPlay.querySelector('.icon-pause');
  const miniText = btnMiniPlayAll ? btnMiniPlayAll.querySelector('span') : null;
  const miniIconPlay = btnMiniPlayAll ? btnMiniPlayAll.querySelector('.icon-play') : null;
  const miniIconPause = btnMiniPlayAll ? btnMiniPlayAll.querySelector('.icon-pause') : null;

  if (playingCount > 0) {
    // Çalan sesler var — "Tümünü Durdur" göster
    btnGlobalPlay.classList.add('active');
    if (btnText) btnText.textContent = translations['stop_all'] || 'Tümünü Durdur';
    if (iconPlay) iconPlay.classList.add('hidden');
    if (iconPause) iconPause.classList.remove('hidden');
    if (btnMiniPlayAll) {
      btnMiniPlayAll.classList.add('active');
      if (miniText) miniText.textContent = translations['stop_all'] || 'Tümünü Durdur';
      if (miniIconPlay) miniIconPlay.classList.add('hidden');
      if (miniIconPause) miniIconPause.classList.remove('hidden');
    }
  } else if (totalActiveCount > 0) {
    // Sesler var ama hepsi duraklatılmış — "Devam Et" göster
    btnGlobalPlay.classList.remove('active');
    const resumeLabel = currentLanguage === 'tr' ? 'Devam Et' : 'Resume';
    if (btnText) btnText.textContent = resumeLabel;
    if (iconPlay) iconPlay.classList.remove('hidden');
    if (iconPause) iconPause.classList.add('hidden');
    if (btnMiniPlayAll) {
      btnMiniPlayAll.classList.remove('active');
      if (miniText) miniText.textContent = resumeLabel;
      if (miniIconPlay) miniIconPlay.classList.remove('hidden');
      if (miniIconPause) miniIconPause.classList.add('hidden');
    }
  } else {
    // Hiç aktif ses yok — "Tümünü Çal" göster
    btnGlobalPlay.classList.remove('active');
    if (btnText) btnText.textContent = translations['play_all'] || 'Tümünü Çal';
    if (iconPlay) iconPlay.classList.remove('hidden');
    if (iconPause) iconPause.classList.add('hidden');
    if (btnMiniPlayAll) {
      btnMiniPlayAll.classList.remove('active');
      if (miniText) miniText.textContent = translations['play_all'] || 'Tümünü Çal';
      if (miniIconPlay) miniIconPlay.classList.remove('hidden');
      if (miniIconPause) miniIconPause.classList.add('hidden');
    }
  }
}

function pauseAllActiveSounds() {
  // Tek bir UI güncellemesi için tüm fade işlemlerini say
  const playing = Object.keys(activeAudio).filter(f => !activeAudio[f].paused);
  if (playing.length === 0) return;
  let remaining = playing.length;

  playing.forEach(filename => {
    const audio = activeAudio[filename];
    fadeOutAudio(audio, () => {
      audio.pause();
      remaining--;
      // Sadece son ses bittiğinde UI'ı bir kez güncelle
      if (remaining === 0) {
        updateGlobalPlayButtonState();
        renderSoundsGrid();
        updateActiveSoundsPanel();
        updateAmbientAtmosphere();
      }
    });
  });
}

function clearAllActiveSounds() {
  const filenames = Object.keys(activeAudio);
  if (filenames.length === 0) return;

  // Race condition önlemi: önce tüm referansları al, activeAudio'yu temizle
  const audioSnapshot = {};
  filenames.forEach(f => { audioSnapshot[f] = activeAudio[f]; delete activeAudio[f]; });

  let remaining = filenames.length;
  filenames.forEach(filename => {
    const audio = audioSnapshot[filename];
    fadeOutAudio(audio, () => {
      audio.pause();
      remaining--;
      // Sadece son ses bittiğinde UI'ı bir kez güncelle
      if (remaining === 0) {
        updateGlobalPlayButtonState();
        renderSoundsGrid();
        updateActiveSoundsPanel();
        updateAmbientAtmosphere();
      }
    });
  });
}

// Pomodoro Focus Timer Logic
function initPomodoro() {
  pomoModeWork.addEventListener('click', () => switchPomodoroMode('work'));
  pomoModeBreak.addEventListener('click', () => switchPomodoroMode('break'));
  btnPomoToggle.addEventListener('click', togglePomodoroTimer);
  btnPomoReset.addEventListener('click', resetPomodoroTimer);
  updatePomodoroDisplay();
}

function switchPomodoroMode(mode) {
  // Önce modu güncelle, sonra sıfırla
  // (Eski sıra: resetPomodoroTimer önce çalışıyordu — pomoMode henüz değişmediğinden yanlış süre ayarlanıyordu)
  if (isPomoRunning) {
    clearInterval(pomoTimer);
    pomoTimer = null;
    isPomoRunning = false;
    btnPomoToggle.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
  }
  pomoMode = mode; // Önce modu değiştir
  pomoTimeRemaining = mode === 'work' ? 25 * 60 : 5 * 60; // Sonra süreyi set et

  if (mode === 'work') {
    pomoModeWork.classList.add('active');
    pomoModeBreak.classList.remove('active');
  } else {
    pomoModeBreak.classList.add('active');
    pomoModeWork.classList.remove('active');
  }
  updatePomodoroDisplay();
}

function togglePomodoroTimer() {
  if (isPomoRunning) {
    // Duraklat
    clearInterval(pomoTimer);
    pomoTimer = null;
    isPomoRunning = false;
    btnPomoToggle.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
  } else {
    // Başlat / devam et
    isPomoRunning = true;
    btnPomoToggle.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
    pomoTimer = setInterval(() => {
      pomoTimeRemaining--;
      if (pomoTimeRemaining <= 0) {
        // Önce timer'i durdur ve isPomoRunning'i kapat
        clearInterval(pomoTimer);
        pomoTimer = null;
        isPomoRunning = false; // switchPomodoroMode bunu görecek

        if (pomoMode === 'work') {
          showToast('🔔 Çalışma seansı bitti! Mola vakti.', 'info');
          switchPomodoroMode('break');
        } else {
          showToast('🔔 Mola bitti! Odaklanma zamanı.', 'info');
          switchPomodoroMode('work');
        }
        // Düzgün döngü için buton ikonunu doğru göster
        btnPomoToggle.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
      } else {
        updatePomodoroDisplay();
      }
    }, 1000);
  }
}

function resetPomodoroTimer() {
  if (pomoTimer) clearInterval(pomoTimer);
  pomoTimer = null;
  isPomoRunning = false;
  btnPomoToggle.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
  pomoTimeRemaining = pomoMode === 'work' ? 25 * 60 : 5 * 60;
  updatePomodoroDisplay();
}

function updatePomodoroDisplay() {
  const mins = Math.floor(pomoTimeRemaining / 60);
  const secs = pomoTimeRemaining % 60;
  pomodoroTime.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Event Listeners
function initEventListeners() {
  btnGlobalPlay.addEventListener('click', () => {
    if (isGlobalPlaying) {
      pauseAllActiveSounds();
    } else {
      const activeKeys = Object.keys(activeAudio);
      if (activeKeys.length > 0) {
        // Duraklatılmış sesleri devam ettir
        activeKeys.forEach(filename => {
          if (activeAudio[filename] && activeAudio[filename].paused) {
            toggleSound(filename);
          }
        });
      } else {
        // Hiç aktif ses yok → ilk 3 çalmayan sesi başlat
        let started = 0;
        for (let i = 0; i < sounds.length && started < 3; i++) {
          const s = sounds[i];
          if (!activeAudio[s.filename]) {
            toggleSound(s.filename);
            started++;
          }
        }
      }
    }
  });

  if (btnMiniPlayAll) {
    btnMiniPlayAll.addEventListener('click', () => {
      btnGlobalPlay.click();
    });
  }

  btnClearAllActive.addEventListener('click', () => clearAllActiveSounds());

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderSoundsGrid();
  });

  categoryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      categoryTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCategory = tab.dataset.category;
      renderSoundsGrid();
    });
  });

  btnOpenFolder.addEventListener('click', () => window.api.openFolder());

  btnAddSound.addEventListener('click', async () => {
    const result = await window.api.addSound();
    if (result.success) {
      await loadSounds();
      showToast('Yeni ses başarıyla eklendi.', 'info');
    } else if (result.error) {
      showToast(`Ses eklenirken hata oluştu: ${result.error}`, 'error');
    }
  });

  timerDropdownTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = timerSelectContainer.classList.contains('open');
    if (isOpen) closeCustomDropdown();
    else {
      timerSelectContainer.classList.add('open');
      timerDropdownOptions.classList.remove('hidden');
    }
  });

  customOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = parseInt(option.dataset.value);
      const text = option.textContent;
      customOptions.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
      timerTriggerText.textContent = text;
      closeCustomDropdown();

      if (val > 0) startSleepTimer(val);
      else cancelSleepTimer();
    });
  });

  document.addEventListener('click', () => closeCustomDropdown());
  btnCancelTimer.addEventListener('click', () => cancelSleepTimer());

  btnSaveMix.addEventListener('click', () => {
    if (Object.keys(activeAudio).length === 0) {
      showToast(translations['alert_play_first'] || 'Karışım oluşturmak için lütfen en az bir ses çalın.', 'warning');
      return;
    }
    mixNameInput.value = '';
    saveMixModal.classList.remove('hidden');
  });

  btnCloseMixModal.addEventListener('click', () => saveMixModal.classList.add('hidden'));

  btnConfirmSaveMix.addEventListener('click', () => {
    const name = mixNameInput.value.trim();
    if (!name) {
      showToast(translations['alert_enter_name'] || 'Lütfen karışım için bir isim girin.', 'warning');
      return;
    }
    saveMix(name);
    saveMixModal.classList.add('hidden');
  });

  // Import / Export Mixes Triggers
  btnExportMixes.addEventListener('click', async () => {
    const mixes = JSON.parse(localStorage.getItem('primemix_mixes') || localStorage.getItem('serenemix_mixes') || '[]');
    if (mixes.length === 0) {
      showToast('Dışa aktarılacak kayıtlı karışım bulunamadı.', 'warning');
      return;
    }
    const result = await window.api.exportMixes(mixes);
    if (result.success) {
      showToast('Karışımlar başarıyla dosyaya aktarıldı. 💾', 'info');
    } else if (result.error) {
      showToast(`Dışa aktarma hatası: ${result.error}`, 'error');
    }
  });

  btnImportMixes.addEventListener('click', async () => {
    const result = await window.api.importMixes();
    if (result.success && Array.isArray(result.data)) {
      localStorage.setItem('primemix_mixes', JSON.stringify(result.data));
      loadSavedMixes();
      showToast('Karışımlar dosyadan yüklendi! 📥', 'info');
    } else if (result.error) {
      showToast(`İçe aktarma hatası: ${result.error}`, 'error');
    }
  });

  editModal.addEventListener('click', (e) => { if (e.target === editModal) editModal.classList.add('hidden'); });
  saveMixModal.addEventListener('click', (e) => { if (e.target === saveMixModal) saveMixModal.classList.add('hidden'); });
  btnCloseModal.addEventListener('click', () => editModal.classList.add('hidden'));
  btnSaveModal.addEventListener('click', saveEditDetails);
  btnSelectCover.addEventListener('click', uploadCoverImage);

  const chkStartup = document.getElementById('chk-startup');
  if (chkStartup) {
    chkStartup.addEventListener('change', async (e) => {
      try {
        await window.api.setStartupSettings(e.target.checked);
      } catch (err) {
        showToast('Başlangıç ayarı değiştirilemedi.', 'error');
        e.target.checked = !e.target.checked;
      }
    });
  }

  const btnLangToggle = document.getElementById('btn-lang-toggle');
  if (btnLangToggle) {
    btnLangToggle.addEventListener('click', () => {
      const nextLang = currentLanguage === 'tr' ? 'en' : 'tr';
      loadLanguage(nextLang);
    });
  }

  const aboutModal = document.getElementById('about-modal');
  document.getElementById('btn-about').addEventListener('click', () => aboutModal.classList.remove('hidden'));
  document.getElementById('btn-close-about-modal').addEventListener('click', () => aboutModal.classList.add('hidden'));
  // Overlay tıklamasıyla tüm modalları kapat
  aboutModal.addEventListener('click', (e) => { if (e.target === aboutModal) aboutModal.classList.add('hidden'); });
  document.getElementById('link-github').addEventListener('click', (e) => { e.preventDefault(); window.api.openExternal('https://github.com/MaximusPrime77/PrimeMix'); });
  document.getElementById('link-email').addEventListener('click', (e) => { e.preventDefault(); window.api.openExternal('mailto:b.maximus.prime@gmail.com'); });

  window.api.onStopAllSounds(() => pauseAllActiveSounds());
  window.api.onSoundsChanged(() => loadSounds(true));
  window.api.onToggleGlobalPlay(() => btnGlobalPlay.click());
}

function closeCustomDropdown() {
  timerSelectContainer.classList.remove('open');
  timerDropdownOptions.classList.add('hidden');
}

function startSleepTimer(minutes) {
  if (sleepTimer) clearInterval(sleepTimer);
  sleepTimeRemaining = minutes * 60;
  timerSelectContainer.classList.add('hidden');
  timerDisplay.classList.remove('hidden');
  updateTimerDisplay();

  sleepTimer = setInterval(() => {
    sleepTimeRemaining--;
    if (sleepTimeRemaining <= 0) {
      clearInterval(sleepTimer);
      sleepTimer = null;
      // Uyku zamanlayıcısı: sesleri SİLME, sadece DURAKLAT
      // Kullanıcı ertesi gün açınca sesleri sıfırdan kurmak zorunda kalmasın
      pauseAllActiveSounds();
      cancelSleepTimer();
      showToast('🌙 Uyku zamanlayıcısı sona erdi. İyi geceler!', 'info');
    } else updateTimerDisplay();
  }, 1000);
}

function updateTimerDisplay() {
  const mins = Math.floor(sleepTimeRemaining / 60);
  const secs = sleepTimeRemaining % 60;
  timerTime.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function cancelSleepTimer() {
  if (sleepTimer) { clearInterval(sleepTimer); sleepTimer = null; }
  timerTriggerText.textContent = translations['timer_off'] || "Kapat";
  customOptions.forEach(opt => {
    if (opt.dataset.value === "0") opt.classList.add('active');
    else opt.classList.remove('active');
  });
  timerSelectContainer.classList.remove('hidden');
  timerDisplay.classList.add('hidden');
}

function loadSavedMixes() {
  mixesList.innerHTML = '';
  const mixes = JSON.parse(localStorage.getItem('primemix_mixes') || localStorage.getItem('serenemix_mixes') || '[]');
  if (mixes.length === 0) {
    mixesList.innerHTML = `<p class="empty-text">${translations['no_saved_mixes'] || 'Henüz kayıtlı karışımınız yok.'}</p>`;
    return;
  }

  mixes.forEach(mix => {
    const item = document.createElement('div');
    item.className = 'mix-item';
    const soundTitles = mix.sounds.map(s => {
      const originalSound = sounds.find(orig => orig.filename === s.filename);
      return originalSound ? originalSound.title : s.filename;
    });
    item.innerHTML = `
      <div class="mix-info" onclick="applyMix('${mix.id}')">
        <span class="mix-name">${mix.name}</span>
        <span class="mix-details">${soundTitles.join(' + ')}</span>
      </div>
      <button class="btn-icon" onclick="deleteMix('${mix.id}', event)" title="Sil">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
      </button>
    `;
    mixesList.appendChild(item);
  });
}

function saveMix(name) {
  const currentMixSounds = [];
  Object.keys(activeAudio).forEach(filename => {
    currentMixSounds.push({ filename: filename, volume: activeAudio[filename].volume });
  });

  const newMix = { id: 'mix_' + Date.now(), name: name, sounds: currentMixSounds };
  const mixes = JSON.parse(localStorage.getItem('primemix_mixes') || localStorage.getItem('serenemix_mixes') || '[]');
  mixes.push(newMix);
  localStorage.setItem('primemix_mixes', JSON.stringify(mixes));
  loadSavedMixes();
  showToast('Karışım başarıyla kaydedildi.', 'info');
}

async function applyMix(id) {
  const mixes = JSON.parse(localStorage.getItem('primemix_mixes') || localStorage.getItem('serenemix_mixes') || '[]');
  const mix = mixes.find(m => m.id === id);
  if (!mix) return;

  // Önce mevcut sesleri temizle
  clearAllActiveSounds();
  await new Promise(resolve => setTimeout(resolve, 420));

  // Yeni sesleri başlat, eksik olanları kaydet
  const limitSounds = mix.sounds.slice(0, 3);
  let loadedCount = 0;
  let missingCount = 0;

  for (const s of limitSounds) {
    const originalSound = sounds.find(orig => orig.filename === s.filename);
    if (originalSound) {
      originalSound.volume = s.volume;
      await toggleSound(s.filename);
      loadedCount++;
    } else {
      missingCount++;
    }
  }

  if (loadedCount === 0) {
    showToast(`"${mix.name}" karışımındaki sesler bulunamadı. Dosyalar silinmiş olabilir.`, 'error');
  } else if (missingCount > 0) {
    showToast(`"${mix.name}" yüklendi (${missingCount} ses eksik — dosya bulunamadı).`, 'warning');
  } else {
    showToast(`"${mix.name}" karışımı yüklendi. 🎧`, 'info');
  }
}

function deleteMix(id, event) {
  event.stopPropagation();
  let mixes = JSON.parse(localStorage.getItem('primemix_mixes') || localStorage.getItem('serenemix_mixes') || '[]');
  mixes = mixes.filter(m => m.id !== id);
  localStorage.setItem('primemix_mixes', JSON.stringify(mixes));
  loadSavedMixes();
}

function openEditModal(filename) {
  const sound = sounds.find(s => s.filename === filename);
  if (!sound) return;
  selectedSoundForEdit = sound;
  editFilename.value = sound.filename;
  editTitle.value = sound.title;
  editCategory.value = sound.category;
  updateCoverPreview(sound);
  editModal.classList.remove('hidden');
}

function updateCoverPreview(sound) {
  if (sound.cover) {
    const fullCoverPath = `${sound.filePath.replace(sound.filename, '')}${sound.cover}`;
    const mediaUrl = getMediaUrl(fullCoverPath);
    editCoverPreview.style.backgroundImage = `url('${encodeURI(mediaUrl)}')`;
    editCoverPreview.style.background = '';
  } else {
    editCoverPreview.style.backgroundImage = '';
    editCoverPreview.style.background = sound.color;
  }
}

async function uploadCoverImage() {
  if (!selectedSoundForEdit) return;
  const result = await window.api.addCover(selectedSoundForEdit.filename);
  if (result.success) {
    selectedSoundForEdit.cover = result.coverPath;
    updateCoverPreview(selectedSoundForEdit);
    renderSoundsGrid();
    showToast('Kapak görseli güncellendi.', 'info');
  } else if (result.error) showToast(`Resim yüklenirken hata oluştu: ${result.error}`, 'error');
}

async function saveEditDetails() {
  const filename = editFilename.value;
  const title = editTitle.value.trim();
  const category = editCategory.value;

  if (!title) { showToast(translations['alert_enter_title'] || 'Lütfen bir başlık girin.', 'warning'); return; }

  const response = await window.api.saveSoundMetadata(filename, { title: title, category: category });
  if (response.success) {
    const sound = sounds.find(s => s.filename === filename);
    if (sound) { sound.title = title; sound.category = category; }
    editModal.classList.add('hidden');
    renderSoundsGrid();
    showToast('Ses detayları kaydedildi.', 'info');
  } else showToast(`Kaydedilemedi: ${response.error}`, 'error');
}

async function confirmDeleteSound(filename) {
  const sound = sounds.find(s => s.filename === filename);
  if (!sound) return;

  const confirmMsg = currentLanguage === 'tr' ? `"${sound.title}" sesini silmek istediğinize emin misiniz?` : `Are you sure you want to delete "${sound.title}"?`;
  showConfirm(confirmMsg, async () => {
    if (activeAudio[filename]) {
      activeAudio[filename].pause();
      delete activeAudio[filename];
      updateGlobalPlayButtonState();
    }
    const response = await window.api.deleteSound(filename);
    if (response.success) {
      await loadSounds(true);
      showToast('Ses dosyası silindi.', 'info');
    } else showToast(`Silme başarısız: ${response.error}`, 'error');
  });
}

function removeActiveSound(filename) {
  if (activeAudio[filename]) {
    const audio = activeAudio[filename];
    fadeOutAudio(audio, () => {
      audio.pause();
      delete activeAudio[filename];
      updateGlobalPlayButtonState();
      renderSoundsGrid();
      updateActiveSoundsPanel();
      updateAmbientAtmosphere();
    });
  }
}

function updateActiveSoundsPanel() {
  const activeKeys = Object.keys(activeAudio);
  if (activeKeys.length === 0) { 
    activeSoundsBar.classList.add('hidden'); 
    updateMiniModePanel();
    return; 
  }
  
  activeSoundsBar.classList.remove('hidden');
  activeSoundsList.innerHTML = '';
  
  activeKeys.forEach(filename => {
    const sound = sounds.find(s => s.filename === filename);
    if (!sound) return;
    const audio = activeAudio[filename];
    const isPaused = audio.paused;
    const item = document.createElement('div');
    item.className = `active-sound-item ${isPaused ? 'paused' : ''}`;
    item.dataset.filename = filename;
    
    let coverStyle = '';
    if (sound.cover) {
      const fullCoverPath = `${sound.filePath.replace(sound.filename, '')}${sound.cover}`;
      coverStyle = `background-image: url('${encodeURI(getMediaUrl(fullCoverPath))}');`;
    } else coverStyle = `background: ${sound.color};`;
    
    const titleKey = `sound_${sound.filename.replace(/\.[^/.]+$/, "")}`;
    const translatedTitle = translations[titleKey] || sound.title;
    
    item.innerHTML = `
      <div class="active-sound-cover" style="${coverStyle}"></div>
      <div class="active-sound-info">
        <span class="active-sound-name" title="${translatedTitle}">${translatedTitle}</span>
        <div class="active-sound-controls">
          <div class="active-sound-slider-container">
            <input type="range" class="active-sound-slider" min="0" max="1" step="0.01" value="${sound.volume}" oninput="changeSoundVolume('${filename}', this.value)">
          </div>
          <button class="btn-active-sound-action play-pause" onclick="toggleSound('${filename}')" title="${isPaused ? (translations['play_all'] || 'Çal') : (translations['stop_all'] || 'Durdur')}">
            ${isPaused ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>` : `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`}
          </button>
          <button class="btn-active-sound-action remove" onclick="removeActiveSound('${filename}')" title="${translations['delete'] || 'Kaldır'}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
    `;
    activeSoundsList.appendChild(item);
  });

  updateMiniModePanel();
}

function updateMiniModePanel() {
  if (!miniActiveList) return;
  miniActiveList.innerHTML = '';
  const activeKeys = Object.keys(activeAudio);
  if (activeKeys.length === 0) {
    miniActiveList.innerHTML = `<p class="empty-text">${translations['no_sounds_found'] || 'Aktif ses yok.'}</p>`;
    return;
  }
  activeKeys.forEach(filename => {
    const sound = sounds.find(s => s.filename === filename);
    if (!sound) return;
    const audio = activeAudio[filename];
    const isPaused = audio.paused;
    const titleKey = `sound_${sound.filename.replace(/\.[^/.]+$/, "")}`;
    const translatedTitle = translations[titleKey] || sound.title;

    const item = document.createElement('div');
    item.className = `active-sound-item ${isPaused ? 'paused' : ''}`;
    item.style.padding = '6px 10px';
    item.innerHTML = `
      <span class="active-sound-name" style="flex:1; font-size:11px; font-weight:600;" title="${translatedTitle}">${translatedTitle}</span>
      <div style="display:flex; align-items:center; gap:4px;">
        <button class="btn-active-sound-action play-pause" onclick="toggleSound('${filename}')" title="Çal/Durdur">
          ${isPaused ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>` : `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`}
        </button>
        <button class="btn-active-sound-action remove" onclick="removeActiveSound('${filename}')" title="Kaldır">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
    `;
    miniActiveList.appendChild(item);
  });
}
