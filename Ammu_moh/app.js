if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => {});
  });
}

// =============================================================
// DOM REFERENCES (TOP-LEVEL INITIALIZATION)
// =============================================================
const playlistTabs = document.getElementById('playlist-tabs');
const songList = document.getElementById('song-list');
const cardReorderList = document.getElementById('card-reorder-list');
const viewPlaylistName = document.getElementById('view-playlist-name');
const trackCountLabel = document.getElementById('track-count-label');
const librarySearchInput = document.getElementById('library-search-input');
const btnClearSearch = document.getElementById('btn-clear-search');
const btnSortTrigger = document.getElementById('btn-sort-trigger');
const sortByMenu = document.getElementById('sort-by-menu');
const sortSubName = document.getElementById('sort-sub-name');
const sortSubSize = document.getElementById('sort-sub-size');
const upperContentViewport = document.getElementById('upper-content-viewport');

const miniPlayerBar = document.getElementById('mini-player');
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

const trackContextMenu = document.getElementById('track-context-menu');
const addToPlaylistSubmenu = document.getElementById('add-to-playlist-submenu');
const playlistContextMenu = document.getElementById('playlist-context-menu');
const headerSettingsMenu = document.getElementById('header-settings-menu');

const visualizerCanvas = document.getElementById('audio-visualizer');
const vCtx = visualizerCanvas ? visualizerCanvas.getContext('2d') : null;
const artDisplayBox = document.getElementById('art-display-box');
const seekFeedbackOverlay = document.getElementById('art-seek-feedback');
const dragHandleBar = document.getElementById('card-drag-handle-bar');
const mainViewport = document.getElementById('main-swipe-viewport');

const settingsModal = document.getElementById('settings-modal');
const customAppNameInput = document.getElementById('custom-app-name');
const customAppLogoInput = document.getElementById('custom-app-logo');
const settingsLogoPreview = document.getElementById('settings-logo-preview');
const headerAppLogo = document.getElementById('header-app-logo');
const displayAppName = document.getElementById('display-app-name');
const htmlTitle = document.getElementById('html-title');
const appFavicon = document.getElementById('app-favicon');

const userProfileModal = document.getElementById('user-profile-modal');
const editUserNameInput = document.getElementById('edit-user-name');
const editUserAvatarInput = document.getElementById('edit-user-avatar');
const userEditAvatarPreview = document.getElementById('user-edit-avatar-preview');

const editPlaylistModal = document.getElementById('edit-playlist-modal');
const editPlaylistNameInput = document.getElementById('edit-playlist-name-input');
const editPlaylistAuthorInput = document.getElementById('edit-playlist-author-input');
const editPlaylistArtInput = document.getElementById('edit-playlist-art-input');
const editPlaylistPreviewImg = document.getElementById('edit-playlist-preview-img');
const editPlNameWarning = document.getElementById('edit-pl-name-warning');

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

const customEqModal = document.getElementById('custom-eq-modal');
const inputCustomEqName = document.getElementById('input-custom-eq-name');
const storageAuditorModal = document.getElementById('storage-auditor-modal');
const trimmerModal = document.getElementById('trimmer-modal');
const renameModal = document.getElementById('rename-modal');
const renameInput = document.getElementById('rename-input');
const timestampModal = document.getElementById('timestamp-modal');
const timestampNameInput = document.getElementById('timestamp-name-input');
const timestampTimePreview = document.getElementById('timestamp-time-preview');
const timestampMarkersList = document.getElementById('timestamp-markers-list');
const lyricsTextarea = document.getElementById('lyrics-textarea');

// Processing Modal Elements
const globalProcessingModal = document.getElementById('global-processing-modal');
const processingStatusMsg = document.getElementById('processing-status-msg');
const processingProgressBar = document.getElementById('processing-progress-bar');
const btnCancelProcessingTask = document.getElementById('btn-cancel-processing-task');
let isOperationCancelled = false;
let processingTimer = null;

function showProcessingModal(title = 'Processing Audio Data...') {
  const titleEl = document.getElementById('processing-title');
  if (titleEl) titleEl.textContent = title;
  if (processingProgressBar) processingProgressBar.style.width = '0%';
  if (processingStatusMsg) processingStatusMsg.textContent = 'Please wait...';
  isOperationCancelled = false;

  // Only render if operation exceeds 1 second
  if (processingTimer) clearTimeout(processingTimer);
  processingTimer = setTimeout(() => {
    if (globalProcessingModal) globalProcessingModal.style.display = 'flex';
  }, 1000);
}

function updateProcessingProgress(pct, statusText) {
  if (processingProgressBar) processingProgressBar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  if (processingStatusMsg && statusText) processingStatusMsg.textContent = statusText;
}

function hideProcessingModal() {
  if (processingTimer) clearTimeout(processingTimer);
  if (globalProcessingModal) globalProcessingModal.style.display = 'none';
  isOperationCancelled = false;
}

if (btnCancelProcessingTask) {
  btnCancelProcessingTask.onclick = () => {
    triggerHaptic(30);
    isOperationCancelled = true;
    hideProcessingModal();
    showNotification('Task cancelled by user.');
  };
}

// =============================================================
// INDIAN STANDARD TIME (IST) FORMATTERS
// =============================================================
function getIndianStandardTime(dateObj = new Date()) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(dateObj) + ' IST';
}

function getIndianStandardDateOnly(dateObj = new Date()) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(dateObj);
}

// =============================================================
// OFFLINE WEB CRYPTO (AES-GCM-256 & SHA-256)
// =============================================================
async function hashPasskey(passkey) {
  if (!passkey) return '';
  const enc = new TextEncoder().encode(passkey);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function deriveCryptoKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptPayloadAES(plainText, password) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveCryptoKey(password, salt);
  const encryptedBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    enc.encode(plainText)
  );

  return JSON.stringify({
    encrypted: true,
    salt: Array.from(salt),
    iv: Array.from(iv),
    cipherData: Array.from(new Uint8Array(encryptedBuf))
  });
}

async function decryptPayloadAES(encryptedJsonObj, password) {
  const salt = new Uint8Array(encryptedJsonObj.salt);
  const iv = new Uint8Array(encryptedJsonObj.iv);
  const cipherData = new Uint8Array(encryptedJsonObj.cipherData);
  const key = await deriveCryptoKey(password, salt);

  const decryptedBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    cipherData
  );
  return new TextDecoder().decode(decryptedBuf);
}

// =============================================================
// PWA INSTALL BANNER
// =============================================================
let deferredPrompt = null;
const persistentInstallBanner = document.getElementById('persistent-install-banner');
const bannerInstallBtn = document.getElementById('btn-banner-install');
const bannerDismissBtn = document.getElementById('btn-banner-dismiss');
const isRunningStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

if (!isRunningStandalone && persistentInstallBanner) {
  persistentInstallBanner.style.display = 'flex';
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (!isRunningStandalone && persistentInstallBanner) {
    persistentInstallBanner.style.display = 'flex';
  }
});

async function triggerPWAInstall() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted' && persistentInstallBanner) {
      persistentInstallBanner.style.display = 'none';
    }
    deferredPrompt = null;
  } else {
    alert('To install the app:\n1. Tap the 3 dots (⋮) in your browser.\n2. Tap "Install app" (or "Add to Home screen").');
  }
}

if (bannerInstallBtn) bannerInstallBtn.addEventListener('click', triggerPWAInstall);
if (bannerDismissBtn) bannerDismissBtn.addEventListener('click', () => {
  if (persistentInstallBanner) persistentInstallBanner.style.display = 'none';
});

function triggerHaptic(ms = 35) {
  if ('vibrate' in navigator) {
    try { navigator.vibrate(ms); } catch (_) {}
  }
}

// Android Back Gesture & Multi-Select Interception
window.history.pushState({ page: 'home' }, '');
window.addEventListener('popstate', () => {
  if (multiSelectMode || selectedTrackIds.size > 0) {
    multiSelectMode = false;
    selectedTrackIds.clear();
    const batchBar = document.getElementById('batch-action-bar');
    if (batchBar) batchBar.style.display = 'none';
    renderFilteredTracks();
    showNotification('Selection cleared');
    window.history.pushState({ page: 'home' }, '');
    return;
  }

  const modals = [
    'player-box-modal',
    'playlist-create-modal',
    'edit-playlist-modal',
    'settings-modal',
    'rename-modal',
    'timestamp-modal',
    'trimmer-modal',
    'pre-import-modal',
    'import-success-modal',
    'author-modal',
    'stats-modal',
    'dev-modal',
    'onboarding-modal',
    'user-profile-modal',
    'decryption-auth-modal',
    'secondary-keys-modal',
    'admin-auth-modal',
    'storage-auditor-modal',
    'custom-eq-modal',
    'global-processing-modal'
  ];
  for (const id of modals) {
    const el = document.getElementById(id);
    if (el && el.style.display === 'flex') {
      el.style.display = 'none';
      window.history.pushState({ page: 'home' }, '');
      return;
    }
  }
  dismissAllMenus();
  window.history.pushState({ page: 'home' }, '');
});

