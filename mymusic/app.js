// Register Service Worker with relative scope
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => {});
  });
}

// -------------------------------------------------------------
// PWA INSTALL BANNER MANAGEMENT
// -------------------------------------------------------------
let deferredPrompt = null;
const headerInstallBtn = document.getElementById('btn-header-install');
const persistentInstallBanner = document.getElementById('persistent-install-banner');
const bannerInstallBtn = document.getElementById('btn-banner-install');
const bannerDismissBtn = document.getElementById('btn-banner-dismiss');
const isRunningStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

if (!isRunningStandalone) {
  persistentInstallBanner.style.display = 'flex';
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (!isRunningStandalone) {
    persistentInstallBanner.style.display = 'flex';
    if (headerInstallBtn) headerInstallBtn.style.display = 'block';
  }
});

async function triggerPWAInstall() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      persistentInstallBanner.style.display = 'none';
      if (headerInstallBtn) headerInstallBtn.style.display = 'none';
    }
    deferredPrompt = null;
  } else {
    alert('To install the app:\n1. Tap the 3 dots (⋮) in Chrome.\n2. Tap "Install app" (or "Add to Home screen").');
  }
}

if (bannerInstallBtn) bannerInstallBtn.addEventListener('click', triggerPWAInstall);
if (headerInstallBtn) headerInstallBtn.addEventListener('click', triggerPWAInstall);
if (bannerDismissBtn) bannerDismissBtn.addEventListener('click', () => {
  persistentInstallBanner.style.display = 'none';
});

// -------------------------------------------------------------
// PREVENT BACKGROUND APP EXIT ON ANDROID SYSTEM BACK GESTURE
// -------------------------------------------------------------
window.history.pushState({ page: 'home' }, '');
window.addEventListener('popstate', () => {
  const modals = [
    'player-box-modal',
    'playlist-create-modal',
    'settings-modal',
    'rename-modal',
    'timestamp-modal',
    'dev-modal',
    'thanks-modal',
    'welcome-modal'
  ];
  for (const id of modals) {
    const el = document.getElementById(id);
    if (el && el.style.display === 'flex') {
      el.style.display = 'none';
      window.history.pushState({ page: 'home' }, '');
      return;
    }
  }
  window.history.pushState({ page: 'home' }, '');
});

// Toast Notifications
function showNotification(msg) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<div class="toast-msg">${msg}</div><div class="toast-progress"></div>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function showThanksPopup(msg) {
  const modal = document.getElementById('thanks-modal');
  document.getElementById('thanks-msg').textContent = msg;
  modal.style.display = 'flex';
}
document.getElementById('btn-close-thanks').onclick = () => {
  document.getElementById('thanks-modal').style.display = 'none';
};

// -------------------------------------------------------------
// INDEXEDDB ENGINE
// -------------------------------------------------------------
const DB_NAME = 'AmarjeetAudioStudioDB_v70';
const DB_VER = 1;
let db;

function initDB() {
  return new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = (e) => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('playlists')) d.createObjectStore('playlists', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('tracks')) {
        const trk = d.createObjectStore('tracks', { keyPath: 'id', autoIncrement: true });
        trk.createIndex('playlistId', 'playlistId', { unique: false });
      }
      if (!d.objectStoreNames.contains('favorites')) d.createObjectStore('favorites', { keyPath: 'songKey' });
      if (!d.objectStoreNames.contains('config')) d.createObjectStore('config', { keyPath: 'key' });
      if (!d.objectStoreNames.contains('lyrics')) d.createObjectStore('lyrics', { keyPath: 'songKey' });
      if (!d.objectStoreNames.contains('stats')) d.createObjectStore('stats', { keyPath: 'songKey' });
      if (!d.objectStoreNames.contains('dev_profile')) d.createObjectStore('dev_profile', { keyPath: 'key' });
      if (!d.objectStoreNames.contains('timestamps')) d.createObjectStore('timestamps', { keyPath: 'songKey' });
    };
    req.onsuccess = () => { db = req.result; resolve(); };
    req.onerror = () => resolve();
  });
}

const dbOps = {
  async getPlaylists() {
    return new Promise((res) => {
      const tx = db.transaction('playlists', 'readonly');
      tx.objectStore('playlists').getAll().onsuccess = (e) => res(e.target.result || []);
    });
  },
  async savePlaylist(pl) {
    return new Promise((res) => {
      const tx = db.transaction('playlists', 'readwrite');
      tx.objectStore('playlists').put(pl);
      tx.oncomplete = () => res();
    });
  },
  async getAllTracks() {
    return new Promise((res) => {
      const tx = db.transaction('tracks', 'readonly');
      tx.objectStore('tracks').getAll().onsuccess = (e) => res(e.target.result || []);
    });
  },
  async getTracks(playlistId) {
    if (playlistId === 'all') {
      const all = await this.getAllTracks();
      const uniqueMap = new Map();
      all.forEach((trk) => {
        const cleanKey = trk.name.trim().toLowerCase();
        if (!uniqueMap.has(cleanKey)) uniqueMap.set(cleanKey, trk);
      });
      return Array.from(uniqueMap.values());
    }
    return new Promise((res) => {
      const tx = db.transaction('tracks', 'readonly');
      const idx = tx.objectStore('tracks').index('playlistId');
      idx.getAll(playlistId).onsuccess = (e) => res(e.target.result || []);
    });
  },
  async saveTrack(track) {
    return new Promise((res) => {
      const tx = db.transaction('tracks', 'readwrite');
      tx.objectStore('tracks').add(track);
      tx.oncomplete = () => res();
    });
  },
  async updateTrack(track) {
    return new Promise((res) => {
      const tx = db.transaction('tracks', 'readwrite');
      tx.objectStore('tracks').put(track);
      tx.oncomplete = () => res();
    });
  },
  async deleteTrack(id) {
    return new Promise((res) => {
      const tx = db.transaction('tracks', 'readwrite');
      tx.objectStore('tracks').delete(id);
      tx.oncomplete = () => res();
    });
  },
  async isFavorite(songKey) {
    return new Promise((res) => {
      const tx = db.transaction('favorites', 'readonly');
      const req = tx.objectStore('favorites').get(songKey.trim().toLowerCase());
      req.onsuccess = () => res(!!req.result);
    });
  },
  async setFavorite(songKey, trackData) {
    return new Promise((res) => {
      const tx = db.transaction('favorites', 'readwrite');
      tx.objectStore('favorites').put({ songKey: songKey.trim().toLowerCase(), trackData });
      tx.oncomplete = () => res();
    });
  },
  async removeFavorite(songKey) {
    return new Promise((res) => {
      const tx = db.transaction('favorites', 'readwrite');
      tx.objectStore('favorites').delete(songKey.trim().toLowerCase());
      tx.oncomplete = () => res();
    });
  },
  async getConfig(key) {
    return new Promise((res) => {
      const tx = db.transaction('config', 'readonly');
      const req = tx.objectStore('config').get(key);
      req.onsuccess = () => res(req.result ? req.result.val : null);
    });
  },
  async setConfig(key, val) {
    return new Promise((res) => {
      const tx = db.transaction('config', 'readwrite');
      tx.objectStore('config').put({ key, val });
      tx.oncomplete = () => res();
    });
  },
  async getLyrics(songKey) {
    return new Promise((res) => {
      const tx = db.transaction('lyrics', 'readonly');
      const req = tx.objectStore('lyrics').get(songKey.trim().toLowerCase());
      req.onsuccess = () => res(req.result ? req.result.text : '');
    });
  },
  async setLyrics(songKey, text) {
    return new Promise((res) => {
      const tx = db.transaction('lyrics', 'readwrite');
      tx.objectStore('lyrics').put({ songKey: songKey.trim().toLowerCase(), text });
      tx.oncomplete = () => res();
    });
  },
  async incrementPlayCount(songKey) {
    const key = songKey.trim().toLowerCase();
    const count = await this.getPlayCount(key);
    return new Promise((res) => {
      const tx = db.transaction('stats', 'readwrite');
      tx.objectStore('stats').put({ songKey: key, count: count + 1 });
      tx.oncomplete = () => res();
    });
  },
  async getPlayCount(songKey) {
    return new Promise((res) => {
      const tx = db.transaction('stats', 'readonly');
      const req = tx.objectStore('stats').get(songKey.trim().toLowerCase());
      req.onsuccess = () => res(req.result ? req.result.count : 0);
    });
  },
  async getDevProfile() {
    return new Promise((res) => {
      const tx = db.transaction('dev_profile', 'readonly');
      const req = tx.objectStore('dev_profile').get('profile');
      req.onsuccess = () => res(req.result ? req.result.val : null);
    });
  },
  async setDevProfile(val) {
    return new Promise((res) => {
      const tx = db.transaction('dev_profile', 'readwrite');
      tx.objectStore('dev_profile').put({ key: 'profile', val });
      tx.oncomplete = () => res();
    });
  },
  async getTimestamps(songKey) {
    return new Promise((res) => {
      const tx = db.transaction('timestamps', 'readonly');
      const req = tx.objectStore('timestamps').get(songKey.trim().toLowerCase());
      req.onsuccess = () => res(req.result ? req.result.list : []);
    });
  },
  async saveTimestamps(songKey, list) {
    return new Promise((res) => {
      const tx = db.transaction('timestamps', 'readwrite');
      tx.objectStore('timestamps').put({ songKey: songKey.trim().toLowerCase(), list });
      tx.oncomplete = () => res();
    });
  }
};

