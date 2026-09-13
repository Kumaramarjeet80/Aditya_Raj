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

// Haptic feedback helper
function triggerHaptic(ms = 35) {
  if ('vibrate' in navigator) {
    try { navigator.vibrate(ms); } catch (_) {}
  }
}

// Android Back Gesture & Navigation Trap
window.history.pushState({ page: 'home' }, '');
window.addEventListener('popstate', () => {
  const modals = [
    'player-box-modal',
    'playlist-create-modal',
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
    'user-profile-modal'
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

// ==========================================
// 5-SECOND GRACEFUL UNDO ENGINE & TOASTS
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
  if (activeUndoAction) {
    activeUndoAction.commit();
  }

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

// Fullscreen Floating Heart Animation Overlay
function triggerHeartBurst(isFavorited) {
  const overlay = document.getElementById('heart-burst-overlay');
  overlay.innerHTML = '';
  overlay.style.display = 'block';

  const heartChar = isFavorited ? '❤️' : '💛';
  const count = 18;

  for (let i = 0; i < count; i++) {
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

// -------------------------------------------------------------
// INDEXEDDB ENGINE
// -------------------------------------------------------------
const DB_NAME = 'AmmuMusicDB_v150';
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
      tx.objectStore('audit_log').add({ ...entry, date: new Date().toLocaleString() });
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
        dateStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
    const todayKey = new Date().toISOString().split('T')[0];
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
  }
};

// ==========================================
// AUDIO ENGINE (GAIN, EQ, BASS BOOST, ANALYSER)
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
let currentVol = 0.20;
let isVisualizerActive = true;

// Audio Interruption & Focus Auto-Resume State
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

// Audio Interruption & Visibility Handling
audio.addEventListener('play', () => {
  wasPlayingBeforeInterruption = true;
  isManualPause = false;
  syncButtons(true);
});

audio.addEventListener('pause', () => {
  syncButtons(false);
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (wasPlayingBeforeInterruption && !isManualPause && audio.paused && audio.src) {
      audio.play().then(() => {
        syncButtons(true);
        updateMediaSession();
      }).catch(() => {});
    }
  }
});

// Battery Status Saver API
if ('getBattery' in navigator) {
  navigator.getBattery().then((battery) => {
    function evaluateBattery() {
      if (battery.level <= 0.15 && !battery.charging) {
        isVisualizerActive = false;
        showNotification('Battery under 15%: Visualizer paused to extend playback.');
      } else {
        isVisualizerActive = true;
      }
    }
    evaluateBattery();
    battery.addEventListener('levelchange', evaluateBattery);
    battery.addEventListener('chargingchange', evaluateBattery);
  }).catch(() => {});
}

// Headphone / Bluetooth Disconnect Protection
if (navigator.mediaDevices && navigator.mediaDevices.ondevicechange !== undefined) {
  navigator.mediaDevices.ondevicechange = () => {
    if (!audio.paused) {
      isManualPause = true;
      wasPlayingBeforeInterruption = false;
      audio.pause();
      syncButtons(false);
      showNotification('Headphones disconnected: Audio paused');
    }
  };
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

// Volume Quick-Snap Buttons
document.querySelectorAll('.vol-snap-btn').forEach(btn => {
  btn.onclick = () => {
    triggerHaptic(20);
    const v = parseInt(btn.dataset.vol, 10);
    setVolume(v);
    showNotification(`Volume set to ${v}%`);
  };
});

// Spectrum Visualizer
const visualizerCanvas = document.getElementById('audio-visualizer');
const vCtx = visualizerCanvas.getContext('2d');
function startVisualizerLoop() {
  if (!analyserNode) return;
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

// Dynamic Ambient Fluid Glow
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
let tracks = [];
let allTracksRaw = [];
let currentIndex = -1;
let currentAppLogo = 'ammu-icon.png';
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
let userProfile = { name: 'Amarjeet Kumar', avatar: 'ammu-icon.png' };
let multiSelectMode = false;
let selectedTrackIds = new Set();
let artModeIndex = 0;
const artModes = ['mode-standard', 'mode-vinyl'];
let playNextQueue = [];
let activePlayTimer = null;
let tempUserAvatarBase64 = null;
let availablePlaylistList = [];

// UI References
const playlistTabs = document.getElementById('playlist-tabs');
const songList = document.getElementById('song-list');
const cardReorderList = document.getElementById('card-reorder-list');
const viewPlaylistName = document.getElementById('view-playlist-name');
const trackCountLabel = document.getElementById('track-count-label');
const librarySearchInput = document.getElementById('library-search-input');
const btnClearSearch = document.getElementById('btn-clear-search');
const sortSelect = document.getElementById('sort-select');

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

// First-Launch Onboarding System
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
  const avatar = document.getElementById('onboarding-avatar-preview').src || 'ammu-icon.png';
  userProfile = { name, avatar };
  await dbOps.setUserProfile(userProfile);
  updateUserProfileLabels();
  document.getElementById('onboarding-modal').style.display = 'none';
  ensureAudioPipeline();
  showNotification(`Welcome to Ammu, ${name}!`);
};

// Onboarding Import Trigger
document.getElementById('onboarding-import-file').onchange = (e) => {
  handleDirectImport(e.target.files[0], true);
};

// Playlist Create Modal - Import Shared Playlist Button Trigger
document.getElementById('playlist-modal-import-file').onchange = (e) => {
  document.getElementById('playlist-create-modal').style.display = 'none';
  handleDirectImport(e.target.files[0], false);
};

// Anytime User Profile Edit
const userProfileModal = document.getElementById('user-profile-modal');
const editUserNameInput = document.getElementById('edit-user-name');
const editUserAvatarInput = document.getElementById('edit-user-avatar');
const userEditAvatarPreview = document.getElementById('user-edit-avatar-preview');

document.getElementById('btn-open-edit-user-profile').onclick = () => {
  triggerHaptic(20);
  editUserNameInput.value = userProfile.name;
  userEditAvatarPreview.src = userProfile.avatar || 'ammu-icon.png';
  tempUserAvatarBase64 = userProfile.avatar;
  userProfileModal.style.display = 'flex';
};

document.getElementById('btn-cancel-user-profile').onclick = () => {
  userProfileModal.style.display = 'none';
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
  showNotification('Listener profile updated successfully!');
};

// Save Playlist Audio Files to Local Phone Storage (e.g. "[Username]'s music taste")
document.getElementById('btn-download-playlist-to-storage').onclick = async () => {
  triggerHaptic(35);
  const folderName = `${userProfile.name}'s music taste`;
  const playlistTracks = tracks.filter(t => t.blob && t.blob.size > 0);

  if (!playlistTracks.length) {
    return showNotification('No audio files available to save in this playlist.');
  }

  showNotification(`Exporting songs to "${folderName}"...`);

  // Direct Directory Picker (Chromium / Supported Android)
  if ('showDirectoryPicker' in window) {
    try {
      const rootDir = await window.showDirectoryPicker();
      const targetDir = await rootDir.getDirectoryHandle(folderName, { create: true });

      for (const t of playlistTracks) {
        const fileHandle = await targetDir.getFileHandle(t.name, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(t.blob);
        await writable.close();
      }

      showNotification(`Saved ${playlistTracks.length} song(s) inside "${folderName}"!`);
      document.getElementById('author-modal').style.display = 'none';
      return;
    } catch (_) {
      // User cancelled or fallback needed
    }
  }

  // Fallback sequential blob download
  for (let i = 0; i < playlistTracks.length; i++) {
    const t = playlistTracks[i];
    const url = URL.createObjectURL(t.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${folderName}_${t.name}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    await new Promise(r => setTimeout(r, 200));
  }
  showNotification(`Exported files to your Downloads folder.`);
  document.getElementById('author-modal').style.display = 'none';
};

// Author Profile Modal
document.getElementById('btn-view-playlist-author').onclick = () => {
  triggerHaptic(20);
  const author = currentPlaylist.author || userProfile;
  document.getElementById('author-name-display').textContent = author.name;
  document.getElementById('author-avatar-display').src = author.avatar || 'ammu-icon.png';
  document.getElementById('author-pl-name').textContent = currentPlaylist.name;
  document.getElementById('author-track-count').textContent = tracks.length;
  document.getElementById('author-created-date').textContent = currentPlaylist.createdAt || 'Local Storage';
  document.getElementById('author-status-tag').textContent = (currentPlaylist.isImported || currentPlaylist.isAuthorLocked) ? 'Imported (Protected)' : 'Original Creator';
  document.getElementById('author-modal').style.display = 'flex';
};
document.getElementById('btn-close-author').onclick = () => {
  document.getElementById('author-modal').style.display = 'none';
};

// Artwork Mode Switcher
const artDisplayBox = document.getElementById('art-display-box');
document.getElementById('btn-toggle-art-mode').onclick = () => {
  triggerHaptic(25);
  artModeIndex = (artModeIndex + 1) % artModes.length;
  artDisplayBox.className = `detail-art-container ${artModes[artModeIndex]}`;
  document.getElementById('btn-toggle-art-mode').textContent = artModeIndex === 1 ? '🖼️ Art' : '💿 Disc';
};

// Double-Tap Cover Art to Seek (-10s / +10s)
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
  }
  lastTapTime = now;
});

function showSeekFeedback(text) {
  seekFeedbackOverlay.textContent = text;
  seekFeedbackOverlay.style.opacity = '1';
  setTimeout(() => { seekFeedbackOverlay.style.opacity = '0'; }, 500);
}

// Developer Profile System
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
  avatar: 'ammu-icon.png'
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
  devAvatarImg.src = devData.avatar || 'ammu-icon.png';

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

// ==========================================
// LISTENING ANALYTICS & TIME TRACKING
// ==========================================
document.getElementById('btn-open-stats').onclick = () => {
  triggerHaptic(20);
  renderListeningDashboard();
  document.getElementById('stats-modal').style.display = 'flex';
};
document.getElementById('btn-close-stats').onclick = () => {
  document.getElementById('stats-modal').style.display = 'none';
};

async function renderListeningDashboard() {
  const allTimeLogs = await dbOps.getAllListeningTimes();
  const todayKey = new Date().toISOString().split('T')[0];

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

  // Top 5 Songs (Clickable to play)
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

  // Playback History Timeline (Clickable to play)
  renderPlaybackHistoryTimeline();
}

async function playSongByNameGlobally(songName) {
  triggerHaptic(20);
  document.getElementById('stats-modal').style.display = 'none';

  let sIdx = tracks.findIndex(t => t.name.trim().toLowerCase() === songName.trim().toLowerCase());
  if (sIdx !== -1) {
    return playTrack(sIdx);
  }

  const all = await dbOps.getAllTracks();
  const found = all.find(t => t.name.trim().toLowerCase() === songName.trim().toLowerCase());
  if (found) {
    activePlaylistId = 'all';
    await loadPlaylists();
    sIdx = tracks.findIndex(t => t.name.trim().toLowerCase() === songName.trim().toLowerCase());
    if (sIdx !== -1) playTrack(sIdx);
  } else {
    showNotification(`Track "${songName}" not found in current library.`);
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
    li.innerHTML = `<strong>${h.name}</strong> <span style="font-size:0.68rem;color:var(--text-muted);">(${h.playlist})</span> <span style="float:right;">${h.dateStr}</span>`;
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

// Settings & Preferences Hub
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

  const plChecklist = document.getElementById('export-playlist-checklist');
  plChecklist.innerHTML = '';
  const pls = await dbOps.getPlaylists();
  pls.forEach(p => {
    const label = document.createElement('label');
    label.className = 'checkbox-label';
    label.innerHTML = `<input type="checkbox" data-pl-id="${p.id}" checked /> ${p.name}`;
    plChecklist.appendChild(label);
  });

  renderAuditLogs();
  settingsModal.style.display = 'flex';
}

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
    li.innerHTML = `<strong>[${log.type}]</strong> ${log.desc} <span style="float:right;font-size:0.68rem;">${log.date}</span>`;
    listEl.appendChild(li);
  });
}