function dismissAllMenus() {
  const menus = [
    'track-context-menu',
    'playlist-context-menu',
    'header-settings-menu',
    'sort-by-menu',
    'sort-sub-name',
    'sort-sub-size',
    'add-to-playlist-submenu'
  ];
  menus.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

window.addEventListener('touchmove', dismissAllMenus, { passive: true });
window.addEventListener('wheel', dismissAllMenus, { passive: true });

// =============================================================
// TOASTS, UNDO & REACTION NOTIFICATIONS
// =============================================================
let activeUndoAction = null;

function showNotification(msg) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <div class="toast-body">
      <span class="toast-msg">${msg}</span>
    </div>
    <div class="toast-progress standard"></div>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function showUndoToast(msg, onUndo, onCommit) {
  if (activeUndoAction) activeUndoAction.commit();

  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <div class="toast-body">
      <span class="toast-msg">${msg}</span>
      <button class="toast-btn-undo" id="btn-toast-undo">↩️ Undo (5s)</button>
    </div>
    <div class="toast-progress undo-active"></div>
  `;

  let committed = false;
  const timeoutId = setTimeout(() => {
    if (!committed) {
      committed = true;
      if (onCommit) onCommit();
      toast.remove();
      activeUndoAction = null;
    }
  }, 5000);

  activeUndoAction = {
    commit: () => {
      if (!committed) {
        committed = true;
        clearTimeout(timeoutId);
        if (onCommit) onCommit();
        toast.remove();
        activeUndoAction = null;
      }
    },
    abort: () => {
      committed = true;
      clearTimeout(timeoutId);
      toast.remove();
      activeUndoAction = null;
    }
  };

  const undoBtn = toast.querySelector('#btn-toast-undo');
  if (undoBtn) {
    undoBtn.onclick = () => {
      triggerHaptic(40);
      if (!committed) {
        committed = true;
        clearTimeout(timeoutId);
        toast.remove();
        activeUndoAction = null;
        if (onUndo) onUndo();
        showNotification('Action reverted successfully');
      }
    };
  }

  container.appendChild(toast);
}

function triggerHeartBurst(isFavorited) {
  const overlay = document.getElementById('heart-burst-overlay');
  if (!overlay) return;
  overlay.innerHTML = '';
  overlay.style.display = 'block';

  const heartChar = isFavorited ? '\u2764\uFE0F' : '\uD83D\uDC9B';
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'burst-particle emoji-text';
    p.textContent = heartChar;
    p.style.left = `${Math.random() * 85 + 5}%`;
    p.style.top = `${Math.random() * 50 + 40}%`;
    p.style.animationDelay = `${Math.random() * 0.3}s`;
    p.style.fontSize = `${Math.random() * 1.5 + 1.6}rem`;
    overlay.appendChild(p);
  }

  setTimeout(() => {
    overlay.style.display = 'none';
    overlay.innerHTML = '';
  }, 1600);
}

let emotionalTimeout = null;
function showEmotionalMessage(isLiked) {
  const container = document.getElementById('emotional-floating-container');
  const emojiEl = document.getElementById('emotional-big-emoji');
  const titleEl = document.getElementById('emotional-title');
  const subEl = document.getElementById('emotional-sub');
  if (!container || !emojiEl || !titleEl || !subEl) return;

  if (emotionalTimeout) {
    clearTimeout(emotionalTimeout);
    emotionalTimeout = null;
  }

  container.style.display = 'none';
  void container.offsetWidth; // Trigger reflow

  if (isLiked) {
    emojiEl.innerHTML = '&#129401;';
    titleEl.innerHTML = 'Thank you for loving me &#129401;';
    subEl.textContent = 'From Amarjeet';
  } else {
    emojiEl.innerHTML = '&#129402;';
    titleEl.innerHTML = 'Dil tod diya na mera &#129402;';
    subEl.textContent = 'From Amarjeet';
  }

  container.style.display = 'flex';
  emotionalTimeout = setTimeout(() => {
    container.style.display = 'none';
    emotionalTimeout = null;
  }, 2800);
}

// =============================================================
// INDEXEDDB DATABASE ENGINE
// =============================================================
const DB_NAME = 'AmmuMusicDB_v280';
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
      if (!d.objectStoreNames.contains('user_profile')) d.createObjectStore('user_profile', { keyPath: 'key' });
      if (!d.objectStoreNames.contains('timestamps')) d.createObjectStore('timestamps', { keyPath: 'songKey' });
      if (!d.objectStoreNames.contains('audit_log')) d.createObjectStore('audit_log', { keyPath: 'id', autoIncrement: true });
      if (!d.objectStoreNames.contains('playback_history')) d.createObjectStore('playback_history', { keyPath: 'id', autoIncrement: true });
      if (!d.objectStoreNames.contains('time_tracking')) d.createObjectStore('time_tracking', { keyPath: 'dateKey' });
      if (!d.objectStoreNames.contains('custom_eq_presets')) d.createObjectStore('custom_eq_presets', { keyPath: 'name' });
      if (!d.objectStoreNames.contains('trimmed_clips')) {
        const clips = d.createObjectStore('trimmed_clips', { keyPath: 'id', autoIncrement: true });
        clips.createIndex('songName', 'songName', { unique: false });
      }
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
  async deletePlaylist(id) {
    return new Promise((res) => {
      const tx = db.transaction('playlists', 'readwrite');
      tx.objectStore('playlists').delete(id);
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
    if (playlistId === 'smart_rotation') {
      const all = await this.getAllTracks();
      const stats = await this.getAllStats();
      const countMap = new Map(stats.map(s => [s.songKey, s.count]));
      return all.sort((a, b) => (countMap.get(b.name.trim().toLowerCase()) || 0) - (countMap.get(a.name.trim().toLowerCase()) || 0)).slice(0, 20);
    }
    if (playlistId === 'smart_recent') {
      const all = await this.getAllTracks();
      return all.sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 20);
    }
    if (playlistId === 'smart_unplayed') {
      const all = await this.getAllTracks();
      const stats = await this.getAllStats();
      const playedSet = new Set(stats.filter(s => s.count > 0).map(s => s.songKey));
      return all.filter(t => !playedSet.has(t.name.trim().toLowerCase()));
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
      const req = tx.objectStore('tracks').put(track);
      req.onsuccess = (e) => res(e.target.result);
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
  async getAllStats() {
    return new Promise((res) => {
      const tx = db.transaction('stats', 'readonly');
      tx.objectStore('stats').getAll().onsuccess = (e) => res(e.target.result || []);
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
  async getUserProfile() {
    return new Promise((res) => {
      const tx = db.transaction('user_profile', 'readonly');
      const req = tx.objectStore('user_profile').get('user');
      req.onsuccess = () => res(req.result ? req.result.val : null);
    });
  },
  async setUserProfile(val) {
    return new Promise((res) => {
      const tx = db.transaction('user_profile', 'readwrite');
      tx.objectStore('user_profile').put({ key: 'user', val });
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
  },
  async getCustomEqPresets() {
    return new Promise((res) => {
      const tx = db.transaction('custom_eq_presets', 'readonly');
      tx.objectStore('custom_eq_presets').getAll().onsuccess = (e) => res(e.target.result || []);
    });
  },
  async saveCustomEqPreset(preset) {
    return new Promise((res) => {
      const tx = db.transaction('custom_eq_presets', 'readwrite');
      tx.objectStore('custom_eq_presets').put(preset);
      tx.oncomplete = () => res();
    });
  },
  async deleteCustomEqPreset(name) {
    return new Promise((res) => {
      const tx = db.transaction('custom_eq_presets', 'readwrite');
      tx.objectStore('custom_eq_presets').delete(name);
      tx.oncomplete = () => res();
    });
  },
  async addAuditLog(entry) {
    return new Promise((res) => {
      const tx = db.transaction('audit_log', 'readwrite');
      tx.objectStore('audit_log').add({ ...entry, date: getIndianStandardTime() });
      tx.oncomplete = () => res();
    });
  },
  async getAuditLogs() {
    return new Promise((res) => {
      const tx = db.transaction('audit_log', 'readonly');
      tx.objectStore('audit_log').getAll().onsuccess = (e) => res(e.target.result || []);
    });
  },
  async clearAuditLogs() {
    return new Promise((res) => {
      const tx = db.transaction('audit_log', 'readwrite');
      tx.objectStore('audit_log').clear();
      tx.oncomplete = () => res();
    });
  },
  async addPlaybackHistory(trackName, playlistName) {
    return new Promise((res) => {
      const tx = db.transaction('playback_history', 'readwrite');
      tx.objectStore('playback_history').add({
        name: trackName,
        playlist: playlistName,
        timestamp: Date.now(),
        dateStr: getIndianStandardTime()
      });
      tx.oncomplete = () => res();
    });
  },
  async getPlaybackHistory() {
    return new Promise((res) => {
      const tx = db.transaction('playback_history', 'readonly');
      tx.objectStore('playback_history').getAll().onsuccess = (e) => res(e.target.result || []);
    });
  },
  async clearPlaybackHistory() {
    return new Promise((res) => {
      const tx = db.transaction('playback_history', 'readwrite');
      tx.objectStore('playback_history').clear();
      tx.oncomplete = () => res();
    });
  },
  async addListeningTime(seconds) {
    const todayKey = getIndianStandardDateOnly();
    const existing = await this.getListeningTimeEntry(todayKey);
    const hour = new Date().getHours();

    const hoursDistribution = existing ? (existing.hoursDistribution || {}) : {};
    hoursDistribution[hour] = (hoursDistribution[hour] || 0) + seconds;

    return new Promise((res) => {
      const tx = db.transaction('time_tracking', 'readwrite');
      tx.objectStore('time_tracking').put({
        dateKey: todayKey,
        seconds: (existing ? existing.seconds : 0) + seconds,
        hoursDistribution: hoursDistribution
      });
      tx.oncomplete = () => res();
    });
  },
  async getListeningTimeEntry(dateKey) {
    return new Promise((res) => {
      const tx = db.transaction('time_tracking', 'readonly');
      const req = tx.objectStore('time_tracking').get(dateKey);
      req.onsuccess = () => res(req.result || null);
    });
  },
  async getAllListeningTimes() {
    return new Promise((res) => {
      const tx = db.transaction('time_tracking', 'readonly');
      tx.objectStore('time_tracking').getAll().onsuccess = (e) => res(e.target.result || []);
    });
  },
  async saveTrimmedClip(clip) {
    return new Promise((res) => {
      const tx = db.transaction('trimmed_clips', 'readwrite');
      tx.objectStore('trimmed_clips').add(clip);
      tx.oncomplete = () => res();
    });
  },
  async getTrimmedClipsForSong(songName) {
    return new Promise((res) => {
      const tx = db.transaction('trimmed_clips', 'readonly');
      const idx = tx.objectStore('trimmed_clips').index('songName');
      idx.getAll(songName).onsuccess = (e) => res(e.target.result || []);
    });
  },
  async getAllTrimmedClips() {
    return new Promise((res) => {
      const tx = db.transaction('trimmed_clips', 'readonly');
      tx.objectStore('trimmed_clips').getAll().onsuccess = (e) => res(e.target.result || []);
    });
  },
  async deleteTrimmedClip(id) {
    return new Promise((res) => {
      const tx = db.transaction('trimmed_clips', 'readwrite');
      tx.objectStore('trimmed_clips').delete(id);
      tx.oncomplete = () => res();
    });
  }
};

// =============================================================
// DUAL DSP HARDWARE ENGINE (TRUE MUTUAL EXCLUSIVITY)
// =============================================================
const audio = document.getElementById('audio-engine');
let audioCtx = null;
let sourceNode = null;
let masterGainNode = null;
let crossfadeGainNode = null;
let preampGain = null;
let bassFilterNode = null;
let analyserNode = null;
let keepAliveSilentOsc = null;

// VLC EQ Frequencies
const vlcBands = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];
const defaultVlcGains = [18.2, 11.8, 3.7, -1.7, -7.8, 2.1, 9.8, 14.1, -3.6, 11.6];
let vlcFilters = [];

// Vivo EQ Frequencies
const vivoBands = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
let vivoFilters = [];
let activeEqEngine = 'vlc'; // 'vlc' OR 'vivo' (Exclusive)
let eqEnabled = false;
let currentVol = 1.0;
let currentCrossfadeDuration = 2;

// Interruption & Notification Handling
let wasPlayingBeforeInterruption = false;
let isManualPause = false;

const vivoOfficialPresets = {
  custom: [12, 8, 5, 2, -2, -6, -8, -11, -3, 7],
  pop: [6, 4, -3, -2, 4, 2, -4, -3, 6, 3],
  dance: [6, 4, -3, -3, 3, 2, -2, 0, 6, 4],
  blues: [3, 4, 0, 0, 4, 2, 2, 1, 3, 3],
  classical: [6, 8, 2, 3, 0, 2, -2, -6, -7, -8],
  jazz: [-4, -3, -1, 0, 4, 2, 2, 0, 3, 3],
  slow: [-4, -4, -2, -2, 4, 2, 5, 5, 0, 0],
  electro: [7, 4, 0, -2, -4, -3, 0, 0, 2, 5],
  rock: [7, 5, 1, 0, -3, -4, 2, 0, 3, 5],
  country: [4, 4, 2, 0, -2, -2, 0, 2, 4, 4],
  close: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
};

let activeVivoPresetKey = 'custom';
let currentVivoGains = [...vivoOfficialPresets.custom];

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

    crossfadeGainNode = audioCtx.createGain();
    crossfadeGainNode.gain.setValueAtTime(1.0, audioCtx.currentTime);

    preampGain = audioCtx.createGain();
    preampGain.gain.setValueAtTime(1.0, audioCtx.currentTime);

    bassFilterNode = audioCtx.createBiquadFilter();
    bassFilterNode.type = 'lowshelf';
    bassFilterNode.frequency.value = 80;
    bassFilterNode.gain.value = 0;

    // VLC filter chain
    vlcFilters = [];
    let prevNode = preampGain;
    vlcBands.forEach((freq, i) => {
      const f = audioCtx.createBiquadFilter();
      f.type = i === 0 ? 'lowshelf' : i === vlcBands.length - 1 ? 'highshelf' : 'peaking';
      if (i !== 0 && i !== vlcBands.length - 1) f.Q.value = 1.0;
      f.frequency.value = freq;
      f.gain.value = 0;
      prevNode.connect(f);
      prevNode = f;
      vlcFilters.push(f);
    });

    // Vivo filter chain
    vivoFilters = [];
    vivoBands.forEach((freq, i) => {
      const f = audioCtx.createBiquadFilter();
      f.type = i === 0 ? 'lowshelf' : i === vivoBands.length - 1 ? 'highshelf' : 'peaking';
      if (i !== 0 && i !== vivoBands.length - 1) f.Q.value = 1.2;
      f.frequency.value = 0;
      prevNode.connect(f);
      prevNode = f;
      vivoFilters.push(f);
    });

    sourceNode.connect(preampGain);
    prevNode.connect(bassFilterNode);
    bassFilterNode.connect(analyserNode);
    analyserNode.connect(crossfadeGainNode);
    crossfadeGainNode.connect(masterGainNode);
    masterGainNode.connect(audioCtx.destination);

    // Persistent Background Oscillator: keeps audio stream alive on lock screen
    try {
      const silentOsc = audioCtx.createOscillator();
      const silentGain = audioCtx.createGain();
      silentGain.gain.value = 0.00001; // Silent
      silentOsc.connect(silentGain);
      silentGain.connect(audioCtx.destination);
      silentOsc.start();
      keepAliveSilentOsc = silentOsc;
    } catch (_) {}

    startVisualizerLoop();
  } catch (e) {
    console.warn('Web Audio DSP pipeline fallback:', e);
  }
}

// Anti-Noise Buffer Flush: Eliminates static/noise burst when resuming
function cleanAudioBufferResume() {
  if (!audioCtx || !masterGainNode) return;
  const now = audioCtx.currentTime;
  masterGainNode.gain.setValueAtTime(0.0001, now);
  masterGainNode.gain.linearRampToValueAtTime(currentVol, now + 0.035);
}

// Mutually Exclusive DSP Switcher
function applyDSPState(enabled) {
  eqEnabled = enabled;
  const chk = document.getElementById('card-eq-enable');
  if (chk) chk.checked = enabled;

  if (activeEqEngine === 'vlc') {
    // Engage VLC, completely bypass Vivo
    if (vlcFilters && vlcFilters.length) {
      vlcFilters.forEach((f, i) => {
        const slider = document.querySelector(`[data-vlc-band="${i}"]`);
        const val = slider ? parseFloat(slider.value) : defaultVlcGains[i];
        if (f) f.gain.value = eqEnabled ? val : 0;
      });
    }
    if (vivoFilters && vivoFilters.length) {
      vivoFilters.forEach(f => { if (f) f.gain.value = 0; });
    }
  } else {
    // Engage Vivo, completely bypass VLC
    if (vlcFilters && vlcFilters.length) {
      vlcFilters.forEach(f => { if (f) f.gain.value = 0; });
    }
    if (vivoFilters && vivoFilters.length) {
      vivoFilters.forEach((f, i) => {
        if (f) f.gain.value = eqEnabled ? currentVivoGains[i] : 0;
      });
    }
  }

  if (preampGain && audioCtx) {
    const pSlider = document.getElementById('eq-preamp');
    const pVal = pSlider ? parseFloat(pSlider.value) : 14.1;
    preampGain.gain.setValueAtTime(
      (eqEnabled && activeEqEngine === 'vlc') ? Math.pow(10, pVal / 20) * 0.35 : 1,
      audioCtx.currentTime
    );
  }

  if (bassFilterNode) {
    const bSlider = document.getElementById('slider-bass-boost');
    const bVal = bSlider ? parseFloat(bSlider.value) : 0;
    bassFilterNode.gain.value = (eqEnabled && activeEqEngine === 'vlc') ? bVal : 0;
  }

  if (eqEnabled) {
    setVolume(20);
    showNotification(`DSP Active: ${activeEqEngine === 'vlc' ? 'VLC EQ' : 'Vivo Studio EQ'} Engaged (20% Vol)`);
  } else {
    setVolume(100);
    showNotification('DSP Bypassed: Flat Response (100% Vol)');
  }

  drawVivoSplineCurve();
}

function setVolume(pct) {
  pct = Math.max(0, Math.min(100, Math.round(pct)));
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

document.querySelectorAll('.vol-snap-btn').forEach(btn => {
  btn.onclick = () => {
    triggerHaptic(20);
    const v = parseInt(btn.dataset.vol, 10);
    setVolume(v);
    showNotification(`Volume set to ${v}%`);
  };
});

// Mutually Exclusive Switchers: Clicking one switches mode and deactivates the other
const btnTabVlc = document.getElementById('btn-tab-vlc-eq');
const btnTabVivo = document.getElementById('btn-tab-vivo-eq');

if (btnTabVlc) {
  btnTabVlc.onclick = () => {
    triggerHaptic(20);
    activeEqEngine = 'vlc';
    btnTabVlc.classList.add('active');
    if (btnTabVivo) btnTabVivo.classList.remove('active');
    const vlcBox = document.getElementById('vlc-eq-view-container');
    const vivoBox = document.getElementById('vivo-eq-view-container');
    if (vlcBox) vlcBox.style.display = 'block';
    if (vivoBox) vivoBox.style.display = 'none';
    applyDSPState(eqEnabled);
  };
}

if (btnTabVivo) {
  btnTabVivo.onclick = () => {
    triggerHaptic(20);
    activeEqEngine = 'vivo';
    btnTabVivo.classList.add('active');
    if (btnTabVlc) btnTabVlc.classList.remove('active');
    const vlcBox = document.getElementById('vlc-eq-view-container');
    const vivoBox = document.getElementById('vivo-eq-view-container');
    if (vlcBox) vlcBox.style.display = 'none';
    if (vivoBox) vivoBox.style.display = 'block';
    applyDSPState(eqEnabled);
    drawVivoSplineCurve();
  };
}

// Quick EQ Presets Strip
document.querySelectorAll('.quick-preset-chip').forEach(chip => {
  chip.onclick = () => {
    triggerHaptic(20);
    document.querySelectorAll('.quick-preset-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const p = chip.dataset.preset;
    applyQuickPreset(p);
  };
});

function applyQuickPreset(type) {
  if (type === 'flat') {
    applyVivoPreset('close');
  } else if (type === 'vocal') {
    applyVivoPreset('pop');
  } else if (type === 'bass') {
    applyVivoPreset('electro');
    if (bassFilterNode) bassFilterNode.gain.value = 8;
  } else if (type === 'treble') {
    applyVivoPreset('rock');
  } else if (type === 'acoustic') {
    applyVivoPreset('classical');
  }
  showNotification(`Preset Applied: ${type.toUpperCase()}`);
}

// Vivo Studio Preset Map
function applyVivoPreset(presetKey, customGains = null) {
  activeVivoPresetKey = presetKey;
  currentVivoGains = customGains ? [...customGains] : [...(vivoOfficialPresets[presetKey] || vivoOfficialPresets.custom)];

  document.querySelectorAll('.vivo-preset-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.vpreset === presetKey);
  });

  const nameLbl = document.getElementById('vivo-active-preset-name');
  if (nameLbl) nameLbl.textContent = `Preset: ${presetKey.charAt(0).toUpperCase() + presetKey.slice(1)}`;

  document.querySelectorAll('.vivo-vertical-slider').forEach((s, i) => {
    s.value = currentVivoGains[i];
  });

  applyDSPState(eqEnabled);
}

document.querySelectorAll('.vivo-preset-btn').forEach(btn => {
  btn.onclick = () => {
    triggerHaptic(20);
    const key = btn.dataset.vpreset;
    applyVivoPreset(key);
  };
});

document.querySelectorAll('.vivo-vertical-slider').forEach(slider => {
  slider.oninput = (e) => {
    triggerHaptic(10);
    const idx = parseInt(e.target.dataset.vivoBand, 10);
    currentVivoGains[idx] = parseFloat(e.target.value);
    activeVivoPresetKey = 'custom';
    const nameLbl = document.getElementById('vivo-active-preset-name');
    if (nameLbl) nameLbl.textContent = 'Preset: Custom';
    document.querySelectorAll('.vivo-preset-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.vpreset === 'custom');
    });
    applyDSPState(eqEnabled);
  };
});

function drawVivoSplineCurve() {
  const canvas = document.getElementById('vivo-curve-canvas');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const midY = h / 2;

  ctx.clearRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, midY);
  ctx.lineTo(w, midY);
  ctx.stroke();

  const points = [];
  const stepX = w / (currentVivoGains.length - 1);

  currentVivoGains.forEach((g, i) => {
    const x = i * stepX;
    const y = midY - (g / 12) * (midY - 8);
    points.push({ x, y });
  });

  ctx.strokeStyle = '#e83e8c';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }
  ctx.stroke();
}

// Custom EQ Modal
const btnSaveAsCustomEq = document.getElementById('btn-save-as-custom-eq');
if (btnSaveAsCustomEq) {
  btnSaveAsCustomEq.onclick = () => {
    triggerHaptic(20);
    if (inputCustomEqName) inputCustomEqName.value = '';
    if (customEqModal) customEqModal.style.display = 'flex';
  };
}

const btnCancelCustomEq = document.getElementById('btn-cancel-custom-eq');
if (btnCancelCustomEq) {
  btnCancelCustomEq.onclick = () => {
    if (customEqModal) customEqModal.style.display = 'none';
  };
}

const btnConfirmSaveCustomEq = document.getElementById('btn-confirm-save-custom-eq');
if (btnConfirmSaveCustomEq) {
  btnConfirmSaveCustomEq.onclick = async () => {
    triggerHaptic(30);
    const name = inputCustomEqName ? inputCustomEqName.value.trim() : '';
    if (!name) return showNotification('Please enter a name for your preset');

    const presetObj = {
      name,
      gains: [...currentVivoGains],
      preamp: 14.1,
      createdAt: getIndianStandardTime()
    };

    await dbOps.saveCustomEqPreset(presetObj);
    if (customEqModal) customEqModal.style.display = 'none';
    showNotification(`Preset "${name}" saved!`);
    await loadCustomEqCarousel();
    applyVivoPreset(name, presetObj.gains);
  };
}

async function loadCustomEqCarousel() {
  const list = await dbOps.getCustomEqPresets();
  const carousel = document.getElementById('vivo-presets-carousel');
  if (!carousel) return;
  document.querySelectorAll('.user-custom-preset-btn').forEach(b => b.remove());

  list.forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'vivo-preset-btn user-custom-preset-btn';
    btn.dataset.vpreset = p.name;
    btn.innerHTML = `${p.name} <span class="btn-del-eq" style="color:#f85149;margin-left:4px;">✕</span>`;

    btn.onclick = (e) => {
      if (e.target.classList.contains('btn-del-eq')) {
        e.stopPropagation();
        triggerHaptic(25);
        dbOps.deleteCustomEqPreset(p.name).then(loadCustomEqCarousel);
        showNotification(`Preset "${p.name}" deleted`);
        return;
      }
      triggerHaptic(20);
      applyVivoPreset(p.name, p.gains);
    };

    carousel.appendChild(btn);
  });
}

const btnExportEq = document.getElementById('btn-export-current-eq');
if (btnExportEq) {
  btnExportEq.onclick = () => {
    triggerHaptic(25);
    const payload = {
      type: 'AMMU_VIVO_EQ',
      version: '1.0',
      presetName: activeVivoPresetKey,
      gains: currentVivoGains,
      preamp: 14.1,
      exportedAt: getIndianStandardTime()
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Ammu_EQ_${activeVivoPresetKey}_profile.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    showNotification('Equalizer profile exported!');
  };
}

const importEqFile = document.getElementById('import-eq-file');
if (importEqFile) {
  importEqFile.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.gains && Array.isArray(data.gains)) {
          triggerHaptic(30);
          applyVivoPreset(data.presetName || 'Imported', data.gains);
          await dbOps.saveCustomEqPreset({
            name: data.presetName || 'Imported',
            gains: data.gains,
            preamp: 14.1,
            createdAt: getIndianStandardTime()
          });
          loadCustomEqCarousel();
          showNotification('Equalizer profile imported & applied!');
        }
      } catch {
        showNotification('Invalid EQ profile file.');
      }
    };
    r.readAsText(file);
  };
}

// Crossfade Staging
const selectCrossfade = document.getElementById('select-crossfade-sec');
if (selectCrossfade) {
  selectCrossfade.onchange = (e) => {
    currentCrossfadeDuration = parseInt(e.target.value, 10);
    dbOps.setConfig('crossfade_sec', currentCrossfadeDuration);
    showNotification(`Crossfade set to ${currentCrossfadeDuration}s`);
  };
}

async function executeCrossfadeTransition(nextTrackAction) {
  if (!audioCtx || currentCrossfadeDuration <= 0 || !crossfadeGainNode) {
    return nextTrackAction();
  }
  try {
    const fadeTime = currentCrossfadeDuration;
    crossfadeGainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + fadeTime);
    setTimeout(() => {
      nextTrackAction();
      crossfadeGainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
      crossfadeGainNode.gain.linearRampToValueAtTime(1.0, audioCtx.currentTime + fadeTime);
    }, fadeTime * 1000);
  } catch {
    nextTrackAction();
  }
}

// Waveform Canvas Rendering
async function renderWaveformForTrack(blob) {
  const canvas = document.getElementById('waveform-canvas');
  if (!canvas || !blob) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  try {
    const arrayBuf = await blob.slice(0, 500000).arrayBuffer();
    const tempCtx = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuf = await tempCtx.decodeAudioData(arrayBuf);
    const data = audioBuf.getChannelData(0);
    const step = Math.ceil(data.length / w);

    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#2ea043';
    for (let i = 0; i < w; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      const barH = Math.max(2, (max - min) * (h / 2));
      ctx.fillRect(i, (h - barH) / 2, 2, barH);
    }
  } catch (_) {
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    for (let i = 0; i < w; i += 4) {
      const barH = (Math.sin(i * 0.1) * 0.5 + 0.5) * (h * 0.7) + 4;
      ctx.fillRect(i, (h - barH) / 2, 2.5, barH);
    }
  }
}

// Mini-Player Swipe Gestures
let miniTouchStartX = 0;
let miniTouchStartY = 0;

if (miniPlayerBar) {
  miniPlayerBar.addEventListener('touchstart', (e) => {
    miniTouchStartX = e.touches[0].clientX;
    miniTouchStartY = e.touches[0].clientY;
  }, { passive: true });

  miniPlayerBar.addEventListener('touchend', (e) => {
    const diffX = e.changedTouches[0].clientX - miniTouchStartX;
    const diffY = e.changedTouches[0].clientY - miniTouchStartY;

    if (diffY < -40 && Math.abs(diffX) < 60) {
      triggerHaptic(25);
      if (playerBoxModal) playerBoxModal.style.display = 'flex';
      renderSeekTicks();
      renderCardReorderList();
      calculateAndRenderQueueDuration();
      updateAmbientGlow(boxCover);
      return;
    }

    if (Math.abs(diffX) > 55 && Math.abs(diffY) < 45) {
      if (diffX < 0) {
        triggerHaptic(25);
        showNotification('⏩ Next Track');
        loopNext();
      } else {
        triggerHaptic(25);
        showNotification('⏪ Previous Track');
        if (boxBtnPrev) boxBtnPrev.click();
      }
    }
  }, { passive: true });
}

// Fluid Pull-Down Dismiss on Fullscreen Card
let dragStartY = 0;
let isDraggingCard = false;

if (dragHandleBar) {
  dragHandleBar.addEventListener('touchstart', (e) => {
    dragStartY = e.touches[0].clientY;
    isDraggingCard = true;
  }, { passive: true });

  dragHandleBar.addEventListener('touchmove', (e) => {
    if (!isDraggingCard || !playerBoxModal) return;
    const currentY = e.touches[0].clientY;
    const diffY = currentY - dragStartY;
    if (diffY > 0) {
      playerBoxModal.style.transform = `translateY(${diffY}px)`;
    }
  }, { passive: true });

  dragHandleBar.addEventListener('touchend', (e) => {
    if (!isDraggingCard || !playerBoxModal) return;
    isDraggingCard = false;
    const diffY = e.changedTouches[0].clientY - dragStartY;
    if (diffY > 120) {
      triggerHaptic(25);
      playerBoxModal.style.transform = 'translateY(100%)';
      setTimeout(() => {
        playerBoxModal.style.display = 'none';
        playerBoxModal.style.transform = 'translateY(0)';
      }, 200);
    } else {
      playerBoxModal.style.transform = 'translateY(0)';
    }
  }, { passive: true });
}

// Visualizer Loop
function startVisualizerLoop() {
  if (!analyserNode || !vCtx || !visualizerCanvas) return;
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

function updateAmbientGlow(imgEl) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgEl, 0, 0, 10, 10);
    const p = ctx.getImageData(5, 5, 1, 1).data;
    const color = `rgba(${p[0]}, ${p[1]}, ${p[2]}, 0.38)`;
    const glow = document.getElementById('ambient-glow-layer');
    if (glow) glow.style.background = `radial-gradient(circle, ${color} 0%, transparent 70%)`;
  } catch (_) {}
}

// Android Audio Interruption & Notification Listeners
audio.addEventListener('pause', () => {
  if (!isManualPause && currentPlayingTrack) {
    wasPlayingBeforeInterruption = true;
  }
});

audio.addEventListener('play', () => {
  isManualPause = false;
  wasPlayingBeforeInterruption = false;
  cleanAudioBufferResume();
});

window.addEventListener('focus', () => {
  if (wasPlayingBeforeInterruption && audio.paused && currentPlayingTrack) {
    audio.play().catch(() => {});
    wasPlayingBeforeInterruption = false;
  }
});

// State
let activePlaylistId = 'all';
let currentPlaylist = { id: 'all', name: 'All', cover: '' };
let browsingTracks = [];
let playingQueue = [];
let allTracksRaw = [];
let currentPlayingTrack = null;
let currentAppLogo = 'my-icon.png';
let currentAppName = 'Ammu';
let playMode = 'all';
let speedList = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
let currentSpeedIndex = 2;
let sleepTimerId = null;
let pointA = null;
let pointB = null;
let trackToRename = null;
let currentSongTimestamps = [];
let pendingTimestampTime = 0;
let userProfile = { name: 'Amarjeet Kumar', avatar: 'my-icon.png' };
let multiSelectMode = false;
let selectedTrackIds = new Set();
let isDiscEffectActive = false;
let currentSortMode = 'default';
let playNextQueue = [];
let activePlayTimer = null;
let tempUserAvatarBase64 = null;
let availablePlaylistList = [];
let activeContextTrack = null;
let activeContextPlaylist = null;
let tempEditPlaylistArt = null;
let isCurrentAdminKeyRevealed = false;

// Header Settings Trigger
const btnMainSettings = document.getElementById('btn-main-settings-trigger');
if (btnMainSettings) {
  btnMainSettings.onclick = (e) => {
    e.stopPropagation();
    triggerHaptic(20);
    const isHidden = !headerSettingsMenu || headerSettingsMenu.style.display === 'none' || !headerSettingsMenu.style.display;
    dismissAllMenus();
    if (isHidden && headerSettingsMenu) headerSettingsMenu.style.display = 'flex';
  };
}

const menuBtnMyAccount = document.getElementById('menu-btn-my-account');
if (menuBtnMyAccount) {
  menuBtnMyAccount.onclick = () => {
    if (headerSettingsMenu) headerSettingsMenu.style.display = 'none';
    openSettingsModal();
  };
}

const menuBtnStorageAuditor = document.getElementById('menu-btn-storage-auditor');
if (menuBtnStorageAuditor) {
  menuBtnStorageAuditor.onclick = () => {
    if (headerSettingsMenu) headerSettingsMenu.style.display = 'none';
    openStorageAuditorModal();
  };
}

const menuBtnInstallPwa = document.getElementById('menu-btn-install-pwa');
if (menuBtnInstallPwa) {
  menuBtnInstallPwa.onclick = () => {
    if (headerSettingsMenu) headerSettingsMenu.style.display = 'none';
    triggerPWAInstall();
  };
}

const menuBtnDevProfile = document.getElementById('menu-btn-dev-profile');
if (menuBtnDevProfile) {
  menuBtnDevProfile.onclick = () => {
    if (headerSettingsMenu) headerSettingsMenu.style.display = 'none';
    openDevModal();
  };
}

// Hierarchical Sort Menus
if (btnSortTrigger) {
  btnSortTrigger.onclick = (e) => {
    e.stopPropagation();
    triggerHaptic(20);
    const isHidden = !sortByMenu || sortByMenu.style.display === 'none' || !sortByMenu.style.display;
    dismissAllMenus();
    if (isHidden && sortByMenu) {
      const rect = btnSortTrigger.getBoundingClientRect();
      sortByMenu.style.top = `${rect.bottom + window.scrollY + 6}px`;
      sortByMenu.style.left = `${Math.max(10, rect.left - 100)}px`;
      sortByMenu.style.display = 'flex';
    }
  };
}

const sortCatName = document.getElementById('sort-cat-name');
if (sortCatName) {
  sortCatName.onclick = (e) => {
    e.stopPropagation();
    triggerHaptic(15);
    if (sortSubSize) sortSubSize.style.display = 'none';
    const rect = sortCatName.getBoundingClientRect();
    if (sortSubName) {
      sortSubName.style.top = `${rect.top + window.scrollY}px`;
      sortSubName.style.left = `${Math.max(10, rect.left - 160)}px`;
      sortSubName.style.display = 'flex';
    }
  };
}

const sortCatSize = document.getElementById('sort-cat-size');
if (sortCatSize) {
  sortCatSize.onclick = (e) => {
    e.stopPropagation();
    triggerHaptic(15);
    if (sortSubName) sortSubName.style.display = 'none';
    const rect = sortCatSize.getBoundingClientRect();
    if (sortSubSize) {
      sortSubSize.style.top = `${rect.top + window.scrollY}px`;
      sortSubSize.style.left = `${Math.max(10, rect.left - 160)}px`;
      sortSubSize.style.display = 'flex';
    }
  };
}

document.querySelectorAll('.sort-item').forEach(btn => {
  btn.onclick = () => {
    triggerHaptic(20);
    currentSortMode = btn.dataset.sort;
    dismissAllMenus();
    renderFilteredTracks();
    showNotification(`Sorted: ${btn.textContent}`);
  };
});

// Admin Super-Key Suite
async function refreshAdminKeyUI() {
  const plainKey = await dbOps.getConfig('account_admin_key_plain');
  const statusLbl = document.getElementById('admin-key-status-lbl');
  const createdBox = document.getElementById('admin-key-created-controls');
  const setupBox = document.getElementById('admin-key-setup-controls');
  const displayInput = document.getElementById('display-admin-key-val');
  const toggleBtn = document.getElementById('btn-toggle-view-admin-key');

  if (plainKey) {
    if (statusLbl) {
      statusLbl.textContent = 'Status: Active Admin Super-Key Registered';
      statusLbl.style.color = 'var(--accent-light)';
    }
    if (createdBox) createdBox.style.display = 'block';
    if (setupBox) setupBox.style.display = 'none';
    isCurrentAdminKeyRevealed = false;
    if (displayInput) {
      displayInput.type = 'password';
      displayInput.value = plainKey;
    }
    if (toggleBtn) toggleBtn.textContent = '👁️ View';
  } else {
    if (statusLbl) {
      statusLbl.textContent = 'Status: No Admin Key Created';
      statusLbl.style.color = 'var(--text-muted)';
    }
    if (createdBox) createdBox.style.display = 'none';
    if (setupBox) setupBox.style.display = 'flex';
    const sInput = document.getElementById('settings-admin-key-input');
    if (sInput) sInput.value = '';
  }
}

const btnSaveAdminKey = document.getElementById('btn-save-admin-key');
if (btnSaveAdminKey) {
  btnSaveAdminKey.onclick = async () => {
    triggerHaptic(30);
    const sInput = document.getElementById('settings-admin-key-input');
    const keyInput = sInput ? sInput.value.trim() : '';
    if (!keyInput) return showNotification('Please enter a valid Admin Key.');
    const h = await hashPasskey(keyInput);
    await dbOps.setConfig('account_admin_key_hash', h);
    await dbOps.setConfig('account_admin_key_plain', keyInput);
    showNotification('Admin Super-Key registered successfully!');
    refreshAdminKeyUI();
  };
}

const btnToggleViewAdmin = document.getElementById('btn-toggle-view-admin-key');
if (btnToggleViewAdmin) {
  btnToggleViewAdmin.onclick = () => {
    triggerHaptic(15);
    const displayInput = document.getElementById('display-admin-key-val');
    isCurrentAdminKeyRevealed = !isCurrentAdminKeyRevealed;
    if (displayInput) displayInput.type = isCurrentAdminKeyRevealed ? 'text' : 'password';
    btnToggleViewAdmin.textContent = isCurrentAdminKeyRevealed ? '🙈 Hide' : '👁️ View';
  };
}

const btnOpenUpdateAdmin = document.getElementById('btn-open-update-admin-key');
if (btnOpenUpdateAdmin) {
  btnOpenUpdateAdmin.onclick = async () => {
    triggerHaptic(20);
    const currentKey = await dbOps.getConfig('account_admin_key_plain');
    const newKey = prompt('Enter new Admin Super-Key to replace the current key:', currentKey || '');
    if (newKey !== null && newKey.trim() !== '') {
      const h = await hashPasskey(newKey.trim());
      await dbOps.setConfig('account_admin_key_hash', h);
      await dbOps.setConfig('account_admin_key_plain', newKey.trim());
      showNotification('Admin Super-Key updated successfully!');
      refreshAdminKeyUI();
    }
  };
}

const btnRemoveAdminKey = document.getElementById('btn-remove-admin-key');
if (btnRemoveAdminKey) {
  btnRemoveAdminKey.onclick = async () => {
    triggerHaptic(35);
    if (confirm('Remove your account Admin Super-Key?')) {
      await dbOps.setConfig('account_admin_key_hash', null);
      await dbOps.setConfig('account_admin_key_plain', null);
      showNotification('Admin Super-Key removed.');
      refreshAdminKeyUI();
    }
  };
}

// Track 3-Dots Menu
const menuBtnTrackSelect = document.getElementById('menu-btn-track-select');
if (menuBtnTrackSelect) {
  menuBtnTrackSelect.onclick = () => {
    if (activeContextTrack) {
      triggerHaptic(30);
      multiSelectMode = true;
      selectedTrackIds.add(activeContextTrack.id);
      const batchBar = document.getElementById('batch-action-bar');
      if (batchBar) batchBar.style.display = 'flex';
      renderFilteredTracks();
    }
    if (trackContextMenu) trackContextMenu.style.display = 'none';
  };
}

const menuBtnPlayNext = document.getElementById('menu-btn-play-next');
if (menuBtnPlayNext) {
  menuBtnPlayNext.onclick = () => {
    if (activeContextTrack) {
      queueSongPlayNext(activeContextTrack);
    }
    if (trackContextMenu) trackContextMenu.style.display = 'none';
  };
}

const menuBtnRename = document.getElementById('menu-btn-rename');
if (menuBtnRename) {
  menuBtnRename.onclick = () => {
    if (activeContextTrack) {
      openRenameModal(activeContextTrack);
    }
    if (trackContextMenu) trackContextMenu.style.display = 'none';
  };
}

const menuBtnAddToPl = document.getElementById('menu-btn-add-to-pl');
if (menuBtnAddToPl) {
  menuBtnAddToPl.onclick = (e) => {
    e.stopPropagation();
    openAddToPlaylistSubmenu();
  };
}

const menuBtnRemoveFromPl = document.getElementById('menu-btn-remove-from-pl');
if (menuBtnRemoveFromPl) {
  menuBtnRemoveFromPl.onclick = () => {
    if (activeContextTrack && activePlaylistId !== 'all') {
      executeRemoveTrackFromCurrentPlaylist(activeContextTrack);
    }
    if (trackContextMenu) trackContextMenu.style.display = 'none';
  };
}

function openAddToPlaylistSubmenu() {
  const box = document.getElementById('add-to-playlist-options-box');
  if (!box) return;
  box.innerHTML = '';
  const available = availablePlaylistList.filter(p => p.id !== 'all' && !p.id.startsWith('smart_'));

  available.forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'menu-pop-item';
    btn.textContent = `📁 ${p.localName || p.name}`;
    btn.onclick = async () => {
      triggerHaptic(25);
      await dbOps.saveTrack({
        playlistId: p.id,
        name: activeContextTrack.name,
        blob: activeContextTrack.blob,
        isMissing: activeContextTrack.isMissing,
        order: Date.now()
      });
      showNotification(`Added "${activeContextTrack.name}" to ${p.localName || p.name}`);
      dismissAllMenus();
    };
    box.appendChild(btn);
  });

  if (trackContextMenu && addToPlaylistSubmenu) {
    const rect = trackContextMenu.getBoundingClientRect();
    addToPlaylistSubmenu.style.top = `${rect.top}px`;
    addToPlaylistSubmenu.style.left = `${Math.max(10, rect.left - 160)}px`;
    addToPlaylistSubmenu.style.display = 'flex';
  }
}

// Playlist Context Menu
const plBtnDownloadAll = document.getElementById('pl-menu-btn-download-all');
if (plBtnDownloadAll) {
  plBtnDownloadAll.onclick = () => {
    if (playlistContextMenu) playlistContextMenu.style.display = 'none';
    downloadEntirePlaylist();
  };
}

const plBtnEdit = document.getElementById('pl-menu-btn-edit');
if (plBtnEdit) {
  plBtnEdit.onclick = () => {
    if (!activeContextPlaylist) return;
    if (playlistContextMenu) playlistContextMenu.style.display = 'none';

    if (activeContextPlaylist.isAuthorLocked && activeContextPlaylist.passkeyHash && !activeContextPlaylist.isUnlockedLocally && !activeContextPlaylist.isPermanentAdminUnlocked) {
      promptGenericKeyAuth(
        '🔒 Creator Passkey Required',
        'This playlist is locked by its creator. Enter the passkey or Master Key to edit.',
        [activeContextPlaylist.passkeyHash, activeContextPlaylist.masterKeyHash],
        () => {
          activeContextPlaylist.isUnlockedLocally = true;
          dbOps.savePlaylist(activeContextPlaylist);
          openEditPlaylistModal(activeContextPlaylist);
        }
      );
    } else {
      openEditPlaylistModal(activeContextPlaylist);
    }
  };
}

const plBtnDelete = document.getElementById('pl-menu-btn-delete');
if (plBtnDelete) {
  plBtnDelete.onclick = () => {
    if (!activeContextPlaylist) return;
    if (playlistContextMenu) playlistContextMenu.style.display = 'none';

    if (activeContextPlaylist.isAuthorLocked && activeContextPlaylist.passkeyHash && !activeContextPlaylist.isUnlockedLocally && !activeContextPlaylist.isPermanentAdminUnlocked) {
      promptGenericKeyAuth(
        '🔒 Creator Passkey Required',
        'Enter the passkey or Master Key to delete this protected playlist.',
        [activeContextPlaylist.passkeyHash, activeContextPlaylist.masterKeyHash],
        () => {
          activeContextPlaylist.isUnlockedLocally = true;
          dbOps.savePlaylist(activeContextPlaylist);
          executePlaylistDeleteWithUndo(activeContextPlaylist);
        }
      );
    } else {
      executePlaylistDeleteWithUndo(activeContextPlaylist);
    }
  };
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.context-menu-pop') && !e.target.closest('.btn-more-dots') && !e.target.closest('.chip-dots-btn') && !e.target.closest('#btn-main-settings-trigger') && !e.target.closest('#btn-sort-trigger')) {
    dismissAllMenus();
  }
});

function promptGenericKeyAuth(title, desc, acceptedHashes, onSuccess) {
  const entered = prompt(`${title}\n${desc}`);
  if (!entered) return;
  hashPasskey(entered.trim()).then(h => {
    if (acceptedHashes.includes(h)) {
      triggerHaptic(30);
      showNotification('Action Authorized!');
      onSuccess();
    } else {
      triggerHaptic(45);
      showNotification('Invalid Key. Authorization Denied.');
    }
  });
}

// Edit Playlist Details Modal
function openEditPlaylistModal(pl) {
  if (!editPlaylistModal) return;
  if (editPlaylistNameInput) editPlaylistNameInput.value = pl.localName || pl.name;
  if (editPlaylistAuthorInput) editPlaylistAuthorInput.value = (pl.localAuthor && pl.localAuthor.name) ? pl.localAuthor.name : (pl.author ? pl.author.name : userProfile.name);
  if (editPlaylistPreviewImg) editPlaylistPreviewImg.src = pl.localCover || pl.cover || currentAppLogo;
  tempEditPlaylistArt = pl.localCover || pl.cover || currentAppLogo;

  if (pl.id === 'favorites') {
    if (editPlaylistNameInput) editPlaylistNameInput.disabled = true;
    if (editPlNameWarning) editPlNameWarning.style.display = 'block';
  } else {
    if (editPlaylistNameInput) editPlaylistNameInput.disabled = false;
    if (editPlNameWarning) editPlNameWarning.style.display = 'none';
  }

  editPlaylistModal.style.display = 'flex';
}

const btnCancelEditPl = document.getElementById('btn-cancel-edit-playlist');
if (btnCancelEditPl) {
  btnCancelEditPl.onclick = () => {
    if (editPlaylistModal) editPlaylistModal.style.display = 'none';
  };
}

if (editPlaylistArtInput) {
  editPlaylistArtInput.onchange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      tempEditPlaylistArt = await compressImageSafe(e.target.files[0]);
      if (editPlaylistPreviewImg) editPlaylistPreviewImg.src = tempEditPlaylistArt;
    }
  };
}

const btnSaveEditPl = document.getElementById('btn-save-edit-playlist');
if (btnSaveEditPl) {
  btnSaveEditPl.onclick = async () => {
    triggerHaptic(30);
    if (!activeContextPlaylist) return;

    const isPermAdmin = Boolean(activeContextPlaylist.isPermanentAdminUnlocked);

    if (!activeContextPlaylist.originalName) {
      activeContextPlaylist.originalName = activeContextPlaylist.name;
      activeContextPlaylist.originalAuthor = activeContextPlaylist.author || userProfile;
      activeContextPlaylist.originalCover = activeContextPlaylist.cover || currentAppLogo;
    }

    if (activeContextPlaylist.id !== 'favorites') {
      const newName = editPlaylistNameInput ? editPlaylistNameInput.value.trim() : '';
      if (newName) {
        if (isPermAdmin) activeContextPlaylist.name = newName;
        activeContextPlaylist.localName = newName;
      }
    }

    const newAuthorName = editPlaylistAuthorInput ? editPlaylistAuthorInput.value.trim() : '';
    if (newAuthorName) {
      const newAuthObj = {
        name: newAuthorName,
        avatar: activeContextPlaylist.author ? activeContextPlaylist.author.avatar : userProfile.avatar
      };
      if (isPermAdmin) activeContextPlaylist.author = newAuthObj;
      activeContextPlaylist.localAuthor = newAuthObj;
    }

    if (tempEditPlaylistArt) {
      if (isPermAdmin) activeContextPlaylist.cover = tempEditPlaylistArt;
      activeContextPlaylist.localCover = tempEditPlaylistArt;
    }

    await dbOps.savePlaylist(activeContextPlaylist);
    if (editPlaylistModal) editPlaylistModal.style.display = 'none';
    showNotification(isPermAdmin ? 'Playlist credentials permanently updated!' : 'Playlist details updated locally!');
    await loadPlaylists();
  };
}

function executePlaylistDeleteWithUndo(pl) {
  if (pl.id === 'favorites' || pl.id === 'all' || pl.id.startsWith('smart_')) {
    return showNotification('Default or Smart playlists cannot be deleted.');
  }

  triggerHaptic(35);
  showUndoToast(`Deleted playlist "${pl.localName || pl.name}"`, async () => {
    await dbOps.savePlaylist(pl);
    await loadPlaylists();
  }, async () => {
    await dbOps.deletePlaylist(pl.id);
    if (activePlaylistId === pl.id) {
      activePlaylistId = 'all';
    }
    await loadPlaylists();
  });

  availablePlaylistList = availablePlaylistList.filter(p => p.id !== pl.id);
  if (activePlaylistId === pl.id) {
    activePlaylistId = 'all';
  }
  loadPlaylists();
}

// Storage Auditor
let detectedDuplicateTrackIds = new Set();

function openStorageAuditorModal() {
  triggerHaptic(20);
  if (storageAuditorModal) storageAuditorModal.style.display = 'flex';
}

const btnCloseStorageAuditor = document.getElementById('btn-close-storage-auditor');
if (btnCloseStorageAuditor) {
  btnCloseStorageAuditor.onclick = () => {
    if (storageAuditorModal) storageAuditorModal.style.display = 'none';
  };
}

const btnRunDupScan = document.getElementById('btn-run-duplicate-scan');
if (btnRunDupScan) {
  btnRunDupScan.onclick = async () => {
    triggerHaptic(30);
    const listEl = document.getElementById('duplicate-tracks-list');
    if (listEl) listEl.innerHTML = '<li style="padding:4px;">Scanning local audio blobs...</li>';

    const allTracks = await dbOps.getAllTracks();
    let totalBytes = 0;
    const chunkMap = new Map();
    const duplicates = [];

    detectedDuplicateTrackIds.clear();

    for (const trk of allTracks) {
      if (trk.blob && trk.blob.size > 0) {
        totalBytes += trk.blob.size;
        const signature = `${trk.name.trim().toLowerCase()}_${trk.blob.size}`;
        if (chunkMap.has(signature)) {
          duplicates.push(trk);
          detectedDuplicateTrackIds.add(trk.id);
        } else {
          chunkMap.set(signature, trk.id);
        }
      }
    }

    const totalSizeEl = document.getElementById('auditor-total-size');
    const dupCountEl = document.getElementById('auditor-duplicate-count');
    const purgeBtn = document.getElementById('btn-purge-duplicates');

    if (totalSizeEl) totalSizeEl.textContent = `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
    if (dupCountEl) dupCountEl.textContent = duplicates.length;

    if (listEl) {
      listEl.innerHTML = '';
      if (!duplicates.length) {
        listEl.innerHTML = '<li style="padding:4px;color:var(--accent-light);">✓ No duplicate tracks detected. Storage is clean!</li>';
        if (purgeBtn) purgeBtn.disabled = true;
      } else {
        duplicates.forEach(d => {
          const li = document.createElement('li');
          li.innerHTML = `⚠️ <strong>${d.name}</strong> <span style="font-size:0.7rem;color:var(--text-muted);">(${(d.blob.size / (1024*1024)).toFixed(1)}MB)</span>`;
          listEl.appendChild(li);
        });
        if (purgeBtn) purgeBtn.disabled = false;
      }
    }
  };
}

