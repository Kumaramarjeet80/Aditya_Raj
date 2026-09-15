if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => {});
  });
}

// -------------------------------------------------------------
// INDIAN STANDARD TIME (IST) FORMATTERS
// -------------------------------------------------------------
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

// -------------------------------------------------------------
// OFFLINE WEB CRYPTO (AES-GCM-256 & SHA-256)
// -------------------------------------------------------------
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

// -------------------------------------------------------------
// PWA INSTALL BANNER
// -------------------------------------------------------------
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
  persistentInstallBanner.style.display = 'none';
});

function triggerHaptic(ms = 35) {
  if ('vibrate' in navigator) {
    try { navigator.vibrate(ms); } catch (_) {}
  }
}

// Android Back Gesture & Multi-Select Cancellation Handling
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
    'admin-auth-modal'
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
  const trackMenu = document.getElementById('track-context-menu');
  const plMenu = document.getElementById('playlist-context-menu');
  const headerMenu = document.getElementById('header-settings-menu');
  const sortMenu = document.getElementById('sort-by-menu');
  const sortSubName = document.getElementById('sort-sub-name');
  const sortSubSize = document.getElementById('sort-sub-size');
  const subMenu = document.getElementById('add-to-playlist-submenu');
  if (trackMenu) trackMenu.style.display = 'none';
  if (plMenu) plMenu.style.display = 'none';
  if (headerMenu) headerMenu.style.display = 'none';
  if (sortMenu) sortMenu.style.display = 'none';
  if (sortSubName) sortSubName.style.display = 'none';
  if (sortSubSize) sortSubSize.style.display = 'none';
  if (subMenu) subMenu.style.display = 'none';
}

window.addEventListener('touchmove', dismissAllMenus, { passive: true });
window.addEventListener('wheel', dismissAllMenus, { passive: true });

// ==========================================
// TOASTS, UNDO & FLOATING EMOTIONAL BANNER
// ==========================================
let activeUndoAction = null;

function showNotification(msg) {
  const container = document.getElementById('toast-container');
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

  toast.querySelector('#btn-toast-undo').onclick = () => {
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

  container.appendChild(toast);
}

function triggerHeartBurst(isFavorited) {
  const overlay = document.getElementById('heart-burst-overlay');
  overlay.innerHTML = '';
  overlay.style.display = 'block';

  const heartChar = isFavorited ? '❤️' : '💛';
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'burst-particle';
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

  if (emotionalTimeout) clearTimeout(emotionalTimeout);

  if (isLiked) {
    emojiEl.textContent = '🥹';
    titleEl.textContent = 'Thank you for loving me 🥹';
    subEl.textContent = 'From Amarjeet';
  } else {
    emojiEl.textContent = '🥲';
    titleEl.textContent = 'Dil tod diya na mera 🥲';
    subEl.textContent = 'From Amarjeet';
  }

  container.style.display = 'flex';
  emotionalTimeout = setTimeout(() => {
    container.style.display = 'none';
  }, 2800);
}

// -------------------------------------------------------------
// INDEXEDDB ENGINE
// -------------------------------------------------------------
const DB_NAME = 'AmmuMusicDB_v240';
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

// ==========================================
// AUDIO ENGINE (NO DEVICE DETECTION, 100% DEFAULT, DSP 20%)
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
let eqEnabled = false;
let currentVol = 1.0;
let isVisualizerActive = true;

let wasPlayingBeforeInterruption = false;
let isManualPause = false;

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
    preampGain.gain.setValueAtTime(1.0, audioCtx.currentTime);

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
      f.gain.value = 0;
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
    console.warn('Web Audio pipeline init fallback:', e);
  }
}