document.getElementById('btn-clear-history').onclick = async () => {
  await dbOps.clearAuditLogs();
  renderAuditLogs();
  showNotification('Audit history cleared');
};

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

// Complete Full Profile & Library Exporter (with audio)
document.getElementById('btn-export-full-profile').onclick = async () => {
  triggerHaptic(35);
  showNotification('Packaging full profile & media backup...');
  await executeUniversalExport(true, true, true, null);
};

// Metadata-Only Full Exporter (No heavy audio blobs)
document.getElementById('btn-export-meta-profile').onclick = async () => {
  triggerHaptic(35);
  showNotification('Packaging lightweight metadata backup...');
  await executeUniversalExport(false, true, true, null);
};

// Granular Universal Export
document.getElementById('btn-export-backup').onclick = async () => {
  triggerHaptic(35);
  const includeAudio = document.getElementById('chk-export-audio').checked;
  const includeMarkers = document.getElementById('chk-export-timestamps').checked;
  const includeImages = document.getElementById('chk-export-images').checked;

  const selectedPlIds = new Set(
    Array.from(document.querySelectorAll('#export-playlist-checklist input:checked'))
      .map(cb => cb.dataset.plId)
  );

  showNotification('Packaging backup data...');
  await executeUniversalExport(includeAudio, includeMarkers, includeImages, selectedPlIds);
};