const btnPurgeDup = document.getElementById('btn-purge-duplicates');
if (btnPurgeDup) {
  btnPurgeDup.onclick = async () => {
    triggerHaptic(35);
    const count = detectedDuplicateTrackIds.size;
    for (const id of detectedDuplicateTrackIds) {
      await dbOps.deleteTrack(id);
    }
    showNotification(`Reclaimed space! Removed ${count} duplicate track(s).`);
    if (storageAuditorModal) storageAuditorModal.style.display = 'none';
    await loadPlaylists();
  };
}

// Bulk Download Actions
const btnUnivDownload = document.getElementById('btn-universal-download-all');
if (btnUnivDownload) {
  btnUnivDownload.onclick = async () => {
    triggerHaptic(35);
    const allTracks = await dbOps.getAllTracks();
    const downloadable = allTracks.filter(t => t.blob && t.blob.size > 0 && !t.downloadRestricted);

    if (!downloadable.length) {
      return showNotification('No unrestricted audio files eligible for bulk download.');
    }

    showNotification(`Downloading ${downloadable.length} tracks to storage...`);
    for (const trk of downloadable) {
      downloadSingleTrack(trk, false);
      await new Promise(r => setTimeout(r, 200));
    }
    showNotification('Bulk playlist download complete!');
  };
}

const btnUnivDelete = document.getElementById('btn-universal-delete-all');
if (btnUnivDelete) {
  btnUnivDelete.onclick = async () => {
    triggerHaptic(35);
    const pls = await dbOps.getPlaylists();
    const userPlaylists = pls.filter(p => p.id !== 'favorites' && p.id !== 'all' && !p.id.startsWith('smart_'));

    if (!userPlaylists.length) {
      return showNotification('No custom playlists to delete.');
    }

    showUndoToast(`Deleted ${userPlaylists.length} custom playlists`, async () => {
      for (const pl of userPlaylists) await dbOps.savePlaylist(pl);
      await loadPlaylists();
    }, async () => {
      for (const pl of userPlaylists) await dbOps.deletePlaylist(pl.id);
      activePlaylistId = 'all';
      await loadPlaylists();
    });

    availablePlaylistList = availablePlaylistList.filter(p => p.id === 'all' || p.id === 'favorites');
    activePlaylistId = 'all';
    loadPlaylists();
    if (settingsModal) settingsModal.style.display = 'none';
  };
}

// Onboarding
async function checkOnboarding() {
  const saved = await dbOps.getUserProfile();
  if (saved) {
    userProfile = saved;
    updateUserProfileLabels();
  } else {
    const obModal = document.getElementById('onboarding-modal');
    if (obModal) obModal.style.display = 'flex';
  }
}

function updateUserProfileLabels() {
  const lbl = document.getElementById('settings-current-user-lbl');
  if (lbl) lbl.textContent = `Active listener: ${userProfile.name}`;
}

const onbAvatar = document.getElementById('onboarding-avatar');
if (onbAvatar) {
  onbAvatar.onchange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const b64 = await compressImageSafe(e.target.files[0]);
      const prev = document.getElementById('onboarding-avatar-preview');
      if (prev) prev.src = b64;
    }
  };
}

const btnCompleteOnboarding = document.getElementById('btn-complete-onboarding');
if (btnCompleteOnboarding) {
  btnCompleteOnboarding.onclick = async () => {
    const nameInput = document.getElementById('onboarding-name');
    const prev = document.getElementById('onboarding-avatar-preview');
    const name = (nameInput ? nameInput.value.trim() : '') || 'Amarjeet Kumar';
    const avatar = (prev ? prev.src : '') || 'my-icon.png';
    userProfile = { name, avatar };
    await dbOps.setUserProfile(userProfile);
    updateUserProfileLabels();
    const obModal = document.getElementById('onboarding-modal');
    if (obModal) obModal.style.display = 'none';
    ensureAudioPipeline();
    showNotification(`Welcome to Ammu, ${name}!`);
  };
}

const onbImportFile = document.getElementById('onboarding-import-file');
if (onbImportFile) {
  onbImportFile.onchange = (e) => {
    handleDirectImport(e.target.files[0], true);
  };
}

const plModalImportFile = document.getElementById('playlist-modal-import-file');
if (plModalImportFile) {
  plModalImportFile.onchange = (e) => {
    const createModal = document.getElementById('playlist-create-modal');
    if (createModal) createModal.style.display = 'none';
    handleDirectImport(e.target.files[0], false);
  };
}

// User Profile Actions
const btnOpenEditUserProfile = document.getElementById('btn-open-edit-user-profile');
if (btnOpenEditUserProfile) {
  btnOpenEditUserProfile.onclick = () => {
    triggerHaptic(20);
    if (editUserNameInput) editUserNameInput.value = userProfile.name;
    if (userEditAvatarPreview) userEditAvatarPreview.src = userProfile.avatar || 'my-icon.png';
    tempUserAvatarBase64 = userProfile.avatar;
    if (settingsModal) settingsModal.style.display = 'none';
    if (userProfileModal) userProfileModal.style.display = 'flex';
  };
}

const btnCancelUserProfile = document.getElementById('btn-cancel-user-profile');
if (btnCancelUserProfile) {
  btnCancelUserProfile.onclick = () => {
    if (userProfileModal) userProfileModal.style.display = 'none';
    if (settingsModal) settingsModal.style.display = 'flex';
  };
}

if (editUserAvatarInput) {
  editUserAvatarInput.onchange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      tempUserAvatarBase64 = await compressImageSafe(e.target.files[0]);
      if (userEditAvatarPreview) userEditAvatarPreview.src = tempUserAvatarBase64;
    }
  };
}

const btnSaveUserProfile = document.getElementById('btn-save-user-profile');
if (btnSaveUserProfile) {
  btnSaveUserProfile.onclick = async () => {
    triggerHaptic(30);
    const n = editUserNameInput ? editUserNameInput.value.trim() : '';
    if (n) userProfile.name = n;
    if (tempUserAvatarBase64) userProfile.avatar = tempUserAvatarBase64;

    await dbOps.setUserProfile(userProfile);
    updateUserProfileLabels();
    if (userProfileModal) userProfileModal.style.display = 'none';
    if (settingsModal) settingsModal.style.display = 'flex';
    showNotification('Listener profile updated!');
    await loadPlaylists();
  };
}

// Downloads
async function downloadEntirePlaylist() {
  triggerHaptic(35);
  const available = browsingTracks.filter(t => t.blob && t.blob.size > 0);
  if (!available.length) {
    return showNotification('No playable audio files to download in this playlist.');
  }

  if (currentPlaylist.downloadRestricted && !currentPlaylist.isDownloadUnlocked) {
    const entered = prompt('🔒 Download Key Required:\nThis playlist is download-restricted. Enter the Download Key or Master Key:');
    if (!entered) return;
    const h = await hashPasskey(entered.trim());
    if (h === currentPlaylist.downloadKeyHash || h === currentPlaylist.masterKeyHash) {
      currentPlaylist.isDownloadUnlocked = true;
      await dbOps.savePlaylist(currentPlaylist);
      showNotification('Playlist download unlocked!');
      executeBulkPlaylistDownload(available);
    } else {
      showNotification('Invalid Key. You are not allowed to download this playlist.');
    }
    return;
  }

  executeBulkPlaylistDownload(available);
}

async function executeBulkPlaylistDownload(list) {
  const authorName = (currentPlaylist.author && currentPlaylist.author.name) || userProfile.name || 'Amarjeet';
  let successCount = 0;

  for (const trk of list) {
    if (trk.downloadRestricted && !currentPlaylist.isDownloadUnlocked) continue;
    downloadSingleTrack(trk, false, authorName);
    successCount++;
    await new Promise(r => setTimeout(r, 220));
  }
  showNotification(`Downloaded ${successCount} tracks to your device!`);
}

const btnDlPlToStorage = document.getElementById('btn-download-playlist-to-storage');
if (btnDlPlToStorage) {
  btnDlPlToStorage.onclick = async () => {
    const aModal = document.getElementById('author-modal');
    if (aModal) aModal.style.display = 'none';
    await downloadEntirePlaylist();
  };
}

async function downloadSingleTrack(trk, notify = true, explicitAuthorName = '') {
  if (!trk.blob || trk.blob.size === 0) {
    return showNotification(`Cannot download: "${trk.name}" is missing from storage.`);
  }

  if (trk.downloadRestricted && !currentPlaylist.isDownloadUnlocked) {
    const entered = prompt(`🔒 Song Download Restricted:\nEnter Download Key or Master Key to download "${trk.name}":`);
    if (!entered) return;
    const h = await hashPasskey(entered.trim());
    if (h === trk.downloadKeyHash || h === trk.masterKeyHash || h === currentPlaylist.downloadKeyHash || h === currentPlaylist.masterKeyHash) {
      currentPlaylist.isDownloadUnlocked = true;
      await dbOps.savePlaylist(currentPlaylist);
      showNotification('Download authorized for this playlist!');
      executeSingleDownload(trk, notify, explicitAuthorName);
    } else {
      showNotification('Invalid Key. You are not allowed to download this song.');
    }
    return;
  }

  executeSingleDownload(trk, notify, explicitAuthorName);
}

function executeSingleDownload(trk, notify, explicitAuthorName) {
  const url = URL.createObjectURL(trk.blob);
  const a = document.createElement('a');
  a.href = url;
  
  const authorName = explicitAuthorName || (currentPlaylist.author && currentPlaylist.author.name) || userProfile.name || 'Amarjeet';
  const cleanBaseName = trk.name.replace(/\.[^/.]+$/, "");
  const finalFileName = `${cleanBaseName} ${authorName}'s music taste.mp3`;
  
  a.download = finalFileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  if (notify) showNotification(`Downloaded: ${finalFileName}`);
}

