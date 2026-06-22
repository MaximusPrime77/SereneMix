// SereneMix - Frontend Logic with i18n support

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
let currentLanguage = localStorage.getItem('serenemix_lang') || 'en';
let translations = {};

// DOM Elements
const btnMinimize = document.getElementById('btn-minimize');
const btnMaximize = document.getElementById('btn-maximize');
const btnClose = document.getElementById('btn-close');
const btnGlobalPlay = document.getElementById('btn-global-play');

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
  localStorage.setItem('serenemix_lang', lang);

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
          // Replace only the text node inside elements (retaining internal SVGs or icons)
          const textNode = Array.from(el.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
          if (textNode) {
            textNode.textContent = translations[key];
          } else {
            el.textContent = translations[key];
          }
        }
      }
    });

    // Update Lang toggle button display
    const btnLangToggle = document.getElementById('btn-lang-toggle');
    if (btnLangToggle) {
      btnLangToggle.textContent = lang.toUpperCase();
    }

    // Refresh UI elements
    updateGlobalPlayButtonState();
    loadSavedMixes();
  } catch (err) {
    console.error('Failed to load language files:', err);
  }
}

// Window Controls
function initWindowControls() {
  btnMinimize.addEventListener('click', () => window.api.minimize());
  btnMaximize.addEventListener('click', () => window.api.maximize());
  btnClose.addEventListener('click', () => window.api.close());
}