async function executeUniversalExport(includeAudio, includeMarkers, includeImages, selectedPlIds) {
  const allTracks = await dbOps.getAllTracks();
  const allPlaylists = await dbOps.getPlaylists();
  const devProfile = await dbOps.getDevProfile();

  const exportedPlaylists = allPlaylists.filter(p => !selectedPlIds || selectedPlIds.has(p.id)).map(p => ({
    id: p.id,
    name: p.name,
    cover: includeImages ? p.cover : 'ammu-icon.png',
    author: p.author || userProfile,
    isAuthorLocked: true,
    createdAt: p.createdAt || new Date().toLocaleDateString()
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

    exportedTracks.push({
      id: t.id,
      name: t.name,
      playlistId: t.playlistId,
      order: t.order,
      audioBase64: audioData,
      lyrics: trkLyrics,
      markers: trkMarkers,
      isFavorite: isFav,
      playCount: playCount
    });
  }

  const payload = {
    version: '6.0',
    exportedAt: new Date().toISOString(),
    generator: 'Ammu',
    author: userProfile,
    isAuthorLocked: true,
    hasMedia: includeAudio,
    branding: {
      appName: currentAppName,
      appLogo: includeImages ? currentAppLogo : 'ammu-icon.png'
    },
    devProfile,
    playlists: exportedPlaylists,
    tracks: exportedTracks
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const fileName = `Ammu_Backup_${includeAudio ? 'FULL' : 'META'}_${Date.now()}.json`;

  if ('showSaveFilePicker' in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [{ description: 'JSON File', accept: { 'application/json': ['.json'] } }]
      });
      const writable = await handle.createWritable();
      await writable.write(jsonString);
      await writable.close();
      await dbOps.addAuditLog({ type: 'EXPORT', desc: `Exported ${exportedTracks.length} track(s) (${includeAudio ? 'with audio' : 'metadata only'})` });
      showNotification('Backup saved to custom destination!');
      renderAuditLogs();
      return;
    } catch (_) {}
  }

  const blob = new Blob([jsonString], { type: 'application/json' });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(downloadUrl);

  await dbOps.addAuditLog({ type: 'EXPORT', desc: `Exported ${exportedTracks.length} track(s) (${includeAudio ? 'with audio' : 'metadata only'})` });
  renderAuditLogs();
  showNotification(`Exported to Downloads folder: ${fileName}`);
}

// Two-Step Pre-Import Engine with Smart Storage Matcher
let pendingImportPayload = null;
let auditMatchMap = new Map();

document.getElementById('import-backup-file').onchange = (e) => {
  handleDirectImport(e.target.files[0], false);
};