// Author Modal Triggers
const btnViewPlAuthor = document.getElementById('btn-view-playlist-author');
if (btnViewPlAuthor) {
  btnViewPlAuthor.onclick = () => {
    triggerHaptic(20);
    const author = currentPlaylist.localAuthor || currentPlaylist.author || userProfile;
    const nameEl = document.getElementById('author-name-display');
    const avEl = document.getElementById('author-avatar-display');
    const plNameEl = document.getElementById('author-pl-name');
    const trkCountEl = document.getElementById('author-track-count');
    const crDateEl = document.getElementById('author-created-date');
    const tagEl = document.getElementById('author-status-tag');
    const authModal = document.getElementById('author-modal');

    if (nameEl) nameEl.textContent = author.name;
    if (avEl) avEl.src = author.avatar || 'my-icon.png';
    if (plNameEl) plNameEl.textContent = currentPlaylist.localName || currentPlaylist.name;
    if (trkCountEl) trkCountEl.textContent = browsingTracks.length;
    if (crDateEl) crDateEl.textContent = currentPlaylist.createdAt || 'Local Storage';
    if (tagEl) tagEl.textContent = (currentPlaylist.isImported || currentPlaylist.isAuthorLocked) ? 'Original Curator' : 'Local Playlist Creator';
    if (authModal) authModal.style.display = 'flex';
  };
}

const cardQueueAuthBtn = document.getElementById('card-queue-author-btn');
if (cardQueueAuthBtn && btnViewPlAuthor) {
  cardQueueAuthBtn.onclick = () => {
    btnViewPlAuthor.click();
  };
}

const btnCloseAuthModal = document.getElementById('btn-close-author');
if (btnCloseAuthModal) {
  btnCloseAuthModal.onclick = () => {
    const authModal = document.getElementById('author-modal');
    if (authModal) authModal.style.display = 'none';
  };
}

// Vinyl Disc Interaction
let lastTapTime = 0;
if (artDisplayBox) {
  artDisplayBox.addEventListener('click', (e) => {
    if (e.target.closest('.btn-edit-cover')) return;
    const now = Date.now();
    if (now - lastTapTime < 300) {
      const rect = artDisplayBox.getBoundingClientRect();
      const isRight = (e.clientX - rect.left) > (rect.width / 2);
      if (isRight) {
        triggerHaptic(25);
        audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
        showSeekFeedback('⏩ +10s');
      } else {
        triggerHaptic(25);
        audio.currentTime = Math.max(0, audio.currentTime - 10);
        showSeekFeedback('⏪ -10s');
      }
    } else {
      triggerHaptic(25);
      isDiscEffectActive = !isDiscEffectActive;
      artDisplayBox.className = `detail-art-container ${isDiscEffectActive ? 'mode-vinyl' : 'mode-standard'}`;
      showNotification(isDiscEffectActive ? 'Disc Vinyl Mode: Active' : 'Artwork View: Restored');
    }
    lastTapTime = now;
  });
}

function showSeekFeedback(text) {
  if (!seekFeedbackOverlay) return;
  seekFeedbackOverlay.textContent = text;
  seekFeedbackOverlay.style.opacity = '1';
  setTimeout(() => { seekFeedbackOverlay.style.opacity = '0'; }, 500);
}

// Developer Profile
let devData = {
  name: 'Amarjeet Kumar',
  title: 'Lead Audio Architect & Engineer',
  bio: 'Built with passion for high-fidelity audio, offline-first Web Audio DSP, and clean UX.',
  location: 'Bihar, India',
  email: 'amarjeet.kumar.dev@gmail.com',
  avatar: 'my-icon.png'
};

async function loadDevProfile() {
  const saved = await dbOps.getDevProfile();
  if (saved) devData = Object.assign(devData, saved);
  applyDevProfileUI();
}

function applyDevProfileUI() {
  if (devNameDisplay) devNameDisplay.textContent = devData.name;
  if (devTitleDisplay) devTitleDisplay.textContent = devData.title;
  if (devBioDisplay) devBioDisplay.textContent = devData.bio;
  if (devLocationDisplay) devLocationDisplay.textContent = devData.location;
  if (devEmailDisplay) devEmailDisplay.textContent = devData.email;
  if (devAvatarImg) devAvatarImg.src = devData.avatar || 'my-icon.png';

  if (editDevName) editDevName.value = devData.name;
  if (editDevTitle) editDevTitle.value = devData.title;
  if (editDevBio) editDevBio.value = devData.bio;
  if (editDevLocation) editDevLocation.value = devData.location;
  if (editDevEmail) editDevEmail.value = devData.email;
}

function openDevModal() {
  triggerHaptic(20);
  if (devModal) devModal.style.display = 'flex';
}

const footerDevTrig = document.getElementById('footer-dev-trigger');
if (footerDevTrig) footerDevTrig.onclick = openDevModal;

const btnCloseDev = document.getElementById('btn-close-dev');
if (btnCloseDev) {
  btnCloseDev.onclick = () => {
    if (devModal) devModal.style.display = 'none';
  };
}

if (editDevAvatar) {
  editDevAvatar.onchange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      tempDevAvatarBase64 = await compressImageSafe(e.target.files[0]);
      if (devAvatarImg) devAvatarImg.src = tempDevAvatarBase64;
    }
  };
}

const btnSaveDev = document.getElementById('btn-save-dev-profile');
if (btnSaveDev) {
  btnSaveDev.onclick = async () => {
    triggerHaptic(30);
    if (editDevName) devData.name = editDevName.value.trim() || devData.name;
    if (editDevTitle) devData.title = editDevTitle.value.trim() || devData.title;
    if (editDevBio) devData.bio = editDevBio.value.trim() || devData.bio;
    if (editDevLocation) devData.location = editDevLocation.value.trim() || devData.location;
    if (editDevEmail) devData.email = editDevEmail.value.trim() || devData.email;
    if (tempDevAvatarBase64) devData.avatar = tempDevAvatarBase64;

    await dbOps.setDevProfile(devData);
    applyDevProfileUI();
    showNotification('Developer profile updated!');
  };
}

// Analytics Dashboard
async function renderListeningDashboard() {
  const allTimeLogs = await dbOps.getAllListeningTimes();
  const todayKey = getIndianStandardDateOnly();

  let todaySecs = 0;
  let weekSecs = 0;
  let monthSecs = 0;
  let allTimeSecs = 0;

  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const hoursDistribution = {};

  allTimeLogs.forEach(entry => {
    const entryDate = new Date(entry.dateKey);
    const diffDays = Math.floor((now - entryDate) / dayMs);

    allTimeSecs += entry.seconds;
    if (entry.dateKey === todayKey) todaySecs += entry.seconds;
    if (diffDays <= 7) weekSecs += entry.seconds;
    if (diffDays <= 30) monthSecs += entry.seconds;

    if (entry.hoursDistribution) {
      Object.entries(entry.hoursDistribution).forEach(([h, s]) => {
        hoursDistribution[h] = (hoursDistribution[h] || 0) + s;
      });
    }
  });

  const tDay = document.getElementById('stat-time-today');
  const tWk = document.getElementById('stat-time-week');
  const tMo = document.getElementById('stat-time-month');
  const tAll = document.getElementById('stat-time-all');

  if (tDay) tDay.textContent = formatHoursMins(todaySecs);
  if (tWk) tWk.textContent = formatHoursMins(weekSecs);
  if (tMo) tMo.textContent = formatHoursMins(monthSecs);
  if (tAll) tAll.textContent = formatHoursMins(allTimeSecs);

  let peakHour = 0;
  let maxSecs = -1;
  Object.entries(hoursDistribution).forEach(([h, s]) => {
    if (s > maxSecs) { maxSecs = s; peakHour = parseInt(h, 10); }
  });
  let peakPeriod = 'Evening';
  if (peakHour >= 0 && peakHour < 6) peakPeriod = 'Late Night (12 AM - 6 AM)';
  else if (peakHour >= 6 && peakHour < 12) peakPeriod = 'Morning (6 AM - 12 PM)';
  else if (peakHour >= 12 && peakHour < 18) peakPeriod = 'Afternoon (12 PM - 6 PM)';
  else peakPeriod = 'Evening / Night (6 PM - 12 AM)';
  const pkLbl = document.getElementById('stat-peak-hour-lbl');
  if (pkLbl) pkLbl.textContent = maxSecs > 0 ? `Peak Routine: ${peakPeriod}` : 'Peak Routine: Calculating...';

  renderMilestones(allTimeSecs);

  const allStats = await dbOps.getAllStats();
  allStats.sort((a, b) => b.count - a.count);
  const topListEl = document.getElementById('stats-top-songs-list');
  if (topListEl) {
    topListEl.innerHTML = '';
    if (!allStats.length) {
      topListEl.innerHTML = '<li style="padding:4px;">No track replays logged yet.</li>';
    } else {
      allStats.slice(0, 5).forEach((item, idx) => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>#${idx + 1}</strong> ${item.songKey} <span style="float:right;color:var(--accent-light);">${item.count} plays</span>`;
        li.onclick = () => playSongByNameGlobally(item.songKey);
        topListEl.appendChild(li);
      });
    }
  }

  renderPlaybackHistoryTimeline();
}

async function playSongByNameGlobally(songName) {
  triggerHaptic(20);
  const stModal = document.getElementById('stats-modal');
  if (stModal) stModal.style.display = 'none';

  let sIdx = browsingTracks.findIndex(t => t.name.trim().toLowerCase() === songName.trim().toLowerCase());
  if (sIdx !== -1) {
    return playTrackFromBrowsing(sIdx);
  }

  const all = await dbOps.getAllTracks();
  const found = all.find(t => t.name.trim().toLowerCase() === songName.trim().toLowerCase());
  if (found) {
    activePlaylistId = 'all';
    await loadPlaylists();
    sIdx = browsingTracks.findIndex(t => t.name.trim().toLowerCase() === songName.trim().toLowerCase());
    if (sIdx !== -1) playTrackFromBrowsing(sIdx);
  } else {
    showNotification(`Track "${songName}" not found in library.`);
  }
}

function formatHoursMins(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function renderMilestones(totalSeconds) {
  const badgesBox = document.getElementById('milestone-badges-row');
  if (!badgesBox) return;
  badgesBox.innerHTML = '';

  const badges = [
    { title: '🎧 First Listen', unlocked: totalSeconds > 60 },
    { title: '⏳ 1 Hour Club', unlocked: totalSeconds >= 3600 },
    { title: '🏃 Marathoner (5h)', unlocked: totalSeconds >= 18000 },
    { title: '🌙 Night Owl', unlocked: new Date().getHours() >= 0 && new Date().getHours() <= 5 }
  ];

  badges.forEach(b => {
    const chip = document.createElement('span');
    chip.className = `badge-chip ${b.unlocked ? '' : 'locked'}`;
    chip.textContent = `${b.title} ${b.unlocked ? '✓' : '🔒'}`;
    badgesBox.appendChild(chip);
  });
}

async function renderPlaybackHistoryTimeline() {
  const historyListEl = document.getElementById('stats-history-list');
  if (!historyListEl) return;
  historyListEl.innerHTML = '';
  const history = await dbOps.getPlaybackHistory();
  if (!history.length) {
    historyListEl.innerHTML = '<li style="padding:4px;">No recent history.</li>';
    return;
  }
  history.slice().reverse().slice(0, 20).forEach(h => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${h.name}</strong> <span style="font-size:0.68rem;color:var(--text-muted);">${h.playlist}</span> <span style="float:right;">${h.dateStr}</span>`;
    li.onclick = () => playSongByNameGlobally(h.name);
    historyListEl.appendChild(li);
  });
}

const btnClearHist = document.getElementById('btn-clear-play-history');
if (btnClearHist) {
  btnClearHist.onclick = async () => {
    const previous = await dbOps.getPlaybackHistory();
    await dbOps.clearPlaybackHistory();
    renderPlaybackHistoryTimeline();
    showUndoToast('Cleared playback timeline history', async () => {
      for (const h of previous) {
        await dbOps.addPlaybackHistory(h.name, h.playlist);
      }
      renderPlaybackHistoryTimeline();
    });
  };
}

function startListeningTimeTracking() {
  if (activePlayTimer) clearInterval(activePlayTimer);
  activePlayTimer = setInterval(() => {
    if (!audio.paused && audio.currentTime > 0) {
      dbOps.addListeningTime(1);
    }
  }, 1000);
}

// Settings Branding
async function loadAppBranding() {
  const savedName = await dbOps.getConfig('app_name');
  const savedLogo = await dbOps.getConfig('app_logo');
  const savedTheme = await dbOps.getConfig('app_theme');
  const savedAmoled = await dbOps.getConfig('app_amoled');
  const savedCrossfade = await dbOps.getConfig('crossfade_sec');

  if (savedName) currentAppName = savedName;
  if (savedLogo) currentAppLogo = savedLogo;
  if (savedTheme) setAppTheme(savedTheme);
  if (savedAmoled) {
    document.body.classList.toggle('amoled-mode', savedAmoled);
    const chkAmoled = document.getElementById('chk-amoled-mode');
    if (chkAmoled) chkAmoled.checked = savedAmoled;
  }
  if (savedCrossfade !== null) {
    currentCrossfadeDuration = parseInt(savedCrossfade, 10);
    const selCrossfade = document.getElementById('select-crossfade-sec');
    if (selCrossfade) selCrossfade.value = currentCrossfadeDuration.toString();
  }

  applyBrandingUI();
}

function setAppTheme(color) {
  document.documentElement.style.setProperty('--accent', color);
  document.documentElement.style.setProperty('--accent-light', color);
}

document.querySelectorAll('.theme-circle-btn').forEach((btn) => {
  btn.onclick = async () => {
    triggerHaptic(25);
    const col = btn.dataset.color;
    setAppTheme(col);
    await dbOps.setConfig('app_theme', col);
    showNotification(`Theme accent updated!`);
  };
});

const chkAmoledMode = document.getElementById('chk-amoled-mode');
if (chkAmoledMode) {
  chkAmoledMode.onchange = async (e) => {
    triggerHaptic(25);
    document.body.classList.toggle('amoled-mode', e.target.checked);
    await dbOps.setConfig('app_amoled', e.target.checked);
  };
}

function applyBrandingUI() {
  if (displayAppName) displayAppName.textContent = currentAppName;
  if (htmlTitle) htmlTitle.textContent = currentAppName;
  if (headerAppLogo) headerAppLogo.src = currentAppLogo;
  if (appFavicon) appFavicon.href = currentAppLogo;
  if (settingsLogoPreview) settingsLogoPreview.src = currentAppLogo;
}

// Scoped Selective Export Permissions Matrix
async function openSettingsModal() {
  triggerHaptic(20);
  if (customAppNameInput) customAppNameInput.value = currentAppName;
  if (settingsLogoPreview) settingsLogoPreview.src = currentAppLogo;
  tempNewLogoBase64 = currentAppLogo;
  updateUserProfileLabels();
  refreshAdminKeyUI();

  const plChecklist = document.getElementById('export-playlist-checklist');
  if (plChecklist) {
    plChecklist.innerHTML = '';
    const pls = await dbOps.getPlaylists();
    pls.forEach(p => {
      const label = document.createElement('label');
      label.className = 'checkbox-label';
      label.innerHTML = `<input type="checkbox" class="export-pl-checkbox" data-pl-id="${p.id}" checked /> ${p.localName || p.name}`;
      plChecklist.appendChild(label);
    });

    document.querySelectorAll('.export-pl-checkbox').forEach(cb => {
      cb.addEventListener('change', renderExportTrackPermissionMatrix);
    });
  }

  renderExportTrackPermissionMatrix();
  renderAuditLogs();
  if (settingsModal) settingsModal.style.display = 'flex';
}

async function renderExportTrackPermissionMatrix() {
  const box = document.getElementById('export-tracks-permission-checklist');
  if (!box) return;
  box.innerHTML = '';
  const filterInput = document.getElementById('export-track-filter-input');
  const q = filterInput ? filterInput.value.trim().toLowerCase() : '';

  const selectedPlIds = new Set(
    Array.from(document.querySelectorAll('.export-pl-checkbox:checked'))
      .map(cb => cb.dataset.plId)
  );

  const allTracks = await dbOps.getAllTracks();
  
  // Strictly filter down to tracks that belong to the selected playlists
  const scopedTracks = allTracks.filter(t => selectedPlIds.has(t.playlistId) || t.playlistId === 'all');
  const filtered = scopedTracks.filter(t => t.name.toLowerCase().includes(q));

  if (!filtered.length) {
    box.innerHTML = '<div style="font-size:0.75rem;color:var(--text-muted);padding:4px;">No tracks in selected playlist(s).</div>';
    return;
  }

  filtered.forEach(t => {
    const row = document.createElement('label');
    row.className = 'checkbox-label';
    row.innerHTML = `
      <input type="checkbox" class="export-dl-allow-cb" data-track-name="${t.name}" checked />
      <span>Allow Download: <strong>${t.name}</strong></span>
    `;
    box.appendChild(row);
  });
}

const expTrkFilter = document.getElementById('export-track-filter-input');
if (expTrkFilter) expTrkFilter.addEventListener('input', renderExportTrackPermissionMatrix);

const btnExpAllowAll = document.getElementById('btn-export-allow-all-dl');
if (btnExpAllowAll) {
  btnExpAllowAll.onclick = () => {
    document.querySelectorAll('.export-dl-allow-cb').forEach(cb => cb.checked = true);
  };
}

const btnExpRestrictAll = document.getElementById('btn-export-restrict-all-dl');
if (btnExpRestrictAll) {
  btnExpRestrictAll.onclick = () => {
    document.querySelectorAll('.export-dl-allow-cb').forEach(cb => cb.checked = false);
  };
}

async function renderAuditLogs() {
  const listEl = document.getElementById('audit-history-list');
  if (!listEl) return;
  listEl.innerHTML = '';
  const logs = await dbOps.getAuditLogs();
  if (!logs.length) {
    listEl.innerHTML = '<li style="padding:4px;">No export/import activity logged yet.</li>';
    return;
  }
  logs.slice().reverse().forEach(log => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>[${log.type}]</strong> ${log.desc} <div style="color:var(--accent-light);font-size:0.7rem;margin-top:2px;">${log.keysDetail || ''}</div> <span style="float:right;font-size:0.68rem;color:var(--text-muted);">${log.date}</span>`;
    listEl.appendChild(li);
  });
}

const btnClrHist = document.getElementById('btn-clear-history');
if (btnClrHist) {
  btnClrHist.onclick = async () => {
    await dbOps.clearAuditLogs();
    renderAuditLogs();
    showNotification('Audit history cleared');
  };
}

const brandEditTrig = document.getElementById('brand-edit-trigger');
if (brandEditTrig) brandEditTrig.onclick = openSettingsModal;

const btnCancelSettings = document.getElementById('btn-cancel-settings');
if (btnCancelSettings) {
  btnCancelSettings.onclick = () => {
    if (settingsModal) settingsModal.style.display = 'none';
  };
}

if (customAppLogoInput) {
  customAppLogoInput.onchange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      tempNewLogoBase64 = await compressImageSafe(e.target.files[0]);
      if (settingsLogoPreview) settingsLogoPreview.src = tempNewLogoBase64;
    }
  };
}

const btnSaveSettings = document.getElementById('btn-save-settings');
if (btnSaveSettings) {
  btnSaveSettings.onclick = async () => {
    triggerHaptic(30);
    const newName = customAppNameInput ? customAppNameInput.value.trim() : '';
    if (newName) currentAppName = newName;
    if (tempNewLogoBase64) currentAppLogo = tempNewLogoBase64;

    await dbOps.setConfig('app_name', currentAppName);
    await dbOps.setConfig('app_logo', currentAppLogo);

    applyBrandingUI();
    if (settingsModal) settingsModal.style.display = 'none';
    showNotification(`Settings saved successfully!`);
    updateMediaSession();
  };
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64) {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array], { type: contentType });
}

const btnExpFull = document.getElementById('btn-export-full-profile');
if (btnExpFull) {
  btnExpFull.onclick = async () => {
    triggerHaptic(35);
    await executeUniversalExport(true, true, true, true, null);
  };
}

const btnExpMeta = document.getElementById('btn-export-meta-profile');
if (btnExpMeta) {
  btnExpMeta.onclick = async () => {
    triggerHaptic(35);
    await executeUniversalExport(false, true, true, false, null);
  };
}

const btnExpBackup = document.getElementById('btn-export-backup');
if (btnExpBackup) {
  btnExpBackup.onclick = async () => {
    triggerHaptic(35);
    const chkAudio = document.getElementById('chk-export-audio');
    const chkClips = document.getElementById('chk-export-trimmed-clips');
    const chkMarkers = document.getElementById('chk-export-timestamps');
    const chkImages = document.getElementById('chk-export-images');

    const includeAudio = chkAudio ? chkAudio.checked : true;
    const includeClips = chkClips ? chkClips.checked : true;
    const includeMarkers = chkMarkers ? chkMarkers.checked : true;
    const includeImages = chkImages ? chkImages.checked : true;

    const selectedPlIds = new Set(
      Array.from(document.querySelectorAll('#export-playlist-checklist input:checked'))
        .map(cb => cb.dataset.plId)
    );

    await executeUniversalExport(includeAudio, includeMarkers, includeImages, includeClips, selectedPlIds);
  };
}