// Load Application Settings (Startup setting)
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
    // If sounds are playing but deleted, stop them
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
    // Check if the tab filtering matches
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
    card.className = `sound-card ${activeAudio[sound.filename] ? 'active' : ''}`;
    card.dataset.filename = sound.filename;

    // Cover art setup
    let coverStyle = '';
    if (sound.cover) {
      const coverUrl = `file:///${sound.filePath.replace(/\\/g, '/').replace(sound.filename, '')}${sound.cover.replace(/\\/g, '/')}`;
      coverStyle = `background-image: url('${encodeURI(coverUrl)}');`;
    } else {
      coverStyle = `background: ${sound.color};`;
    }

    // Translate category dynamically on sound card display
    const transKey = catKeyMap[sound.category] || 'cat_other';
    const translatedCategory = translations[transKey] || sound.category;

    // Translate sound title dynamically if key exists
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
            ${activeAudio[sound.filename] ? 
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

// Toggle Sound Play/Pause
async function toggleSound(filename) {
  const sound = sounds.find(s => s.filename === filename);
  if (!sound) return;

  if (activeAudio[filename]) {
    activeAudio[filename].pause();
    delete activeAudio[filename];
  } else {
    const filePath = `file:///${sound.filePath.replace(/\\/g, '/')}`;
    const audio = new Audio(filePath);
    audio.loop = true;
    audio.volume = sound.volume;
    
    try {
      await audio.play();
      activeAudio[filename] = audio;
    } catch (err) {
      console.error(translations['alert_audio_error_log'] || 'Ses oynatılamadı:', err);
      alert(translations['alert_audio_error'] || 'Ses dosyası çalınamadı. Dosyanın mevcut olduğundan emin olun.');
      return;
    }
  }

  updateGlobalPlayButtonState();
  renderSoundsGrid();
}

// Volume Control
function changeSoundVolume(filename, volume) {
  const sound = sounds.find(s => s.filename === filename);
  if (sound) {
    sound.volume = parseFloat(volume);
    
    if (activeAudio[filename]) {
      activeAudio[filename].volume = sound.volume;
    }
    
    window.api.saveSoundMetadata(filename, { volume: sound.volume });
  }
}

// Global controls
function updateGlobalPlayButtonState() {
  const playingCount = Object.keys(activeAudio).length;
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

// Stop all sounds
function stopAllSounds() {
  Object.keys(activeAudio).forEach(filename => {
    activeAudio[filename].pause();
    delete activeAudio[filename];
  });
  updateGlobalPlayButtonState();
  renderSoundsGrid();
}

// Event Listeners
function initEventListeners() {
  // Global Play/Pause
  btnGlobalPlay.addEventListener('click', () => {
    if (isGlobalPlaying) {
      stopAllSounds();
    } else {
      const limit = Math.min(sounds.length, 3);
      for (let i = 0; i < limit; i++) {
        if (!activeAudio[sounds[i].filename]) {
          toggleSound(sounds[i].filename);
        }
      }
    }
  });

  // Search input
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderSoundsGrid();
  });

  // Category filtering
  categoryTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      categoryTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCategory = tab.dataset.category;
      renderSoundsGrid();
    });
  });

  // Open folder
  btnOpenFolder.addEventListener('click', () => window.api.openFolder());

  // Add sound
  btnAddSound.addEventListener('click', async () => {
    const result = await window.api.addSound();
    if (result.success) {
      await loadSounds();
    } else if (result.error) {
      alert(`Ses eklenirken hata oluştu: ${result.error}`);
    }
  });

  // Custom Dropdown Trigger Click
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

  // Custom Options Click
  customOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = parseInt(option.dataset.value);
      const text = option.textContent;

      // Update active option styling
      customOptions.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');

      // Update trigger visual text
      timerTriggerText.textContent = text;

      closeCustomDropdown();

      // Timer trigger logic
      if (val > 0) {
        startSleepTimer(val);
      } else {
        cancelSleepTimer();
      }
    });
  });

  // Close dropdown on clicking outside
  document.addEventListener('click', () => {
    closeCustomDropdown();
  });

  // Timer Cancel Click
  btnCancelTimer.addEventListener('click', () => {
    cancelSleepTimer();
  });

  // Save Mix triggers
  btnSaveMix.addEventListener('click', () => {
    const activeCount = Object.keys(activeAudio).length;
    if (activeCount === 0) {
      alert(translations['alert_play_first'] || 'Karışım oluşturmak için lütfen en az bir ses çalın.');
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
      alert(translations['alert_enter_name'] || 'Lütfen karışım için bir isim girin.');
      return;
    }
    saveMix(name);
    saveMixModal.classList.add('hidden');
  });

  // Edit modal close
  btnCloseModal.addEventListener('click', () => {
    editModal.classList.add('hidden');
  });

  btnSaveModal.addEventListener('click', saveEditDetails);
  btnSelectCover.addEventListener('click', uploadCoverImage);

  // Startup configuration change
  const chkStartup = document.getElementById('chk-startup');
  if (chkStartup) {
    chkStartup.addEventListener('change', async (e) => {
      try {
        const isChecked = e.target.checked;
        await window.api.setStartupSettings(isChecked);
      } catch (err) {
        console.error('Başlangıç ayarı kaydedilemedi:', err);
        alert('Başlangıç ayarı değiştirilemedi.');
        e.target.checked = !e.target.checked;
      }
    });
  }

  // Language Toggle Button Trigger
  const btnLangToggle = document.getElementById('btn-lang-toggle');
  if (btnLangToggle) {
    btnLangToggle.addEventListener('click', () => {
      const nextLang = currentLanguage === 'tr' ? 'en' : 'tr';
      loadLanguage(nextLang);
    });
  }

  // About Modal triggers
  const aboutModal = document.getElementById('about-modal');
  document.getElementById('btn-about').addEventListener('click', () => {
    aboutModal.classList.remove('hidden');
  });

  document.getElementById('btn-close-about-modal').addEventListener('click', () => {
    aboutModal.classList.add('hidden');
  });

  document.getElementById('link-github').addEventListener('click', (e) => {
    e.preventDefault();
    window.api.openExternal('https://github.com/MaximusPrime77');
  });

  document.getElementById('link-email').addEventListener('click', (e) => {
    e.preventDefault();
    window.api.openExternal('mailto:b.maximus.prime@gmail.com');
  });

  // Listen to Tray stop-all event
  window.api.onStopAllSounds(() => {
    stopAllSounds();
  });

  // Listen to Directory Watcher sounds-changed event (Silent update to keep current playback undisturbed)
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

