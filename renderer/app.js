// PrimeMix - Frontend Logic with i18n support, Audio limits & Crossfading

// State Management
let sounds = [];
const activeAudio = {}; // filename -> Audio object
let currentCategory = 'all';
let searchQuery = '';
let isGlobalPlaying = false;
let sleepTimer = null;
let sleepTimeRemaining = 0; // seconds
let selectedSoundForEdit = null;

// Multi-language State
let currentLanguage = localStorage.getItem('primemix_lang') || localStorage.getItem('serenemix_lang') || 'en';
let translations = {};

// DOM Elements
const btnMinimize = document.getElementById('btn-minimize');
const btnMaximize = document.getElementById('btn-maximize');
const btnClose = document.getElementById('btn-close');
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
const btnAddSound = document.getElementById('btn-add-sound');
const btnOpenFolder = document.getElementById('btn-open-folder');
const btnSaveMix = document.getElementById('btn-save-mix');
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

// Category to translation key mapping
const catKeyMap = {
  'Doğa': 'cat_nature',
  'Şehir': 'cat_urban',
  'Hayvanlar': 'cat_animals',
  'Müzik': 'cat_music',
  'Enstrümantal': 'cat_bells',
  'Gürültü': 'cat_noise',
  'Genel': 'cat_other'
};

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
  }, 3000);
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

  const handleOk = () => {
    cleanup();
    onConfirm();
  };
  const handleCancel = () => {
    cleanup();
  };
  const cleanup = () => {
    confirmModal.classList.add('hidden');
    btnOk.removeEventListener('click', handleOk);
    btnCancel.removeEventListener('click', handleCancel);
  };

  btnOk.addEventListener('click', handleOk);
  btnCancel.addEventListener('click', handleCancel);
}

// Media URL Helper (Uses secure media:// protocol)
function getMediaUrl(filePath) {
  if (!filePath) return '';
  const cleanPath = filePath.replace(/\\/g, '/');
  return `media://${cleanPath}`;
}

// Active playing count helper (Max 3 constraint)
function getActivePlayingCount() {
  return Object.values(activeAudio).filter(audio => !audio.paused).length;
}

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
  initWindowControls();
  await loadLanguage(currentLanguage);
  await loadSounds();
  loadSavedMixes();
  loadSettings();
  initEventListeners();
});

// Load Translation Files
async function loadLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem('primemix_lang', lang);

  try {
    const response = await fetch(`./locales/${lang}.json`);
    translations = await response.json();

    // Translate DOM elements marked with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[key]) {
        if (el.tagName === 'INPUT') {
          el.placeholder = translations[key];
        } else if (el.tagName === 'OPTION') {
          el.textContent = translations[key];
        } else {
          const textNode = Array.from(el.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
          if (textNode) {
            textNode.textContent = translations[key];
          } else {
            el.textContent = translations[key];
          }
        }
      }
    });

    const btnLangToggle = document.getElementById('btn-lang-toggle');
    if (btnLangToggle) {
      btnLangToggle.textContent = lang.toUpperCase();
    }

    window.api.setLanguage(lang);

    updateGlobalPlayButtonState();
    loadSavedMixes();
    renderSoundsGrid();
    updateActiveSoundsPanel();

    const btnMaximize = document.getElementById('btn-maximize');
    if (btnMaximize) {
      const isMaximized = btnMaximize.innerHTML.includes('rect x="1.5" y="3.5"');
      if (isMaximized) {
        btnMaximize.title = lang === 'tr' ? 'Aşağı Getir' : 'Restore';
      } else {
        btnMaximize.title = lang === 'tr' ? 'Ekranı Kapla' : 'Maximize';
      }
    }
  } catch (err) {
    console.error('Failed to load language files:', err);
  }
}

// Window Controls
function initWindowControls() {
  btnMinimize.addEventListener('click', () => window.api.minimize());
  btnMaximize.addEventListener('click', () => window.api.maximize());
  btnClose.addEventListener('click', () => window.api.close());

  window.api.onWindowStateChanged((state) => {
    if (state === 'maximized') {
      btnMaximize.innerHTML = `<svg width="10" height="10" viewBox="0 0 10 10"><rect x="1.5" y="3.5" width="5" height="5" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M3.5 3.5V1.5H8.5V6.5H6.5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>`;
      btnMaximize.title = currentLanguage === 'tr' ? 'Aşağı Getir' : 'Restore';
    } else {
      btnMaximize.innerHTML = `<svg width="10" height="10" viewBox="0 0 10 10"><rect x="1.5" y="1.5" width="7" height="7" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>`;
      btnMaximize.title = currentLanguage === 'tr' ? 'Ekranı Kapla' : 'Maximize';
    }
  });
}