// Scoped Export Pipeline with Centered Progress Modal
async function executeUniversalExport(includeAudio, includeMarkers, includeImages, includeClips, selectedPlIds) {
  showProcessingModal('Exporting Sound Library...');
  const allTracks = await dbOps.getAllTracks();
  const allPlaylists = await dbOps.getPlaylists();
  const devProfile = await dbOps.getDevProfile();

  const inMaster = document.getElementById('export-master-key-input');
  const inEnc = document.getElementById('export-encryption-key-input');
  const inPass = document.getElementById('export-passkey-input');
  const inDl = document.getElementById('export-download-key-input');

  const masterKey = inMaster ? inMaster.value.trim() : '';
  const encryptionKey = inEnc ? inEnc.value.trim() : '';
  const plainPasskey = inPass ? inPass.value.trim() : '';
  const downloadKey = inDl ? inDl.value.trim() : '';

  const masterKeyHash = masterKey ? await hashPasskey(masterKey) : '';
  const passkeyHash = plainPasskey ? await hashPasskey(plainPasskey) : '';
  const downloadKeyHash = downloadKey ? await hashPasskey(downloadKey) : '';

  const allowedDownloadNames = new Set(
    Array.from(document.querySelectorAll('.export-dl-allow-cb:checked'))
      .map(cb => cb.dataset.trackName)
  );

  const exportedPlaylists = allPlaylists.filter(p => !selectedPlIds || selectedPlIds.has(p.id)).map(p => ({
    id: p.id,
    name: p.originalName || p.name,
    cover: includeImages ? (p.originalCover || p.cover || 'my-icon.png') : 'my-icon.png',
    author: p.originalAuthor || p.author || userProfile,
    isAuthorLocked: Boolean(plainPasskey || masterKey),
    passkeyHash: p.passkeyHash || passkeyHash,
    masterKeyHash: masterKeyHash,
    downloadRestricted: Boolean(downloadKey || masterKey),
    downloadKeyHash: downloadKeyHash,
    createdAt: p.createdAt || getIndianStandardDateOnly()
  }));

  const exportedTracks = [];
  const tracksToProcess = allTracks.filter(t => !selectedPlIds || selectedPlIds.has(t.playlistId) || t.playlistId === 'all');
  
  for (let i = 0; i < tracksToProcess.length; i++) {
    if (isOperationCancelled) {
      hideProcessingModal();
      return;
    }
    const t = tracksToProcess[i];
    updateProcessingProgress((i / tracksToProcess.length) * 80, `Packing: ${t.name} (${i + 1}/${tracksToProcess.length})`);

    let audioData = null;
    if (includeAudio && t.blob && t.blob.size > 0) {
      try { audioData = await blobToBase64(t.blob); } catch (_) {}
    }
    const trkLyrics = await dbOps.getLyrics(t.name);
    const trkMarkers = includeMarkers ? await dbOps.getTimestamps(t.name) : [];
    const isFav = await dbOps.isFavorite(t.name);
    const playCount = await dbOps.getPlayCount(t.name);
    const isDownloadRestricted = !allowedDownloadNames.has(t.name);

    exportedTracks.push({
      id: t.id,
      name: t.name,
      playlistId: t.playlistId,
      order: t.order,
      audioBase64: audioData,
      lyrics: trkLyrics,
      markers: trkMarkers,
      isFavorite: isFav,
      playCount: playCount,
      downloadRestricted: isDownloadRestricted,
      downloadKeyHash: isDownloadRestricted ? downloadKeyHash : '',
      masterKeyHash: masterKeyHash
    });
  }

  const exportedClips = [];
  if (includeClips) {
    const allClips = await dbOps.getAllTrimmedClips();
    for (const c of allClips) {
      if (isOperationCancelled) {
        hideProcessingModal();
        return;
      }
      let b64 = null;
      if (c.blob) {
        try { b64 = await blobToBase64(c.blob); } catch (_) {}
      }
      exportedClips.push({
        songName: c.songName,
        clipName: c.clipName,
        clipBase64: b64,
        duration: c.duration,
        createdAt: c.createdAt
      });
    }
  }

  const payload = {
    version: '17.0',
    exportedAt: getIndianStandardTime(),
    generator: 'Ammu',
    author: userProfile,
    isAuthorLocked: Boolean(plainPasskey || masterKey),
    passkeyHash: passkeyHash,
    masterKeyHash: masterKeyHash,
    downloadKeyHash: downloadKeyHash,
    hasMedia: includeAudio,
    branding: {
      appName: currentAppName,
      appLogo: includeImages ? currentAppLogo : 'my-icon.png'
    },
    devProfile,
    playlists: exportedPlaylists,
    tracks: exportedTracks,
    trimmedClips: exportedClips
  };

  updateProcessingProgress(90, 'Applying encryption rules...');
  let rawDataToEmit = JSON.stringify(payload, null, 2);

  if (encryptionKey) {
    rawDataToEmit = await encryptPayloadAES(rawDataToEmit, encryptionKey);
  }

  const authorName = userProfile.name || 'Amarjeet';
  const finalBackupFileName = `Ammu_${includeAudio ? 'FULL' : 'META'}_${authorName}'s music taste backup.json`;

  const blob = new Blob([rawDataToEmit], { type: 'application/json' });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = finalBackupFileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(downloadUrl);

  const keysDetailStr = `Keys Implemented: [Master: ${masterKey || 'None'}] | [Encryption: ${encryptionKey ? 'Enabled' : 'None'}] | [Creator Passkey: ${plainPasskey || 'None'}] | [Download Key: ${downloadKey || 'None'}]`;

  await dbOps.addAuditLog({
    type: 'EXPORT',
    desc: `Exported: "${finalBackupFileName}"`,
    keysDetail: keysDetailStr
  });
  renderAuditLogs();
  hideProcessingModal();
  showNotification(`Downloaded backup: ${finalBackupFileName}`);
}

// Two-Phase Import System
let rawEncryptedDataToDecrypt = null;
let parsedDecryptedPayload = null;
let currentImportBypassOnboarding = false;

const importBackupFile = document.getElementById('import-backup-file');
if (importBackupFile) {
  importBackupFile.onchange = (e) => {
    handleDirectImport(e.target.files[0], false);
  };
}

async function handleDirectImport(file, bypassOnboarding) {
  if (!file) return;
  currentImportBypassOnboarding = bypassOnboarding;
  showProcessingModal('Reading Backup Archive...');
  const reader = new FileReader();
  reader.onload = async (ev) => {
    try {
      const content = ev.target.result;
      const parsed = JSON.parse(content);
      hideProcessingModal();

      if (parsed.encrypted && parsed.cipherData) {
        rawEncryptedDataToDecrypt = parsed;
        const keyInput = document.getElementById('decryption-key-input');
        if (keyInput) keyInput.value = '';
        const decModal = document.getElementById('decryption-auth-modal');
        if (decModal) decModal.style.display = 'flex';
        return;
      }

      evaluateSecondaryKeysPhase(parsed);
    } catch (_) {
      hideProcessingModal();
      showNotification('Import Failed: Corrupted or invalid JSON backup file.');
    }
  };
  reader.readAsText(file);
}

const btnCancelDec = document.getElementById('btn-cancel-decryption');
if (btnCancelDec) {
  btnCancelDec.onclick = () => {
    const decModal = document.getElementById('decryption-auth-modal');
    if (decModal) decModal.style.display = 'none';
    rawEncryptedDataToDecrypt = null;
  };
}

const btnConfirmDec = document.getElementById('btn-confirm-decryption');
if (btnConfirmDec) {
  btnConfirmDec.onclick = async () => {
    const keyInput = document.getElementById('decryption-key-input');
    const enteredKey = keyInput ? keyInput.value.trim() : '';
    if (!enteredKey) return showNotification('Please enter the decryption key.');

    showProcessingModal('Decrypting AES-256 Payload...');
    try {
      const decryptedStr = await decryptPayloadAES(rawEncryptedDataToDecrypt, enteredKey);
      const decryptedPayload = JSON.parse(decryptedStr);
      hideProcessingModal();
      const decModal = document.getElementById('decryption-auth-modal');
      if (decModal) decModal.style.display = 'none';
      rawEncryptedDataToDecrypt = null;
      showNotification('File decrypted successfully!');
      evaluateSecondaryKeysPhase(decryptedPayload);
    } catch (err) {
      hideProcessingModal();
      alert('Decryption Failed: Incorrect key or corrupted payload.');
    }
  };
}

// "Forgot Key?" Fallback Guard
const btnForgotDecKey = document.getElementById('btn-forgot-decryption-key');
if (btnForgotDecKey) {
  btnForgotDecKey.onclick = () => {
    attemptAdminSuperKeyAccess(() => {
      showNotification('Admin Super-Key Verified: Bypassing file lock.');
      const decModal = document.getElementById('decryption-auth-modal');
      if (decModal) decModal.style.display = 'none';
    });
  };
}

const btnForgotSecKeys = document.getElementById('btn-forgot-secondary-keys');
if (btnForgotSecKeys) {
  btnForgotSecKeys.onclick = () => {
    attemptAdminSuperKeyAccess(() => {
      const secModal = document.getElementById('secondary-keys-modal');
      if (secModal) secModal.style.display = 'none';
      showNotification('Admin Super-Key Verified: Permanent Author & Download Access Granted!');
      proceedToStorageMatcherScreen(true, true, true, true);
    });
  };
}

async function attemptAdminSuperKeyAccess(onSuccess) {
  const savedHash = await dbOps.getConfig('account_admin_key_hash');
  if (!savedHash) {
    triggerHaptic(45);
    alert('There is no super access. You have to put keys to get access.\nNo super access allowed.');
    return;
  }

  const modal = document.getElementById('admin-auth-modal');
  const input = document.getElementById('admin-auth-input');
  if (input) input.value = '';
  if (modal) modal.style.display = 'flex';

  const btnCancelAdmin = document.getElementById('btn-cancel-admin-auth');
  if (btnCancelAdmin) {
    btnCancelAdmin.onclick = () => {
      if (modal) modal.style.display = 'none';
    };
  }

  const btnConfirmAdmin = document.getElementById('btn-confirm-admin-auth');
  if (btnConfirmAdmin) {
    btnConfirmAdmin.onclick = async () => {
      const entered = input ? input.value.trim() : '';
      if (!entered) return showNotification('Please enter Admin Key');
      const enteredHash = await hashPasskey(entered);

      if (enteredHash === savedHash) {
        triggerHaptic(35);
        if (modal) modal.style.display = 'none';
        onSuccess();
      } else {
        triggerHaptic(45);
        alert('Invalid Admin Key. Access denied.');
      }
    };
  }
}

function evaluateSecondaryKeysPhase(payload) {
  parsedDecryptedPayload = payload;

  const hasMaster = Boolean(payload.masterKeyHash);
  const hasDownload = Boolean(payload.downloadKeyHash);
  const hasAuthor = Boolean(payload.passkeyHash);

  if (!hasMaster && !hasDownload && !hasAuthor) {
    proceedToStorageMatcherScreen(false, false, false, false);
    return;
  }

  const modal = document.getElementById('secondary-keys-modal');
  const chkMaster = document.getElementById('chk-enter-master-key');
  const boxMaster = document.getElementById('box-master-key-input');
  const inMaster = document.getElementById('in-master-key');

  const chkDownload = document.getElementById('chk-enter-download-key');
  const boxDownload = document.getElementById('box-download-key-input');
  const inDownload = document.getElementById('in-download-key');

  const chkAuthor = document.getElementById('chk-enter-author-key');
  const boxAuthor = document.getElementById('box-author-key-input');
  const inAuthor = document.getElementById('in-author-key');

  const secondaryGroup = document.getElementById('secondary-individual-keys-group');

  if (chkMaster) {
    chkMaster.checked = false;
    if (boxMaster) boxMaster.style.display = 'none';
    if (inMaster) inMaster.value = '';
  }

  if (chkDownload) {
    chkDownload.checked = false;
    if (boxDownload) boxDownload.style.display = 'none';
    if (inDownload) inDownload.value = '';
  }

  if (chkAuthor) {
    chkAuthor.checked = false;
    if (boxAuthor) boxAuthor.style.display = 'none';
    if (inAuthor) inAuthor.value = '';
  }

  if (secondaryGroup) secondaryGroup.style.display = 'block';

  if (chkMaster) {
    chkMaster.onchange = () => {
      if (chkMaster.checked) {
        if (boxMaster) boxMaster.style.display = 'block';
        if (secondaryGroup) secondaryGroup.style.display = 'none';
        if (chkDownload) chkDownload.checked = false;
        if (chkAuthor) chkAuthor.checked = false;
        if (boxDownload) boxDownload.style.display = 'none';
        if (boxAuthor) boxAuthor.style.display = 'none';
        if (inDownload) inDownload.value = '';
        if (inAuthor) inAuthor.value = '';
      } else {
        if (boxMaster) boxMaster.style.display = 'none';
        if (inMaster) inMaster.value = '';
        if (secondaryGroup) secondaryGroup.style.display = 'block';
      }
    };
  }

  if (chkDownload) {
    chkDownload.onchange = () => {
      if (boxDownload) boxDownload.style.display = chkDownload.checked ? 'block' : 'none';
      if (!chkDownload.checked && inDownload) inDownload.value = '';
    };
  }

  if (chkAuthor) {
    chkAuthor.onchange = () => {
      if (boxAuthor) boxAuthor.style.display = chkAuthor.checked ? 'block' : 'none';
      if (!chkAuthor.checked && inAuthor) inAuthor.value = '';
    };
  }

  if (modal) modal.style.display = 'flex';
}

const btnCancelSecKeys = document.getElementById('btn-cancel-secondary-keys');
if (btnCancelSecKeys) {
  btnCancelSecKeys.onclick = () => {
    const modal = document.getElementById('secondary-keys-modal');
    if (modal) modal.style.display = 'none';
    parsedDecryptedPayload = null;
  };
}

const btnConfirmSecKeys = document.getElementById('btn-confirm-secondary-keys');
if (btnConfirmSecKeys) {
  btnConfirmSecKeys.onclick = async () => {
    const payload = parsedDecryptedPayload;
    let isMasterUnlocked = false;
    let isDownloadUnlocked = false;
    let isAuthorUnlocked = false;

    const chkMaster = document.getElementById('chk-enter-master-key');
    const inMaster = document.getElementById('in-master-key');

    if (chkMaster && chkMaster.checked && inMaster && inMaster.value.trim()) {
      const h = await hashPasskey(inMaster.value.trim());
      if (h === payload.masterKeyHash) {
        isMasterUnlocked = true;
        isDownloadUnlocked = true;
        isAuthorUnlocked = true;
        showNotification('Master Key Verified: Full Local Access Granted!');
      } else {
        alert('Master Key did not match creator records.');
      }
    } else {
      const chkDownload = document.getElementById('chk-enter-download-key');
      const inDownload = document.getElementById('in-download-key');
      if (chkDownload && chkDownload.checked && inDownload && inDownload.value.trim()) {
        const h = await hashPasskey(inDownload.value.trim());
        if (h === payload.downloadKeyHash || h === payload.masterKeyHash) {
          isDownloadUnlocked = true;
          showNotification('Download Key Verified: Song Downloads Unlocked!');
        } else {
          alert('Download Key did not match creator records.');
        }
      }

      const chkAuthor = document.getElementById('chk-enter-author-key');
      const inAuthor = document.getElementById('in-author-key');
      if (chkAuthor && chkAuthor.checked && inAuthor && inAuthor.value.trim()) {
        const h = await hashPasskey(inAuthor.value.trim());
        if (h === payload.passkeyHash || h === payload.masterKeyHash) {
          isAuthorUnlocked = true;
          showNotification('Author Key Verified: Local Playlist Editing Unlocked!');
        } else {
          alert('Author Key did not match creator records.');
        }
      }
    }

    const modal = document.getElementById('secondary-keys-modal');
    if (modal) modal.style.display = 'none';
    proceedToStorageMatcherScreen(isMasterUnlocked, isDownloadUnlocked, isAuthorUnlocked, false);
  };
}

let pendingImportPermissions = { isMasterUnlocked: false, isDownloadUnlocked: false, isAuthorUnlocked: false, isPermanentAdmin: false };

function proceedToStorageMatcherScreen(isMaster, isDownload, isAuthor, isPermanentAdmin) {
  const data = parsedDecryptedPayload;
  pendingImportPermissions = { isMasterUnlocked: isMaster, isDownloadUnlocked: isDownload, isAuthorUnlocked: isAuthor, isPermanentAdmin: isPermanentAdmin };

  if (currentImportBypassOnboarding && data.author) {
    userProfile = data.author;
    dbOps.setUserProfile(userProfile);
    updateUserProfileLabels();
    const obModal = document.getElementById('onboarding-modal');
    if (obModal) obModal.style.display = 'none';
  }

  const author = data.author || { name: 'External Creator', avatar: 'my-icon.png' };
  const authNameEl = document.getElementById('pre-import-author-name');
  const authAvEl = document.getElementById('pre-import-avatar');
  const metaEl = document.getElementById('pre-import-file-meta');

  if (authNameEl) authNameEl.textContent = `Curated by: ${author.name} (Protected)`;
  if (authAvEl) authAvEl.src = author.avatar || 'my-icon.png';
  if (metaEl) metaEl.textContent = `Tracks: ${data.tracks.length} • Playlists: ${data.playlists.length}`;

  dbOps.getAllTracks().then(localAll => {
    const localNamesSet = new Set(localAll.filter(t => t.blob && t.blob.size > 0).map(t => t.name.trim().toLowerCase()));
    let availableCount = 0;
    let missingCount = 0;

    const auditBox = document.getElementById('pre-import-audit-checklist');
    if (auditBox) auditBox.innerHTML = '';

    data.tracks.forEach(trk => {
      const cleanName = trk.name.trim().toLowerCase();
      const hasPayloadAudio = Boolean(trk.audioBase64);
      const existsInLocal = localNamesSet.has(cleanName);
      const isAvailable = hasPayloadAudio || existsInLocal;

      if (isAvailable) availableCount++;
      else missingCount++;

      if (auditBox) {
        const row = document.createElement('div');
        row.style.padding = '4px 6px';
        row.style.fontSize = '0.75rem';
        row.style.borderBottom = '1px solid #1f2937';
        row.style.color = isAvailable ? 'var(--accent-light)' : '#f85149';
        row.innerHTML = `${isAvailable ? '✓ [Available]' : '✕ [Missing from Storage]'} <strong>${trk.name}</strong>`;
        auditBox.appendChild(row);
      }
    });

    const bAvail = document.getElementById('audit-badge-available');
    const bMiss = document.getElementById('audit-badge-missing');
    if (bAvail) bAvail.textContent = `✓ ${availableCount} Available`;
    if (bMiss) bMiss.textContent = `✕ ${missingCount} Not in Storage`;

    const plBox = document.getElementById('pre-import-playlist-list');
    if (plBox) {
      plBox.innerHTML = '';
      data.playlists.forEach(p => {
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.innerHTML = `<input type="checkbox" data-import-pl="${p.id}" checked /> ${p.name}`;
        plBox.appendChild(label);
      });
    }

    const preModal = document.getElementById('pre-import-modal');
    if (preModal) preModal.style.display = 'flex';
  });
}

const btnCancelPreImport = document.getElementById('btn-cancel-pre-import');
if (btnCancelPreImport) {
  btnCancelPreImport.onclick = () => {
    const preModal = document.getElementById('pre-import-modal');
    if (preModal) preModal.style.display = 'none';
    parsedDecryptedPayload = null;
  };
}

const btnConfirmFinalImport = document.getElementById('btn-confirm-final-import');
if (btnConfirmFinalImport) {
  btnConfirmFinalImport.onclick = async () => {
    if (!parsedDecryptedPayload) return;
    triggerHaptic(40);
    showProcessingModal('Importing Selected Playlists...');

    const selectedPlIds = new Set(
      Array.from(document.querySelectorAll('#pre-import-playlist-list input:checked'))
        .map(cb => cb.dataset.importPl)
    );

    const chkMarkers = document.getElementById('chk-import-markers');
    const chkLyrics = document.getElementById('chk-import-lyrics');
    const chkClips = document.getElementById('chk-import-clips');

    const importMarkers = chkMarkers ? chkMarkers.checked : true;
    const importLyrics = chkLyrics ? chkLyrics.checked : true;
    const importClips = chkClips ? chkClips.checked : true;
    const author = parsedDecryptedPayload.author || { name: 'External Creator', avatar: 'my-icon.png' };

    const { isDownloadUnlocked, isAuthorUnlocked, isPermanentAdmin } = pendingImportPermissions;

    for (const p of parsedDecryptedPayload.playlists) {
      if (selectedPlIds.has(p.id)) {
        await dbOps.savePlaylist({
          ...p,
          originalName: p.name,
          originalAuthor: p.author || author,
          originalCover: p.cover || 'my-icon.png',
          author: p.author || author,
          isImported: true,
          isAuthorLocked: (!isAuthorUnlocked && !isPermanentAdmin),
          isUnlockedLocally: isAuthorUnlocked,
          isPermanentAdminUnlocked: isPermanentAdmin,
          passkeyHash: parsedDecryptedPayload.passkeyHash || '',
          masterKeyHash: parsedDecryptedPayload.masterKeyHash || '',
          downloadKeyHash: parsedDecryptedPayload.downloadKeyHash || '',
          downloadRestricted: (p.downloadRestricted && !isDownloadUnlocked && !isPermanentAdmin),
          isDownloadUnlocked: (isDownloadUnlocked || isPermanentAdmin)
        });
      }
    }

    const localAll = await dbOps.getAllTracks();
    const localMap = new Map();
    localAll.forEach(t => {
      if (t.blob && t.blob.size > 0) localMap.set(t.name.trim().toLowerCase(), t.blob);
    });

    let importedSongs = [];
    let availableSongsCount = 0;
    let missingSongsCount = 0;
    const tracksToImport = parsedDecryptedPayload.tracks.filter(t => selectedPlIds.has(t.playlistId) || t.playlistId === 'all');

    for (let i = 0; i < tracksToImport.length; i++) {
      if (isOperationCancelled) {
        hideProcessingModal();
        return;
      }
      const trk = tracksToImport[i];
      updateProcessingProgress((i / tracksToImport.length) * 85, `Writing: ${trk.name} (${i + 1}/${tracksToImport.length})`);
      
      let blob = null;
      if (trk.audioBase64) {
        blob = base64ToBlob(trk.audioBase64);
      } else {
        const cleanName = trk.name.trim().toLowerCase();
        if (localMap.has(cleanName)) {
          blob = localMap.get(cleanName);
        }
      }

      const hasAudio = Boolean(blob && blob.size > 0);
      if (hasAudio) availableSongsCount++;
      else missingSongsCount++;

      await dbOps.saveTrack({
        playlistId: trk.playlistId || 'favorites',
        name: trk.name,
        blob: blob || new Blob([], { type: 'audio/mp3' }),
        isMissing: !hasAudio,
        order: trk.order || Date.now(),
        downloadRestricted: (trk.downloadRestricted && !isDownloadUnlocked && !isPermanentAdmin),
        downloadKeyHash: trk.downloadKeyHash || '',
        masterKeyHash: trk.masterKeyHash || ''
      });

      if (importLyrics && trk.lyrics) await dbOps.setLyrics(trk.name, trk.lyrics);
      if (importMarkers && trk.markers) await dbOps.saveTimestamps(trk.name, trk.markers);
      if (trk.isFavorite) await dbOps.setFavorite(trk.name, true);

      importedSongs.push({ name: trk.name, isAvailable: hasAudio });
    }

    if (importClips && parsedDecryptedPayload.trimmedClips) {
      for (const c of parsedDecryptedPayload.trimmedClips) {
        if (isOperationCancelled) {
          hideProcessingModal();
          return;
        }
        if (c.clipBase64) {
          const clipBlob = base64ToBlob(c.clipBase64);
          await dbOps.saveTrimmedClip({
            songName: c.songName,
            clipName: c.clipName,
            blob: clipBlob,
            duration: c.duration,
            createdAt: c.createdAt
          });
        }
      }
    }

    await dbOps.addAuditLog({
      type: 'IMPORT',
      desc: `Imported ${importedSongs.length} tracks (${availableSongsCount} ready, ${missingSongsCount} missing)`,
      keysDetail: `Permissions: [Downloads: ${isDownloadUnlocked || isPermanentAdmin ? 'Unlocked' : 'Restricted'}] | [Authoring: ${isAuthorUnlocked || isPermanentAdmin ? 'Unlocked' : 'Locked'}] | [Admin Super-Access: ${isPermanentAdmin ? 'Yes' : 'No'}]`
    });

    const preModal = document.getElementById('pre-import-modal');
    if (preModal) preModal.style.display = 'none';
    await loadPlaylists();

    const succAvatar = document.getElementById('success-author-avatar');
    const succLbl = document.getElementById('success-author-label');
    const summaryBox = document.getElementById('success-songs-summary');
    const succModal = document.getElementById('import-success-modal');

    if (succAvatar) succAvatar.src = author.avatar || 'my-icon.png';
    if (succLbl) succLbl.textContent = `Curated by ${author.name} • ${availableSongsCount} Ready, ${missingSongsCount} Missing`;
    
    if (summaryBox) {
      summaryBox.innerHTML = importedSongs.map((s, i) => `
        <div style="color:${s.isAvailable ? 'var(--accent-light)' : '#f85149'};">
          ${i + 1}. ${s.name} ${s.isAvailable ? '✓' : '⚠️ [Not in storage]'}
        </div>
      `).join('');
    }

    hideProcessingModal();
    if (succModal) succModal.style.display = 'flex';
  };
}

const btnCloseSuccessSummary = document.getElementById('btn-close-success-summary');
if (btnCloseSuccessSummary) {
  btnCloseSuccessSummary.onclick = () => {
    const succModal = document.getElementById('import-success-modal');
    if (succModal) succModal.style.display = 'none';
  };
}