async function handleDirectImport(file, bypassOnboarding) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!data.playlists || !data.tracks) throw new Error('Invalid format');

      if (bypassOnboarding && data.author) {
        userProfile = data.author;
        await dbOps.setUserProfile(userProfile);
        updateUserProfileLabels();
        document.getElementById('onboarding-modal').style.display = 'none';
      }

      pendingImportPayload = data;

      const author = data.author || { name: 'Unknown Author', avatar: 'ammu-icon.png' };
      document.getElementById('pre-import-author-name').textContent = `Created by: ${author.name} (Protected)`;
      document.getElementById('pre-import-avatar').src = author.avatar || 'ammu-icon.png';
      document.getElementById('pre-import-file-meta').textContent = `Tracks: ${data.tracks.length} • Playlists: ${data.playlists.length}`;

      // Run Storage Availability Match Audit
      const localAll = await dbOps.getAllTracks();
      const localNamesSet = new Set(localAll.filter(t => t.blob && t.blob.size > 0).map(t => t.name.trim().toLowerCase()));

      let availableCount = 0;
      let missingCount = 0;
      auditMatchMap.clear();

      const auditBox = document.getElementById('pre-import-audit-checklist');
      auditBox.innerHTML = '';

      data.tracks.forEach(trk => {
        const cleanName = trk.name.trim().toLowerCase();
        const hasPayloadAudio = Boolean(trk.audioBase64);
        const existsInLocal = localNamesSet.has(cleanName);
        const isAvailable = hasPayloadAudio || existsInLocal;

        auditMatchMap.set(trk.id || trk.name, isAvailable);

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

      // Render Playlists checklist
      const plBox = document.getElementById('pre-import-playlist-list');
      plBox.innerHTML = '';
      data.playlists.forEach(p => {
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.innerHTML = `<input type="checkbox" data-import-pl="${p.id}" checked /> ${p.name}`;
        plBox.appendChild(label);
      });

      document.getElementById('pre-import-modal').style.display = 'flex';
    } catch (_) {
      showNotification('Corrupted or invalid JSON backup file.');
    }
  };
  reader.readAsText(file);
}

document.getElementById('btn-cancel-pre-import').onclick = () => {
  document.getElementById('pre-import-modal').style.display = 'none';
  pendingImportPayload = null;
};