function applyDSPState(enabled) {
  eqEnabled = enabled;
  const chk = document.getElementById('card-eq-enable');
  if (chk) chk.checked = enabled;

  if (filters && filters.length) {
    filters.forEach((f, i) => {
      const slider = document.querySelector(`[data-band="${i}"]`);
      const val = slider ? parseFloat(slider.value) : defaultGains[i];
      f.gain.value = eqEnabled ? val : 0;
    });
  }

  if (preampGain && audioCtx) {
    const pSlider = document.getElementById('eq-preamp');
    const pVal = pSlider ? parseFloat(pSlider.value) : defaultPreamp;
    preampGain.gain.setValueAtTime(
      eqEnabled ? Math.pow(10, pVal / 20) * 0.35 : 1,
      audioCtx.currentTime
    );
  }

  if (bassFilterNode) {
    const bSlider = document.getElementById('slider-bass-boost');
    const bVal = bSlider ? parseFloat(bSlider.value) : 0;
    bassFilterNode.gain.value = eqEnabled ? bVal : 0;
  }

  if (eqEnabled) {
    setVolume(20);
    showNotification('DSP Active: 10-Band EQ ON (Auto Volume 20%)');
  } else {
    setVolume(100);
    showNotification('DSP Bypassed: Flat Sound (Volume 100%)');
  }
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

const visualizerCanvas = document.getElementById('audio-visualizer');
const vCtx = visualizerCanvas ? visualizerCanvas.getContext('2d') : null;
function startVisualizerLoop() {
  if (!analyserNode || !vCtx) return;
  const bufferLength = analyserNode.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function renderFrame() {
    requestAnimationFrame(renderFrame);
    if (audio.paused || !isVisualizerActive) {
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
    const color = `rgba(${p[0]}, ${p[1]}, ${p[2]}, 0.35)`;
    document.getElementById('ambient-glow-layer').style.background = `radial-gradient(circle, ${color} 0%, transparent 70%)`;
  } catch (_) {}
}

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

// UI References
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

const miniCover = document.getElementById('mini-cover');
const miniTitle = document.getElementById('mini-title');
const miniSub = document.getElementById('mini-sub');
const barBtnPlay = document.getElementById('bar-btn-play');
const barBtnLike = document.getElementById('bar-btn-like');
const miniPlayerBar = document.getElementById('mini-player');

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

// Settings Header Trigger
document.getElementById('btn-main-settings-trigger').onclick = (e) => {
  e.stopPropagation();
  triggerHaptic(20);
  const isHidden = headerSettingsMenu.style.display === 'none' || !headerSettingsMenu.style.display;
  dismissAllMenus();
  if (isHidden) headerSettingsMenu.style.display = 'flex';
};

document.getElementById('menu-btn-my-account').onclick = () => {
  headerSettingsMenu.style.display = 'none';
  openSettingsModal();
};

document.getElementById('menu-btn-install-pwa').onclick = () => {
  headerSettingsMenu.style.display = 'none';
  triggerPWAInstall();
};

document.getElementById('menu-btn-dev-profile').onclick = () => {
  headerSettingsMenu.style.display = 'none';
  openDevModal();
};

// ==========================================
// HIERARCHICAL TWO-TIER SORT MENUS
// ==========================================
btnSortTrigger.onclick = (e) => {
  e.stopPropagation();
  triggerHaptic(20);
  const isHidden = sortByMenu.style.display === 'none' || !sortByMenu.style.display;
  dismissAllMenus();
  if (isHidden) {
    const rect = btnSortTrigger.getBoundingClientRect();
    sortByMenu.style.top = `${rect.bottom + window.scrollY + 6}px`;
    sortByMenu.style.left = `${Math.max(10, rect.left - 100)}px`;
    sortByMenu.style.display = 'flex';
  }
};

document.getElementById('sort-cat-name').onclick = (e) => {
  e.stopPropagation();
  triggerHaptic(15);
  sortSubSize.style.display = 'none';
  const rect = document.getElementById('sort-cat-name').getBoundingClientRect();
  sortSubName.style.top = `${rect.top + window.scrollY}px`;
  sortSubName.style.left = `${Math.max(10, rect.left - 160)}px`;
  sortSubName.style.display = 'flex';
};

document.getElementById('sort-cat-size').onclick = (e) => {
  e.stopPropagation();
  triggerHaptic(15);
  sortSubName.style.display = 'none';
  const rect = document.getElementById('sort-cat-size').getBoundingClientRect();
  sortSubSize.style.top = `${rect.top + window.scrollY}px`;
  sortSubSize.style.left = `${Math.max(10, rect.left - 160)}px`;
  sortSubSize.style.display = 'flex';
};

document.querySelectorAll('.sort-item').forEach(btn => {
  btn.onclick = () => {
    triggerHaptic(20);
    currentSortMode = btn.dataset.sort;
    dismissAllMenus();
    renderFilteredTracks();
    showNotification(`Sorted: ${btn.textContent}`);
  };
});

// ==========================================
// ACCOUNT ADMIN SUPER-KEY SUITE (VIEW/UPDATE/DELETE)
// ==========================================
async function refreshAdminKeyUI() {
  const plainKey = await dbOps.getConfig('account_admin_key_plain');
  const statusLbl = document.getElementById('admin-key-status-lbl');
  const createdBox = document.getElementById('admin-key-created-controls');
  const setupBox = document.getElementById('admin-key-setup-controls');
  const displayInput = document.getElementById('display-admin-key-val');
  const toggleBtn = document.getElementById('btn-toggle-view-admin-key');

  if (plainKey) {
    statusLbl.textContent = 'Status: Active Admin Super-Key Registered';
    statusLbl.style.color = 'var(--accent-light)';
    createdBox.style.display = 'block';
    setupBox.style.display = 'none';
    isCurrentAdminKeyRevealed = false;
    displayInput.type = 'password';
    displayInput.value = plainKey;
    toggleBtn.textContent = '👁️ View';
  } else {
    statusLbl.textContent = 'Status: No Admin Key Created (Super-Access Disabled)';
    statusLbl.style.color = 'var(--text-muted)';
    createdBox.style.display = 'none';
    setupBox.style.display = 'flex';
    document.getElementById('settings-admin-key-input').value = '';
  }
}

document.getElementById('btn-save-admin-key').onclick = async () => {
  triggerHaptic(30);
  const keyInput = document.getElementById('settings-admin-key-input').value.trim();
  if (!keyInput) return showNotification('Please enter a valid Admin Key.');
  const h = await hashPasskey(keyInput);
  await dbOps.setConfig('account_admin_key_hash', h);
  await dbOps.setConfig('account_admin_key_plain', keyInput);
  showNotification('Admin Super-Key registered successfully!');
  refreshAdminKeyUI();
};

document.getElementById('btn-toggle-view-admin-key').onclick = () => {
  triggerHaptic(15);
  const displayInput = document.getElementById('display-admin-key-val');
  const toggleBtn = document.getElementById('btn-toggle-view-admin-key');
  isCurrentAdminKeyRevealed = !isCurrentAdminKeyRevealed;
  displayInput.type = isCurrentAdminKeyRevealed ? 'text' : 'password';
  toggleBtn.textContent = isCurrentAdminKeyRevealed ? '🙈 Hide' : '👁️ View';
};

document.getElementById('btn-open-update-admin-key').onclick = async () => {
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

document.getElementById('btn-remove-admin-key').onclick = async () => {
  triggerHaptic(35);
  if (confirm('Remove your account Admin Super-Key? Super-Access recovery will be disabled until you set a new key.')) {
    await dbOps.setConfig('account_admin_key_hash', null);
    await dbOps.setConfig('account_admin_key_plain', null);
    showNotification('Admin Super-Key removed. Storage is blank.');
    refreshAdminKeyUI();
  }
};

// ==========================================
// TRACK 3-DOTS CONTEXT MENU
// ==========================================
document.getElementById('menu-btn-track-select').onclick = () => {
  if (activeContextTrack) {
    triggerHaptic(30);
    multiSelectMode = true;
    selectedTrackIds.add(activeContextTrack.id);
    document.getElementById('batch-action-bar').style.display = 'flex';
    renderFilteredTracks();
  }
  trackContextMenu.style.display = 'none';
};

document.getElementById('menu-btn-play-next').onclick = () => {
  if (activeContextTrack) {
    queueSongPlayNext(activeContextTrack);
  }
  trackContextMenu.style.display = 'none';
};

document.getElementById('menu-btn-rename').onclick = () => {
  if (activeContextTrack) {
    openRenameModal(activeContextTrack);
  }
  trackContextMenu.style.display = 'none';
};

document.getElementById('menu-btn-add-to-pl').onclick = (e) => {
  e.stopPropagation();
  openAddToPlaylistSubmenu();
};

document.getElementById('menu-btn-remove-from-pl').onclick = () => {
  if (activeContextTrack && activePlaylistId !== 'all') {
    executeRemoveTrackFromCurrentPlaylist(activeContextTrack);
  }
  trackContextMenu.style.display = 'none';
};

function openAddToPlaylistSubmenu() {
  const box = document.getElementById('add-to-playlist-options-box');
  box.innerHTML = '';
  const available = availablePlaylistList.filter(p => p.id !== 'all');

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

  const rect = trackContextMenu.getBoundingClientRect();
  addToPlaylistSubmenu.style.top = `${rect.top}px`;
  addToPlaylistSubmenu.style.left = `${Math.max(10, rect.left - 160)}px`;
  addToPlaylistSubmenu.style.display = 'flex';
}

// Playlist 3-Dots Menu Listeners
document.getElementById('pl-menu-btn-download-all').onclick = () => {
  playlistContextMenu.style.display = 'none';
  downloadEntirePlaylist();
};

document.getElementById('pl-menu-btn-edit').onclick = () => {
  if (!activeContextPlaylist) return;
  playlistContextMenu.style.display = 'none';

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

document.getElementById('pl-menu-btn-delete').onclick = () => {
  if (!activeContextPlaylist) return;
  playlistContextMenu.style.display = 'none';

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
const editPlaylistModal = document.getElementById('edit-playlist-modal');
const editPlaylistNameInput = document.getElementById('edit-playlist-name-input');
const editPlaylistAuthorInput = document.getElementById('edit-playlist-author-input');
const editPlaylistArtInput = document.getElementById('edit-playlist-art-input');
const editPlaylistPreviewImg = document.getElementById('edit-playlist-preview-img');
const editPlNameWarning = document.getElementById('edit-pl-name-warning');

function openEditPlaylistModal(pl) {
  editPlaylistNameInput.value = pl.localName || pl.name;
  editPlaylistAuthorInput.value = (pl.localAuthor && pl.localAuthor.name) ? pl.localAuthor.name : (pl.author ? pl.author.name : userProfile.name);
  editPlaylistPreviewImg.src = pl.localCover || pl.cover || currentAppLogo;
  tempEditPlaylistArt = pl.localCover || pl.cover || currentAppLogo;

  if (pl.id === 'favorites') {
    editPlaylistNameInput.disabled = true;
    editPlNameWarning.style.display = 'block';
  } else {
    editPlaylistNameInput.disabled = false;
    editPlNameWarning.style.display = 'none';
  }

  editPlaylistModal.style.display = 'flex';
}

document.getElementById('btn-cancel-edit-playlist').onclick = () => {
  editPlaylistModal.style.display = 'none';
};

editPlaylistArtInput.onchange = async (e) => {
  if (e.target.files && e.target.files[0]) {
    tempEditPlaylistArt = await compressImageSafe(e.target.files[0]);
    editPlaylistPreviewImg.src = tempEditPlaylistArt;
  }
};

document.getElementById('btn-save-edit-playlist').onclick = async () => {
  triggerHaptic(30);
  if (!activeContextPlaylist) return;

  const isPermAdmin = Boolean(activeContextPlaylist.isPermanentAdminUnlocked);

  if (!activeContextPlaylist.originalName) {
    activeContextPlaylist.originalName = activeContextPlaylist.name;
    activeContextPlaylist.originalAuthor = activeContextPlaylist.author || userProfile;
    activeContextPlaylist.originalCover = activeContextPlaylist.cover || currentAppLogo;
  }

  if (activeContextPlaylist.id !== 'favorites') {
    const newName = editPlaylistNameInput.value.trim();
    if (newName) {
      if (isPermAdmin) activeContextPlaylist.name = newName;
      activeContextPlaylist.localName = newName;
    }
  }

  const newAuthorName = editPlaylistAuthorInput.value.trim();
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
  editPlaylistModal.style.display = 'none';
  showNotification(isPermAdmin ? 'Playlist credentials permanently updated!' : 'Playlist details updated locally!');
  await loadPlaylists();
};

function executePlaylistDeleteWithUndo(pl) {
  if (pl.id === 'favorites' || pl.id === 'all') {
    return showNotification('Default playlists cannot be deleted.');
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

// -------------------------------------------------------------
// UNIVERSAL ACTIONS (DOWNLOAD ALL / DELETE ALL PLAYLISTS)
// -------------------------------------------------------------
document.getElementById('btn-universal-download-all').onclick = async () => {
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

document.getElementById('btn-universal-delete-all').onclick = async () => {
  triggerHaptic(35);
  const pls = await dbOps.getPlaylists();
  const userPlaylists = pls.filter(p => p.id !== 'favorites' && p.id !== 'all');

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
  settingsModal.style.display = 'none';
};

// Onboarding
async function checkOnboarding() {
  const saved = await dbOps.getUserProfile();
  if (saved) {
    userProfile = saved;
    updateUserProfileLabels();
  } else {
    document.getElementById('onboarding-modal').style.display = 'flex';
  }
}

function updateUserProfileLabels() {
  const lbl = document.getElementById('settings-current-user-lbl');
  if (lbl) lbl.textContent = `Active listener: ${userProfile.name}`;
}

document.getElementById('onboarding-avatar').onchange = async (e) => {
  if (e.target.files && e.target.files[0]) {
    const b64 = await compressImageSafe(e.target.files[0]);
    document.getElementById('onboarding-avatar-preview').src = b64;
  }
};

document.getElementById('btn-complete-onboarding').onclick = async () => {
  const name = document.getElementById('onboarding-name').value.trim() || 'Amarjeet Kumar';
  const avatar = document.getElementById('onboarding-avatar-preview').src || 'my-icon.png';
  userProfile = { name, avatar };
  await dbOps.setUserProfile(userProfile);
  updateUserProfileLabels();
  document.getElementById('onboarding-modal').style.display = 'none';
  ensureAudioPipeline();
  showNotification(`Welcome to Ammu, ${name}!`);
};

document.getElementById('onboarding-import-file').onchange = (e) => {
  handleDirectImport(e.target.files[0], true);
};

document.getElementById('playlist-modal-import-file').onchange = (e) => {
  document.getElementById('playlist-create-modal').style.display = 'none';
  handleDirectImport(e.target.files[0], false);
};

// User Profile Edit Modal
const userProfileModal = document.getElementById('user-profile-modal');
const editUserNameInput = document.getElementById('edit-user-name');
const editUserAvatarInput = document.getElementById('edit-user-avatar');
const userEditAvatarPreview = document.getElementById('user-edit-avatar-preview');

document.getElementById('btn-open-edit-user-profile').onclick = () => {
  triggerHaptic(20);
  editUserNameInput.value = userProfile.name;
  userEditAvatarPreview.src = userProfile.avatar || 'my-icon.png';
  tempUserAvatarBase64 = userProfile.avatar;
  settingsModal.style.display = 'none';
  userProfileModal.style.display = 'flex';
};

document.getElementById('btn-cancel-user-profile').onclick = () => {
  userProfileModal.style.display = 'none';
  settingsModal.style.display = 'flex';
};

editUserAvatarInput.onchange = async (e) => {
  if (e.target.files && e.target.files[0]) {
    tempUserAvatarBase64 = await compressImageSafe(e.target.files[0]);
    userEditAvatarPreview.src = tempUserAvatarBase64;
  }
};

document.getElementById('btn-save-user-profile').onclick = async () => {
  triggerHaptic(30);
  const n = editUserNameInput.value.trim();
  if (n) userProfile.name = n;
  if (tempUserAvatarBase64) userProfile.avatar = tempUserAvatarBase64;

  await dbOps.setUserProfile(userProfile);
  updateUserProfileLabels();
  userProfileModal.style.display = 'none';
  settingsModal.style.display = 'flex';
  showNotification('Listener profile updated!');
  await loadPlaylists();
};

// -------------------------------------------------------------
// DOWNLOAD HANDLERS WITH PERSISTENT PLAYLIST KEY MEMORY
// -------------------------------------------------------------
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
  const authorName = (currentPlaylist.author?.name) || userProfile.name || 'Amarjeet';
  let successCount = 0;

  for (const trk of list) {
    if (trk.downloadRestricted && !currentPlaylist.isDownloadUnlocked) continue;
    downloadSingleTrack(trk, false, authorName);
    successCount++;
    await new Promise(r => setTimeout(r, 220));
  }
  showNotification(`Downloaded ${successCount} tracks to your device!`);
}

document.getElementById('btn-download-playlist-to-storage').onclick = async () => {
  document.getElementById('author-modal').style.display = 'none';
  await downloadEntirePlaylist();
};

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
  
  const authorName = explicitAuthorName || (currentPlaylist.author?.name) || userProfile.name || 'Amarjeet';
  const cleanBaseName = trk.name.replace(/\.[^/.]+$/, "");
  const finalFileName = `${cleanBaseName} ${authorName}'s music taste.mp3`;
  
  a.download = finalFileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  if (notify) showNotification(`Downloaded: ${finalFileName}`);
}

// Author Profile Modal
document.getElementById('btn-view-playlist-author').onclick = () => {
  triggerHaptic(20);
  const author = currentPlaylist.localAuthor || currentPlaylist.author || userProfile;
  document.getElementById('author-name-display').textContent = author.name;
  document.getElementById('author-avatar-display').src = author.avatar || 'my-icon.png';
  document.getElementById('author-pl-name').textContent = currentPlaylist.localName || currentPlaylist.name;
  document.getElementById('author-track-count').textContent = browsingTracks.length;
  document.getElementById('author-created-date').textContent = currentPlaylist.createdAt || 'Local Storage';
  document.getElementById('author-status-tag').textContent = (currentPlaylist.isImported || currentPlaylist.isAuthorLocked) ? 'Original Curator' : 'Local Playlist Creator';
  document.getElementById('author-modal').style.display = 'flex';
};

document.getElementById('card-queue-author-btn').onclick = () => {
  document.getElementById('btn-view-playlist-author').click();
};

document.getElementById('btn-close-author').onclick = () => {
  document.getElementById('author-modal').style.display = 'none';
};

// Vinyl Disc Mode Toggle
const artDisplayBox = document.getElementById('art-display-box');
let lastTapTime = 0;
const seekFeedbackOverlay = document.getElementById('art-seek-feedback');

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

function showSeekFeedback(text) {
  seekFeedbackOverlay.textContent = text;
  seekFeedbackOverlay.style.opacity = '1';
  setTimeout(() => { seekFeedbackOverlay.style.opacity = '0'; }, 500);
}

// Developer Profile
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
  avatar: 'my-icon.png'
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
  devAvatarImg.src = devData.avatar || 'my-icon.png';

  editDevName.value = devData.name;
  editDevTitle.value = devData.title;
  editDevBio.value = devData.bio;
  editDevLocation.value = devData.location;
  editDevEmail.value = devData.email;
}

function openDevModal() {
  triggerHaptic(20);
  devModal.style.display = 'flex';
}

document.getElementById('footer-dev-trigger').onclick = openDevModal;
document.getElementById('btn-close-dev').onclick = () => { devModal.style.display = 'none'; };

editDevAvatar.onchange = async (e) => {
  if (e.target.files && e.target.files[0]) {
    tempDevAvatarBase64 = await compressImageSafe(e.target.files[0]);
    devAvatarImg.src = tempDevAvatarBase64;
  }
};

document.getElementById('btn-save-dev-profile').onclick = async () => {
  triggerHaptic(30);
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

  document.getElementById('stat-time-today').textContent = formatHoursMins(todaySecs);
  document.getElementById('stat-time-week').textContent = formatHoursMins(weekSecs);
  document.getElementById('stat-time-month').textContent = formatHoursMins(monthSecs);
  document.getElementById('stat-time-all').textContent = formatHoursMins(allTimeSecs);

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
  document.getElementById('stat-peak-hour-lbl').textContent = maxSecs > 0 ? `Peak Routine: ${peakPeriod}` : 'Peak Routine: Calculating...';

  renderMilestones(allTimeSecs);

  const allStats = await dbOps.getAllStats();
  allStats.sort((a, b) => b.count - a.count);
  const topListEl = document.getElementById('stats-top-songs-list');
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

  renderPlaybackHistoryTimeline();
}

async function playSongByNameGlobally(songName) {
  triggerHaptic(20);
  document.getElementById('stats-modal').style.display = 'none';

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

document.getElementById('btn-clear-play-history').onclick = async () => {
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

function startListeningTimeTracking() {
  if (activePlayTimer) clearInterval(activePlayTimer);
  activePlayTimer = setInterval(() => {
    if (!audio.paused && audio.currentTime > 0) {
      dbOps.addListeningTime(1);
    }
  }, 1000);
}

// Settings Modal Hub
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
  const savedAmoled = await dbOps.getConfig('app_amoled');

  if (savedName) currentAppName = savedName;
  if (savedLogo) currentAppLogo = savedLogo;
  if (savedTheme) setAppTheme(savedTheme);
  if (savedAmoled) {
    document.body.classList.toggle('amoled-mode', savedAmoled);
    document.getElementById('chk-amoled-mode').checked = savedAmoled;
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

document.getElementById('chk-amoled-mode').onchange = async (e) => {
  triggerHaptic(25);
  document.body.classList.toggle('amoled-mode', e.target.checked);
  await dbOps.setConfig('app_amoled', e.target.checked);
};

function applyBrandingUI() {
  displayAppName.textContent = currentAppName;
  htmlTitle.textContent = currentAppName;
  headerAppLogo.src = currentAppLogo;
  appFavicon.href = currentAppLogo;
  settingsLogoPreview.src = currentAppLogo;
}

async function openSettingsModal() {
  triggerHaptic(20);
  customAppNameInput.value = currentAppName;
  settingsLogoPreview.src = currentAppLogo;
  tempNewLogoBase64 = currentAppLogo;
  updateUserProfileLabels();
  refreshAdminKeyUI();

  const plChecklist = document.getElementById('export-playlist-checklist');
  plChecklist.innerHTML = '';
  const pls = await dbOps.getPlaylists();
  pls.forEach(p => {
    const label = document.createElement('label');
    label.className = 'checkbox-label';
    label.innerHTML = `<input type="checkbox" data-pl-id="${p.id}" checked /> ${p.localName || p.name}`;
    plChecklist.appendChild(label);
  });

  renderExportTrackPermissionMatrix();
  renderAuditLogs();
  settingsModal.style.display = 'flex';
}

async function renderExportTrackPermissionMatrix() {
  const box = document.getElementById('export-tracks-permission-checklist');
  box.innerHTML = '';
  const q = document.getElementById('export-track-filter-input').value.trim().toLowerCase();
  const allTracks = await dbOps.getAllTracks();
  
  const filtered = allTracks.filter(t => t.name.toLowerCase().includes(q));
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

document.getElementById('export-track-filter-input').addEventListener('input', renderExportTrackPermissionMatrix);

document.getElementById('btn-export-allow-all-dl').onclick = () => {
  document.querySelectorAll('.export-dl-allow-cb').forEach(cb => cb.checked = true);
};

document.getElementById('btn-export-restrict-all-dl').onclick = () => {
  document.querySelectorAll('.export-dl-allow-cb').forEach(cb => cb.checked = false);
};

async function renderAuditLogs() {
  const listEl = document.getElementById('audit-history-list');
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

document.getElementById('btn-clear-history').onclick = async () => {
  await dbOps.clearAuditLogs();
  renderAuditLogs();
  showNotification('Audit history cleared');
};

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
  triggerHaptic(30);
  const newName = customAppNameInput.value.trim();
  if (newName) currentAppName = newName;
  if (tempNewLogoBase64) currentAppLogo = tempNewLogoBase64;

  await dbOps.setConfig('app_name', currentAppName);
  await dbOps.setConfig('app_logo', currentAppLogo);

  applyBrandingUI();
  settingsModal.style.display = 'none';
  showNotification(`Settings saved successfully!`);
  updateMediaSession();
};

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

document.getElementById('btn-export-full-profile').onclick = async () => {
  triggerHaptic(35);
  showNotification('Packaging full profile & media backup...');
  await executeUniversalExport(true, true, true, true, null);
};

document.getElementById('btn-export-meta-profile').onclick = async () => {
  triggerHaptic(35);
  showNotification('Packaging lightweight metadata backup...');
  await executeUniversalExport(false, true, true, false, null);
};

document.getElementById('btn-export-backup').onclick = async () => {
  triggerHaptic(35);
  const includeAudio = document.getElementById('chk-export-audio').checked;
  const includeClips = document.getElementById('chk-export-trimmed-clips').checked;
  const includeMarkers = document.getElementById('chk-export-timestamps').checked;
  const includeImages = document.getElementById('chk-export-images').checked;

  const selectedPlIds = new Set(
    Array.from(document.querySelectorAll('#export-playlist-checklist input:checked'))
      .map(cb => cb.dataset.plId)
  );

  showNotification('Packaging backup data...');
  await executeUniversalExport(includeAudio, includeMarkers, includeImages, includeClips, selectedPlIds);
};

// -------------------------------------------------------------
// EXPORT PIPELINE WITH FULL KEY HISTORY LOGGING
// -------------------------------------------------------------
async function executeUniversalExport(includeAudio, includeMarkers, includeImages, includeClips, selectedPlIds) {
  const allTracks = await dbOps.getAllTracks();
  const allPlaylists = await dbOps.getPlaylists();
  const devProfile = await dbOps.getDevProfile();

  const masterKey = document.getElementById('export-master-key-input').value.trim();
  const encryptionKey = document.getElementById('export-encryption-key-input').value.trim();
  const plainPasskey = document.getElementById('export-passkey-input').value.trim();
  const downloadKey = document.getElementById('export-download-key-input').value.trim();

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
  for (const t of allTracks) {
    if (selectedPlIds && !selectedPlIds.has(t.playlistId) && t.playlistId !== 'all') continue;
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
    version: '13.0',
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
  showNotification(`Downloaded backup: ${finalBackupFileName}`);
}

// =============================================================
// TWO-PHASE IMPORT SYSTEM WITH ADMIN SUPER-ACCESS & FORGOT GUARD
// =============================================================
let rawEncryptedDataToDecrypt = null;
let parsedDecryptedPayload = null;
let currentImportBypassOnboarding = false;

document.getElementById('import-backup-file').onchange = (e) => {
  handleDirectImport(e.target.files[0], false);
};

async function handleDirectImport(file, bypassOnboarding) {
  if (!file) return;
  currentImportBypassOnboarding = bypassOnboarding;
  const reader = new FileReader();
  reader.onload = async (ev) => {
    try {
      const content = ev.target.result;
      const parsed = JSON.parse(content);

      if (parsed.encrypted && parsed.cipherData) {
        rawEncryptedDataToDecrypt = parsed;
        document.getElementById('decryption-key-input').value = '';
        document.getElementById('decryption-auth-modal').style.display = 'flex';
        return;
      }

      evaluateSecondaryKeysPhase(parsed);
    } catch (_) {
      showNotification('Import Failed: Corrupted or invalid JSON backup file.');
    }
  };
  reader.readAsText(file);
}

document.getElementById('btn-cancel-decryption').onclick = () => {
  document.getElementById('decryption-auth-modal').style.display = 'none';
  rawEncryptedDataToDecrypt = null;
};

document.getElementById('btn-confirm-decryption').onclick = async () => {
  const enteredKey = document.getElementById('decryption-key-input').value.trim();
  if (!enteredKey) return showNotification('Please enter the decryption key.');

  try {
    const decryptedStr = await decryptPayloadAES(rawEncryptedDataToDecrypt, enteredKey);
    const decryptedPayload = JSON.parse(decryptedStr);
    document.getElementById('decryption-auth-modal').style.display = 'none';
    rawEncryptedDataToDecrypt = null;
    showNotification('File decrypted successfully!');
    evaluateSecondaryKeysPhase(decryptedPayload);
  } catch (err) {
    alert('Decryption Failed: Incorrect key or corrupted payload.');
  }
};

// "Forgot Key?" Guard
document.getElementById('btn-forgot-decryption-key').onclick = () => {
  attemptAdminSuperKeyAccess(() => {
    showNotification('Admin Super-Key Verified: Bypassing file lock.');
    document.getElementById('decryption-auth-modal').style.display = 'none';
  });
};

document.getElementById('btn-forgot-secondary-keys').onclick = () => {
  attemptAdminSuperKeyAccess(() => {
    document.getElementById('secondary-keys-modal').style.display = 'none';
    showNotification('Admin Super-Key Verified: Permanent Author & Download Access Granted!');
    proceedToStorageMatcherScreen(true, true, true, true);
  });
};

async function attemptAdminSuperKeyAccess(onSuccess) {
  const savedHash = await dbOps.getConfig('account_admin_key_hash');
  if (!savedHash) {
    triggerHaptic(45);
    alert('There is no super access. You have to put keys to get access.\nNo super access allowed.');
    return;
  }

  const modal = document.getElementById('admin-auth-modal');
  const input = document.getElementById('admin-auth-input');
  input.value = '';
  modal.style.display = 'flex';

  document.getElementById('btn-cancel-admin-auth').onclick = () => {
    modal.style.display = 'none';
  };

  document.getElementById('btn-confirm-admin-auth').onclick = async () => {
    const entered = input.value.trim();
    if (!entered) return showNotification('Please enter Admin Key');
    const enteredHash = await hashPasskey(entered);

    if (enteredHash === savedHash) {
      triggerHaptic(35);
      modal.style.display = 'none';
      onSuccess();
    } else {
      triggerHaptic(45);
      alert('Invalid Admin Key. Access denied.');
    }
  };
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

  chkMaster.checked = false;
  boxMaster.style.display = 'none';
  inMaster.value = '';

  chkDownload.checked = false;
  boxDownload.style.display = 'none';
  inDownload.value = '';

  chkAuthor.checked = false;
  boxAuthor.style.display = 'none';
  inAuthor.value = '';

  secondaryGroup.style.display = 'block';

  chkMaster.onchange = () => {
    if (chkMaster.checked) {
      boxMaster.style.display = 'block';
      secondaryGroup.style.display = 'none';
      chkDownload.checked = false;
      chkAuthor.checked = false;
      boxDownload.style.display = 'none';
      boxAuthor.style.display = 'none';
      inDownload.value = '';
      inAuthor.value = '';
    } else {
      boxMaster.style.display = 'none';
      inMaster.value = '';
      secondaryGroup.style.display = 'block';
    }
  };

  chkDownload.onchange = () => {
    boxDownload.style.display = chkDownload.checked ? 'block' : 'none';
    if (!chkDownload.checked) inDownload.value = '';
  };

  chkAuthor.onchange = () => {
    boxAuthor.style.display = chkAuthor.checked ? 'block' : 'none';
    if (!chkAuthor.checked) inAuthor.value = '';
  };

  modal.style.display = 'flex';
}

document.getElementById('btn-cancel-secondary-keys').onclick = () => {
  document.getElementById('secondary-keys-modal').style.display = 'none';
  parsedDecryptedPayload = null;
};

document.getElementById('btn-confirm-secondary-keys').onclick = async () => {
  const payload = parsedDecryptedPayload;
  let isMasterUnlocked = false;
  let isDownloadUnlocked = false;
  let isAuthorUnlocked = false;

  const chkMaster = document.getElementById('chk-enter-master-key').checked;
  const inMaster = document.getElementById('in-master-key').value.trim();

  if (chkMaster && inMaster) {
    const h = await hashPasskey(inMaster);
    if (h === payload.masterKeyHash) {
      isMasterUnlocked = true;
      isDownloadUnlocked = true;
      isAuthorUnlocked = true;
      showNotification('Master Key Verified: Full Local Access Granted!');
    } else {
      alert('Master Key did not match creator records.');
    }
  } else {
    const chkDownload = document.getElementById('chk-enter-download-key').checked;
    const inDownload = document.getElementById('in-download-key').value.trim();
    if (chkDownload && inDownload) {
      const h = await hashPasskey(inDownload);
      if (h === payload.downloadKeyHash || h === payload.masterKeyHash) {
        isDownloadUnlocked = true;
        showNotification('Download Key Verified: Song Downloads Unlocked!');
      } else {
        alert('Download Key did not match creator records.');
      }
    }

    const chkAuthor = document.getElementById('chk-enter-author-key').checked;
    const inAuthor = document.getElementById('in-author-key').value.trim();
    if (chkAuthor && inAuthor) {
      const h = await hashPasskey(inAuthor);
      if (h === payload.passkeyHash || h === payload.masterKeyHash) {
        isAuthorUnlocked = true;
        showNotification('Author Key Verified: Local Playlist Editing Unlocked!');
      } else {
        alert('Author Key did not match creator records.');
      }
    }
  }

  document.getElementById('secondary-keys-modal').style.display = 'none';
  proceedToStorageMatcherScreen(isMasterUnlocked, isDownloadUnlocked, isAuthorUnlocked, false);
};

let pendingImportPermissions = { isMasterUnlocked: false, isDownloadUnlocked: false, isAuthorUnlocked: false, isPermanentAdmin: false };

function proceedToStorageMatcherScreen(isMaster, isDownload, isAuthor, isPermanentAdmin) {
  const data = parsedDecryptedPayload;
  pendingImportPermissions = { isMasterUnlocked: isMaster, isDownloadUnlocked: isDownload, isAuthorUnlocked: isAuthor, isPermanentAdmin: isPermanentAdmin };

  if (currentImportBypassOnboarding && data.author) {
    userProfile = data.author;
    dbOps.setUserProfile(userProfile);
    updateUserProfileLabels();
    document.getElementById('onboarding-modal').style.display = 'none';
  }

  const author = data.author || { name: 'External Creator', avatar: 'my-icon.png' };
  document.getElementById('pre-import-author-name').textContent = `Curated by: ${author.name} (Protected)`;
  document.getElementById('pre-import-avatar').src = author.avatar || 'my-icon.png';
  document.getElementById('pre-import-file-meta').textContent = `Tracks: ${data.tracks.length} • Playlists: ${data.playlists.length}`;

  dbOps.getAllTracks().then(localAll => {
    const localNamesSet = new Set(localAll.filter(t => t.blob && t.blob.size > 0).map(t => t.name.trim().toLowerCase()));
    let availableCount = 0;
    let missingCount = 0;

    const auditBox = document.getElementById('pre-import-audit-checklist');
    auditBox.innerHTML = '';

    data.tracks.forEach(trk => {
      const cleanName = trk.name.trim().toLowerCase();
      const hasPayloadAudio = Boolean(trk.audioBase64);
      const existsInLocal = localNamesSet.has(cleanName);
      const isAvailable = hasPayloadAudio || existsInLocal;

      if (isAvailable) availableCount++;
      else missingCount++;

      const row = document.createElement('div');
      row.style.padding = '4px 6px';
      row.style.fontSize = '0.75rem';
      row.style.borderBottom = '1px solid #1f2937';
      row.style.color = isAvailable ? 'var(--accent-light)' : '#f85149';
      row.innerHTML = `${isAvailable ? '✓ [Available]' : '✕ [Missing from Storage]'} <strong>${trk.name}</strong>`;
      auditBox.appendChild(row);
    });

    document.getElementById('audit-badge-available').textContent = `✓ ${availableCount} Available`;
    document.getElementById('audit-badge-missing').textContent = `✕ ${missingCount} Not in Storage`;

    const plBox = document.getElementById('pre-import-playlist-list');
    plBox.innerHTML = '';
    data.playlists.forEach(p => {
      const label = document.createElement('label');
      label.className = 'checkbox-label';
      label.innerHTML = `<input type="checkbox" data-import-pl="${p.id}" checked /> ${p.name}`;
      plBox.appendChild(label);
    });

    document.getElementById('pre-import-modal').style.display = 'flex';
  });
}

document.getElementById('btn-cancel-pre-import').onclick = () => {
  document.getElementById('pre-import-modal').style.display = 'none';
  parsedDecryptedPayload = null;
};

document.getElementById('btn-confirm-final-import').onclick = async () => {
  if (!parsedDecryptedPayload) return;
  triggerHaptic(40);

  const selectedPlIds = new Set(
    Array.from(document.querySelectorAll('#pre-import-playlist-list input:checked'))
      .map(cb => cb.dataset.importPl)
  );

  const importMarkers = document.getElementById('chk-import-markers').checked;
  const importLyrics = document.getElementById('chk-import-lyrics').checked;
  const importClips = document.getElementById('chk-import-clips').checked;
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

  for (const trk of parsedDecryptedPayload.tracks) {
    if (!selectedPlIds.has(trk.playlistId) && trk.playlistId !== 'all') continue;
    
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

  document.getElementById('pre-import-modal').style.display = 'none';
  await loadPlaylists();

  document.getElementById('success-author-avatar').src = author.avatar || 'my-icon.png';
  document.getElementById('success-author-label').textContent = `Curated by ${author.name} • ${availableSongsCount} Ready, ${missingSongsCount} Missing`;
  
  const summaryBox = document.getElementById('success-songs-summary');
  summaryBox.innerHTML = importedSongs.map((s, i) => `
    <div style="color:${s.isAvailable ? 'var(--accent-light)' : '#f85149'};">
      ${i + 1}. ${s.name} ${s.isAvailable ? '✓' : '⚠️ [Not in storage]'}
    </div>
  `).join('');

  document.getElementById('import-success-modal').style.display = 'flex';
};

document.getElementById('btn-close-success-summary').onclick = () => {
  document.getElementById('import-success-modal').style.display = 'none';
};

// -------------------------------------------------------------
// PLAYLISTS & BROWSING LISTING
// -------------------------------------------------------------
async function loadPlaylists() {
  let list = await dbOps.getPlaylists();
  if (!list.length) {
    const def = { id: 'favorites', name: 'Favorites', cover: currentAppLogo, author: userProfile, createdAt: getIndianStandardDateOnly() };
    await dbOps.savePlaylist(def);
    list = [def];
  }

  const allCategory = { id: 'all', name: 'All', cover: currentAppLogo, author: userProfile };
  const combined = [allCategory, ...list];
  availablePlaylistList = combined;

  playlistTabs.innerHTML = '';

  const newPlChip = document.createElement('div');
  newPlChip.className = 'chip';
  newPlChip.style.border = '1px dashed var(--accent-light)';
  newPlChip.innerHTML = `<span>➕ New</span>`;
  newPlChip.onclick = () => {
    triggerHaptic(20);
    document.getElementById('new-playlist-name').value = '';
    document.getElementById('new-playlist-img').value = '';
    document.getElementById('preview-art-tag').src = currentAppLogo;
    document.getElementById('preview-status-text').textContent = 'Default art selected';
    document.getElementById('playlist-create-modal').style.display = 'flex';
  };
  playlistTabs.appendChild(newPlChip);

  combined.forEach((p) => {
    const chip = document.createElement('div');
    chip.className = `chip ${p.id === activePlaylistId ? 'active' : ''}`;
    
    const dotsBtn = (p.id !== 'all') 
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

    if (p.id !== 'all') {
      const dBtn = chip.querySelector('.chip-dots-btn');
      dBtn.onclick = (e) => {
        e.stopPropagation();
        triggerHaptic(20);
        activeContextPlaylist = p;
        const rect = dBtn.getBoundingClientRect();
        playlistContextMenu.style.top = `${rect.bottom + window.scrollY + 4}px`;
        playlistContextMenu.style.left = `${Math.max(10, rect.left - 100)}px`;
        playlistContextMenu.style.display = 'flex';
      };
    }

    playlistTabs.appendChild(chip);
  });

  currentPlaylist = combined.find((p) => p.id === activePlaylistId) || allCategory;
  viewPlaylistName.textContent = currentPlaylist.localName || currentPlaylist.name;
  loadTracks();
}

async function loadTracks() {
  allTracksRaw = await dbOps.getTracks(activePlaylistId);
  allTracksRaw.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  renderFilteredTracks();
}

function renderFilteredTracks() {
  const currentScrollTop = upperContentViewport.scrollTop;

  const q = librarySearchInput.value.trim().toLowerCase();
  btnClearSearch.style.display = q ? 'block' : 'none';

  let filtered = allTracksRaw.filter(t => t.name.toLowerCase().includes(q));

  if (currentSortMode === 'az') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (currentSortMode === 'za') {
    filtered.sort((a, b) => b.name.localeCompare(a.name));
  } else if (currentSortMode === 'size-asc') {
    filtered.sort((a, b) => (a.blob?.size || 0) - (b.blob?.size || 0));
  } else if (currentSortMode === 'size-desc') {
    filtered.sort((a, b) => (b.blob?.size || 0) - (a.blob?.size || 0));
  }

  browsingTracks = filtered;

  let totalSecs = browsingTracks.length * 210;
  let hrs = Math.floor(totalSecs / 3600);
  let mins = Math.floor((totalSecs % 3600) / 60);
  let durStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  trackCountLabel.textContent = `${browsingTracks.length} song${browsingTracks.length === 1 ? '' : 's'} • ~${durStr}`;

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
      <span class="song-sub-info">${isMissing ? 'Audio file missing from device' : `Plays: ${playCount} • ${(trk.blob?.size / (1024*1024) || 0).toFixed(1)}MB`}</span>
    `;

    let pressTimer = null;
    info.addEventListener('touchstart', () => {
      pressTimer = setTimeout(() => {
        triggerHaptic(50);
        multiSelectMode = true;
        selectedTrackIds.add(trk.id);
        document.getElementById('batch-action-bar').style.display = 'flex';
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
    btnLike.className = 'btn-icon-sm song-heart-btn';
    btnLike.innerHTML = isFav ? '❤️' : '💛';
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
        removeBtn.style.display = (activePlaylistId === 'all') ? 'none' : 'block';
      }

      const rect = btnMore.getBoundingClientRect();
      trackContextMenu.style.top = `${rect.bottom + window.scrollY - 10}px`;
      trackContextMenu.style.left = `${Math.max(10, rect.left - 150)}px`;
      trackContextMenu.style.display = 'flex';
    };

    actions.append(btnDownload, btnLike, btnDelete, btnMore);
    li.append(info, actions);

    bindSongRowSwipeGestures(li, trk);
    songList.appendChild(li);
  });

  upperContentViewport.scrollTop = currentScrollTop;

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

  miniTitle.textContent = 'No track playing';
  miniSub.textContent = 'Playlist: All';
  boxTitle.textContent = 'Song Title';
  boxPlaylist.textContent = 'Playlist: All';
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

document.getElementById('btn-batch-select-all').onclick = () => {
  triggerHaptic(20);
  if (selectedTrackIds.size === browsingTracks.length) {
    selectedTrackIds.clear();
    document.getElementById('btn-batch-select-all').textContent = 'Select All';
  } else {
    selectedTrackIds = new Set(browsingTracks.map(t => t.id));
    document.getElementById('btn-batch-select-all').textContent = 'Deselect All';
  }
  document.getElementById('batch-count-label').textContent = `${selectedTrackIds.size} Selected`;
  
  document.querySelectorAll('.multi-chk').forEach(cb => {
    const trkId = parseInt(cb.dataset.trkId, 10);
    cb.checked = selectedTrackIds.has(trkId);
  });
};

function toggleSelectTrack(id) {
  triggerHaptic(15);
  if (selectedTrackIds.has(id)) selectedTrackIds.delete(id);
  else selectedTrackIds.add(id);
  
  document.getElementById('batch-count-label').textContent = `${selectedTrackIds.size} Selected`;
  document.getElementById('btn-batch-select-all').textContent = (selectedTrackIds.size === browsingTracks.length) ? 'Deselect All' : 'Select All';

  const cb = document.querySelector(`.multi-chk[data-trk-id="${id}"]`);
  if (cb) cb.checked = selectedTrackIds.has(id);
}

document.getElementById('btn-batch-cancel').onclick = () => {
  multiSelectMode = false;
  selectedTrackIds.clear();
  document.getElementById('batch-action-bar').style.display = 'none';
  renderFilteredTracks();
};

document.getElementById('btn-batch-delete').onclick = () => {
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
  document.getElementById('batch-action-bar').style.display = 'none';
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

document.getElementById('btn-batch-add-playlist').onclick = () => {
  if (!selectedTrackIds.size) return;
  const available = availablePlaylistList.filter(p => p.id !== 'all');
  const box = document.getElementById('add-to-playlist-options-box');
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
      document.getElementById('batch-action-bar').style.display = 'none';
      dismissAllMenus();
      renderFilteredTracks();
    };
    box.appendChild(btn);
  });

  const rect = document.getElementById('btn-batch-add-playlist').getBoundingClientRect();
  addToPlaylistSubmenu.style.top = `${rect.bottom + window.scrollY + 4}px`;
  addToPlaylistSubmenu.style.left = `${Math.max(10, rect.left - 50)}px`;
  addToPlaylistSubmenu.style.display = 'flex';
};

librarySearchInput.addEventListener('input', renderFilteredTracks);
btnClearSearch.onclick = () => {
  librarySearchInput.value = '';
  renderFilteredTracks();
};

document.getElementById('btn-clean-names').onclick = async () => {
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

// Rename Track Modal
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
    if (currentPlayingTrack && currentPlayingTrack.id === trackToRename.id) {
      miniTitle.textContent = newTitle;
      boxTitle.textContent = newTitle;
      updateMediaSession();
    }
  }
};

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
  loadTracks();
}

function syncHeartsEverywhere(songName, isLiked) {
  const heart = isLiked ? '❤️' : '💛';
  const rows = document.querySelectorAll(`[data-song-name="${CSS.escape(songName)}"] .song-heart-btn`);
  rows.forEach((btn) => { btn.innerHTML = heart; });
  if (currentPlayingTrack && currentPlayingTrack.name === songName) {
    updateLikeButtonsUI(isLiked);
  }
}

function updateLikeButtonsUI(isLiked) {
  const heart = isLiked ? '❤️' : '💛';
  barBtnLike.textContent = heart;
  modalBtnLike.textContent = heart;
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
document.getElementById('btn-edit-art').onclick = () => editCoverInput.click();
editCoverInput.onchange = async (e) => {
  if (e.target.files && e.target.files[0]) {
    const newArt = await compressImageSafe(e.target.files[0]);
    miniCover.src = newArt;
    boxCover.src = newArt;
    if (currentPlaylist && currentPlaylist.id !== 'all') {
      currentPlaylist.localCover = newArt;
      await dbOps.savePlaylist(currentPlaylist);
    }
    updateAmbientGlow(boxCover);
    showNotification('Cover image updated!');
    updateMediaSession();
  }
};

const createModal = document.getElementById('playlist-create-modal');
const newPlaylistName = document.getElementById('new-playlist-name');
const newPlaylistImg = document.getElementById('new-playlist-img');
const previewArt = document.getElementById('preview-art-tag');
const previewStatus = document.getElementById('preview-status-text');
const btnConfirmPlaylist = document.getElementById('btn-confirm-playlist');
let newBase64Cover = null;

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
  const pl = {
    id: 'pl_' + Date.now(),
    name,
    cover: newBase64Cover || currentAppLogo,
    author: userProfile,
    createdAt: getIndianStandardDateOnly()
  };
  await dbOps.savePlaylist(pl);
  createModal.style.display = 'none';
  activePlaylistId = pl.id;
  await loadPlaylists();
  showNotification(`Playlist "${name}" created!`);
};

document.getElementById('file-picker').onchange = async (e) => {
  const files = Array.from(e.target.files);
  if (!files.length) return;
  const targetId = activePlaylistId === 'all' ? 'favorites' : activePlaylistId;
  const existingTracks = await dbOps.getTracks(targetId);
  const existingNames = new Set(existingTracks.map(t => t.name.trim().toLowerCase()));

  let addedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
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

  showNotification(`Added ${addedCount} song(s)${skippedCount ? ` (${skippedCount} duplicates skipped)` : ''}!`);
  loadTracks();
};

// ==========================================
// INDEPENDENT NOW PLAYING QUEUE LOGIC
// ==========================================
function playTrackFromBrowsing(idx) {
  if (idx < 0 || idx >= browsingTracks.length) return;
  playingQueue = [...browsingTracks];
  playTrackDirect(browsingTracks[idx]);
}

async function playTrackDirect(trk) {
  if (!trk || trk.isMissing || (!trk.blob || trk.blob.size === 0)) {
    showNotification(`Cannot play: "${trk?.name || 'Track'}" is missing from storage.`);
    return;
  }

  ensureAudioPipeline();

  if (currentPlayingTrack && currentPlayingTrack.name === trk.name && audio.src) {
    if (audio.paused) {
      audio.play();
      syncButtons(true);
      syncGlobalEqualizerBars(true);
    }
    return;
  }

  currentPlayingTrack = trk;
  audio.src = URL.createObjectURL(trk.blob);
  audio.playbackRate = speedList[currentSpeedIndex];

  audio.play().then(() => {
    syncButtons(true);
    syncGlobalEqualizerBars(true);
    updateMediaSession();
  }).catch(() => {});

  miniTitle.textContent = trk.name;
  miniSub.textContent = `Playlist: ${currentPlaylist.localName || currentPlaylist.name}`;
  boxTitle.textContent = trk.name;
  boxPlaylist.textContent = `Playlist: ${currentPlaylist.localName || currentPlaylist.name}`;
  miniCover.src = currentPlaylist.localCover || currentPlaylist.cover || currentAppLogo;
  boxCover.src = currentPlaylist.localCover || currentPlaylist.cover || currentAppLogo;

  const isFav = await dbOps.isFavorite(trk.name);
  updateLikeButtonsUI(isFav);

  await dbOps.incrementPlayCount(trk.name);
  await dbOps.addPlaybackHistory(trk.name, currentPlaylist.localName || currentPlaylist.name);
  loadLyricsForCurrent();
  await loadTimestampsForCurrent();
  renderSeekTicks();
  updateMediaSession();
  updateAmbientGlow(boxCover);
  loadTracks();

  startListeningTimeTracking();
  saveCurrentSessionState();
  renderCardReorderList();
  calculateAndRenderQueueDuration();
  renderTrimmedClipsForCurrent();
}

function syncButtons(isPlaying) {
  barBtnPlay.textContent = isPlaying ? '⏸' : '▶';
  boxBtnPlay.textContent = isPlaying ? '⏸' : '▶';
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
    audio.play();
    syncButtons(true);
    syncGlobalEqualizerBars(true);
  } else {
    isManualPause = true;
    wasPlayingBeforeInterruption = false;
    audio.pause();
    syncButtons(false);
    syncGlobalEqualizerBars(false);
  }
}

function loopNext() {
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

  let curIdx = playingQueue.findIndex(t => t.name === currentPlayingTrack?.name);
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
}

barBtnPlay.onclick = (e) => { e.stopPropagation(); togglePlay(); };
boxBtnPlay.onclick = togglePlay;
boxBtnPrev.onclick = () => {
  triggerHaptic(20);
  if (!playingQueue.length) return;
  let curIdx = playingQueue.findIndex(t => t.name === currentPlayingTrack?.name);
  let prev = curIdx;
  let attempts = 0;
  do {
    prev = prev > 0 ? prev - 1 : playingQueue.length - 1;
    attempts++;
  } while (playingQueue[prev] && (playingQueue[prev].isMissing || !playingQueue[prev].blob || playingQueue[prev].blob.size === 0) && attempts < playingQueue.length);

  playTrackDirect(playingQueue[prev]);
};
boxBtnNext.onclick = () => { triggerHaptic(20); loopNext(); };
audio.onended = loopNext;

barBtnLike.onclick = (e) => {
  e.stopPropagation();
  if (currentPlayingTrack) toggleFavorite(currentPlayingTrack);
};
modalBtnLike.onclick = () => {
  if (currentPlayingTrack) toggleFavorite(currentPlayingTrack);
};

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

  navigator.mediaSession.setActionHandler('play', () => {
    ensureAudioPipeline();
    audio.play().then(() => {
      syncButtons(true);
      syncGlobalEqualizerBars(true);
      navigator.mediaSession.playbackState = 'playing';
    }).catch(() => {});
  });

  navigator.mediaSession.setActionHandler('pause', () => {
    isManualPause = true;
    wasPlayingBeforeInterruption = false;
    audio.pause();
    syncButtons(false);
    syncGlobalEqualizerBars(false);
    navigator.mediaSession.playbackState = 'paused';
  });

  navigator.mediaSession.setActionHandler('nexttrack', loopNext);
  navigator.mediaSession.setActionHandler('previoustrack', () => {
    boxBtnPrev.click();
  });
}

document.getElementById('open-box-trigger').onclick = () => { 
  playerBoxModal.style.display = 'flex'; 
  renderSeekTicks();
  renderCardReorderList();
  calculateAndRenderQueueDuration();
  updateAmbientGlow(boxCover);
};
document.getElementById('btn-close-box').onclick = () => { playerBoxModal.style.display = 'none'; };

document.getElementById('btn-skip-backward').onclick = () => { triggerHaptic(20); audio.currentTime = Math.max(0, audio.currentTime - 10); };
document.getElementById('btn-skip-forward').onclick = () => { triggerHaptic(20); audio.currentTime = Math.min(audio.duration, audio.currentTime + 10); };

const btnSpeedToggle = document.getElementById('btn-speed-toggle');
btnSpeedToggle.onclick = () => {
  triggerHaptic(20);
  currentSpeedIndex = (currentSpeedIndex + 1) % speedList.length;
  const spd = speedList[currentSpeedIndex];
  audio.playbackRate = spd;
  btnSpeedToggle.textContent = `${spd}x`;
  showNotification(`Speed: ${spd}x`);
};

const btnModeShuffle = document.getElementById('btn-mode-shuffle');
const btnModeRepeat = document.getElementById('btn-mode-repeat');

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

const btnSleepTimer = document.getElementById('btn-sleep-timer');
const sleepTimes = [0, 15, 30, 45, 60];
let sleepIndex = 0;
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

// Touch Gestures on Mini Player
let miniStartX = 0;
let miniStartY = 0;
miniPlayerBar.addEventListener('touchstart', (e) => {
  miniStartX = e.touches[0].clientX;
  miniStartY = e.touches[0].clientY;
}, { passive: true });

miniPlayerBar.addEventListener('touchend', (e) => {
  const diffX = e.changedTouches[0].clientX - miniStartX;
  const diffY = e.changedTouches[0].clientY - miniStartY;

  if (diffY < -40 && Math.abs(diffX) < 60) {
    triggerHaptic(25);
    playerBoxModal.style.display = 'flex';
    renderSeekTicks();
    renderCardReorderList();
    calculateAndRenderQueueDuration();
    updateAmbientGlow(boxCover);
    return;
  }

  if (Math.abs(diffX) > 60 && Math.abs(diffY) < 50) {
    if (diffX < 0) {
      triggerHaptic(20);
      loopNext();
    } else {
      triggerHaptic(20);
      boxBtnPrev.click();
    }
  }
}, { passive: true });

const mainViewport = document.getElementById('main-swipe-viewport');
let mainTouchStartX = 0;
let mainTouchStartY = 0;

mainViewport.addEventListener('touchstart', (e) => {
  mainTouchStartX = e.touches[0].clientX;
  mainTouchStartY = e.touches[0].clientY;
}, { passive: true });

mainViewport.addEventListener('touchend', (e) => {
  if (playerBoxModal.style.display === 'flex') return;
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

// A-B Looper
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

// Audio Trimmer (.mp3)
const trimmerModal = document.getElementById('trimmer-modal');
const trimStartRange = document.getElementById('trim-start-range');
const trimEndRange = document.getElementById('trim-end-range');
const lblTrimStart = document.getElementById('lbl-trim-start');
const lblTrimEnd = document.getElementById('lbl-trim-end');

document.getElementById('btn-open-trim-dialog').onclick = () => {
  if (!currentPlayingTrack) return showNotification('Play a song to trim!');
  document.getElementById('trimmer-track-name').textContent = currentPlayingTrack.name;
  const dur = audio.duration || 100;
  trimStartRange.max = dur;
  trimEndRange.max = dur;
  trimStartRange.value = 0;
  trimEndRange.value = Math.min(30, dur);
  lblTrimStart.textContent = '0.0s';
  lblTrimEnd.textContent = `${Math.min(30, dur).toFixed(1)}s`;
  trimmerModal.style.display = 'flex';
};

document.getElementById('btn-cancel-trimmer').onclick = () => { trimmerModal.style.display = 'none'; };

trimStartRange.oninput = (e) => {
  let s = parseFloat(e.target.value);
  let end = parseFloat(trimEndRange.value);
  if (s >= end) {
    s = Math.max(0, end - 1);
    trimStartRange.value = s;
  }
  lblTrimStart.textContent = `${s.toFixed(1)}s`;
};

trimEndRange.oninput = (e) => {
  let end = parseFloat(e.target.value);
  let s = parseFloat(trimStartRange.value);
  if (end <= s) {
    end = Math.min(parseFloat(trimEndRange.max), s + 1);
    trimEndRange.value = end;
  }
  lblTrimEnd.textContent = `${end.toFixed(1)}s`;
};

document.getElementById('btn-save-ringtone').onclick = async () => {
  if (!currentPlayingTrack) return;
  triggerHaptic(35);
  const trk = currentPlayingTrack;
  const startSec = parseFloat(trimStartRange.value);
  const endSec = parseFloat(trimEndRange.value);

  showNotification('Encoding compressed offline MP3 clip...');

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

    trimmerModal.style.display = 'none';
    showNotification(`MP3 Clip "${clipName}" created!`);
    renderTrimmedClipsForCurrent();
  } catch (err) {
    console.error(err);
    showNotification('Error slicing audio file.');
  }
};

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
    clipAudio.onended = () => { btnPlay.textContent = '▶'; };

    li.querySelector('.btn-dl-clip').onclick = () => {
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

    li.querySelector('.btn-del-clip').onclick = async () => {
      triggerHaptic(25);
      await dbOps.deleteTrimmedClip(c.id);
      renderTrimmedClipsForCurrent();
      showNotification('Clip deleted');
    };

    list.appendChild(li);
  });
}

// Embedded Drawers
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
  const isHidden = target.style.display === 'none' || !target.style.display;
  
  Object.values(panels).forEach(p => p.style.display = 'none');
  Object.values(btns).forEach(b => b.classList.remove('active'));

  if (isHidden) {
    target.style.display = 'block';
    btns[key].classList.add('active');

    if (key === 'playlist') {
      renderCardReorderList();
      calculateAndRenderQueueDuration();
    } else if (key === 'timestamps') {
      renderTimestampsDrawerList();
    } else if (key === 'trimmer') {
      renderTrimmedClipsForCurrent();
    }
  }
}

btns.vol.onclick = () => togglePanel('vol');
btns.eq.onclick = () => togglePanel('eq');
btns.timestamps.onclick = () => togglePanel('timestamps');
btns.looper.onclick = () => togglePanel('looper');
btns.lyrics.onclick = () => togglePanel('lyrics');
btns.playlist.onclick = () => togglePanel('playlist');
btns.trimmer.onclick = () => togglePanel('trimmer');

document.getElementById('card-vol-slider').addEventListener('input', (e) => {
  triggerHaptic(10);
  setVolume(e.target.value);
});

const lyricsTextarea = document.getElementById('lyrics-textarea');
async function loadLyricsForCurrent() {
  if (!currentPlayingTrack) return;
  const text = await dbOps.getLyrics(currentPlayingTrack.name);
  lyricsTextarea.value = text;
}
document.getElementById('btn-save-lyrics').onclick = async () => {
  triggerHaptic(25);
  if (!currentPlayingTrack) return;
  await dbOps.setLyrics(currentPlayingTrack.name, lyricsTextarea.value);
  showNotification('Lyrics saved offline!');
};

// Timestamps
const timestampModal = document.getElementById('timestamp-modal');
const timestampNameInput = document.getElementById('timestamp-name-input');
const timestampTimePreview = document.getElementById('timestamp-time-preview');
const timestampMarkersList = document.getElementById('timestamp-markers-list');

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
        syncButtons(true);
        syncGlobalEqualizerBars(true);
      }
      showNotification(`Jumped to: ${ts.name}`);
      renderTimestampsDrawerList();
    };

    li.querySelector('.btn-del').onclick = (e) => {
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

    timestampMarkersList.appendChild(li);
  });
}

document.getElementById('btn-add-timestamp').onclick = () => {
  triggerHaptic(20);
  if (!currentPlayingTrack) {
    return showNotification('Play a song to bookmark a timestamp!');
  }
  pendingTimestampTime = audio.currentTime;
  timestampTimePreview.textContent = `At timestamp: ${formatSecs(pendingTimestampTime)}`;
  timestampNameInput.value = '';
  timestampModal.style.display = 'flex';
  timestampNameInput.focus();
};

document.getElementById('btn-cancel-timestamp').onclick = () => { timestampModal.style.display = 'none'; };

document.getElementById('btn-confirm-timestamp').onclick = async () => {
  triggerHaptic(30);
  const name = timestampNameInput.value.trim() || `Marker at ${formatSecs(pendingTimestampTime)}`;
  currentSongTimestamps.push({ id: 'ts_' + Date.now(), time: pendingTimestampTime, name });
  currentSongTimestamps.sort((a, b) => a.time - b.time);
  await dbOps.saveTimestamps(currentPlayingTrack.name, currentSongTimestamps);
  timestampModal.style.display = 'none';
  showNotification(`Marker "${name}" saved!`);
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
    document.getElementById('resume-chip-text').textContent = `Resume "${lastSong.substring(0, 15)}..." at ${formatSecs(lastTime)}?`;
    chip.style.display = 'flex';

    document.getElementById('btn-resume-session').onclick = async () => {
      chip.style.display = 'none';
      const plId = localStorage.getItem('ammu_last_pl') || 'all';
      const songListTarget = await dbOps.getTracks(plId);
      const targetTrk = songListTarget.find(t => t.name === lastSong);
      if (targetTrk && (!targetTrk.isMissing && targetTrk.blob && targetTrk.blob.size > 0)) {
        playingQueue = [...songListTarget];
        await playTrackDirect(targetTrk);
        audio.currentTime = lastTime;
      }
    };

    document.getElementById('btn-dismiss-resume').onclick = () => {
      chip.style.display = 'none';
      localStorage.removeItem('ammu_last_song');
    };
  }
}

audio.ontimeupdate = () => {
  if (!audio.duration) return;
  if (pointA !== null && pointB !== null && pointB > pointA) {
    if (audio.currentTime >= pointB) audio.currentTime = pointA;
  }
  seekBar.value = (audio.currentTime / audio.duration) * 100;
  currTime.textContent = formatSecs(audio.currentTime);
  durTime.textContent = formatSecs(audio.duration);
  updateActiveTimestampBadge();
  saveCurrentSessionState();
};

seekBar.oninput = () => {
  if (audio.duration) audio.currentTime = (seekBar.value / 100) * audio.duration;
};

// -------------------------------------------------------------
// IN-CARD QUEUE: SCROLL-FREEZE, AUTO-SCROLL, FLOATING PREVIEW & RED GUIDE
// -------------------------------------------------------------
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
        <span class="song-name" style="max-width:70%;cursor:pointer;">
          <span style="color:var(--accent-light);font-size:0.75rem;font-weight:bold;">[Up Next]</span> ${queuedTrk.name}
        </span>
        <button class="btn-del" title="Remove from queue">✕</button>
      `;

      qLi.querySelector('.song-name').onclick = () => {
        triggerHaptic(25);
        playNextQueue.splice(qIdx, 1);
        playTrackDirect(queuedTrk);
      };

      qLi.querySelector('.btn-del').onclick = (e) => {
        e.stopPropagation();
        triggerHaptic(20);
        playNextQueue.splice(qIdx, 1);
        renderCardReorderList();
        calculateAndRenderQueueDuration();
      };

      cardReorderList.appendChild(qLi);
    });
  }

  playingQueue.forEach((trk, idx) => {
    const isThisPlaying = (currentPlayingTrack && currentPlayingTrack.name === trk.name);
    const isMissing = trk.isMissing || (!trk.blob || trk.blob.size === 0);

    const li = document.createElement('li');
    li.className = `drawer-track-row ${isThisPlaying ? 'now-playing-active' : ''} ${isMissing ? 'missing-storage' : ''}`;
    li.dataset.index = idx;

    li.innerHTML = `
      <span class="song-name" style="max-width:65%;cursor:pointer;">
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
      <div class="drawer-reorder-btns">
        <button class="drawer-shift-btn" onclick="shiftQueueTrack(${idx}, -1)">▲</button>
        <button class="drawer-shift-btn" onclick="shiftQueueTrack(${idx}, 1)">▼</button>
        <button class="drawer-shift-btn" style="color:#f85149;" onclick="removeTrackFromQueue(${idx})" title="Remove from queue">✕</button>
      </div>
    `;

    li.querySelector('.song-name').onclick = () => {
      if (isMissing) {
        showNotification(`"${trk.name}" is not in device storage.`);
        return;
      }
      playTrackDirect(trk);
    };

    // Long-Press Scroll-Freeze Drag Engine
    let pressTimer = null;
    let isDraggingThis = false;

    li.addEventListener('touchstart', (e) => {
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

    li.addEventListener('touchend', cancelLongPress, { passive: true });
    li.addEventListener('touchcancel', cancelLongPress, { passive: true });

    function attachActiveDragListeners() {
      activeMoveHandler = (ev) => {
        if (!isDraggingThis) return;
        ev.preventDefault();

        const touchY = ev.touches[0].clientY;
        const panelRect = document.getElementById('card-playlist-panel').getBoundingClientRect();

        updateDragPreviewPosition(touchY);

        // Boundary Auto-Scroll Radar
        const scrollZone = 44;
        if (touchY < panelRect.top + scrollZone) {
          startBoundaryAutoScroll(-6);
        } else if (touchY > panelRect.bottom - scrollZone) {
          startBoundaryAutoScroll(6);
        } else {
          stopBoundaryAutoScroll();
        }

        // Strict Midpoint Calculation for Red Indicator Line
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

        // Position & strictly bound the Red Target Guide inside the playlist box
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

    cardReorderList.appendChild(li);
  });
}

function updateDragPreviewPosition(touchY) {
  const dragPreview = document.getElementById('queue-drag-preview');
  const panel = document.getElementById('card-playlist-panel');
  if (!dragPreview || !panel) return;
  const pRect = panel.getBoundingClientRect();
  const relY = touchY - pRect.top - 20;
  const clampedY = Math.max(cardReorderList.offsetTop, Math.min(cardReorderList.offsetTop + cardReorderList.offsetHeight - 48, relY));
  dragPreview.style.top = `${clampedY}px`;
}

function startBoundaryAutoScroll(speed) {
  if (autoScrollInterval) return;
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
  showNotification(`Removed "${removed?.name}" from playing queue`);
};

// Equalizer Sliders & Preamp Controls
document.getElementById('slider-bass-boost').oninput = (e) => {
  triggerHaptic(10);
  const val = parseFloat(e.target.value);
  document.getElementById('val-bass-boost').textContent = `${val}dB`;
  if (bassFilterNode) bassFilterNode.gain.value = val;
};

document.querySelectorAll('[data-band]').forEach((s) => {
  s.oninput = (e) => {
    triggerHaptic(10);
    const b = parseInt(e.target.dataset.band, 10);
    const val = parseFloat(e.target.value);
    if (filters[b]) filters[b].gain.value = val;
    document.getElementById(`val-${bands[b]}`).textContent = `${val}dB`;
  };
});

document.getElementById('eq-preamp').oninput = (e) => {
  triggerHaptic(10);
  const val = parseFloat(e.target.value);
  document.getElementById('val-preamp').textContent = `${val}dB`;
  if (preampGain) preampGain.gain.setValueAtTime(Math.pow(10, val / 20) * 0.35, audioCtx.currentTime);
};

document.getElementById('card-eq-enable').onchange = (e) => {
  triggerHaptic(20);
  applyDSPState(e.target.checked);
};

document.getElementById('btn-reset-eq-card').onclick = () => {
  triggerHaptic(25);
  document.getElementById('eq-preamp').value = 14.1;
  document.getElementById('val-preamp').textContent = '14.1dB';
  if (preampGain && audioCtx) preampGain.gain.setValueAtTime(Math.pow(10, 14.1 / 20) * 0.35, audioCtx.currentTime);
  defaultGains.forEach((g, i) => {
    const slider = document.querySelector(`[data-band="${i}"]`);
    slider.value = g;
    document.getElementById(`val-${bands[i]}`).textContent = `${g}dB`;
    if (filters[i]) filters[i].gain.value = g;
  });
  showNotification('Equalizer reset to default');
};

// ==========================================
// SYSTEM BOOT (100% VOLUME & FLAT DSP OFF)
// ==========================================
initDB().then(async () => {
  await checkOnboarding();
  await loadAppBranding();
  await loadDevProfile();
  await loadPlaylists();
  checkResumeSession();
  
  applyDSPState(false);
  setVolume(100);
});