// ==========================================
// AUDIO ENGINE (SOFTWARE GAIN, EQUALIZER, BASS BOOST, ANALYSER)
// ==========================================
const audio = document.getElementById('audio-engine');
let audioCtx = null;
let sourceNode = null;
let masterGainNode = null;
let preampGain = null;
let bassFilterNode = null;
let analyserNode = null;

const bands = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];
const defaultGains = [18.2, 11.8, 3.7, -1.7, -7.8, 2.1, 9.8, 14.1, -3.6, 11.6];
const defaultPreamp = 14.1;
let filters = [];
let eqEnabled = true;
let currentVol = 0.20; // 20% default volume

function ensureAudioPipeline() {
  if (audioCtx) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return;
  }
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
    sourceNode = audioCtx.createMediaElementSource(audio);

    analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 64;

    masterGainNode = audioCtx.createGain();
    masterGainNode.gain.setValueAtTime(currentVol, audioCtx.currentTime);

    preampGain = audioCtx.createGain();
    preampGain.gain.setValueAtTime(Math.pow(10, defaultPreamp / 20) * 0.35, audioCtx.currentTime);

    bassFilterNode = audioCtx.createBiquadFilter();
    bassFilterNode.type = 'lowshelf';
    bassFilterNode.frequency.value = 80;
    bassFilterNode.gain.value = 0;

    let prevNode = preampGain;
    bands.forEach((freq, i) => {
      const f = audioCtx.createBiquadFilter();
      f.type = i === 0 ? 'lowshelf' : i === bands.length - 1 ? 'highshelf' : 'peaking';
      if (i !== 0 && i !== bands.length - 1) f.Q.value = 1.0;
      f.frequency.value = freq;
      f.gain.value = defaultGains[i];
      prevNode.connect(f);
      prevNode = f;
      filters.push(f);
    });

    sourceNode.connect(preampGain);
    prevNode.connect(bassFilterNode);
    bassFilterNode.connect(analyserNode);
    analyserNode.connect(masterGainNode);
    masterGainNode.connect(audioCtx.destination);

    startVisualizerLoop();
  } catch (e) {
    console.warn('Web Audio routing fallback:', e);
  }
}

// Headphone / Bluetooth Disconnect Protection
if (navigator.mediaDevices && navigator.mediaDevices.ondevicechange !== undefined) {
  navigator.mediaDevices.ondevicechange = () => {
    if (!audio.paused) {
      audio.pause();
      syncButtons(false);
      showNotification('Headphones disconnected: Audio paused');
    }
  };
}

function setVolume(pct) {
  currentVol = pct / 100;
  audio.volume = currentVol;
  if (masterGainNode && audioCtx) {
    masterGainNode.gain.setValueAtTime(currentVol, audioCtx.currentTime);
  }
  const slider = document.getElementById('card-vol-slider');
  const label = document.getElementById('card-vol-label');
  if (slider) slider.value = pct;
  if (label) label.textContent = `${pct}%`;
}

// Spectrum Visualizer
const visualizerCanvas = document.getElementById('audio-visualizer');
const vCtx = visualizerCanvas.getContext('2d');
function startVisualizerLoop() {
  if (!analyserNode) return;
  const bufferLength = analyserNode.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function renderFrame() {
    requestAnimationFrame(renderFrame);
    if (audio.paused) {
      vCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
      return;
    }
    analyserNode.getByteFrequencyData(dataArray);
    vCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);

    const barWidth = (visualizerCanvas.width / bufferLength) * 1.5;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * visualizerCanvas.height;
      vCtx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#2ea043';
      vCtx.fillRect(x, visualizerCanvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 2;
    }
  }
  renderFrame();
}

// State
let activePlaylistId = 'all';
let currentPlaylist = { id: 'all', name: 'All', cover: '' };
let tracks = [];
let allTracksRaw = [];
let currentIndex = -1;
let currentAppLogo = 'icon-192.png';
let currentAppName = 'Amarjeet Studio';
let playMode = 'all';
let speedList = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
let currentSpeedIndex = 2; // 1.0x
let sleepTimerId = null;
let pointA = null;
let pointB = null;
let trackToRename = null;
let currentSongTimestamps = [];
let pendingTimestampTime = 0;