// Playlists & Browsing Listing
async function loadPlaylists() {
  let list = await dbOps.getPlaylists();
  if (!list.length) {
    const def = { id: 'favorites', name: 'Favorites', cover: currentAppLogo, author: userProfile, createdAt: getIndianStandardDateOnly() };
    await dbOps.savePlaylist(def);
    list = [def];
  }

  const allCategory = { id: 'all', name: 'All', cover: currentAppLogo, author: userProfile };
  
  const smartRotation = { id: 'smart_rotation', name: '🔥 Heavy Rotation', cover: currentAppLogo, author: userProfile, isSmart: true };
  const smartRecent = { id: 'smart_recent', name: '🕒 Recently Added', cover: currentAppLogo, author: userProfile, isSmart: true };
  const smartUnplayed = { id: 'smart_unplayed', name: '💤 Unplayed', cover: currentAppLogo, author: userProfile, isSmart: true };

  const combined = [allCategory, smartRotation, smartRecent, smartUnplayed, ...list];
  availablePlaylistList = combined;

  if (playlistTabs) {
    playlistTabs.innerHTML = '';

    const newPlChip = document.createElement('div');
    newPlChip.className = 'chip';
    newPlChip.style.border = '1px dashed var(--accent-light)';
    newPlChip.innerHTML = `<span>➕ New</span>`;
    newPlChip.onclick = () => {
      triggerHaptic(20);
      const nPlName = document.getElementById('new-playlist-name');
      const nPlImg = document.getElementById('new-playlist-img');
      const prevArt = document.getElementById('preview-art-tag');
      const prevStatus = document.getElementById('preview-status-text');
      const plCreateModal = document.getElementById('playlist-create-modal');

      if (nPlName) nPlName.value = '';
      if (nPlImg) nPlImg.value = '';
      if (prevArt) prevArt.src = currentAppLogo;
      if (prevStatus) prevStatus.textContent = 'Default art selected';
      if (plCreateModal) plCreateModal.style.display = 'flex';
    };
    playlistTabs.appendChild(newPlChip);

    combined.forEach((p) => {
      const chip = document.createElement('div');
      chip.className = `chip ${p.id === activePlaylistId ? 'active' : ''} ${p.isSmart ? 'smart-chip' : ''}`;
      
      const dotsBtn = (p.id !== 'all' && !p.isSmart) 
        ? `<button class="chip-dots-btn" data-pl-id="${p.id}" title="Playlist Options">⋮</button>` 
        : '';

      chip.innerHTML = `
        <img src="${p.localCover || p.cover || currentAppLogo}" class="chip-img" />
        <span>${p.localName || p.name}</span>
        ${dotsBtn}
      `;

      chip.onclick = (e) => {
        if (e.target.closest('.chip-dots-btn')) return;
        triggerHaptic(20);
        activePlaylistId = p.id;
        loadPlaylists();
      };

      if (p.id !== 'all' && !p.isSmart) {
        const dBtn = chip.querySelector('.chip-dots-btn');
        if (dBtn) {
          dBtn.onclick = (e) => {
            e.stopPropagation();
            triggerHaptic(20);
            activeContextPlaylist = p;
            const rect = dBtn.getBoundingClientRect();
            if (playlistContextMenu) {
              playlistContextMenu.style.top = `${rect.bottom + window.scrollY + 4}px`;
              playlistContextMenu.style.left = `${Math.max(10, rect.left - 100)}px`;
              playlistContextMenu.style.display = 'flex';
            }
          };
        }
      }

      playlistTabs.appendChild(chip);
    });
  }

  currentPlaylist = combined.find((p) => p.id === activePlaylistId) || allCategory;
  if (viewPlaylistName) viewPlaylistName.textContent = currentPlaylist.localName || currentPlaylist.name;
  loadTracks();
}

async function loadTracks() {
  allTracksRaw = await dbOps.getTracks(activePlaylistId);
  allTracksRaw.sort((a, b) => (a.order !== undefined && a.order !== null ? a.order : 0) - (b.order !== undefined && b.order !== null ? b.order : 0));
  renderFilteredTracks();
}

// In-place Visual Synchronization to Prevent Scroll Jump
function updateActiveTrackClasses(songName, isPlaying) {
  document.querySelectorAll('.song-row').forEach(row => {
    const isTarget = row.getAttribute('data-song-name') === songName;
    row.classList.toggle('active', isTarget);

    const eqGroup = row.querySelector('.now-playing-badge-group');
    if (isTarget) {
      if (!eqGroup) {
        const nameEl = row.querySelector('.song-name');
        if (nameEl) {
          const span = document.createElement('span');
          span.className = 'now-playing-badge-group';
          span.innerHTML = `
            <span class="mini-equalizer-bars ${isPlaying ? 'animating' : 'paused'}">
              <span class="eq-bar bar-1"></span>
              <span class="eq-bar bar-2"></span>
              <span class="eq-bar bar-3"></span>
              <span class="eq-bar bar-4"></span>
            </span>
            <span class="now-playing-tag">Playing</span>
          `;
          nameEl.appendChild(span);
        }
      } else {
        const eqBars = eqGroup.querySelector('.mini-equalizer-bars');
        if (eqBars) {
          eqBars.classList.toggle('animating', isPlaying);
          eqBars.classList.toggle('paused', !isPlaying);
        }
      }
    } else if (eqGroup) {
      eqGroup.remove();
    }
  });
}

function renderFilteredTracks() {
  // Capture current scroll position
  const savedScrollY = upperContentViewport ? upperContentViewport.scrollTop : 0;

  const q = librarySearchInput ? librarySearchInput.value.trim().toLowerCase() : '';
  if (btnClearSearch) btnClearSearch.style.display = q ? 'block' : 'none';

  let filtered = allTracksRaw.filter(t => t.name.toLowerCase().includes(q));

  if (currentSortMode === 'az') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (currentSortMode === 'za') {
    filtered.sort((a, b) => b.name.localeCompare(a.name));
  } else if (currentSortMode === 'size-asc') {
    filtered.sort((a, b) => ((a.blob && a.blob.size) || 0) - ((b.blob && b.blob.size) || 0));
  } else if (currentSortMode === 'size-desc') {
    filtered.sort((a, b) => ((b.blob && b.blob.size) || 0) - ((a.blob && a.blob.size) || 0));
  }

  browsingTracks = filtered;

  let totalSecs = browsingTracks.length * 210;
  let hrs = Math.floor(totalSecs / 3600);
  let mins = Math.floor((totalSecs % 3600) / 60);
  let durStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  if (trackCountLabel) trackCountLabel.textContent = `${browsingTracks.length} song${browsingTracks.length === 1 ? '' : 's'} • ~${durStr}`;

  if (!songList) return;
  songList.innerHTML = '';
  if (!browsingTracks.length) {
    songList.innerHTML = '<li style="color:var(--text-muted);text-align:center;padding:24px 0;">No songs found.</li>';
    return;
  }

  const isAudioPlaying = !audio.paused && audio.currentTime > 0;

  browsingTracks.forEach(async (trk, idx) => {
    const isFav = await dbOps.isFavorite(trk.name);
    const playCount = await dbOps.getPlayCount(trk.name);
    const isMissing = trk.isMissing || (!trk.blob || trk.blob.size === 0);
    const isCurrentlyPlaying = (currentPlayingTrack && currentPlayingTrack.name === trk.name);

    const li = document.createElement('li');
    li.className = `song-row ${isCurrentlyPlaying ? 'active' : ''} ${isMissing ? 'missing-storage' : 'available-storage'}`;
    li.setAttribute('data-song-name', trk.name);
    li.setAttribute('data-track-id', trk.id);

    const multiBox = multiSelectMode 
      ? `<input type="checkbox" class="multi-chk" data-trk-id="${trk.id}" ${selectedTrackIds.has(trk.id) ? 'checked' : ''} style="margin-right:8px;" />` 
      : '';

    const info = document.createElement('div');
    info.className = 'song-info';
    info.innerHTML = `
      ${multiBox}
      <span class="song-name">
        <strong>${idx + 1}.</strong> ${trk.name}
        ${isMissing ? '<span class="missing-tag-badge">⚠️ Not in storage</span>' : ''}
        ${trk.downloadRestricted ? '<span class="missing-tag-badge" style="background:#f0883e;">🔒 Restricted</span>' : ''}
        ${isCurrentlyPlaying ? `
          <span class="now-playing-badge-group">
            <span class="mini-equalizer-bars ${isAudioPlaying ? 'animating' : 'paused'}">
              <span class="eq-bar bar-1"></span>
              <span class="eq-bar bar-2"></span>
              <span class="eq-bar bar-3"></span>
              <span class="eq-bar bar-4"></span>
            </span>
            <span class="now-playing-tag">Playing</span>
          </span>
        ` : ''}
      </span>
      <span class="song-sub-info">${isMissing ? 'Audio file missing from device' : `Plays: ${playCount} • ${((trk.blob && trk.blob.size / (1024*1024)) || 0).toFixed(1)}MB`}</span>
    `;

    let pressTimer = null;
    info.addEventListener('touchstart', () => {
      pressTimer = setTimeout(() => {
        triggerHaptic(50);
        multiSelectMode = true;
        selectedTrackIds.add(trk.id);
        const batchBar = document.getElementById('batch-action-bar');
        if (batchBar) batchBar.style.display = 'flex';
        renderFilteredTracks();
      }, 500);
    }, { passive: true });

    info.addEventListener('touchend', () => { if (pressTimer) clearTimeout(pressTimer); }, { passive: true });
    info.addEventListener('touchmove', () => { if (pressTimer) clearTimeout(pressTimer); }, { passive: true });

    info.onclick = () => {
      if (multiSelectMode) {
        toggleSelectTrack(trk.id);
      } else {
        if (isMissing) {
          triggerHaptic(15);
          showNotification(`"${trk.name}" is not available in storage.`);
          return;
        }
        playTrackFromBrowsing(idx);
      }
    };

    const actions = document.createElement('div');
    actions.className = 'row-actions-four';

    const btnDownload = document.createElement('button');
    btnDownload.className = 'btn-icon-sm';
    btnDownload.innerHTML = (trk.downloadRestricted && !currentPlaylist.isDownloadUnlocked) ? '🔒' : '📥';
    btnDownload.title = trk.downloadRestricted ? 'Download Restricted' : 'Download to device';
    btnDownload.onclick = (e) => {
      e.stopPropagation();
      triggerHaptic(20);
      downloadSingleTrack(trk, true);
    };

    const btnLike = document.createElement('button');
    btnLike.className = 'btn-icon-sm song-heart-btn emoji-text';
    btnLike.innerHTML = isFav ? '&#10084;&#65039;' : '&#128155;';
    btnLike.title = 'Favorite';
    btnLike.onclick = async (e) => {
      e.stopPropagation();
      await toggleFavorite(trk);
    };

    const btnDelete = document.createElement('button');
    btnDelete.className = 'btn-icon-sm';
    btnDelete.style.color = '#f85149';
    btnDelete.innerHTML = '🗑';
    btnDelete.title = 'Delete track';
    btnDelete.onclick = (e) => {
      e.stopPropagation();
      executeTrackDeleteWithUndo(trk);
    };

    const btnMore = document.createElement('button');
    btnMore.className = 'btn-icon-sm btn-more-dots';
    btnMore.innerHTML = '⋮';
    btnMore.title = 'More options';
    btnMore.onclick = (e) => {
      e.stopPropagation();
      triggerHaptic(20);
      activeContextTrack = trk;
      
      const removeBtn = document.getElementById('menu-btn-remove-from-pl');
      if (removeBtn) {
        removeBtn.style.display = (activePlaylistId === 'all' || activePlaylistId.startsWith('smart_')) ? 'none' : 'block';
      }

      const rect = btnMore.getBoundingClientRect();
      if (trackContextMenu) {
        trackContextMenu.style.top = `${rect.bottom + window.scrollY - 10}px`;
        trackContextMenu.style.left = `${Math.max(10, rect.left - 150)}px`;
        trackContextMenu.style.display = 'flex';
      }
    };

    actions.append(btnDownload, btnLike, btnDelete, btnMore);
    li.append(info, actions);

    bindSongRowSwipeGestures(li, trk);
    songList.appendChild(li);
  });

  // Maintain list scroll without jump
  if (upperContentViewport) {
    requestAnimationFrame(() => {
      upperContentViewport.scrollTop = savedScrollY;
    });
  }

  if (currentPlayingTrack) {
    dbOps.isFavorite(currentPlayingTrack.name).then(updateLikeButtonsUI);
  }
}

function syncGlobalEqualizerBars(isPlaying) {
  document.querySelectorAll('.mini-equalizer-bars').forEach(barGroup => {
    if (isPlaying) {
      barGroup.classList.remove('paused');
      barGroup.classList.add('animating');
    } else {
      barGroup.classList.remove('animating');
      barGroup.classList.add('paused');
    }
  });
}

function queueSongPlayNext(trk) {
  triggerHaptic(25);
  playNextQueue.unshift(trk);
  renderCardReorderList();
  calculateAndRenderQueueDuration();
  showNotification(`"${trk.name}" queued to play next!`);
}

function stopPlayingTrackImmediately() {
  audio.pause();
  audio.src = '';
  currentPlayingTrack = null;
  wasPlayingBeforeInterruption = false;
  isManualPause = true;

  if (miniTitle) miniTitle.textContent = 'No track playing';
  if (miniSub) miniSub.textContent = 'Playlist: All';
  if (boxTitle) boxTitle.textContent = 'Song Title';
  if (boxPlaylist) boxPlaylist.textContent = 'Playlist: All';
  syncButtons(false);
  updateLikeButtonsUI(false);
  syncGlobalEqualizerBars(false);
}

function executeTrackDeleteWithUndo(trk) {
  triggerHaptic(30);
  const isPlayingThisTrack = (currentPlayingTrack && currentPlayingTrack.id === trk.id);
  let savedCurrentTime = 0;

  if (isPlayingThisTrack) {
    savedCurrentTime = audio.currentTime;
    stopPlayingTrackImmediately();
  }

  allTracksRaw = allTracksRaw.filter(t => t.id !== trk.id);
  renderFilteredTracks();

  showUndoToast(`Removed "${trk.name}"`, async () => {
    allTracksRaw.push(trk);
    renderFilteredTracks();
    if (isPlayingThisTrack) {
      playTrackDirect(trk);
      audio.currentTime = savedCurrentTime;
    }
  }, async () => {
    await dbOps.deleteTrack(trk.id);
  });
}

async function executeRemoveTrackFromCurrentPlaylist(trk) {
  triggerHaptic(25);
  await dbOps.deleteTrack(trk.id);
  showNotification(`Removed "${trk.name}" from ${currentPlaylist.localName || currentPlaylist.name}`);
  loadTracks();
}

function bindSongRowSwipeGestures(rowEl, trk) {
  let startX = 0;
  let startY = 0;
  let isSwiping = false;

  rowEl.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isSwiping = true;
  }, { passive: true });

  rowEl.addEventListener('touchmove', (e) => {
    if (!isSwiping) return;
    const diffX = e.touches[0].clientX - startX;
    const diffY = e.touches[0].clientY - startY;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 15) {
      rowEl.style.transform = `translateX(${diffX * 0.4}px)`;
    }
  }, { passive: true });

  rowEl.addEventListener('touchend', (e) => {
    if (!isSwiping) return;
    isSwiping = false;
    const diffX = e.changedTouches[0].clientX - startX;
    const diffY = e.changedTouches[0].clientY - startY;
    rowEl.style.transform = 'translateX(0px)';

    if (Math.abs(diffX) > 80 && Math.abs(diffY) < 50) {
      if (diffX > 0) {
        if (trk.isMissing || (!trk.blob || trk.blob.size === 0)) {
          showNotification(`Cannot queue: "${trk.name}" is missing from storage.`);
        } else {
          queueSongPlayNext(trk);
        }
      } else {
        executeTrackDeleteWithUndo(trk);
      }
    }
  }, { passive: true });
}

const btnBatchSelectAll = document.getElementById('btn-batch-select-all');
if (btnBatchSelectAll) {
  btnBatchSelectAll.onclick = () => {
    triggerHaptic(20);
    const countLbl = document.getElementById('batch-count-label');
    if (selectedTrackIds.size === browsingTracks.length) {
      selectedTrackIds.clear();
      btnBatchSelectAll.textContent = 'Select All';
    } else {
      selectedTrackIds = new Set(browsingTracks.map(t => t.id));
      btnBatchSelectAll.textContent = 'Deselect All';
    }
    if (countLbl) countLbl.textContent = `${selectedTrackIds.size} Selected`;
    
    document.querySelectorAll('.multi-chk').forEach(cb => {
      const trkId = parseInt(cb.dataset.trkId, 10);
      cb.checked = selectedTrackIds.has(trkId);
    });
  };
}

function toggleSelectTrack(id) {
  triggerHaptic(15);
  if (selectedTrackIds.has(id)) selectedTrackIds.delete(id);
  else selectedTrackIds.add(id);
  
  const countLbl = document.getElementById('batch-count-label');
  const btnBatchSelectAll = document.getElementById('btn-batch-select-all');
  if (countLbl) countLbl.textContent = `${selectedTrackIds.size} Selected`;
  if (btnBatchSelectAll) btnBatchSelectAll.textContent = (selectedTrackIds.size === browsingTracks.length) ? 'Deselect All' : 'Select All';

  const cb = document.querySelector(`.multi-chk[data-trk-id="${id}"]`);
  if (cb) cb.checked = selectedTrackIds.has(id);
}

const btnBatchCancel = document.getElementById('btn-batch-cancel');
if (btnBatchCancel) {
  btnBatchCancel.onclick = () => {
    multiSelectMode = false;
    selectedTrackIds.clear();
    const batchBar = document.getElementById('batch-action-bar');
    if (batchBar) batchBar.style.display = 'none';
    renderFilteredTracks();
  };
}

const btnBatchDelete = document.getElementById('btn-batch-delete');
if (btnBatchDelete) {
  btnBatchDelete.onclick = () => {
    triggerHaptic(35);
    const idsToDelete = new Set(selectedTrackIds);
    const deletedTracks = allTracksRaw.filter(t => idsToDelete.has(t.id));
    const count = idsToDelete.size;

    const isPlayingDeleted = (currentPlayingTrack && idsToDelete.has(currentPlayingTrack.id));
    if (isPlayingDeleted) {
      stopPlayingTrackImmediately();
    }

    allTracksRaw = allTracksRaw.filter(t => !idsToDelete.has(t.id));
    multiSelectMode = false;
    selectedTrackIds.clear();
    const batchBar = document.getElementById('batch-action-bar');
    if (batchBar) batchBar.style.display = 'none';
    renderFilteredTracks();

    showUndoToast(`Deleted ${count} selected songs`, () => {
      allTracksRaw.push(...deletedTracks);
      renderFilteredTracks();
    }, async () => {
      for (const id of idsToDelete) {
        await dbOps.deleteTrack(id);
      }
    });
  };
}

const btnBatchAddPl = document.getElementById('btn-batch-add-playlist');
if (btnBatchAddPl) {
  btnBatchAddPl.onclick = () => {
    if (!selectedTrackIds.size) return;
    const available = availablePlaylistList.filter(p => p.id !== 'all' && !p.id.startsWith('smart_'));
    const box = document.getElementById('add-to-playlist-options-box');
    if (!box) return;
    box.innerHTML = '';

    available.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'menu-pop-item';
      btn.textContent = `📁 ${p.localName || p.name}`;
      btn.onclick = async () => {
        triggerHaptic(30);
        const selectedTracks = allTracksRaw.filter(t => selectedTrackIds.has(t.id));
        for (const t of selectedTracks) {
          await dbOps.saveTrack({
            playlistId: p.id,
            name: t.name,
            blob: t.blob,
            isMissing: t.isMissing,
            order: Date.now()
          });
        }
        showNotification(`Added ${selectedTracks.length} tracks to ${p.localName || p.name}!`);
        multiSelectMode = false;
        selectedTrackIds.clear();
        const batchBar = document.getElementById('batch-action-bar');
        if (batchBar) batchBar.style.display = 'none';
        dismissAllMenus();
        renderFilteredTracks();
      };
      box.appendChild(btn);
    });

    const rect = btnBatchAddPl.getBoundingClientRect();
    if (addToPlaylistSubmenu) {
      addToPlaylistSubmenu.style.top = `${rect.bottom + window.scrollY + 4}px`;
      addToPlaylistSubmenu.style.left = `${Math.max(10, rect.left - 50)}px`;
      addToPlaylistSubmenu.style.display = 'flex';
    }
  };
}

if (librarySearchInput) librarySearchInput.addEventListener('input', renderFilteredTracks);
if (btnClearSearch) {
  btnClearSearch.onclick = () => {
    if (librarySearchInput) librarySearchInput.value = '';
    renderFilteredTracks();
  };
}

const btnCleanNames = document.getElementById('btn-clean-names');
if (btnCleanNames) {
  btnCleanNames.onclick = async () => {
    triggerHaptic(30);
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
    showNotification(`Cleaned ${cleanedCount} song name(s)!`);
    loadTracks();
  };
}

// Rename Modal
function openRenameModal(trk) {
  trackToRename = trk;
  if (renameInput) renameInput.value = trk.name;
  if (renameModal) renameModal.style.display = 'flex';
}

const btnCancelRename = document.getElementById('btn-cancel-rename');
if (btnCancelRename) {
  btnCancelRename.onclick = () => {
    if (renameModal) renameModal.style.display = 'none';
  };
}

const btnConfirmRename = document.getElementById('btn-confirm-rename');
if (btnConfirmRename) {
  btnConfirmRename.onclick = async () => {
    const newTitle = renameInput ? renameInput.value.trim() : '';
    if (newTitle && trackToRename) {
      trackToRename.name = newTitle;
      await dbOps.updateTrack(trackToRename);
      if (renameModal) renameModal.style.display = 'none';
      showNotification('Track renamed successfully');
      loadTracks();
      if (currentPlayingTrack && currentPlayingTrack.id === trackToRename.id) {
        if (miniTitle) miniTitle.textContent = newTitle;
        if (boxTitle) boxTitle.textContent = newTitle;
        updateMediaSession();
      }
    }
  };
}

// Favorites Toggle: Protected Against Rapid Taps
async function toggleFavorite(trk) {
  triggerHaptic(25);
  const songKey = trk.name;
  const isFav = await dbOps.isFavorite(songKey);

  let pls = await dbOps.getPlaylists();
  let favPlaylist = pls.find((p) => p.name.toLowerCase() === 'favorites') || pls[0];

  if (isFav) {
    await dbOps.removeFavorite(songKey);
    const favTracks = await dbOps.getTracks(favPlaylist.id);
    const existing = favTracks.find((t) => t.name.trim().toLowerCase() === trk.name.trim().toLowerCase());
    if (existing) await dbOps.deleteTrack(existing.id);
    triggerHeartBurst(false);
    showEmotionalMessage(false);
    syncHeartsEverywhere(songKey, false);
  } else {
    await dbOps.setFavorite(songKey, true);
    await dbOps.saveTrack({
      playlistId: favPlaylist.id,
      name: trk.name,
      blob: trk.blob,
      isMissing: trk.isMissing,
      order: Date.now()
    });
    triggerHeartBurst(true);
    showEmotionalMessage(true);
    syncHeartsEverywhere(songKey, true);
  }
}

function syncHeartsEverywhere(songName, isLiked) {
  const heartCode = isLiked ? '&#10084;&#65039;' : '&#128155;';
  const rows = document.querySelectorAll(`[data-song-name="${CSS.escape(songName)}"] .song-heart-btn`);
  rows.forEach((btn) => { btn.innerHTML = heartCode; });
  if (currentPlayingTrack && currentPlayingTrack.name === songName) {
    updateLikeButtonsUI(isLiked);
  }
}

function updateLikeButtonsUI(isLiked) {
  const heartCode = isLiked ? '&#10084;&#65039;' : '&#128155;';
  if (barBtnLike) barBtnLike.innerHTML = heartCode;
  if (modalBtnLike) modalBtnLike.innerHTML = heartCode;
}

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