// Final Verified Import Execution
document.getElementById('btn-confirm-final-import').onclick = async () => {
  if (!pendingImportPayload) return;
  triggerHaptic(40);

  const selectedPlIds = new Set(
    Array.from(document.querySelectorAll('#pre-import-playlist-list input:checked'))
      .map(cb => cb.dataset.importPl)
  );

  const importMarkers = document.getElementById('chk-import-markers').checked;
  const importLyrics = document.getElementById('chk-import-lyrics').checked;
  const author = pendingImportPayload.author || { name: 'External Creator', avatar: 'ammu-icon.png' };

  for (const p of pendingImportPayload.playlists) {
    if (selectedPlIds.has(p.id)) {
      await dbOps.savePlaylist({
        ...p,
        author: p.author || author,
        isImported: true,
        isAuthorLocked: true
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

  for (const trk of pendingImportPayload.tracks) {
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
      order: trk.order || Date.now()
    });

    if (importLyrics && trk.lyrics) await dbOps.setLyrics(trk.name, trk.lyrics);
    if (importMarkers && trk.markers) await dbOps.saveTimestamps(trk.name, trk.markers);
    if (trk.isFavorite) await dbOps.setFavorite(trk.name, true);

    importedSongs.push({ name: trk.name, isAvailable: hasAudio });
  }

  await dbOps.addAuditLog({
    type: 'IMPORT',
    desc: `Imported ${importedSongs.length} tracks (${availableSongsCount} available, ${missingSongsCount} missing from storage)`
  });

  document.getElementById('pre-import-modal').style.display = 'none';
  await loadPlaylists();

  document.getElementById('success-author-avatar').src = author.avatar || 'ammu-icon.png';
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

// Playlists & Track Listing
async function loadPlaylists() {
  let list = await dbOps.getPlaylists();
  if (!list.length) {
    const def = { id: 'favorites', name: 'Favorites', cover: currentAppLogo, author: userProfile, createdAt: new Date().toLocaleDateString() };
    await dbOps.savePlaylist(def);
    list = [def];
  }

  const allCategory = { id: 'all', name: 'All', cover: currentAppLogo, author: userProfile };
  const combined = [allCategory, ...list];
  availablePlaylistList = combined;

  playlistTabs.innerHTML = '';
  combined.forEach((p) => {
    const chip = document.createElement('div');
    chip.className = `chip ${p.id === activePlaylistId ? 'active' : ''}`;
    chip.innerHTML = `<img src="${p.cover || currentAppLogo}" class="chip-img" /><span>${p.name}</span>`;
    chip.onclick = () => {
      triggerHaptic(20);
      activePlaylistId = p.id;
      playNextQueue = [];
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
  btnClearSearch.style.display = q ? 'block' : 'none';

  let filtered = allTracksRaw.filter(t => t.name.toLowerCase().includes(q));

  const sortVal = sortSelect.value;
  if (sortVal === 'az') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortVal === 'za') {
    filtered.sort((a, b) => b.name.localeCompare(a.name));
  }

  tracks = filtered;

  let totalSecs = tracks.length * 210;
  let hrs = Math.floor(totalSecs / 3600);
  let mins = Math.floor((totalSecs % 3600) / 60);
  let durStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  trackCountLabel.textContent = `${tracks.length} song${tracks.length === 1 ? '' : 's'} • ~${durStr}`;

  songList.innerHTML = '';
  if (!tracks.length) {
    songList.innerHTML = '<li style="color:var(--text-muted);text-align:center;padding:24px 0;">No songs found.</li>';
    return;
  }

  tracks.forEach(async (trk, idx) => {
    const isFav = await dbOps.isFavorite(trk.name);
    const playCount = await dbOps.getPlayCount(trk.name);
    const isMissing = trk.isMissing || (!trk.blob || trk.blob.size === 0);

    const li = document.createElement('li');
    li.className = `song-row ${idx === currentIndex ? 'active' : ''} ${isMissing ? 'missing-storage' : 'available-storage'}`;
    li.setAttribute('data-song-name', trk.name);

    const multiBox = multiSelectMode ? `<input type="checkbox" class="multi-chk" data-trk-id="${trk.id}" ${selectedTrackIds.has(trk.id) ? 'checked' : ''} style="margin-right:8px;" />` : '';

    const info = document.createElement('div');
    info.className = 'song-info';
    info.innerHTML = `
      ${multiBox}
      <span class="song-name">
        <strong>${idx + 1}.</strong> ${trk.name}
        ${isMissing ? '<span class="missing-tag-badge">⚠️ Not in storage</span>' : ''}
      </span>
      <span class="song-sub-info">${isMissing ? 'Audio file missing from device' : `Plays: ${playCount}`}</span>
    `;

    info.onclick = () => {
      if (multiSelectMode) {
        toggleSelectTrack(trk.id);
      } else {
        if (isMissing) {
          triggerHaptic(15);
          // Playback continues completely uninterrupted without affecting current song
          showNotification(`"${trk.name}" is not available in device storage.`);
          return;
        }
        playTrack(idx);
      }
    };

    const actions = document.createElement('div');
    actions.className = 'row-actions';

    const btnPlayNext = document.createElement('button');
    btnPlayNext.className = 'btn-icon-sm';
    btnPlayNext.innerHTML = '⏭️';
    btnPlayNext.title = 'Play Next';
    btnPlayNext.onclick = (e) => {
      e.stopPropagation();
      if (isMissing) return showNotification(`Cannot queue: "${trk.name}" is missing from storage.`);
      queueSongPlayNext(trk);
    };

    const btnRename = document.createElement('button');
    btnRename.className = 'btn-icon-sm';
    btnRename.innerHTML = '✏️';
    btnRename.onclick = (e) => { e.stopPropagation(); openRenameModal(trk); };

    const btnLikeRow = document.createElement('button');
    btnLikeRow.className = 'btn-icon-sm song-heart-btn';
    btnLikeRow.innerHTML = isFav ? '❤️' : '💛';
    btnLikeRow.onclick = async (e) => { e.stopPropagation(); await toggleFavorite(trk); };

    const del = document.createElement('button');
    del.className = 'btn-del';
    del.innerHTML = '🗑';
    del.onclick = (e) => {
      e.stopPropagation();
      executeTrackDeleteWithUndo(trk);
    };

    actions.append(btnPlayNext, btnRename, btnLikeRow, del);
    li.append(info, actions);

    bindSongRowSwipeGestures(li, trk);
    songList.appendChild(li);
  });

  if (currentIndex !== -1 && tracks[currentIndex]) {
    dbOps.isFavorite(tracks[currentIndex].name).then(updateLikeButtonsUI);
  }
}

function queueSongPlayNext(trk) {
  triggerHaptic(25);
  playNextQueue.unshift(trk);
  renderCardReorderList();
  showNotification(`"${trk.name}" queued to play next!`);
}

// 5-Second Undo Safe Track Delete
function executeTrackDeleteWithUndo(trk) {
  triggerHaptic(30);
  allTracksRaw = allTracksRaw.filter(t => t.id !== trk.id);
  renderFilteredTracks();

  showUndoToast(`Removed "${trk.name}"`, async () => {
    allTracksRaw.push(trk);
    renderFilteredTracks();
  }, async () => {
    await dbOps.deleteTrack(trk.id);
  });
}

// Song Row Touch Swipe Gestures
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

// Multi-Select Engine with 5-Second Undo
document.getElementById('btn-toggle-multi-select').onclick = () => {
  triggerHaptic(20);
  multiSelectMode = !multiSelectMode;
  selectedTrackIds.clear();
  document.getElementById('batch-action-bar').style.display = multiSelectMode ? 'flex' : 'none';
  renderFilteredTracks();
};

function toggleSelectTrack(id) {
  triggerHaptic(15);
  if (selectedTrackIds.has(id)) selectedTrackIds.delete(id);
  else selectedTrackIds.add(id);
  document.getElementById('batch-count-label').textContent = `${selectedTrackIds.size} Selected`;
  renderFilteredTracks();
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

// Search & Sort Clear
librarySearchInput.addEventListener('input', renderFilteredTracks);
btnClearSearch.onclick = () => {
  librarySearchInput.value = '';
  renderFilteredTracks();
};
sortSelect.addEventListener('change', renderFilteredTracks);

// One-Tap Song Name Cleaner
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

// Rename Single Track
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

// Toggle Favorite Logic with Fullscreen Heart Burst Animation
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
    showNotification(`Removed "${trk.name}" from Favorites 💛`);
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
    showNotification(`"${trk.name}" added to Favorites ❤️!`);
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
      currentPlaylist.cover = newArt;
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
  const pl = {
    id: 'pl_' + Date.now(),
    name,
    cover: newBase64Cover || currentAppLogo,
    author: userProfile,
    createdAt: new Date().toLocaleDateString()
  };
  await dbOps.savePlaylist(pl);
  createModal.style.display = 'none';
  activePlaylistId = pl.id;
  await loadPlaylists();
  showNotification(`Playlist "${name}" created!`);
};

// Add Songs with Duplicate Detection & Missing Flag Reset
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

    // If already exists as a missing ghost track, update it with real audio
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
      order: tracks.length + i
    });
    addedCount++;
  }

  showNotification(`Added ${addedCount} song(s)${skippedCount ? ` (${skippedCount} duplicates skipped)` : ''}!`);
  loadTracks();
};

// Playback Engine (Skips Missing Tracks Gracefully)
async function playTrack(idx) {
  if (idx < 0 || idx >= tracks.length) return;

  const trk = tracks[idx];
  if (trk.isMissing || (!trk.blob || trk.blob.size === 0)) {
    showNotification(`Cannot play: "${trk.name}" is missing from storage.`);
    return;
  }

  ensureAudioPipeline();

  if (currentIndex === idx && audio.src) {
    if (audio.paused) {
      audio.play();
      syncButtons(true);
    }
    return;
  }

  currentIndex = idx;
  audio.src = URL.createObjectURL(trk.blob);
  audio.playbackRate = speedList[currentSpeedIndex];

  audio.play().then(() => {
    syncButtons(true);
    updateMediaSession();
  }).catch(() => {});

  miniTitle.textContent = trk.name;
  miniSub.textContent = `Playlist: ${currentPlaylist.name}`;
  boxTitle.textContent = trk.name;
  boxPlaylist.textContent = `Playlist: ${currentPlaylist.name}`;

  const isFav = await dbOps.isFavorite(trk.name);
  updateLikeButtonsUI(isFav);

  await dbOps.incrementPlayCount(trk.name);
  await dbOps.addPlaybackHistory(trk.name, currentPlaylist.name);
  loadLyricsForCurrent();
  await loadTimestampsForCurrent();
  renderSeekTicks();
  updateMediaSession();
  updateAmbientGlow(boxCover);
  loadTracks();

  startListeningTimeTracking();
  saveCurrentSessionState();
  renderCardReorderList();
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
  if (!audio.src && tracks.length) {
    const firstPlayable = tracks.findIndex(t => t.blob && t.blob.size > 0);
    return playTrack(firstPlayable !== -1 ? firstPlayable : 0);
  }
  if (audio.paused) {
    audio.play();
    syncButtons(true);
  } else {
    isManualPause = true;
    wasPlayingBeforeInterruption = false;
    audio.pause();
    syncButtons(false);
  }
}

function loopNext() {
  if (!tracks.length) return;
  
  if (playNextQueue.length > 0) {
    const nextTrk = playNextQueue.shift();
    renderCardReorderList();
    const idx = tracks.findIndex(t => t.name === nextTrk.name && (!t.isMissing && t.blob && t.blob.size > 0));
    if (idx !== -1) return playTrack(idx);
  }

  if (playMode === 'one') return playTrack(currentIndex);

  // Find next available track with real audio
  let next = currentIndex;
  let attempts = 0;
  do {
    next = (playMode === 'shuffle') 
      ? Math.floor(Math.random() * tracks.length) 
      : next + 1;
    if (next >= tracks.length) next = 0;
    attempts++;
  } while (tracks[next] && (tracks[next].isMissing || !tracks[next].blob || tracks[next].blob.size === 0) && attempts < tracks.length);

  if (tracks[next] && (!tracks[next].isMissing && tracks[next].blob && tracks[next].blob.size > 0)) {
    playTrack(next);
  }
}

barBtnPlay.onclick = (e) => { e.stopPropagation(); togglePlay(); };
boxBtnPlay.onclick = togglePlay;
boxBtnPrev.onclick = () => {
  triggerHaptic(20);
  let prev = currentIndex;
  let attempts = 0;
  do {
    prev = prev > 0 ? prev - 1 : tracks.length - 1;
    attempts++;
  } while (tracks[prev] && (tracks[prev].isMissing || !tracks[prev].blob || tracks[prev].blob.size === 0) && attempts < tracks.length);

  playTrack(prev);
};
boxBtnNext.onclick = () => { triggerHaptic(20); loopNext(); };
audio.onended = loopNext;

barBtnLike.onclick = (e) => {
  e.stopPropagation();
  if (currentIndex !== -1 && tracks[currentIndex]) toggleFavorite(tracks[currentIndex]);
};
modalBtnLike.onclick = () => {
  if (currentIndex !== -1 && tracks[currentIndex]) toggleFavorite(tracks[currentIndex]);
};

// Robust MediaSession Handler Re-binding
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

  navigator.mediaSession.playbackState = audio.paused ? 'paused' : 'playing';

  navigator.mediaSession.setActionHandler('play', () => {
    ensureAudioPipeline();
    audio.play().then(() => {
      syncButtons(true);
      navigator.mediaSession.playbackState = 'playing';
    }).catch(() => {});
  });

  navigator.mediaSession.setActionHandler('pause', () => {
    isManualPause = true;
    wasPlayingBeforeInterruption = false;
    audio.pause();
    syncButtons(false);
    navigator.mediaSession.playbackState = 'paused';
  });

  navigator.mediaSession.setActionHandler('nexttrack', loopNext);
  navigator.mediaSession.setActionHandler('previoustrack', () => {
    let prev = currentIndex;
    let attempts = 0;
    do {
      prev = prev > 0 ? prev - 1 : tracks.length - 1;
      attempts++;
    } while (tracks[prev] && (tracks[prev].isMissing || !tracks[prev].blob || tracks[prev].blob.size === 0) && attempts < tracks.length);
    playTrack(prev);
  });
}