// UI References
const playlistTabs = document.getElementById('playlist-tabs');
const songList = document.getElementById('song-list');
const cardReorderList = document.getElementById('card-reorder-list');
const viewPlaylistName = document.getElementById('view-playlist-name');
const trackCountLabel = document.getElementById('track-count-label');
const librarySearchInput = document.getElementById('library-search-input');
const sortSelect = document.getElementById('sort-select');

const miniCover = document.getElementById('mini-cover');
const miniTitle = document.getElementById('mini-title');
const miniSub = document.getElementById('mini-sub');
const barBtnPlay = document.getElementById('bar-btn-play');
const barBtnLike = document.getElementById('bar-btn-like');

const playerBoxModal = document.getElementById('player-box-modal');
const boxCover = document.getElementById('box-cover');
const boxTitle = document.getElementById('box-title');
const boxPlaylist = document.getElementById('box-playlist');
const boxBtnPrev = document.getElementById('box-btn-prev');
const boxBtnPlay = document.getElementById('box-btn-play');
const boxBtnNext = document.getElementById('box-btn-next');
const modalBtnLike = document.getElementById('modal-btn-like');

const seekBar = document.getElementById('seek-bar');
const currTime = document.getElementById('curr-time');
const durTime = document.getElementById('dur-time');
const seekTicksLayer = document.getElementById('seek-ticks-layer');
const activeMarkerPill = document.getElementById('active-marker-pill');
const activeMarkerName = document.getElementById('active-marker-name');

// Welcome Modal Dismissal
document.getElementById('btn-close-welcome').onclick = () => {
  document.getElementById('welcome-modal').style.display = 'none';
  ensureAudioPipeline();
  showNotification('Welcome to ' + currentAppName + '!');
};

// ==========================================
// DEVELOPER PROFILE SYSTEM (100% OFFLINE)
// ==========================================
const devModal = document.getElementById('dev-modal');
const devAvatarImg = document.getElementById('dev-avatar-img');
const devNameDisplay = document.getElementById('dev-name-display');
const devTitleDisplay = document.getElementById('dev-title-display');
const devBioDisplay = document.getElementById('dev-bio-display');
const devLocationDisplay = document.getElementById('dev-location-display');
const devEmailDisplay = document.getElementById('dev-email-display');

const editDevName = document.getElementById('edit-dev-name');
const editDevTitle = document.getElementById('edit-dev-title');
const editDevBio = document.getElementById('edit-dev-bio');
const editDevLocation = document.getElementById('edit-dev-location');
const editDevEmail = document.getElementById('edit-dev-email');
const editDevAvatar = document.getElementById('edit-dev-avatar');
let tempDevAvatarBase64 = null;

let devData = {
  name: 'Amarjeet Kumar',
  title: 'Lead Audio Architect & Engineer',
  bio: 'Built with passion for high-fidelity audio, offline-first Web Audio DSP, and clean UX.',
  location: 'Bihar, India',
  email: 'amarjeet.kumar.dev@gmail.com',
  avatar: 'icon-192.png'
};

async function loadDevProfile() {
  const saved = await dbOps.getDevProfile();
  if (saved) devData = Object.assign(devData, saved);
  applyDevProfileUI();
}

function applyDevProfileUI() {
  devNameDisplay.textContent = devData.name;
  devTitleDisplay.textContent = devData.title;
  devBioDisplay.textContent = devData.bio;
  devLocationDisplay.textContent = devData.location;
  devEmailDisplay.textContent = devData.email;
  devAvatarImg.src = devData.avatar || 'icon-192.png';

  editDevName.value = devData.name;
  editDevTitle.value = devData.title;
  editDevBio.value = devData.bio;
  editDevLocation.value = devData.location;
  editDevEmail.value = devData.email;
}

function openDevModal() {
  devModal.style.display = 'flex';
}

document.getElementById('btn-open-dev').onclick = openDevModal;
document.getElementById('footer-dev-trigger').onclick = openDevModal;
document.getElementById('btn-close-dev').onclick = () => { devModal.style.display = 'none'; };

editDevAvatar.onchange = async (e) => {
  if (e.target.files && e.target.files[0]) {
    tempDevAvatarBase64 = await compressImageSafe(e.target.files[0]);
    devAvatarImg.src = tempDevAvatarBase64;
  }
};

document.getElementById('btn-save-dev-profile').onclick = async () => {
  devData.name = editDevName.value.trim() || devData.name;
  devData.title = editDevTitle.value.trim() || devData.title;
  devData.bio = editDevBio.value.trim() || devData.bio;
  devData.location = editDevLocation.value.trim() || devData.location;
  devData.email = editDevEmail.value.trim() || devData.email;
  if (tempDevAvatarBase64) devData.avatar = tempDevAvatarBase64;

  await dbOps.setDevProfile(devData);
  applyDevProfileUI();
  showNotification('Developer profile updated!');
};

// ==========================================
// APP BRANDING & PREFERENCES
// ==========================================
const settingsModal = document.getElementById('settings-modal');
const customAppNameInput = document.getElementById('custom-app-name');
const customAppLogoInput = document.getElementById('custom-app-logo');
const settingsLogoPreview = document.getElementById('settings-logo-preview');
const headerAppLogo = document.getElementById('header-app-logo');
const displayAppName = document.getElementById('display-app-name');
const htmlTitle = document.getElementById('html-title');
const appFavicon = document.getElementById('app-favicon');
let tempNewLogoBase64 = null;

async function loadAppBranding() {
  const savedName = await dbOps.getConfig('app_name');
  const savedLogo = await dbOps.getConfig('app_logo');
  const savedTheme = await dbOps.getConfig('app_theme');

  if (savedName) currentAppName = savedName;
  if (savedLogo) currentAppLogo = savedLogo;
  if (savedTheme) setAppTheme(savedTheme);

  applyBrandingUI();
}

function setAppTheme(color) {
  document.documentElement.style.setProperty('--accent', color);
  document.documentElement.style.setProperty('--accent-light', color);
}

document.querySelectorAll('.theme-circle-btn').forEach((btn) => {
  btn.onclick = async () => {
    const col = btn.dataset.color;
    setAppTheme(col);
    await dbOps.setConfig('app_theme', col);
    showNotification(`Theme accent updated!`);
  };
});

function applyBrandingUI() {
  displayAppName.textContent = currentAppName;
  htmlTitle.textContent = currentAppName;
  headerAppLogo.src = currentAppLogo;
  appFavicon.href = currentAppLogo;
  settingsLogoPreview.src = currentAppLogo;
}

async function openSettingsModal() {
  customAppNameInput.value = currentAppName;
  settingsLogoPreview.src = currentAppLogo;
  tempNewLogoBase64 = currentAppLogo;

  const total = await dbOps.getAllTracks();
  document.getElementById('storage-stat-label').textContent = `${total.length} tracks permanently stored offline in IndexedDB.`;
  settingsModal.style.display = 'flex';
}