// Load Application Settings
async function loadSettings() {
  try {
    const openAtLogin = await window.api.getStartupSettings();
    const chkStartup = document.getElementById('chk-startup');
    if (chkStartup) {
      chkStartup.checked = openAtLogin;
    }
  } catch (err) {
    console.error('Başlangıç ayarı yüklenemedi:', err);
  }
}

// Load Sounds from Local Storage/Folder
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

// Render Grid
function renderSoundsGrid() {
  const filtered = sounds.filter(sound => {
    const matchesCategory = currentCategory === 'all' || sound.category === currentCategory;
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
    card.className = `sound-card ${isActive ? 'active' : ''} ${isPaused ? 'paused' : ''}`;
    card.dataset.filename = sound.filename;

    let coverStyle = '';
    if (sound.cover) {
      const folderPath = sound.filePath.substring(0, sound.filePath.lastIndexOf(sound.filename.replace(/\//g, '\\')));
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
      <div class="cover-container" style="${coverStyle}" onclick="toggleSound('${sound.filename}')">
        <div class="cover-overlay">
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
        <div class="card-actions">
          <button class="btn-icon btn-card-edit" onclick="openEditModal('${sound.filename}')" title="${translations['customize_sound'] || 'Düzenle'}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </button>
          <button class="btn-icon btn-card-delete" onclick="confirmDeleteSound('${sound.filename}')" title="${translations['delete'] || 'Sil'}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
          </button>
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

// Fade Helpers for Smooth Audio Crossfading
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

// Toggle Sound Play/Pause with Max 3 constraint & Fade-in/out
async function toggleSound(filename) {
  const sound = sounds.find(s => s.filename === filename);
  if (!sound) return;

  const isCurrentlyActive = activeAudio[filename] !== undefined;
  const isCurrentlyPaused = isCurrentlyActive && activeAudio[filename].paused;

  // Check Max 3 sounds constraint before playing
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
        console.error(translations['alert_audio_error_log'] || 'Ses oynatılamadı:', err);
        showToast(translations['alert_audio_error'] || 'Ses dosyası çalınamadı.', 'error');
        return;
      }
    } else {
      fadeOutAudio(activeAudio[filename], () => {
        activeAudio[filename].pause();
        updateGlobalPlayButtonState();
        renderSoundsGrid();
        updateActiveSoundsPanel();
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
      console.error(translations['alert_audio_error_log'] || 'Ses oynatılamadı:', err);
      showToast(translations['alert_audio_error'] || 'Ses dosyası çalınamadı.', 'error');
      return;
    }
  }

  updateGlobalPlayButtonState();
  renderSoundsGrid();
  updateActiveSoundsPanel();
}

// Volume Control
function changeSoundVolume(filename, volume) {
  const sound = sounds.find(s => s.filename === filename);
  if (sound) {
    sound.volume = parseFloat(volume);
    
    if (activeAudio[filename]) {
      activeAudio[filename].volume = sound.volume;
    }
    
    const gridSlider = document.querySelector(`.sound-card[data-filename="${filename}"] .volume-slider`);
    if (gridSlider) gridSlider.value = volume;
    
    const activeSlider = document.querySelector(`.active-sound-item[data-filename="${filename}"] .active-sound-slider`);
    if (activeSlider) activeSlider.value = volume;
    
    window.api.saveSoundMetadata(filename, { volume: sound.volume });
  }
}

// Global controls
function updateGlobalPlayButtonState() {
  const playingCount = getActivePlayingCount();
  isGlobalPlaying = playingCount > 0;

  const btnText = btnGlobalPlay.querySelector('span');
  const iconPlay = btnGlobalPlay.querySelector('.icon-play');
  const iconPause = btnGlobalPlay.querySelector('.icon-pause');

  if (isGlobalPlaying) {
    btnGlobalPlay.classList.add('active');
    btnText.textContent = translations['stop_all'] || "Tümünü Durdur";
    iconPlay.classList.add('hidden');
    iconPause.classList.remove('hidden');
  } else {
    btnGlobalPlay.classList.remove('active');
    btnText.textContent = translations['play_all'] || "Tümünü Çal";
    iconPlay.classList.remove('hidden');
    iconPause.classList.add('hidden');
  }
}

// Stop all sounds with smooth fade out
function stopAllSounds() {
  Object.keys(activeAudio).forEach(filename => {
    const audio = activeAudio[filename];
    fadeOutAudio(audio, () => {
      audio.pause();
      delete activeAudio[filename];
      updateGlobalPlayButtonState();
      renderSoundsGrid();
      updateActiveSoundsPanel();
    });
  });
}

// Event Listeners
function initEventListeners() {
  // Global Play/Pause (Max 3 Limit)
  btnGlobalPlay.addEventListener('click', () => {
    if (isGlobalPlaying) {
      stopAllSounds();
    } else {
      const limit = Math.min(sounds.length, 3);
      for (let i = 0; i < limit; i++) {
        if (!activeAudio[sounds[i].filename] || activeAudio[sounds[i].filename].paused) {
          toggleSound(sounds[i].filename);
        }
      }
    }
  });

  btnClearAllActive.addEventListener('click', () => {
    stopAllSounds();
  });

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderSoundsGrid();
  });

  categoryTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
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
    if (isOpen) {
      closeCustomDropdown();
    } else {
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

      if (val > 0) {
        startSleepTimer(val);
      } else {
        cancelSleepTimer();
      }
    });
  });

  document.addEventListener('click', () => {
    closeCustomDropdown();
  });

  btnCancelTimer.addEventListener('click', () => {
    cancelSleepTimer();
  });

  btnSaveMix.addEventListener('click', () => {
    const activeCount = Object.keys(activeAudio).length;
    if (activeCount === 0) {
      showToast(translations['alert_play_first'] || 'Karışım oluşturmak için lütfen en az bir ses çalın.', 'warning');
      return;
    }
    mixNameInput.value = '';
    saveMixModal.classList.remove('hidden');
  });

  btnCloseMixModal.addEventListener('click', () => {
    saveMixModal.classList.add('hidden');
  });

  btnConfirmSaveMix.addEventListener('click', () => {
    const name = mixNameInput.value.trim();
    if (!name) {
      showToast(translations['alert_enter_name'] || 'Lütfen karışım için bir isim girin.', 'warning');
      return;
    }
    saveMix(name);
    saveMixModal.classList.add('hidden');
  });

  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) editModal.classList.add('hidden');
  });
  btnCloseModal.addEventListener('click', () => {
    editModal.classList.add('hidden');
  });

  btnSaveModal.addEventListener('click', saveEditDetails);
  btnSelectCover.addEventListener('click', uploadCoverImage);

  const chkStartup = document.getElementById('chk-startup');
  if (chkStartup) {
    chkStartup.addEventListener('change', async (e) => {
      try {
        const isChecked = e.target.checked;
        await window.api.setStartupSettings(isChecked);
      } catch (err) {
        console.error('Başlangıç ayarı kaydedilemedi:', err);
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
  document.getElementById('btn-about').addEventListener('click', () => {
    aboutModal.classList.remove('hidden');
  });

  document.getElementById('btn-close-about-modal').addEventListener('click', () => {
    aboutModal.classList.add('hidden');
  });

  document.getElementById('link-github').addEventListener('click', (e) => {
    e.preventDefault();
    window.api.openExternal('https://github.com/MaximusPrime77/PrimeMix');
  });

  document.getElementById('link-email').addEventListener('click', (e) => {
    e.preventDefault();
    window.api.openExternal('mailto:b.maximus.prime@gmail.com');
  });

  window.api.onStopAllSounds(() => {
    stopAllSounds();
  });

  window.api.onSoundsChanged(() => {
    loadSounds(true); 
  });
}

function closeCustomDropdown() {
  timerSelectContainer.classList.remove('open');
  timerDropdownOptions.classList.add('hidden');
}

// Sleep Timer Logic
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
      fadeOutAndStopSounds();
      cancelSleepTimer();
    } else {
      updateTimerDisplay();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const mins = Math.floor(sleepTimeRemaining / 60);
  const secs = sleepTimeRemaining % 60;
  timerTime.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function cancelSleepTimer() {
  if (sleepTimer) {
    clearInterval(sleepTimer);
    sleepTimer = null;
  }
  
  timerTriggerText.textContent = translations['timer_off'] || "Kapat";
  customOptions.forEach(opt => {
    if (opt.dataset.value === "0") opt.classList.add('active');
    else opt.classList.remove('active');
  });

  timerSelectContainer.classList.remove('hidden');
  timerDisplay.classList.add('hidden');
}

function fadeOutAndStopSounds() {
  stopAllSounds();
}

// Saved Mixes Logic
function loadSavedMixes() {
  mixesList.innerHTML = '';
  const mixes = JSON.parse(localStorage.getItem('primemix_mixes') || localStorage.getItem('serenemix_mixes') || localStorage.getItem('huzur_mixes') || '[]');
  
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
    currentMixSounds.push({
      filename: filename,
      volume: activeAudio[filename].volume
    });
  });

  const newMix = {
    id: 'mix_' + Date.now(),
    name: name,
    sounds: currentMixSounds
  };

  const mixes = JSON.parse(localStorage.getItem('primemix_mixes') || localStorage.getItem('serenemix_mixes') || localStorage.getItem('huzur_mixes') || '[]');
  mixes.push(newMix);
  localStorage.setItem('primemix_mixes', JSON.stringify(mixes));
  loadSavedMixes();
  showToast('Karışım başarıyla kaydedildi.', 'info');
}

function applyMix(id) {
  const mixes = JSON.parse(localStorage.getItem('primemix_mixes') || localStorage.getItem('serenemix_mixes') || localStorage.getItem('huzur_mixes') || '[]');
  const mix = mixes.find(m => m.id === id);
  if (!mix) return;

  stopAllSounds();

  // En fazla 3 ses uygulayacak şekilde limitle
  const limitSounds = mix.sounds.slice(0, 3);
  limitSounds.forEach(s => {
    const originalSound = sounds.find(orig => orig.filename === s.filename);
    if (originalSound) {
      originalSound.volume = s.volume;
      toggleSound(s.filename);
    }
  });
}

function deleteMix(id, event) {
  event.stopPropagation();
  let mixes = JSON.parse(localStorage.getItem('primemix_mixes') || localStorage.getItem('serenemix_mixes') || localStorage.getItem('huzur_mixes') || '[]');
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
  } else if (result.error) {
    showToast(`Resim yüklenirken hata oluştu: ${result.error}`, 'error');
  }
}