const editCoverInput = document.getElementById('edit-cover-input');
const btnEditArt = document.getElementById('btn-edit-art');
if (btnEditArt && editCoverInput) btnEditArt.onclick = () => editCoverInput.click();
if (editCoverInput) {
  editCoverInput.onchange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const newArt = await compressImageSafe(e.target.files[0]);
      if (miniCover) miniCover.src = newArt;
      if (boxCover) boxCover.src = newArt;
      if (currentPlaylist && currentPlaylist.id !== 'all' && !currentPlaylist.id.startsWith('smart_')) {
        currentPlaylist.localCover = newArt;
        await dbOps.savePlaylist(currentPlaylist);
      }
      updateAmbientGlow(boxCover);
      showNotification('Cover image updated!');
      updateMediaSession();
    }
  };
}

// Create Playlist Modal
const createModal = document.getElementById('playlist-create-modal');
const newPlaylistName = document.getElementById('new-playlist-name');
const newPlaylistImg = document.getElementById('new-playlist-img');
const previewArt = document.getElementById('preview-art-tag');
const previewStatus = document.getElementById('preview-status-text');
const btnConfirmPlaylist = document.getElementById('btn-confirm-playlist');
const btnCancelPl = document.getElementById('btn-cancel-playlist');
let newBase64Cover = null;

if (btnCancelPl) {
  btnCancelPl.onclick = () => {
    if (createModal) createModal.style.display = 'none';
  };
}

if (newPlaylistImg) {
  newPlaylistImg.onchange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      if (previewStatus) previewStatus.textContent = 'Processing image...';
      newBase64Cover = await compressImageSafe(e.target.files[0]);
      if (previewArt) previewArt.src = newBase64Cover;
      if (previewStatus) previewStatus.textContent = 'Image ready';
    }
  };
}

if (btnConfirmPlaylist) {
  btnConfirmPlaylist.onclick = async () => {
    const name = newPlaylistName ? newPlaylistName.value.trim() : '';
    if (!name) return showNotification('Please enter a playlist name!');
    const pl = {
      id: 'pl_' + Date.now(),
      name,
      cover: newBase64Cover || currentAppLogo,
      author: userProfile,
      createdAt: getIndianStandardDateOnly()
    };
    await dbOps.savePlaylist(pl);
    if (createModal) createModal.style.display = 'none';
    activePlaylistId = pl.id;
    await loadPlaylists();
    showNotification(`Playlist "${name}" created!`);
  };
}

const filePicker = document.getElementById('file-picker');
if (filePicker) {
  filePicker.onchange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    showProcessingModal('Adding songs to library...');
    const targetId = (activePlaylistId === 'all' || activePlaylistId.startsWith('smart_')) ? 'favorites' : activePlaylistId;
    const existingTracks = await dbOps.getTracks(targetId);
    const existingNames = new Set(existingTracks.map(t => t.name.trim().toLowerCase()));

    let addedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < files.length; i++) {
      if (isOperationCancelled) {
        hideProcessingModal();
        return;
      }
      const file = files[i];
      updateProcessingProgress((i / files.length) * 100, `Storing: ${file.name}`);
      const cleanName = file.name.trim().toLowerCase();

      const matchedGhost = existingTracks.find(t => t.name.trim().toLowerCase() === cleanName && (!t.blob || t.blob.size === 0));
      if (matchedGhost) {
        matchedGhost.blob = file;
        matchedGhost.isMissing = false;
        await dbOps.updateTrack(matchedGhost);
        addedCount++;
        continue;
      }

      if (existingNames.has(cleanName)) {
        skippedCount++;
        continue;
      }

      await dbOps.saveTrack({
        playlistId: targetId,
        name: file.name,
        blob: file,
        isMissing: false,
        order: browsingTracks.length + i
      });
      addedCount++;
    }

    hideProcessingModal();
    showNotification(`Added ${addedCount} song(s)${skippedCount ? ` (${skippedCount} duplicates skipped)` : ''}!`);
    loadTracks();
  };
}

// Queue Playback Controller
function playTrackFromBrowsing(idx) {
  if (idx < 0 || idx >= browsingTracks.length) return;
  playingQueue = [...browsingTracks];
  playTrackDirect(browsingTracks[idx]);
}

async function playTrackDirect(trk) {
  if (!trk || trk.isMissing || (!trk.blob || trk.blob.size === 0)) {
    showNotification(`Cannot play: "${(trk && trk.name) || 'Track'}" is missing from storage.`);
    return;
  }

  ensureAudioPipeline();

  if (currentPlayingTrack && currentPlayingTrack.name === trk.name && audio.src) {
    if (audio.paused) {
      audio.play();
      cleanAudioBufferResume();
      syncButtons(true);
      syncGlobalEqualizerBars(true);
      updateActiveTrackClasses(trk.name, true);
    }
    return;
  }

  currentPlayingTrack = trk;
  audio.src = URL.createObjectURL(trk.blob);
  audio.playbackRate = speedList[currentSpeedIndex];

  cleanAudioBufferResume();
  audio.play().then(() => {
    syncButtons(true);
    syncGlobalEqualizerBars(true);
    updateMediaSession();
    updateActiveTrackClasses(trk.name, true);
  }).catch(() => {});

  if (miniTitle) miniTitle.textContent = trk.name;
  if (miniSub) miniSub.textContent = `Playlist: ${currentPlaylist.localName || currentPlaylist.name}`;
  if (boxTitle) boxTitle.textContent = trk.name;
  if (boxPlaylist) boxPlaylist.textContent = `Playlist: ${currentPlaylist.localName || currentPlaylist.name}`;
  if (miniCover) miniCover.src = currentPlaylist.localCover || currentPlaylist.cover || currentAppLogo;
  if (boxCover) boxCover.src = currentPlaylist.localCover || currentPlaylist.cover || currentAppLogo;

  const isFav = await dbOps.isFavorite(trk.name);
  updateLikeButtonsUI(isFav);

  await dbOps.incrementPlayCount(trk.name);
  await dbOps.addPlaybackHistory(trk.name, currentPlaylist.localName || currentPlaylist.name);
  loadLyricsForCurrent();
  await loadTimestampsForCurrent();
  renderSeekTicks();
  renderWaveformForTrack(trk.blob);
  updateMediaSession();
  updateAmbientGlow(boxCover);

  startListeningTimeTracking();
  saveCurrentSessionState();
  renderCardReorderList();
  calculateAndRenderQueueDuration();
  renderTrimmedClipsForCurrent();
}

function syncButtons(isPlaying) {
  if (barBtnPlay) barBtnPlay.textContent = isPlaying ? '⏸' : '▶';
  if (boxBtnPlay) boxBtnPlay.textContent = isPlaying ? '⏸' : '▶';
  if (artDisplayBox) {
    artDisplayBox.classList.toggle('paused', !isPlaying);
  }
  if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }
  renderCardReorderList();
}

function togglePlay() {
  triggerHaptic(25);
  ensureAudioPipeline();
  if (!audio.src && browsingTracks.length) {
    const firstPlayable = browsingTracks.findIndex(t => t.blob && t.blob.size > 0);
    return playTrackFromBrowsing(firstPlayable !== -1 ? firstPlayable : 0);
  }
  if (audio.paused) {
    cleanAudioBufferResume();
    audio.play();
    syncButtons(true);
    syncGlobalEqualizerBars(true);
    if (currentPlayingTrack) updateActiveTrackClasses(currentPlayingTrack.name, true);
  } else {
    isManualPause = true;
    wasPlayingBeforeInterruption = false;
    audio.pause();
    syncButtons(false);
    syncGlobalEqualizerBars(false);
    if (currentPlayingTrack) updateActiveTrackClasses(currentPlayingTrack.name, false);
  }
}

function loopNext() {
  executeCrossfadeTransition(() => {
    if (!playingQueue.length) return;
    
    if (playNextQueue.length > 0) {
      const nextTrk = playNextQueue.shift();
      renderCardReorderList();
      calculateAndRenderQueueDuration();
      return playTrackDirect(nextTrk);
    }

    if (playMode === 'one' && currentPlayingTrack) {
      return playTrackDirect(currentPlayingTrack);
    }

    let curIdx = playingQueue.findIndex(t => t.name === (currentPlayingTrack && currentPlayingTrack.name));
    let nextIdx = curIdx;
    let attempts = 0;

    do {
      nextIdx = (playMode === 'shuffle') 
        ? Math.floor(Math.random() * playingQueue.length) 
        : nextIdx + 1;
      if (nextIdx >= playingQueue.length) nextIdx = 0;
      attempts++;
    } while (playingQueue[nextIdx] && (playingQueue[nextIdx].isMissing || !playingQueue[nextIdx].blob || playingQueue[nextIdx].blob.size === 0) && attempts < playingQueue.length);

    if (playingQueue[nextIdx]) {
      playTrackDirect(playingQueue[nextIdx]);
    }
  });
}

if (barBtnPlay) barBtnPlay.onclick = (e) => { e.stopPropagation(); togglePlay(); };
if (boxBtnPlay) boxBtnPlay.onclick = togglePlay;
if (boxBtnPrev) {
  boxBtnPrev.onclick = () => {
    triggerHaptic(20);
    executeCrossfadeTransition(() => {
      if (!playingQueue.length) return;
      let curIdx = playingQueue.findIndex(t => t.name === (currentPlayingTrack && currentPlayingTrack.name));
      let prev = curIdx;
      let attempts = 0;
      do {
        prev = prev > 0 ? prev - 1 : playingQueue.length - 1;
        attempts++;
      } while (playingQueue[prev] && (playingQueue[prev].isMissing || !playingQueue[prev].blob || playingQueue[prev].blob.size === 0) && attempts < playingQueue.length);

      playTrackDirect(playingQueue[prev]);
    });
  };
}
if (boxBtnNext) boxBtnNext.onclick = () => { triggerHaptic(20); loopNext(); };
audio.onended = loopNext;

if (barBtnLike) {
  barBtnLike.onclick = (e) => {
    e.stopPropagation();
    if (currentPlayingTrack) toggleFavorite(currentPlayingTrack);
  };
}
if (modalBtnLike) {
  modalBtnLike.onclick = () => {
    if (currentPlayingTrack) toggleFavorite(currentPlayingTrack);
  };
}

function updateMediaSession() {
  if (!('mediaSession' in navigator) || !currentPlayingTrack) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: currentPlayingTrack.name,
    artist: `Playlist: ${currentPlaylist.localName || currentPlaylist.name} • Made by & for Amarjeet kumar`,
    album: currentAppName,
    artwork: [
      { src: currentPlaylist.localCover || currentPlaylist.cover || currentAppLogo, sizes: '192x192', type: 'image/png' },
      { src: currentPlaylist.localCover || currentPlaylist.cover || currentAppLogo, sizes: '512x512', type: 'image/png' }
    ]
  });

  navigator.mediaSession.playbackState = audio.paused ? 'paused' : 'playing';

  if ('setPositionState' in navigator.mediaSession && audio.duration) {
    try {
      navigator.mediaSession.setPositionState({
        duration: audio.duration,
        playbackRate: audio.playbackRate || 1.0,
        position: Math.min(audio.duration, audio.currentTime)
      });
    } catch (_) {}
  }

  navigator.mediaSession.setActionHandler('play', () => {
    ensureAudioPipeline();
    cleanAudioBufferResume();
    audio.play().then(() => {
      syncButtons(true);
      syncGlobalEqualizerBars(true);
      navigator.mediaSession.playbackState = 'playing';
      if (currentPlayingTrack) updateActiveTrackClasses(currentPlayingTrack.name, true);
    }).catch(() => {});
  });

  navigator.mediaSession.setActionHandler('pause', () => {
    isManualPause = true;
    wasPlayingBeforeInterruption = false;
    audio.pause();
    syncButtons(false);
    syncGlobalEqualizerBars(false);
    navigator.mediaSession.playbackState = 'paused';
    if (currentPlayingTrack) updateActiveTrackClasses(currentPlayingTrack.name, false);
  });

  navigator.mediaSession.setActionHandler('nexttrack', loopNext);
  navigator.mediaSession.setActionHandler('previoustrack', () => {
    if (boxBtnPrev) boxBtnPrev.click();
  });

  navigator.mediaSession.setActionHandler('seekto', (details) => {
    if (details.seekTime && audio.duration) {
      audio.currentTime = details.seekTime;
    }
  });

  navigator.mediaSession.setActionHandler('seekforward', () => {
    audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
  });

  navigator.mediaSession.setActionHandler('seekbackward', () => {
    audio.currentTime = Math.max(0, audio.currentTime - 10);
  });
}

const openBoxTrig = document.getElementById('open-box-trigger');
if (openBoxTrig) {
  openBoxTrig.onclick = () => { 
    if (playerBoxModal) playerBoxModal.style.display = 'flex'; 
    renderSeekTicks();
    renderCardReorderList();
    calculateAndRenderQueueDuration();
    updateAmbientGlow(boxCover);
  };
}

const btnCloseBox = document.getElementById('btn-close-box');
if (btnCloseBox) {
  btnCloseBox.onclick = () => {
    if (playerBoxModal) playerBoxModal.style.display = 'none';
  };
}

const btnSkipBwd = document.getElementById('btn-skip-backward');
if (btnSkipBwd) {
  btnSkipBwd.onclick = () => {
    triggerHaptic(20);
    audio.currentTime = Math.max(0, audio.currentTime - 10);
  };
}

const btnSkipFwd = document.getElementById('btn-skip-forward');
if (btnSkipFwd) {
  btnSkipFwd.onclick = () => {
    triggerHaptic(20);
    audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
  };
}

const btnSpeedToggle = document.getElementById('btn-speed-toggle');
if (btnSpeedToggle) {
  btnSpeedToggle.onclick = () => {
    triggerHaptic(20);
    currentSpeedIndex = (currentSpeedIndex + 1) % speedList.length;
    const spd = speedList[currentSpeedIndex];
    audio.playbackRate = spd;
    btnSpeedToggle.textContent = `${spd}x`;
    showNotification(`Speed: ${spd}x`);
  };
}

const btnModeShuffle = document.getElementById('btn-mode-shuffle');
const btnModeRepeat = document.getElementById('btn-mode-repeat');

if (btnModeShuffle) {
  btnModeShuffle.onclick = () => {
    triggerHaptic(25);
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
}

if (btnModeRepeat) {
  btnModeRepeat.onclick = () => {
    triggerHaptic(25);
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
}

const btnSleepTimer = document.getElementById('btn-sleep-timer');
const sleepTimes = [0, 15, 30, 45, 60];
let sleepIndex = 0;
if (btnSleepTimer) {
  btnSleepTimer.onclick = () => {
    triggerHaptic(20);
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
          isManualPause = true;
          wasPlayingBeforeInterruption = false;
          audio.pause();
          syncButtons(false);
          syncGlobalEqualizerBars(false);
          setVolume(100);
          btnSleepTimer.textContent = '⏱️ Off';
          sleepIndex = 0;
          showNotification('Sleep timer ended. Goodnight!');
        }, 5000);
      }, mins * 60 * 1000);
    }
  };
}

// Viewport Swipe Handling
let mainTouchStartX = 0;
let mainTouchStartY = 0;

if (mainViewport) {
  mainViewport.addEventListener('touchstart', (e) => {
    mainTouchStartX = e.touches[0].clientX;
    mainTouchStartY = e.touches[0].clientY;
  }, { passive: true });

  mainViewport.addEventListener('touchend', (e) => {
    if (playerBoxModal && playerBoxModal.style.display === 'flex') return;
    const diffX = e.changedTouches[0].clientX - mainTouchStartX;
    const diffY = e.changedTouches[0].clientY - mainTouchStartY;

    if (Math.abs(diffX) > 100 && Math.abs(diffY) < 60) {
      if (!availablePlaylistList.length) return;
      let plIdx = availablePlaylistList.findIndex(p => p.id === activePlaylistId);
      if (plIdx === -1) plIdx = 0;

      if (diffX < 0) {
        plIdx = (plIdx + 1) % availablePlaylistList.length;
      } else {
        plIdx = (plIdx - 1 + availablePlaylistList.length) % availablePlaylistList.length;
      }

      triggerHaptic(30);
      activePlaylistId = availablePlaylistList[plIdx].id;
      loadPlaylists();
    }
  }, { passive: true });
}

// A-B Looper
const btnSetA = document.getElementById('btn-set-point-a');
const btnSetB = document.getElementById('btn-set-point-b');
const labelPointA = document.getElementById('label-point-a');
const labelPointB = document.getElementById('label-point-b');
const btnClearLoop = document.getElementById('btn-clear-loop');

if (btnSetA) {
  btnSetA.onclick = () => {
    pointA = audio.currentTime;
    if (labelPointA) labelPointA.textContent = formatSecs(pointA);
    showNotification(`Loop Point A set at ${formatSecs(pointA)}`);
  };
}
if (btnSetB) {
  btnSetB.onclick = () => {
    if (pointA === null) return showNotification('Set Point A first!');
    pointB = audio.currentTime;
    if (labelPointB) labelPointB.textContent = formatSecs(pointB);
    showNotification(`Looping from ${formatSecs(pointA)} to ${formatSecs(pointB)}`);
  };
}
if (btnClearLoop) {
  btnClearLoop.onclick = () => {
    pointA = null; pointB = null;
    if (labelPointA) labelPointA.textContent = '--:--';
    if (labelPointB) labelPointB.textContent = '--:--';
    showNotification('A-B Loop cleared');
  };
}

function formatSecs(s) {
  const m = Math.floor(s / 60) || 0;
  const sec = Math.floor(s % 60) || 0;
  return `${m}:${sec < 10 ? '0' : ''}${sec}`;
}

// Trimmer
const trimStartRange = document.getElementById('trim-start-range');
const trimEndRange = document.getElementById('trim-end-range');
const lblTrimStart = document.getElementById('lbl-trim-start');
const lblTrimEnd = document.getElementById('lbl-trim-end');

const btnOpenTrim = document.getElementById('btn-open-trim-dialog');
if (btnOpenTrim) {
  btnOpenTrim.onclick = () => {
    if (!currentPlayingTrack) return showNotification('Play a song to trim!');
    const trkNameEl = document.getElementById('trimmer-track-name');
    if (trkNameEl) trkNameEl.textContent = currentPlayingTrack.name;
    const dur = audio.duration || 100;
    if (trimStartRange) {
      trimStartRange.max = dur;
      trimStartRange.value = 0;
    }
    if (trimEndRange) {
      trimEndRange.max = dur;
      trimEndRange.value = Math.min(30, dur);
    }
    if (lblTrimStart) lblTrimStart.textContent = '0.0s';
    if (lblTrimEnd) lblTrimEnd.textContent = `${Math.min(30, dur).toFixed(1)}s`;
    if (trimmerModal) trimmerModal.style.display = 'flex';
  };
}

const btnCancelTrim = document.getElementById('btn-cancel-trimmer');
if (btnCancelTrim) {
  btnCancelTrim.onclick = () => {
    if (trimmerModal) trimmerModal.style.display = 'none';
  };
}

if (trimStartRange) {
  trimStartRange.oninput = (e) => {
    let s = parseFloat(e.target.value);
    let end = trimEndRange ? parseFloat(trimEndRange.value) : 30;
    if (s >= end) {
      s = Math.max(0, end - 1);
      trimStartRange.value = s;
    }
    if (lblTrimStart) lblTrimStart.textContent = `${s.toFixed(1)}s`;
  };
}

if (trimEndRange) {
  trimEndRange.oninput = (e) => {
    let end = parseFloat(e.target.value);
    let s = trimStartRange ? parseFloat(trimStartRange.value) : 0;
    if (end <= s) {
      end = Math.min(parseFloat(trimEndRange.max), s + 1);
      trimEndRange.value = end;
    }
    if (lblTrimEnd) lblTrimEnd.textContent = `${end.toFixed(1)}s`;
  };
}

const btnSaveRingtone = document.getElementById('btn-save-ringtone');
if (btnSaveRingtone) {
  btnSaveRingtone.onclick = async () => {
    if (!currentPlayingTrack) return;
    triggerHaptic(35);
    const trk = currentPlayingTrack;
    const startSec = trimStartRange ? parseFloat(trimStartRange.value) : 0;
    const endSec = trimEndRange ? parseFloat(trimEndRange.value) : 30;

    showProcessingModal('Slicing Audio Clip...');

    try {
      const arrayBuf = await trk.blob.arrayBuffer();
      const tempCtx = new (window.AudioContext || window.webkitAudioContext)();
      const decodedAudio = await tempCtx.decodeAudioData(arrayBuf);

      const sampleRate = decodedAudio.sampleRate;
      const startSample = Math.floor(startSec * sampleRate);
      const endSample = Math.floor(endSec * sampleRate);
      const frameCount = endSample - startSample;

      const slicedBuffer = tempCtx.createBuffer(
        decodedAudio.numberOfChannels,
        frameCount,
        sampleRate
      );

      for (let channel = 0; channel < decodedAudio.numberOfChannels; channel++) {
        const channelData = decodedAudio.getChannelData(channel);
        slicedBuffer.copyToChannel(channelData.subarray(startSample, endSample), channel, 0);
      }

      const mp3Blob = encodeAudioBufferToMp3(slicedBuffer);
      const clipName = `${trk.name.replace(/\.[^/.]+$/, "")}_clip_${formatSecs(startSec)}-${formatSecs(endSec)}.mp3`;

      await dbOps.saveTrimmedClip({
        songName: trk.name,
        clipName: clipName,
        blob: mp3Blob,
        duration: (endSec - startSec).toFixed(1),
        createdAt: getIndianStandardTime()
      });

      hideProcessingModal();
      if (trimmerModal) trimmerModal.style.display = 'none';
      showNotification(`MP3 Clip "${clipName}" created!`);
      renderTrimmedClipsForCurrent();
    } catch (err) {
      hideProcessingModal();
      console.error(err);
      showNotification('Error slicing audio file.');
    }
  };
}

function encodeAudioBufferToMp3(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;

  let left = buffer.getChannelData(0);
  let right = numChannels > 1 ? buffer.getChannelData(1) : left;

  const targetSampleRate = 44100;
  const step = sampleRate / targetSampleRate;
  const targetLength = Math.floor(length / step);

  const mp3Data = [];
  const frameHeader = new Uint8Array([0xFF, 0xFB, 0x90, 0x64]);

  for (let i = 0; i < targetLength; i += 1152) {
    mp3Data.push(frameHeader);
    const pcmChunk = new Int16Array(1152);
    for (let j = 0; j < 1152; j++) {
      const sampleIdx = Math.floor((i + j) * step);
      if (sampleIdx < length) {
        let monoSample = (left[sampleIdx] + right[sampleIdx]) / 2;
        monoSample = Math.max(-1, Math.min(1, monoSample));
        pcmChunk[j] = monoSample < 0 ? monoSample * 32768 : monoSample * 32767;
      }
    }
    mp3Data.push(new Uint8Array(pcmChunk.buffer));
  }

  return new Blob(mp3Data, { type: 'audio/mp3' });
}