document.getElementById('open-box-trigger').onclick = () => { 
  playerBoxModal.style.display = 'flex'; 
  renderSeekTicks();
  renderCardReorderList();
  updateAmbientGlow(boxCover);
};
document.getElementById('btn-close-box').onclick = () => { playerBoxModal.style.display = 'none'; };

// Pull-Down Drag to Dismiss Full Player
let pullStartY = 0;
const dragDismissArea = document.getElementById('card-drag-dismiss-area');
dragDismissArea.addEventListener('touchstart', (e) => {
  if (dragDismissArea.scrollTop === 0) pullStartY = e.touches[0].clientY;
}, { passive: true });
dragDismissArea.addEventListener('touchmove', (e) => {
  if (pullStartY && e.touches[0].clientY - pullStartY > 120) {
    playerBoxModal.style.display = 'none';
    pullStartY = 0;
  }
}, { passive: true });

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
        setVolume(20);
        btnSleepTimer.textContent = '⏱️ Off';
        sleepIndex = 0;
        showNotification('Sleep timer ended. Goodnight!');
      }, 5000);
    }, mins * 60 * 1000);
  }
};

// ==========================================
// SWIPE GESTURES (MINI-BAR, COVER ART, & MAIN SHELL)
// ==========================================

// 1. Mini Player Bar Gestures (Swipe Up -> Expand | Swipe Left -> Next | Swipe Right -> Prev)
let miniStartX = 0;
let miniStartY = 0;
miniPlayerBar.addEventListener('touchstart', (e) => {
  miniStartX = e.touches[0].clientX;
  miniStartY = e.touches[0].clientY;
}, { passive: true });