async function saveEditDetails() {
  const filename = editFilename.value;
  const title = editTitle.value.trim();
  const category = editCategory.value;

  if (!title) {
    showToast(translations['alert_enter_title'] || 'Lütfen bir başlık girin.', 'warning');
    return;
  }

  const response = await window.api.saveSoundMetadata(filename, {
    title: title,
    category: category
  });

  if (response.success) {
    const sound = sounds.find(s => s.filename === filename);
    if (sound) {
      sound.title = title;
      sound.category = category;
    }
    
    editModal.classList.add('hidden');
    renderSoundsGrid();
    showToast('Ses detayları kaydedildi.', 'info');
  } else {
    showToast(`Kaydedilemedi: ${response.error}`, 'error');
  }
}

async function confirmDeleteSound(filename) {
  const sound = sounds.find(s => s.filename === filename);
  if (!sound) return;

  const confirmMsg = currentLanguage === 'tr' 
    ? `"${sound.title}" sesini silmek istediğinize emin misiniz?` 
    : `Are you sure you want to delete "${sound.title}"?`;

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
    } else {
      showToast(`Silme başarısız: ${response.error}`, 'error');
    }
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
    });
  }
}

function updateActiveSoundsPanel() {
  const activeKeys = Object.keys(activeAudio);
  
  if (activeKeys.length === 0) {
    activeSoundsBar.classList.add('hidden');
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
      const mediaUrl = getMediaUrl(fullCoverPath);
      coverStyle = `background-image: url('${encodeURI(mediaUrl)}');`;
    } else {
      coverStyle = `background: ${sound.color};`;
    }
    
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
            ${isPaused ? 
              `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>` : 
              `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
            }
          </button>
          <button class="btn-active-sound-action remove" onclick="removeActiveSound('${filename}')" title="${translations['delete'] || 'Kaldır'}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
    `;
    
    activeSoundsList.appendChild(item);
  });
}