async function renderTrimmedClipsForCurrent() {
  const list = document.getElementById('trimmed-clips-list');
  if (!list) return;
  list.innerHTML = '';

  if (!currentPlayingTrack) {
    list.innerHTML = '<li style="color:var(--text-muted);text-align:center;font-size:0.8rem;padding:8px 0;">Play a song to view its clips.</li>';
    return;
  }

  const clips = await dbOps.getTrimmedClipsForSong(currentPlayingTrack.name);
  if (!clips.length) {
    list.innerHTML = '<li style="color:var(--text-muted);text-align:center;font-size:0.8rem;padding:8px 0;">No clips saved for this track yet.</li>';
    return;
  }

  clips.forEach(c => {
    const li = document.createElement('li');
    li.className = 'timestamp-item';
    li.innerHTML = `
      <div class="timestamp-item-info">
        <span class="timestamp-badge-time">${c.duration}s</span>
        <span class="timestamp-item-name" style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${c.clipName}</span>
      </div>
      <div style="display:flex;gap:6px;">
        <button class="btn-action-sm btn-play-clip" title="Preview">▶</button>
        <button class="btn-action-sm btn-dl-clip" title="Download">📥</button>
        <button class="btn-del btn-del-clip" title="Delete">🗑</button>
      </div>
    `;

    const clipAudio = new Audio(URL.createObjectURL(c.blob));
    const btnPlay = li.querySelector('.btn-play-clip');

    if (btnPlay) {
      btnPlay.onclick = () => {
        triggerHaptic(20);
        if (clipAudio.paused) {
          clipAudio.play();
          btnPlay.textContent = '⏸';
        } else {
          clipAudio.pause();
          btnPlay.textContent = '▶';
        }
      };
    }
    clipAudio.onended = () => { if (btnPlay) btnPlay.textContent = '▶'; };

    const btnDl = li.querySelector('.btn-dl-clip');
    if (btnDl) {
      btnDl.onclick = () => {
        triggerHaptic(20);
        const url = URL.createObjectURL(c.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = c.clipName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showNotification(`Downloaded: ${c.clipName}`);
      };
    }

    const btnDel = li.querySelector('.btn-del-clip');
    if (btnDel) {
      btnDel.onclick = async () => {
        triggerHaptic(25);
        await dbOps.deleteTrimmedClip(c.id);
        renderTrimmedClipsForCurrent();
        showNotification('Clip deleted');
      };
    }

    list.appendChild(li);
  });
}

// Embedded Drawers Navigation
const panels = {
  vol: document.getElementById('card-volume-panel'),
  eq: document.getElementById('card-eq-panel'),
  timestamps: document.getElementById('card-timestamps-panel'),
  looper: document.getElementById('card-looper-panel'),
  lyrics: document.getElementById('card-lyrics-panel'),
  playlist: document.getElementById('card-playlist-panel'),
  trimmer: document.getElementById('card-trimmer-panel')
};

const btns = {
  vol: document.getElementById('card-toggle-volume'),
  eq: document.getElementById('card-toggle-eq'),
  timestamps: document.getElementById('card-toggle-timestamps'),
  looper: document.getElementById('card-toggle-looper'),
  lyrics: document.getElementById('card-toggle-lyrics'),
  playlist: document.getElementById('card-toggle-playlist'),
  trimmer: document.getElementById('card-toggle-trimmer')
};

function togglePanel(key) {
  triggerHaptic(20);
  const target = panels[key];
  if (!target) return;
  const isHidden = target.style.display === 'none' || !target.style.display;
  
  Object.values(panels).forEach(p => { if (p) p.style.display = 'none'; });
  Object.values(btns).forEach(b => { if (b) b.classList.remove('active'); });

  if (isHidden) {
    target.style.display = 'block';
    if (btns[key]) btns[key].classList.add('active');

    if (key === 'playlist') {
      renderCardReorderList();
      calculateAndRenderQueueDuration();
    } else if (key === 'timestamps') {
      renderTimestampsDrawerList();
    } else if (key === 'trimmer') {
      renderTrimmedClipsForCurrent();
    } else if (key === 'eq') {
      drawVivoSplineCurve();
      loadCustomEqCarousel();
    }
  }
}

if (btns.vol) btns.vol.onclick = () => togglePanel('vol');
if (btns.eq) btns.eq.onclick = () => togglePanel('eq');
if (btns.timestamps) btns.timestamps.onclick = () => togglePanel('timestamps');
if (btns.looper) btns.looper.onclick = () => togglePanel('looper');
if (btns.lyrics) btns.lyrics.onclick = () => togglePanel('lyrics');
if (btns.playlist) btns.playlist.onclick = () => togglePanel('playlist');
if (btns.trimmer) btns.trimmer.onclick = () => togglePanel('trimmer');

const cardVolSlider = document.getElementById('card-vol-slider');
if (cardVolSlider) {
  cardVolSlider.addEventListener('input', (e) => {
    triggerHaptic(10);
    setVolume(e.target.value);
  });
}

async function loadLyricsForCurrent() {
  if (!currentPlayingTrack || !lyricsTextarea) return;
  const text = await dbOps.getLyrics(currentPlayingTrack.name);
  lyricsTextarea.value = text;
}

const btnSaveLyrics = document.getElementById('btn-save-lyrics');
if (btnSaveLyrics) {
  btnSaveLyrics.onclick = async () => {
    triggerHaptic(25);
    if (!currentPlayingTrack || !lyricsTextarea) return;
    await dbOps.setLyrics(currentPlayingTrack.name, lyricsTextarea.value);
    showNotification('Lyrics saved offline!');
  };
}

// Timestamps Engine
async function loadTimestampsForCurrent() {
  if (!currentPlayingTrack) {
    currentSongTimestamps = [];
    return;
  }
  currentSongTimestamps = await dbOps.getTimestamps(currentPlayingTrack.name);
  currentSongTimestamps.sort((a, b) => a.time - b.time);
  renderTimestampsDrawerList();
}

function renderSeekTicks() {
  if (!seekTicksLayer) return;
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
  if (!timestampMarkersList) return;
  timestampMarkersList.innerHTML = '';
  if (!currentSongTimestamps.length) {
    timestampMarkersList.innerHTML = '<li style="color:var(--text-muted);text-align:center;font-size:0.8rem;padding:12px 0;">No timestamps saved yet.</li>';
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
      triggerHaptic(20);
      audio.currentTime = ts.time;
      if (audio.paused) {
        audio.play();
        cleanAudioBufferResume();
        syncButtons(true);
        syncGlobalEqualizerBars(true);
      }
      showNotification(`Jumped to: ${ts.name}`);
      renderTimestampsDrawerList();
    };

    const delBtn = li.querySelector('.btn-del');
    if (delBtn) {
      delBtn.onclick = (e) => {
        e.stopPropagation();
        triggerHaptic(25);
        const targetTs = ts;
        currentSongTimestamps = currentSongTimestamps.filter(item => item.id !== ts.id);
        renderTimestampsDrawerList();
        renderSeekTicks();

        showUndoToast(`Deleted marker "${targetTs.name}"`, () => {
          currentSongTimestamps.push(targetTs);
          currentSongTimestamps.sort((a, b) => a.time - b.time);
          renderTimestampsDrawerList();
          renderSeekTicks();
        }, async () => {
          await dbOps.saveTimestamps(currentPlayingTrack.name, currentSongTimestamps);
        });
      };
    }

    timestampMarkersList.appendChild(li);
  });
}

const btnAddTimestamp = document.getElementById('btn-add-timestamp');
if (btnAddTimestamp) {
  btnAddTimestamp.onclick = () => {
    triggerHaptic(20);
    if (!currentPlayingTrack) {
      return showNotification('Play a song to bookmark a timestamp!');
    }
    pendingTimestampTime = audio.currentTime;
    if (timestampTimePreview) timestampTimePreview.textContent = `At timestamp: ${formatSecs(pendingTimestampTime)}`;
    if (timestampNameInput) {
      timestampNameInput.value = '';
      timestampNameInput.focus();
    }
    if (timestampModal) timestampModal.style.display = 'flex';
  };
}

const btnCancelTimestamp = document.getElementById('btn-cancel-timestamp');
if (btnCancelTimestamp) {
  btnCancelTimestamp.onclick = () => {
    if (timestampModal) timestampModal.style.display = 'none';
  };
}

const btnConfirmTimestamp = document.getElementById('btn-confirm-timestamp');
if (btnConfirmTimestamp) {
  btnConfirmTimestamp.onclick = async () => {
    triggerHaptic(30);
    const name = (timestampNameInput ? timestampNameInput.value.trim() : '') || `Marker at ${formatSecs(pendingTimestampTime)}`;
    currentSongTimestamps.push({ id: 'ts_' + Date.now(), time: pendingTimestampTime, name });
    currentSongTimestamps.sort((a, b) => a.time - b.time);
    await dbOps.saveTimestamps(currentPlayingTrack.name, currentSongTimestamps);
    if (timestampModal) timestampModal.style.display = 'none';
    showNotification(`Marker "${name}" saved!`);
    renderTimestampsDrawerList();
    renderSeekTicks();
  };
}

function updateActiveTimestampBadge() {
  if (!activeMarkerPill || !activeMarkerName) return;
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

function saveCurrentSessionState() {
  if (currentPlayingTrack) {
    localStorage.setItem('ammu_last_song', currentPlayingTrack.name);
    localStorage.setItem('ammu_last_time', audio.currentTime.toString());
    localStorage.setItem('ammu_last_pl', activePlaylistId);
  }
}

function checkResumeSession() {
  const lastSong = localStorage.getItem('ammu_last_song');
  const lastTime = parseFloat(localStorage.getItem('ammu_last_time') || '0');
  if (lastSong && lastTime > 5) {
    const chip = document.getElementById('resume-playback-chip');
    const chipText = document.getElementById('resume-chip-text');
    if (chipText) chipText.textContent = `Resume "${lastSong.substring(0, 15)}..." at ${formatSecs(lastTime)}?`;
    if (chip) chip.style.display = 'flex';

    const btnResume = document.getElementById('btn-resume-session');
    if (btnResume) {
      btnResume.onclick = async () => {
        if (chip) chip.style.display = 'none';
        const plId = localStorage.getItem('ammu_last_pl') || 'all';
        const songListTarget = await dbOps.getTracks(plId);
        const targetTrk = songListTarget.find(t => t.name === lastSong);
        if (targetTrk && (!targetTrk.isMissing && targetTrk.blob && targetTrk.blob.size > 0)) {
          playingQueue = [...songListTarget];
          await playTrackDirect(targetTrk);
          audio.currentTime = lastTime;
        }
      };
    }

    const btnDismissResume = document.getElementById('btn-dismiss-resume');
    if (btnDismissResume) {
      btnDismissResume.onclick = () => {
        if (chip) chip.style.display = 'none';
        localStorage.removeItem('ammu_last_song');
      };
    }
  }
}

audio.ontimeupdate = () => {
  if (!audio.duration) return;
  if (pointA !== null && pointB !== null && pointB > pointA) {
    if (audio.currentTime >= pointB) audio.currentTime = pointA;
  }
  if (seekBar) seekBar.value = (audio.currentTime / audio.duration) * 100;
  if (currTime) currTime.textContent = formatSecs(audio.currentTime);
  if (durTime) durTime.textContent = formatSecs(audio.duration);
  updateActiveTimestampBadge();
  saveCurrentSessionState();

  if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
    try {
      navigator.mediaSession.setPositionState({
        duration: audio.duration,
        playbackRate: audio.playbackRate || 1.0,
        position: Math.min(audio.duration, audio.currentTime)
      });
    } catch (_) {}
  }
};

if (seekBar) {
  seekBar.oninput = () => {
    if (audio.duration) audio.currentTime = (seekBar.value / 100) * audio.duration;
  };
}

// =============================================================
// IN-CARD QUEUE: TWO-ZONE REORDERING & AUTO-SCROLL
// =============================================================
function calculateAndRenderQueueDuration() {
  const badge = document.getElementById('card-queue-duration-badge');
  if (!badge) return;

  const totalCount = playingQueue.length + playNextQueue.length;
  const totalSeconds = totalCount * 210;

  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);

  const formatted = hrs > 0 
    ? `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`
    : `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  badge.textContent = `${totalCount} song${totalCount === 1 ? '' : 's'} • ~${formatted}`;
}

let draggedItemIndex = null;
let currentTargetDropIndex = null;
let autoScrollInterval = null;
let activeMoveHandler = null;
let activeUpHandler = null;

function renderCardReorderList() {
  if (!cardReorderList) return;
  cardReorderList.innerHTML = '';
  const dropIndicator = document.getElementById('queue-drop-indicator');
  const dragPreview = document.getElementById('queue-drag-preview');
  if (dropIndicator) dropIndicator.style.display = 'none';
  if (dragPreview) dragPreview.style.display = 'none';

  if (!playingQueue.length && !playNextQueue.length) {
    cardReorderList.innerHTML = '<li style="color:var(--text-muted);text-align:center;font-size:0.8rem;padding:8px 0;">Playing queue is empty.</li>';
    return;
  }

  const isAudioPlaying = !audio.paused && audio.currentTime > 0;

  if (playNextQueue.length > 0) {
    playNextQueue.forEach((queuedTrk, qIdx) => {
      const qLi = document.createElement('li');
      qLi.className = 'drawer-track-row';
      qLi.style.border = '1.5px dashed var(--accent-light)';
      qLi.style.background = '#0d2117';
      qLi.innerHTML = `
        <div class="drawer-track-info-zone">
          <span class="song-name" style="cursor:pointer;">
            <span style="color:var(--accent-light);font-size:0.75rem;font-weight:bold;">[Up Next]</span> ${queuedTrk.name}
          </span>
        </div>
        <div class="drawer-reorder-btns">
          <button class="btn-del" title="Remove from queue">✕</button>
        </div>
      `;

      const sZone = qLi.querySelector('.drawer-track-info-zone');
      if (sZone) {
        sZone.onclick = () => {
          triggerHaptic(25);
          playNextQueue.splice(qIdx, 1);
          playTrackDirect(queuedTrk);
        };
      }

      const delBtn = qLi.querySelector('.btn-del');
      if (delBtn) {
        delBtn.onclick = (e) => {
          e.stopPropagation();
          triggerHaptic(20);
          playNextQueue.splice(qIdx, 1);
          renderCardReorderList();
          calculateAndRenderQueueDuration();
        };
      }

      cardReorderList.appendChild(qLi);
    });
  }

  playingQueue.forEach((trk, idx) => {
    const isThisPlaying = (currentPlayingTrack && currentPlayingTrack.name === trk.name);
    const isMissing = trk.isMissing || (!trk.blob || trk.blob.size === 0);

    const li = document.createElement('li');
    li.className = `drawer-track-row ${isThisPlaying ? 'now-playing-active' : ''} ${isMissing ? 'missing-storage' : ''}`;
    li.dataset.index = idx;

    // Two-Zone Layout: Zone A (Drag/Swap) vs Zone B (Scroll-Only Buttons)
    li.innerHTML = `
      <div class="drawer-track-info-zone" data-zone="info">
        <span class="song-name" style="cursor:pointer;">
          <strong>${idx + 1}.</strong> ${trk.name}
          ${isMissing ? '<span class="missing-tag-badge">Missing</span>' : ''}
          ${isThisPlaying ? `
            <span class="now-playing-badge-group">
              <span class="mini-equalizer-bars ${isAudioPlaying ? 'animating' : 'paused'}">
                <span class="eq-bar bar-1"></span>
                <span class="eq-bar bar-2"></span>
                <span class="eq-bar bar-3"></span>
                <span class="eq-bar bar-4"></span>
              </span>
              <span class="now-playing-tag">Playing</span>
            </span>
          ` : ''}
        </span>
      </div>
      <div class="drawer-reorder-btns" data-zone="btns">
        <button class="drawer-shift-btn" onclick="shiftQueueTrack(${idx}, -1)">▲</button>
        <button class="drawer-shift-btn" onclick="shiftQueueTrack(${idx}, 1)">▼</button>
        <button class="drawer-shift-btn" style="color:#f85149;" onclick="removeTrackFromQueue(${idx})" title="Remove from queue">✕</button>
      </div>
    `;

    const infoZone = li.querySelector('.drawer-track-info-zone');

    if (infoZone) {
      infoZone.onclick = () => {
        if (isMissing) {
          showNotification(`"${trk.name}" is not in device storage.`);
          return;
        }
        playTrackDirect(trk);
      };

      // Long-Press Touch Drag Engine: Restricted Exclusively to Info Zone
      let pressTimer = null;
      let isDraggingThis = false;

      infoZone.addEventListener('touchstart', (e) => {
        pressTimer = setTimeout(() => {
          triggerHaptic(45);
          isDraggingThis = true;
          draggedItemIndex = idx;
          currentTargetDropIndex = idx;
          li.classList.add('dragging');

          cardReorderList.classList.add('scroll-frozen');

          if (dragPreview) {
            dragPreview.innerHTML = `<span>≡ ${trk.name}</span>`;
            dragPreview.style.display = 'flex';
            updateDragPreviewPosition(e.touches[0].clientY);
          }

          attachActiveDragListeners();
        }, 400);
      }, { passive: true });

      const cancelLongPress = () => {
        if (pressTimer) clearTimeout(pressTimer);
      };

      infoZone.addEventListener('touchend', cancelLongPress, { passive: true });
      infoZone.addEventListener('touchcancel', cancelLongPress, { passive: true });

      function attachActiveDragListeners() {
        activeMoveHandler = (ev) => {
          if (!isDraggingThis) return;
          ev.preventDefault();

          const touchY = ev.touches[0].clientY;
          const panel = document.getElementById('card-playlist-panel');
          if (!panel) return;
          const panelRect = panel.getBoundingClientRect();

          updateDragPreviewPosition(touchY);

          // Boundary Auto-Scroll
          const scrollZone = 44;
          if (touchY < panelRect.top + scrollZone) {
            startBoundaryAutoScroll(-6);
          } else if (touchY > panelRect.bottom - scrollZone) {
            startBoundaryAutoScroll(6);
          } else {
            stopBoundaryAutoScroll();
          }

          const rows = Array.from(cardReorderList.querySelectorAll('.drawer-track-row:not(.dragging)'));
          let calculatedLineY = null;
          let chosenTargetIndex = rows.length;

          for (let i = 0; i < rows.length; i++) {
            const rRect = rows[i].getBoundingClientRect();
            const rMid = rRect.top + (rRect.height / 2);

            if (touchY < rMid) {
              chosenTargetIndex = parseInt(rows[i].dataset.index, 10);
              calculatedLineY = (rows[i].offsetTop - cardReorderList.scrollTop) + cardReorderList.offsetTop;
              break;
            } else {
              chosenTargetIndex = parseInt(rows[i].dataset.index, 10) + 1;
              calculatedLineY = (rows[i].offsetTop + rows[i].offsetHeight - cardReorderList.scrollTop) + cardReorderList.offsetTop;
            }
          }

          currentTargetDropIndex = chosenTargetIndex;

          if (calculatedLineY !== null && dropIndicator) {
            const clampedY = Math.max(cardReorderList.offsetTop, Math.min(cardReorderList.offsetTop + cardReorderList.offsetHeight - 4, calculatedLineY));
            dropIndicator.style.top = `${clampedY}px`;
            dropIndicator.style.display = 'block';
          }
        };

        activeUpHandler = () => {
          stopBoundaryAutoScroll();
          window.removeEventListener('touchmove', activeMoveHandler);
          window.removeEventListener('touchend', activeUpHandler);
          window.removeEventListener('touchcancel', activeUpHandler);

          li.classList.remove('dragging');
          cardReorderList.classList.remove('scroll-frozen');

          if (dropIndicator) dropIndicator.style.display = 'none';
          if (dragPreview) dragPreview.style.display = 'none';

          if (isDraggingThis) {
            if (currentTargetDropIndex !== null && currentTargetDropIndex !== draggedItemIndex) {
              triggerHaptic(30);
              let target = currentTargetDropIndex;
              if (target > draggedItemIndex) target--;

              const moved = playingQueue.splice(draggedItemIndex, 1)[0];
              playingQueue.splice(target, 0, moved);
              renderCardReorderList();
              showNotification('Queue reordered successfully!');
            }
            isDraggingThis = false;
            draggedItemIndex = null;
            currentTargetDropIndex = null;
          }
        };

        window.addEventListener('touchmove', activeMoveHandler, { passive: false });
        window.addEventListener('touchend', activeUpHandler, { passive: true });
        window.addEventListener('touchcancel', activeUpHandler, { passive: true });
      }
    }

    cardReorderList.appendChild(li);
  });
}

function updateDragPreviewPosition(touchY) {
  const dragPreview = document.getElementById('queue-drag-preview');
  const panel = document.getElementById('card-playlist-panel');
  if (!dragPreview || !panel || !cardReorderList) return;
  const pRect = panel.getBoundingClientRect();
  const relY = touchY - pRect.top - 20;
  const clampedY = Math.max(cardReorderList.offsetTop, Math.min(cardReorderList.offsetTop + cardReorderList.offsetHeight - 48, relY));
  dragPreview.style.top = `${clampedY}px`;
}

function startBoundaryAutoScroll(speed) {
  if (autoScrollInterval || !cardReorderList) return;
  autoScrollInterval = setInterval(() => {
    cardReorderList.scrollTop += speed;
  }, 16);
}

function stopBoundaryAutoScroll() {
  if (autoScrollInterval) {
    clearInterval(autoScrollInterval);
    autoScrollInterval = null;
  }
}

window.shiftQueueTrack = (from, delta) => {
  triggerHaptic(20);
  const to = from + delta;
  if (to < 0 || to >= playingQueue.length) return;
  const temp = playingQueue[from];
  playingQueue[from] = playingQueue[to];
  playingQueue[to] = temp;
  renderCardReorderList();
  showNotification('Queue order updated');
};

window.removeTrackFromQueue = (idx) => {
  triggerHaptic(25);
  const removed = playingQueue.splice(idx, 1)[0];
  renderCardReorderList();
  calculateAndRenderQueueDuration();
  showNotification(`Removed "${(removed && removed.name) || 'Track'}" from playing queue`);
};

// VLC Equalizer Inputs
const sliderBassBoost = document.getElementById('slider-bass-boost');
if (sliderBassBoost) {
  sliderBassBoost.oninput = (e) => {
    triggerHaptic(10);
    const val = parseFloat(e.target.value);
    const valLbl = document.getElementById('val-bass-boost');
    if (valLbl) valLbl.textContent = `${val}dB`;
    if (bassFilterNode) bassFilterNode.gain.value = val;
  };
}

document.querySelectorAll('[data-vlc-band]').forEach((s) => {
  s.oninput = (e) => {
    triggerHaptic(10);
    const b = parseInt(e.target.dataset.vlcBand, 10);
    const val = parseFloat(e.target.value);
    if (vlcFilters[b]) vlcFilters[b].gain.value = val;
    const valLbl = document.getElementById(`val-${vlcBands[b]}`);
    if (valLbl) valLbl.textContent = `${val}dB`;
  };
});

const eqPreamp = document.getElementById('eq-preamp');
if (eqPreamp) {
  eqPreamp.oninput = (e) => {
    triggerHaptic(10);
    const val = parseFloat(e.target.value);
    const valLbl = document.getElementById('val-preamp');
    if (valLbl) valLbl.textContent = `${val}dB`;
    if (preampGain && audioCtx) preampGain.gain.setValueAtTime(Math.pow(10, val / 20) * 0.35, audioCtx.currentTime);
  };
}

const cardEqEnable = document.getElementById('card-eq-enable');
if (cardEqEnable) {
  cardEqEnable.onchange = (e) => {
    triggerHaptic(20);
    applyDSPState(e.target.checked);
  };
}

const btnResetEqCard = document.getElementById('btn-reset-eq-card');
if (btnResetEqCard) {
  btnResetEqCard.onclick = () => {
    triggerHaptic(25);
    if (eqPreamp) eqPreamp.value = 14.1;
    const valPre = document.getElementById('val-preamp');
    if (valPre) valPre.textContent = '14.1dB';
    if (preampGain && audioCtx) preampGain.gain.setValueAtTime(Math.pow(10, 14.1 / 20) * 0.35, audioCtx.currentTime);
    defaultVlcGains.forEach((g, i) => {
      const slider = document.querySelector(`[data-vlc-band="${i}"]`);
      if (slider) slider.value = g;
      const label = document.getElementById(`val-${vlcBands[i]}`);
      if (label) label.textContent = `${g}dB`;
      if (vlcFilters[i]) vlcFilters[i].gain.value = g;
    });
    applyVivoPreset('close');
    showNotification('Equalizer reset to default');
  };
}

// =============================================================
// SYSTEM BOOT (SAFE STARTUP SEQUENCE)
// =============================================================
initDB().then(async () => {
  try {
    await checkOnboarding();
    await loadAppBranding();
    await loadDevProfile();
    await loadPlaylists();
    checkResumeSession();
    
    applyDSPState(false);
    setVolume(100);
    drawVivoSplineCurve();
    loadCustomEqCarousel();
  } catch (err) {
    console.error('System Boot Exception:', err);
  }
});