document.getElementById('btn-open-settings').onclick = openSettingsModal;
document.getElementById('brand-edit-trigger').onclick = openSettingsModal;
document.getElementById('btn-cancel-settings').onclick = () => {
  settingsModal.style.display = 'none';
};

customAppLogoInput.onchange = async (e) => {
  if (e.target.files && e.target.files[0]) {
    tempNewLogoBase64 = await compressImageSafe(e.target.files[0]);
    settingsLogoPreview.src = tempNewLogoBase64;
  }
};

document.getElementById('btn-save-settings').onclick = async () => {
  const newName = customAppNameInput.value.trim();
  if (newName) currentAppName = newName;
  if (tempNewLogoBase64) currentAppLogo = tempNewLogoBase64;

  await dbOps.setConfig('app_name', currentAppName);
  await dbOps.setConfig('app_logo', currentAppLogo);

  applyBrandingUI();
  settingsModal.style.display = 'none';
  showThanksPopup(`Branding saved! App name updated to "${currentAppName}".`);
  updateMediaSession();
};

// Backup Export & Import Utilities
document.getElementById('btn-export-backup').onclick = async () => {
  const all = await dbOps.getAllTracks();
  const pls = await dbOps.getPlaylists();
  const backup = {
    appName: currentAppName,
    exportedAt: new Date().toISOString(),
    playlists: pls,
    tracksMeta: all.map(t => ({ id: t.id, name: t.name, playlistId: t.playlistId, order: t.order }))
  };
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
  const a = document.createElement('a');
  a.href = dataStr;
  a.download = `Amarjeet_Studio_Backup_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  showNotification('Backup metadata exported!');
};

document.getElementById('import-backup-file').onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const backup = JSON.parse(event.target.result);
      if (backup.playlists && Array.isArray(backup.playlists)) {
        for (const p of backup.playlists) {
          await dbOps.savePlaylist(p);
        }
      }
      showThanksPopup('Backup metadata restored successfully!');
      loadPlaylists();
    } catch {
      showNotification('Error restoring backup file');
    }
  };
  reader.readAsText(file);
};

// ==========================================
// PLAYLISTS, TRACKS & AUTO-CLEANER
// ==========================================
async function loadPlaylists() {
  let list = await dbOps.getPlaylists();
  if (!list.length) {
    const def = { id: 'favorites', name: 'Favorites', cover: currentAppLogo };
    await dbOps.savePlaylist(def);
    list = [def];
  }

  const allCategory = { id: 'all', name: 'All', cover: currentAppLogo };
  const combined = [allCategory, ...list];

  playlistTabs.innerHTML = '';
  combined.forEach((p) => {
    const chip = document.createElement('div');
    chip.className = `chip ${p.id === activePlaylistId ? 'active' : ''}`;
    chip.innerHTML = `<img src="${p.cover || currentAppLogo}" class="chip-img" /><span>${p.name}</span>`;
    chip.onclick = () => {
      activePlaylistId = p.id;
      loadPlaylists();
    };
    playlistTabs.appendChild(chip);
  });

  currentPlaylist = combined.find((p) => p.id === activePlaylistId) || allCategory;
  viewPlaylistName.textContent = currentPlaylist.name;
  miniCover.src = currentPlaylist.cover || currentAppLogo;
  boxCover.src = currentPlaylist.cover || currentAppLogo;
  loadTracks();
}

async function loadTracks() {
  allTracksRaw = await dbOps.getTracks(activePlaylistId);
  allTracksRaw.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  renderFilteredTracks();
}

function renderFilteredTracks() {
  const q = librarySearchInput.value.trim().toLowerCase();
  let filtered = allTracksRaw.filter(t => t.name.toLowerCase().includes(q));

  const sortVal = sortSelect.value;
  if (sortVal === 'az') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortVal === 'za') {
    filtered.sort((a, b) => b.name.localeCompare(a.name));
  }

  tracks = filtered;
  trackCountLabel.textContent = `${tracks.length} track${tracks.length === 1 ? '' : 's'}`;

  songList.innerHTML = '';
  if (!tracks.length) {
    songList.innerHTML = '<li style="color:var(--text-muted);text-align:center;padding:24px 0;">No songs found.</li>';
    return;
  }

  tracks.forEach(async (trk, idx) => {
    const isFav = await dbOps.isFavorite(trk.name);
    const playCount = await dbOps.getPlayCount(trk.name);

    const li = document.createElement('li');
    li.className = `song-row ${idx === currentIndex ? 'active' : ''}`;
    li.setAttribute('data-song-name', trk.name);

    const info = document.createElement('div');
    info.className = 'song-info';
    info.innerHTML = `
      <span class="song-name"><strong>${idx + 1}.</strong> ${trk.name}</span>
      <span class="song-sub-info">Plays: ${playCount}</span>
    `;
    info.onclick = () => playTrack(idx);

    const actions = document.createElement('div');
    actions.className = 'row-actions';

    // Rename Button
    const btnRename = document.createElement('button');
    btnRename.className = 'btn-icon-sm';
    btnRename.innerHTML = '✏️';
    btnRename.title = 'Rename Track';
    btnRename.onclick = (e) => {
      e.stopPropagation();
      openRenameModal(trk);
    };

    // Favorite Button
    const btnLikeRow = document.createElement('button');
    btnLikeRow.className = 'btn-icon-sm song-heart-btn';
    btnLikeRow.innerHTML = isFav ? '❤️' : '💛';
    btnLikeRow.onclick = async (e) => {
      e.stopPropagation();
      await toggleFavorite(trk);
    };

    // Delete Button
    const del = document.createElement('button');
    del.className = 'btn-del';
    del.innerHTML = '🗑';
    del.onclick = async (e) => {
      e.stopPropagation();
      await dbOps.deleteTrack(trk.id);
      showNotification(`Removed: ${trk.name}`);
      loadTracks();
    };

    actions.append(btnRename, btnLikeRow, del);
    li.append(info, actions);
    songList.appendChild(li);
  });

  if (currentIndex !== -1 && tracks[currentIndex]) {
    dbOps.isFavorite(tracks[currentIndex].name).then(updateLikeButtonsUI);
  }
}

librarySearchInput.addEventListener('input', renderFilteredTracks);
sortSelect.addEventListener('change', renderFilteredTracks);

// One-Tap ID3 Tag Auto-Cleaner
document.getElementById('btn-clean-names').onclick = async () => {
  if (!allTracksRaw.length) return;
  let cleanedCount = 0;
  for (const trk of allTracksRaw) {
    let clean = trk.name
      .replace(/\.(mp3|wav|flac|m4a|aac|ogg|opus)$/i, '')
      .replace(/\[.*?\]|\(.*?\)|_|-/g, ' ')
      .replace(/\b(128kbps|320kbps|download|pagalworld|songs|audio|mp3)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (clean && clean !== trk.name) {
      trk.name = clean;
      await dbOps.updateTrack(trk);
      cleanedCount++;
    }
  }
  showNotification(`Cleaned clutter from ${cleanedCount} song name(s)!`);
  loadTracks();
};

// Track Renaming
const renameModal = document.getElementById('rename-modal');
const renameInput = document.getElementById('rename-input');
function openRenameModal(trk) {
  trackToRename = trk;
  renameInput.value = trk.name;
  renameModal.style.display = 'flex';
}
document.getElementById('btn-cancel-rename').onclick = () => { renameModal.style.display = 'none'; };
document.getElementById('btn-confirm-rename').onclick = async () => {
  const newTitle = renameInput.value.trim();
  if (newTitle && trackToRename) {
    trackToRename.name = newTitle;
    await dbOps.updateTrack(trackToRename);
    renameModal.style.display = 'none';
    showNotification('Track renamed successfully');
    loadTracks();
    if (currentIndex !== -1 && tracks[currentIndex] && tracks[currentIndex].id === trackToRename.id) {
      miniTitle.textContent = newTitle;
      boxTitle.textContent = newTitle;
      updateMediaSession();
    }
  }
};

// Toggle Favorite Logic
async function toggleFavorite(trk) {
  const songKey = trk.name;
  const isFav = await dbOps.isFavorite(songKey);

  let pls = await dbOps.getPlaylists();
  let favPlaylist = pls.find((p) => p.name.toLowerCase() === 'favorites') || pls[0];

  if (isFav) {
    await dbOps.removeFavorite(songKey);
    const favTracks = await dbOps.getTracks(favPlaylist.id);
    const existing = favTracks.find((t) => t.name.trim().toLowerCase() === trk.name.trim().toLowerCase());
    if (existing) await dbOps.deleteTrack(existing.id);
    showNotification(`Removed "${trk.name}" from Favorites 💛`);
    syncHeartsEverywhere(songKey, false);
  } else {
    await dbOps.setFavorite(songKey, true);
    await dbOps.saveTrack({
      playlistId: favPlaylist.id,
      name: trk.name,
      blob: trk.blob,
      order: Date.now()
    });
    showThanksPopup(`"${trk.name}" added to Favorites ❤️!`);
    syncHeartsEverywhere(songKey, true);
  }
  loadTracks();
}

function syncHeartsEverywhere(songName, isLiked) {
  const heart = isLiked ? '❤️' : '💛';
  const rows = document.querySelectorAll(`[data-song-name="${CSS.escape(songName)}"] .song-heart-btn`);
  rows.forEach((btn) => { btn.innerHTML = heart; });
  if (currentIndex !== -1 && tracks[currentIndex] && tracks[currentIndex].name === songName) {
    updateLikeButtonsUI(isLiked);
  }
}

function updateLikeButtonsUI(isLiked) {
  const heart = isLiked ? '❤️' : '💛';
  barBtnLike.textContent = heart;
  modalBtnLike.textContent = heart;
}

// Compress Image Safe
function compressImageSafe(file) {
  return new Promise((resolve) => {
    if (!file) return resolve(currentAppLogo);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 240;
          let w = img.width;
          let h = img.height;
          if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
          else { w = Math.round((w * maxDim) / h); h = maxDim; }
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } catch {
          resolve(e.target.result || currentAppLogo);
        }
      };
      img.onerror = () => resolve(currentAppLogo);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(currentAppLogo);
    reader.readAsDataURL(file);
  });
}

// Edit Cover Anytime
const editCoverInput = document.getElementById('edit-cover-input');
document.getElementById('btn-edit-art').onclick = () => editCoverInput.click();
editCoverInput.onchange = async (e) => {
  if (e.target.files && e.target.files[0]) {
    const newArt = await compressImageSafe(e.target.files[0]);
    miniCover.src = newArt;
    boxCover.src = newArt;
    if (currentPlaylist && currentPlaylist.id !== 'all') {
      currentPlaylist.cover = newArt;
      await dbOps.savePlaylist(currentPlaylist);
    }
    showNotification('Cover image updated!');
    updateMediaSession();
  }
};

// Create Playlist
const createModal = document.getElementById('playlist-create-modal');
const newPlaylistName = document.getElementById('new-playlist-name');
const newPlaylistImg = document.getElementById('new-playlist-img');
const previewArt = document.getElementById('preview-art-tag');
const previewStatus = document.getElementById('preview-status-text');
const btnConfirmPlaylist = document.getElementById('btn-confirm-playlist');
let newBase64Cover = null;

document.getElementById('btn-open-create-playlist').onclick = () => {
  newPlaylistName.value = '';
  newPlaylistImg.value = '';
  newBase64Cover = currentAppLogo;
  previewArt.src = currentAppLogo;
  previewStatus.textContent = 'Default art selected';
  createModal.style.display = 'flex';
};
document.getElementById('btn-cancel-playlist').onclick = () => { createModal.style.display = 'none'; };

newPlaylistImg.onchange = async (e) => {
  if (e.target.files && e.target.files[0]) {
    previewStatus.textContent = 'Processing image...';
    newBase64Cover = await compressImageSafe(e.target.files[0]);
    previewArt.src = newBase64Cover;
    previewStatus.textContent = 'Image ready';
  }
};

btnConfirmPlaylist.onclick = async () => {
  const name = newPlaylistName.value.trim();
  if (!name) return showNotification('Please enter a playlist name!');
  const pl = { id: 'pl_' + Date.now(), name, cover: newBase64Cover || currentAppLogo };
  await dbOps.savePlaylist(pl);
  createModal.style.display = 'none';
  activePlaylistId = pl.id;
  await loadPlaylists();
  showThanksPopup(`Playlist "${name}" created successfully!`);
};

// Add Songs (Multi-Format)
document.getElementById('file-picker').onchange = async (e) => {
  const files = Array.from(e.target.files);
  if (!files.length) return;
  const targetId = activePlaylistId === 'all' ? 'favorites' : activePlaylistId;
  for (let i = 0; i < files.length; i++) {
    await dbOps.saveTrack({
      playlistId: targetId,
      name: files[i].name,
      blob: files[i],
      order: tracks.length + i
    });
  }
  showThanksPopup(`Added ${files.length} song(s)!`);
  loadTracks();
};

// ==========================================
// PLAYBACK SYSTEM & TIMESTAMP MANAGEMENT
// ==========================================
async function playTrack(idx) {
  if (idx < 0 || idx >= tracks.length) return;
  ensureAudioPipeline();

  if (currentIndex === idx && audio.src) {
    if (audio.paused) {
      audio.play();
      syncButtons(true);
    }
    return;
  }

  currentIndex = idx;
  const trk = tracks[currentIndex];
  audio.src = URL.createObjectURL(trk.blob);
  audio.playbackRate = speedList[currentSpeedIndex];

  audio.play().then(() => {
    syncButtons(true);
  }).catch(() => {});

  miniTitle.textContent = trk.name;
  miniSub.textContent = `Playlist: ${currentPlaylist.name}`;
  boxTitle.textContent = trk.name;
  boxPlaylist.textContent = `Playlist: ${currentPlaylist.name}`;

  const isFav = await dbOps.isFavorite(trk.name);
  updateLikeButtonsUI(isFav);

  await dbOps.incrementPlayCount(trk.name);
  loadLyricsForCurrent();
  await loadTimestampsForCurrent();
  renderSeekTicks();
  updateMediaSession();
  loadTracks();

  // Keep in-card playlist strictly updated with active highlight
  renderCardReorderList();
}

function syncButtons(isPlaying) {
  barBtnPlay.textContent = isPlaying ? '⏸' : '▶';
  boxBtnPlay.textContent = isPlaying ? '⏸' : '▶';
  if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }
}

function togglePlay() {
  ensureAudioPipeline();
  if (!audio.src && tracks.length) return playTrack(0);
  if (audio.paused) {
    audio.play();
    syncButtons(true);
  } else {
    audio.pause();
    syncButtons(false);
  }
}

function loopNext() {
  if (!tracks.length) return;
  if (playMode === 'one') return playTrack(currentIndex);
  let next = (playMode === 'shuffle') 
    ? Math.floor(Math.random() * tracks.length) 
    : currentIndex + 1;
  if (next >= tracks.length) next = 0;
  playTrack(next);
}

barBtnPlay.onclick = (e) => { e.stopPropagation(); togglePlay(); };
boxBtnPlay.onclick = togglePlay;
boxBtnPrev.onclick = () => playTrack(currentIndex > 0 ? currentIndex - 1 : tracks.length - 1);
boxBtnNext.onclick = loopNext;
audio.onended = loopNext;

barBtnLike.onclick = (e) => {
  e.stopPropagation();
  if (currentIndex !== -1 && tracks[currentIndex]) toggleFavorite(tracks[currentIndex]);
};
modalBtnLike.onclick = () => {
  if (currentIndex !== -1 && tracks[currentIndex]) toggleFavorite(tracks[currentIndex]);
};

// MediaSession API with Amarjeet credit
function updateMediaSession() {
  if (!('mediaSession' in navigator) || currentIndex === -1) return;
  const trk = tracks[currentIndex];
  if (!trk) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: trk.name,
    artist: `Playlist: ${currentPlaylist.name} • Made by & for Amarjeet kumar`,
    album: currentAppName,
    artwork: [
      { src: currentPlaylist.cover || currentAppLogo, sizes: '192x192', type: 'image/png' },
      { src: currentPlaylist.cover || currentAppLogo, sizes: '512x512', type: 'image/png' }
    ]
  });

  navigator.mediaSession.playbackState = 'playing';
  navigator.mediaSession.setActionHandler('play', () => { ensureAudioPipeline(); audio.play(); syncButtons(true); });
  navigator.mediaSession.setActionHandler('pause', () => { audio.pause(); syncButtons(false); });
  navigator.mediaSession.setActionHandler('nexttrack', loopNext);
  navigator.mediaSession.setActionHandler('previoustrack', () => playTrack(currentIndex > 0 ? currentIndex - 1 : tracks.length - 1));
}

// Fullscreen Modal Details
document.getElementById('open-box-trigger').onclick = () => { 
  playerBoxModal.style.display = 'flex'; 
  renderSeekTicks();
  renderCardReorderList();
};
document.getElementById('btn-close-box').onclick = () => { playerBoxModal.style.display = 'none'; };

// Quick Seek Jumpers
document.getElementById('btn-skip-backward').onclick = () => { audio.currentTime = Math.max(0, audio.currentTime - 10); };
document.getElementById('btn-skip-forward').onclick = () => { audio.currentTime = Math.min(audio.duration, audio.currentTime + 10); };

// Playback Speed Toggle
const btnSpeedToggle = document.getElementById('btn-speed-toggle');
btnSpeedToggle.onclick = () => {
  currentSpeedIndex = (currentSpeedIndex + 1) % speedList.length;
  const spd = speedList[currentSpeedIndex];
  audio.playbackRate = spd;
  btnSpeedToggle.textContent = `${spd}x`;
  showNotification(`Speed: ${spd}x`);
};

// Mode Toggles (Shuffle / Repeat)
const btnModeShuffle = document.getElementById('btn-mode-shuffle');
const btnModeRepeat = document.getElementById('btn-mode-repeat');

btnModeShuffle.onclick = () => {
  if (playMode !== 'shuffle') {
    playMode = 'shuffle';
    btnModeShuffle.classList.add('active');
    btnModeShuffle.textContent = '🔀 On';
    showNotification('Shuffle: Active');
  } else {
    playMode = 'all';
    btnModeShuffle.classList.remove('active');
    btnModeShuffle.textContent = '🔀 Off';
    showNotification('Shuffle: Off');
  }
};

btnModeRepeat.onclick = () => {
  if (playMode === 'all') {
    playMode = 'one';
    btnModeRepeat.textContent = '🔂 One';
    showNotification('Repeat: Current Song');
  } else {
    playMode = 'all';
    btnModeRepeat.textContent = '🔁 All';
    showNotification('Repeat: Entire List');
  }
};

// Sleep Timer with Audio Cross-Fade
const btnSleepTimer = document.getElementById('btn-sleep-timer');
const sleepTimes = [0, 15, 30, 45, 60];
let sleepIndex = 0;
btnSleepTimer.onclick = () => {
  sleepIndex = (sleepIndex + 1) % sleepTimes.length;
  const mins = sleepTimes[sleepIndex];
  if (sleepTimerId) clearTimeout(sleepTimerId);

  if (mins === 0) {
    btnSleepTimer.textContent = '⏱️ Off';
    showNotification('Sleep Timer: Disabled');
  } else {
    btnSleepTimer.textContent = `⏱️ ${mins}m`;
    showNotification(`Sleep Timer set for ${mins} minutes`);
    sleepTimerId = setTimeout(() => {
      if (masterGainNode && audioCtx) {
        masterGainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 5);
      }
      setTimeout(() => {
        audio.pause();
        syncButtons(false);
        setVolume(20);
        btnSleepTimer.textContent = '⏱️ Off';
        sleepIndex = 0;
        showNotification('Sleep timer ended. Goodnight!');
      }, 5000);
    }, mins * 60 * 1000);
  }
};

// Cover Swipe Gestures
let touchStartX = 0;
const swipeArea = document.getElementById('art-swipe-area');
swipeArea.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; });
swipeArea.addEventListener('touchend', (e) => {
  const diff = e.changedTouches[0].screenX - touchStartX;
  if (diff > 50) {
    playTrack(currentIndex > 0 ? currentIndex - 1 : tracks.length - 1);
  } else if (diff < -50) {
    loopNext();
  }
});

// A-B Segment Looper
const btnSetA = document.getElementById('btn-set-point-a');
const btnSetB = document.getElementById('btn-set-point-b');
const labelPointA = document.getElementById('label-point-a');
const labelPointB = document.getElementById('label-point-b');

btnSetA.onclick = () => {
  pointA = audio.currentTime;
  labelPointA.textContent = formatSecs(pointA);
  showNotification(`Loop Point A set at ${formatSecs(pointA)}`);
};
btnSetB.onclick = () => {
  if (pointA === null) return showNotification('Set Point A first!');
  pointB = audio.currentTime;
  labelPointB.textContent = formatSecs(pointB);
  showNotification(`Looping from ${formatSecs(pointA)} to ${formatSecs(pointB)}`);
};
document.getElementById('btn-clear-loop').onclick = () => {
  pointA = null; pointB = null;
  labelPointA.textContent = '--:--';
  labelPointB.textContent = '--:--';
  showNotification('A-B Loop cleared');
};

function formatSecs(s) {
  const m = Math.floor(s / 60) || 0;
  const sec = Math.floor(s % 60) || 0;
  return `${m}:${sec < 10 ? '0' : ''}${sec}`;
}

// ==========================================
// EMBEDDED DRAWERS (PRESERVES ALL CONTROLS)
// ==========================================
const panels = {
  vol: document.getElementById('card-volume-panel'),
  eq: document.getElementById('card-eq-panel'),
  timestamps: document.getElementById('card-timestamps-panel'),
  looper: document.getElementById('card-looper-panel'),
  lyrics: document.getElementById('card-lyrics-panel'),
  playlist: document.getElementById('card-playlist-panel')
};

const btns = {
  vol: document.getElementById('card-toggle-volume'),
  eq: document.getElementById('card-toggle-eq'),
  timestamps: document.getElementById('card-toggle-timestamps'),
  looper: document.getElementById('card-toggle-looper'),
  lyrics: document.getElementById('card-toggle-lyrics'),
  playlist: document.getElementById('card-toggle-playlist')
};

function togglePanel(key) {
  const target = panels[key];
  const isHidden = target.style.display === 'none' || !target.style.display;
  
  // Hide all panels & reset active states
  Object.values(panels).forEach(p => p.style.display = 'none');
  Object.values(btns).forEach(b => b.classList.remove('active'));

  if (isHidden) {
    target.style.display = 'block';
    btns[key].classList.add('active');

    // Specific drawer refresh routines
    if (key === 'playlist') {
      renderCardReorderList();
    } else if (key === 'timestamps') {
      renderTimestampsDrawerList();
    }
  }
}

btns.vol.onclick = () => togglePanel('vol');
btns.eq.onclick = () => togglePanel('eq');
btns.timestamps.onclick = () => togglePanel('timestamps');
btns.looper.onclick = () => togglePanel('looper');
btns.lyrics.onclick = () => togglePanel('lyrics');
btns.playlist.onclick = () => togglePanel('playlist');

document.getElementById('card-vol-slider').addEventListener('input', (e) => setVolume(e.target.value));

// Offline Lyrics Saving
const lyricsTextarea = document.getElementById('lyrics-textarea');
async function loadLyricsForCurrent() {
  if (currentIndex === -1 || !tracks[currentIndex]) return;
  const text = await dbOps.getLyrics(tracks[currentIndex].name);
  lyricsTextarea.value = text;
}
document.getElementById('btn-save-lyrics').onclick = async () => {
  if (currentIndex === -1 || !tracks[currentIndex]) return;
  await dbOps.setLyrics(tracks[currentIndex].name, lyricsTextarea.value);
  showNotification('Lyrics saved offline!');
};

// ==========================================
// TIMESTAMPS & BOOKMARK SYSTEM
// ==========================================
const timestampModal = document.getElementById('timestamp-modal');
const timestampNameInput = document.getElementById('timestamp-name-input');
const timestampTimePreview = document.getElementById('timestamp-time-preview');
const timestampMarkersList = document.getElementById('timestamp-markers-list');

async function loadTimestampsForCurrent() {
  if (currentIndex === -1 || !tracks[currentIndex]) {
    currentSongTimestamps = [];
    return;
  }
  currentSongTimestamps = await dbOps.getTimestamps(tracks[currentIndex].name);
  currentSongTimestamps.sort((a, b) => a.time - b.time);
  renderTimestampsDrawerList();
}

function renderSeekTicks() {
  seekTicksLayer.innerHTML = '';
  if (!audio.duration || !currentSongTimestamps.length) return;
  currentSongTimestamps.forEach(ts => {
    const pct = (ts.time / audio.duration) * 100;
    if (pct >= 0 && pct <= 100) {
      const pip = document.createElement('div');
      pip.className = 'seek-tick-pip';
      pip.style.left = `${pct}%`;
      pip.title = `${ts.name} (${formatSecs(ts.time)})`;
      seekTicksLayer.appendChild(pip);
    }
  });
}

function renderTimestampsDrawerList() {
  timestampMarkersList.innerHTML = '';
  if (!currentSongTimestamps.length) {
    timestampMarkersList.innerHTML = '<li style="color:var(--text-muted);text-align:center;font-size:0.8rem;padding:12px 0;">No timestamps saved yet. Tap "➕ Add Current Time".</li>';
    return;
  }

  const curTimeVal = audio.currentTime;
  let activeTsId = null;
  for (let i = 0; i < currentSongTimestamps.length; i++) {
    if (curTimeVal >= currentSongTimestamps[i].time) {
      activeTsId = currentSongTimestamps[i].id;
    }
  }

  currentSongTimestamps.forEach(ts => {
    const isPlayingThis = (activeTsId === ts.id);
    const li = document.createElement('li');
    li.className = `timestamp-item ${isPlayingThis ? 'playing-timestamp' : ''}`;
    li.innerHTML = `
      <div class="timestamp-item-info">
        <span class="timestamp-badge-time">${formatSecs(ts.time)}</span>
        <span class="timestamp-item-name">${ts.name}</span>
        ${isPlayingThis ? '<span class="active-marker-tag">▶ Playing</span>' : ''}
      </div>
      <button class="btn-del" title="Delete Marker">🗑</button>
    `;

    li.onclick = (e) => {
      if (e.target.closest('.btn-del')) return;
      audio.currentTime = ts.time;
      if (audio.paused) {
        audio.play();
        syncButtons(true);
      }
      showNotification(`Jumped to: ${ts.name} (${formatSecs(ts.time)})`);
      renderTimestampsDrawerList();
    };

    li.querySelector('.btn-del').onclick = async (e) => {
      e.stopPropagation();
      currentSongTimestamps = currentSongTimestamps.filter(item => item.id !== ts.id);
      await dbOps.saveTimestamps(tracks[currentIndex].name, currentSongTimestamps);
      renderTimestampsDrawerList();
      renderSeekTicks();
      showNotification(`Deleted marker "${ts.name}"`);
    };

    timestampMarkersList.appendChild(li);
  });
}

document.getElementById('btn-add-timestamp').onclick = () => {
  if (currentIndex === -1 || !tracks[currentIndex]) {
    return showNotification('Play a song to bookmark a timestamp!');
  }
  pendingTimestampTime = audio.currentTime;
  timestampTimePreview.textContent = `At timestamp: ${formatSecs(pendingTimestampTime)}`;
  timestampNameInput.value = '';
  timestampModal.style.display = 'flex';
  timestampNameInput.focus();
};

document.getElementById('btn-cancel-timestamp').onclick = () => {
  timestampModal.style.display = 'none';
};

document.getElementById('btn-confirm-timestamp').onclick = async () => {
  const name = timestampNameInput.value.trim() || `Marker at ${formatSecs(pendingTimestampTime)}`;
  currentSongTimestamps.push({
    id: 'ts_' + Date.now(),
    time: pendingTimestampTime,
    name
  });
  currentSongTimestamps.sort((a, b) => a.time - b.time);
  await dbOps.saveTimestamps(tracks[currentIndex].name, currentSongTimestamps);
  timestampModal.style.display = 'none';
  showNotification(`Bookmark "${name}" saved!`);
  renderTimestampsDrawerList();
  renderSeekTicks();
};

function updateActiveTimestampBadge() {
  if (!currentSongTimestamps.length) {
    activeMarkerPill.style.display = 'none';
    return;
  }
  const cur = audio.currentTime;
  let activeItem = null;
  for (let i = 0; i < currentSongTimestamps.length; i++) {
    if (cur >= currentSongTimestamps[i].time) {
      activeItem = currentSongTimestamps[i];
    }
  }
  if (activeItem) {
    activeMarkerName.textContent = `${activeItem.name} (${formatSecs(activeItem.time)})`;
    activeMarkerPill.style.display = 'inline-block';
  } else {
    activeMarkerPill.style.display = 'none';
  }
}

// Real-Time Time Update
audio.ontimeupdate = () => {
  if (!audio.duration) return;
  if (pointA !== null && pointB !== null && pointB > pointA) {
    if (audio.currentTime >= pointB) audio.currentTime = pointA;
  }
  seekBar.value = (audio.currentTime / audio.duration) * 100;
  currTime.textContent = formatSecs(audio.currentTime);
  durTime.textContent = formatSecs(audio.duration);
  updateActiveTimestampBadge();
};

seekBar.oninput = () => {
  if (audio.duration) audio.currentTime = (seekBar.value / 100) * audio.duration;
};

// In-Card Playlist Reorder & Active Highlight
function renderCardReorderList() {
  cardReorderList.innerHTML = '';
  if (!tracks.length) {
    cardReorderList.innerHTML = '<li style="color:var(--text-muted);text-align:center;font-size:0.8rem;padding:8px 0;">No songs in this playlist.</li>';
    return;
  }

  tracks.forEach((trk, idx) => {
    const isThisPlaying = (currentIndex !== -1 && tracks[currentIndex] && (tracks[currentIndex].name === trk.name));
    const li = document.createElement('li');
    li.className = `song-row ${isThisPlaying ? 'playing-in-drawer' : ''}`;
    li.innerHTML = `
      <span class="song-name" style="max-width:65%;cursor:pointer;">
        <strong>${idx + 1}.</strong> ${trk.name}
        ${isThisPlaying ? '<span class="now-playing-tag">▶ Now Playing</span>' : ''}
      </span>
      <div>
        <button class="btn-action" onclick="shiftTrack(${idx}, -1)">▲</button>
        <button class="btn-action" onclick="shiftTrack(${idx}, 1)">▼</button>
      </div>
    `;

    // Tap song name inside the drawer to play immediately
    li.querySelector('.song-name').onclick = () => {
      playTrack(idx);
    };

    cardReorderList.appendChild(li);
  });
}

window.shiftTrack = async (from, delta) => {
  const to = from + delta;
  if (to < 0 || to >= tracks.length) return;
  const temp = tracks[from];
  tracks[from] = tracks[to];
  tracks[to] = temp;
  for (let i = 0; i < tracks.length; i++) {
    tracks[i].order = i;
    await dbOps.updateTrack(tracks[i]);
  }
  if (currentIndex === from) currentIndex = to;
  else if (currentIndex === to) currentIndex = from;
  renderCardReorderList();
  loadTracks();
  showNotification('Playlist order updated');
};

// Bass Boost & Equalizer
document.getElementById('slider-bass-boost').oninput = (e) => {
  const val = parseFloat(e.target.value);
  document.getElementById('val-bass-boost').textContent = `${val}dB`;
  if (bassFilterNode) bassFilterNode.gain.value = val;
};

document.querySelectorAll('[data-band]').forEach((s) => {
  s.oninput = (e) => {
    const b = parseInt(e.target.dataset.band, 10);
    const val = parseFloat(e.target.value);
    if (filters[b]) filters[b].gain.value = val;
    document.getElementById(`val-${bands[b]}`).textContent = `${val}dB`;
  };
});
document.getElementById('eq-preamp').oninput = (e) => {
  const val = parseFloat(e.target.value);
  document.getElementById('val-preamp').textContent = `${val}dB`;
  if (preampGain) preampGain.gain.setValueAtTime(Math.pow(10, val / 20) * 0.35, audioCtx.currentTime);
};

document.getElementById('card-eq-enable').onchange = (e) => {
  eqEnabled = e.target.checked;
  filters.forEach((f, i) => {
    f.gain.value = eqEnabled ? parseFloat(document.querySelectorAll('[data-band]')[i].value) : 0;
  });
  if (preampGain && audioCtx) {
    preampGain.gain.setValueAtTime(eqEnabled ? Math.pow(10, parseFloat(document.getElementById('eq-preamp').value) / 20) * 0.35 : 1, audioCtx.currentTime);
  }
  showNotification(eqEnabled ? 'Equalizer active' : 'Direct hardware bypass');
};

document.getElementById('btn-reset-eq-card').onclick = () => {
  document.getElementById('eq-preamp').value = 14.1;
  document.getElementById('val-preamp').textContent = '14.1dB';
  if (preampGain && audioCtx) preampGain.gain.setValueAtTime(Math.pow(10, 14.1 / 20) * 0.35, audioCtx.currentTime);
  defaultGains.forEach((g, i) => {
    const slider = document.querySelector(`[data-band="${i}"]`);
    slider.value = g;
    document.getElementById(`val-${bands[i]}`).textContent = `${g}dB`;
    if (filters[i]) filters[i].gain.value = g;
  });
  showNotification('Equalizer reset to VLC preset');
};

// Initial Boot: Set 20% Volume & Load Data
initDB().then(async () => {
  await loadAppBranding();
  await loadDevProfile();
  await loadPlaylists();
  setVolume(20);
});