miniPlayerBar.addEventListener('touchend', (e) => {
  const diffX = e.changedTouches[0].clientX - miniStartX;
  const diffY = e.changedTouches[0].clientY - miniStartY;

  // Vertical Swipe Up
  if (diffY < -40 && Math.abs(diffX) < 60) {
    triggerHaptic(25);
    playerBoxModal.style.display = 'flex';
    renderSeekTicks();
    renderCardReorderList();
    updateAmbientGlow(boxCover);
    return;
  }

  // Horizontal Swipes
  if (Math.abs(diffX) > 60 && Math.abs(diffY) < 50) {
    if (diffX < 0) {
      triggerHaptic(20);
      loopNext();
    } else {
      triggerHaptic(20);
      let prev = currentIndex;
      let attempts = 0;
      do {
        prev = prev > 0 ? prev - 1 : tracks.length - 1;
        attempts++;
      } while (tracks[prev] && (tracks[prev].isMissing || !tracks[prev].blob || tracks[prev].blob.size === 0) && attempts < tracks.length);
      playTrack(prev);
    }
  }
}, { passive: true });

// 2. Fullscreen Album Cover Gestures (Horizontal Prev/Next | Vertical Slide Volume)
let coverTouchX = 0;
let coverTouchY = 0;
let coverVolStart = 20;

artDisplayBox.addEventListener('touchstart', (e) => {
  coverTouchX = e.touches[0].clientX;
  coverTouchY = e.touches[0].clientY;
  coverVolStart = currentVol * 100;
}, { passive: true });

artDisplayBox.addEventListener('touchmove', (e) => {
  const diffY = coverTouchY - e.touches[0].clientY;
  const diffX = Math.abs(e.touches[0].clientX - coverTouchX);

  if (Math.abs(diffY) > 15 && diffX < 40) {
    const delta = (diffY / 120) * 40;
    const newVol = Math.max(0, Math.min(100, Math.round(coverVolStart + delta)));
    setVolume(newVol);
    showSeekFeedback(`🔊 ${newVol}%`);
  }
}, { passive: true });

artDisplayBox.addEventListener('touchend', (e) => {
  const diffX = e.changedTouches[0].clientX - coverTouchX;
  const diffY = e.changedTouches[0].clientY - coverTouchY;

  // Swipe Down to Minimize
  if (diffY > 70 && Math.abs(diffX) < 50) {
    triggerHaptic(20);
    playerBoxModal.style.display = 'none';
    return;
  }

  // Horizontal Track Skips
  if (Math.abs(diffX) > 60 && Math.abs(diffY) < 40) {
    if (diffX > 0) {
      triggerHaptic(25);
      let prev = currentIndex;
      let attempts = 0;
      do {
        prev = prev > 0 ? prev - 1 : tracks.length - 1;
        attempts++;
      } while (tracks[prev] && (tracks[prev].isMissing || !tracks[prev].blob || tracks[prev].blob.size === 0) && attempts < tracks.length);
      playTrack(prev);
    } else {
      triggerHaptic(25);
      loopNext();
    }
  }
}, { passive: true });

// 3. Main Screen Edge-to-Edge Swipe Between Playlists
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
    playNextQueue = [];
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

// Audio Trimmer
const trimmerModal = document.getElementById('trimmer-modal');
document.getElementById('card-toggle-trimmer').onclick = () => {
  if (currentIndex === -1 || !tracks[currentIndex]) return showNotification('Play a song to trim!');
  document.getElementById('trimmer-track-name').textContent = tracks[currentIndex].name;
  const dur = audio.duration || 100;
  document.getElementById('trim-start-range').max = dur;
  document.getElementById('trim-end-range').max = dur;
  document.getElementById('trim-start-range').value = 0;
  document.getElementById('trim-end-range').value = Math.min(30, dur);
  document.getElementById('lbl-trim-start').textContent = '0.0s';
  document.getElementById('lbl-trim-end').textContent = `${Math.min(30, dur).toFixed(1)}s`;
  trimmerModal.style.display = 'flex';
};
document.getElementById('btn-cancel-trimmer').onclick = () => { trimmerModal.style.display = 'none'; };
document.getElementById('trim-start-range').oninput = (e) => {
  document.getElementById('lbl-trim-start').textContent = `${parseFloat(e.target.value).toFixed(1)}s`;
};
document.getElementById('trim-end-range').oninput = (e) => {
  document.getElementById('lbl-trim-end').textContent = `${parseFloat(e.target.value).toFixed(1)}s`;
};
document.getElementById('btn-save-ringtone').onclick = () => {
  triggerHaptic(35);
  showNotification('Audio slice exported!');
  trimmerModal.style.display = 'none';
};