// Show sleep timer value dynamically
function updateTimerDisplay() {
  const mins = Math.floor(sleepTimeRemaining / 60);
  const secs = sleepTimeRemaining % 60;
  timerTime.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Reset Sleep Timer widget
function cancelSleepTimer() {
  if (sleepTimer) {
    clearInterval(sleepTimer);
    sleepTimer = null;
  }
  
  // Reset trigger display text based on translations
  timerTriggerText.textContent = translations['timer_off'] || "Kapat";
  customOptions.forEach(opt => {
    if (opt.dataset.value === "0") opt.classList.add('active');
    else opt.classList.remove('active');
  });

  timerSelectContainer.classList.remove('hidden');
  timerDisplay.classList.add('hidden');
}

// Fade Out Volume
function fadeOutAndStopSounds() {
  const activeCount = Object.keys(activeAudio).length;
  if (activeCount === 0) return;

  const fadeInterval = 50; 
  const fadeDuration = 3000; 
  const steps = fadeDuration / fadeInterval;

  const audioFaders = [];
  Object.keys(activeAudio).forEach(filename => {
    const audio = activeAudio[filename];
    audioFaders.push({
      audio: audio,
      filename: filename,
      stepVol: audio.volume / steps
    });
  });

  let currentStep = 0;
  const fader = setInterval(() => {
    currentStep++;
    audioFaders.forEach(f => {
      const newVol = Math.max(0, f.audio.volume - f.stepVol);
      f.audio.volume = newVol;
    });

    if (currentStep >= steps) {
      clearInterval(fader);
      stopAllSounds();
    }
  }, fadeInterval);
}

// Saved Mixes Logic
function loadSavedMixes() {
  mixesList.innerHTML = '';
  const mixes = JSON.parse(localStorage.getItem('serenemix_mixes') || localStorage.getItem('huzur_mixes') || '[]');
  
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

// Save Mix settings
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

  const mixes = JSON.parse(localStorage.getItem('serenemix_mixes') || localStorage.getItem('huzur_mixes') || '[]');
  mixes.push(newMix);
  localStorage.setItem('serenemix_mixes', JSON.stringify(mixes));
  loadSavedMixes();
}

// Apply Saved Mix
function applyMix(id) {
  const mixes = JSON.parse(localStorage.getItem('serenemix_mixes') || localStorage.getItem('huzur_mixes') || '[]');
  const mix = mixes.find(m => m.id === id);
  if (!mix) return;

  stopAllSounds();

  mix.sounds.forEach(s => {
    const originalSound = sounds.find(orig => orig.filename === s.filename);
    if (originalSound) {
      originalSound.volume = s.volume;
      toggleSound(s.filename);
    }
  });
}

// Delete Mix setting
function deleteMix(id, event) {
  event.stopPropagation();
  let mixes = JSON.parse(localStorage.getItem('serenemix_mixes') || localStorage.getItem('huzur_mixes') || '[]');
  mixes = mixes.filter(m => m.id !== id);
  localStorage.setItem('serenemix_mixes', JSON.stringify(mixes));
  loadSavedMixes();
}

// Edit Sound Details
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
    const coverUrl = `file:///${sound.filePath.replace(/\\/g, '/').replace(sound.filename, '')}${sound.cover.replace(/\\/g, '/')}`;
    editCoverPreview.style.backgroundImage = `url('${encodeURI(coverUrl)}')`;
    editCoverPreview.style.background = '';
  } else {
    editCoverPreview.style.backgroundImage = '';
    editCoverPreview.style.background = sound.color;
  }
}

// Add cover image from disk
async function uploadCoverImage() {
  if (!selectedSoundForEdit) return;
  
  const result = await window.api.addCover(selectedSoundForEdit.filename);
  if (result.success) {
    selectedSoundForEdit.cover = result.coverPath;
    updateCoverPreview(selectedSoundForEdit);
    renderSoundsGrid();
  } else if (result.error) {
    alert(`Resim yüklenirken hata oluştu: ${result.error}`);
  }
}

// Save sound metadata to file
async function saveEditDetails() {
  const filename = editFilename.value;
  const title = editTitle.value.trim();
  const category = editCategory.value;

  if (!title) {
    alert(translations['alert_enter_title'] || 'Lütfen bir başlık girin.');
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
  } else {
    alert(`Kaydedilemedi: ${response.error}`);
  }
}

// Confirm and delete sound file physically
async function confirmDeleteSound(filename) {
  const sound = sounds.find(s => s.filename === filename);
  if (!sound) return;

  const confirmMsg = currentLanguage === 'tr' 
    ? `"${sound.title}" sesini silmek istediğinize emin misiniz?` 
    : `Are you sure you want to delete "${sound.title}"?`;

  if (confirm(confirmMsg)) {
    // Stop sound if it's currently playing
    if (activeAudio[filename]) {
      activeAudio[filename].pause();
      delete activeAudio[filename];
      updateGlobalPlayButtonState();
    }

    const response = await window.api.deleteSound(filename);
    if (response.success) {
      await loadSounds(true); // reload grid silently
    } else {
      alert(`Silme başarısız: ${response.error}`);
    }
  }
}