// Embedded Panels
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
  looper: document.getElementById('card-looper-panel'),
  lyrics: document.getElementById('card-toggle-lyrics'),
  playlist: document.getElementById('card-toggle-playlist')
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

    if (key === 'playlist') renderCardReorderList();
    else if (key === 'timestamps') renderTimestampsDrawerList();
  }
}

btns.vol.onclick = () => togglePanel('vol');
btns.eq.onclick = () => togglePanel('eq');
btns.timestamps.onclick = () => togglePanel('timestamps');
document.getElementById('card-toggle-looper').onclick = () => togglePanel('looper');
btns.lyrics.onclick = () => togglePanel('lyrics');
btns.playlist.onclick = () => togglePanel('playlist');

document.getElementById('card-vol-slider').addEventListener('input', (e) => {
  triggerHaptic(10);
  setVolume(e.target.value);
});

const lyricsTextarea = document.getElementById('lyrics-textarea');
async function loadLyricsForCurrent() {
  if (currentIndex === -1 || !tracks[currentIndex]) return;
  const text = await dbOps.getLyrics(tracks[currentIndex].name);
  lyricsTextarea.value = text;
}
document.getElementById('btn-save-lyrics').onclick = async () => {
  triggerHaptic(25);
  if (currentIndex === -1 || !tracks[currentIndex]) return;
  await dbOps.setLyrics(tracks[currentIndex].name, lyricsTextarea.value);
  showNotification('Lyrics saved offline!');
};

// Timestamps & Markers with 5-Second Undo
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
        await dbOps.saveTimestamps(tracks[currentIndex].name, currentSongTimestamps);
      });
    };

    timestampMarkersList.appendChild(li);
  });
}

document.getElementById('btn-add-timestamp').onclick = () => {
  triggerHaptic(20);
  if (currentIndex === -1 || !tracks[currentIndex]) {
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
  await dbOps.saveTimestamps(tracks[currentIndex].name, currentSongTimestamps);
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

// Session State Memory
function saveCurrentSessionState() {
  if (currentIndex !== -1 && tracks[currentIndex]) {
    localStorage.setItem('ammu_last_song', tracks[currentIndex].name);
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
      const sIdx = songListTarget.findIndex(t => t.name === lastSong);
      if (sIdx !== -1 && (!songListTarget[sIdx].isMissing && songListTarget[sIdx].blob && songListTarget[sIdx].blob.size > 0)) {
        await playTrack(sIdx);
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

// In-Card Playlist Reorder & Temporary "Play Next" Display
function renderCardReorderList() {
  cardReorderList.innerHTML = '';
  if (!tracks.length && !playNextQueue.length) {
    cardReorderList.innerHTML = '<li style="color:var(--text-muted);text-align:center;font-size:0.8rem;padding:8px 0;">No songs in this playlist.</li>';
    return;
  }

  const isAudioPlaying = !audio.paused && audio.currentTime > 0;

  tracks.forEach((trk, idx) => {
    const isThisPlaying = (currentIndex !== -1 && tracks[currentIndex] && (tracks[currentIndex].name === trk.name));
    const isMissing = trk.isMissing || (!trk.blob || trk.blob.size === 0);
    const li = document.createElement('li');
    li.className = `song-row ${isThisPlaying ? 'playing-in-drawer' : ''} ${isMissing ? 'missing-storage' : ''}`;
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
            <span class="now-playing-tag">Now Playing</span>
          </span>
        ` : ''}
      </span>
      <div>
        <button class="btn-action" onclick="shiftTrack(${idx}, -1)">▲</button>
        <button class="btn-action" onclick="shiftTrack(${idx}, 1)">▼</button>
      </div>
    `;

    li.querySelector('.song-name').onclick = () => {
      if (isMissing) {
        showNotification(`"${trk.name}" is not in device storage.`);
        return;
      }
      playTrack(idx);
    };
    cardReorderList.appendChild(li);

    if (isThisPlaying && playNextQueue.length > 0) {
      playNextQueue.forEach((queuedTrk, qIdx) => {
        const qLi = document.createElement('li');
        qLi.className = 'song-row';
        qLi.style.border = '1px dashed var(--accent-light)';
        qLi.style.background = '#0e1d16';
        qLi.innerHTML = `
          <span class="song-name" style="max-width:75%;cursor:pointer;">
            <span style="color:var(--accent-light);font-size:0.75rem;font-weight:bold;">[Up Next]</span> ${queuedTrk.name}
          </span>
          <button class="btn-del" title="Remove from queue">✕</button>
        `;
        qLi.querySelector('.btn-del').onclick = (e) => {
          e.stopPropagation();
          triggerHaptic(20);
          playNextQueue.splice(qIdx, 1);
          renderCardReorderList();
        };
        cardReorderList.appendChild(qLi);
      });
    }
  });
}

window.shiftTrack = async (from, delta) => {
  triggerHaptic(20);
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
  eqEnabled = e.target.checked;
  filters.forEach((f, i) => {
    f.gain.value = eqEnabled ? parseFloat(document.querySelectorAll('[data-band]')[i].value) : 0;
  });
  if (preampGain && audioCtx) {
    preampGain.gain.setValueAtTime(eqEnabled ? Math.pow(10, parseFloat(document.getElementById('eq-preamp').value) / 20) * 0.35 : 1, audioCtx.currentTime);
  }
  showNotification(eqEnabled ? 'Equalizer active' : 'DSP bypass');
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

// Initial Boot
initDB().then(async () => {
  await checkOnboarding();
  await loadAppBranding();
  await loadDevProfile();
  await loadPlaylists();
  checkResumeSession();
  setVolume(20);
});
