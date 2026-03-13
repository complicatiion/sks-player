/* 
  SKS PLAYER
*/

(() => {
  'use strict';

  /* ------------------ CONFIG ------------------ */
  const CONFIG = {
    ACCEPTED_EXT: [".mp3", ".ogg", ".aac", ".m4a", ".wav"],
    MAX_HOME_ALBUMS: 12,
    MAX_HOME_TRACKS: 18,
    MAX_HOME_FOLDERS: 30,
    DEFAULT_ACCENT: "#6C4DF5",
    SAVE_KEY: "sks-player-settings-v7",
    STATE_KEY: "sks-player-state-v7",
    FAV_KEY: "sks-player-favorites",
    HANDLE_DB: "sks-player-db-v7",
    HANDLE_STORE: "handles",
    HANDLE_LAST_KEY: "musicRoot:last",
    HANDLE_HARD_KEY: "musicRoot:hard",
    SHOW_FOLDER_COVERS: false,
  };

  /* ------------------ STATUS ------------------ */
  const State = {
    tracks: [], albums: [], folders: [],
    queue: [], current: -1,
    shuffle: false, repeat: "off",
    volume: 1, muted: false,
    folderHandle: null, lastFiles: null,
  };

  const Settings = loadSettings();
  const Favorites = loadFavorites();

  /* ------------------ DOM ------------------ */
  const el = {
    navLinks: document.querySelectorAll('.main-tabs .nav-link'),
    sections: {
      home: document.getElementById('section-home'),
      albums: document.getElementById('section-albums'),
      tracks: document.getElementById('section-tracks'),
      folders: document.getElementById('section-folders'),
      favorites: document.getElementById('section-favorites'),
    },
    home: {
      favorites: document.getElementById('home-favorites'),
      albums: document.getElementById('home-albums'),
      tracks: document.getElementById('home-tracks'),
      folders: document.getElementById('home-folders'),
    },
    albumsGrid: document.getElementById('albums-grid'),
    tracksList: document.getElementById('tracks-list'),
    foldersGrid: document.getElementById('folders-grid'),
    favoritesList: document.getElementById('favorites-list'),

    // Player
    audio: document.getElementById('audio'),
    btnPrev: document.getElementById('btn-prev'),
    btnPlay: document.getElementById('btn-play'),
    btnNext: document.getElementById('btn-next'),
    btnShuffle: document.getElementById('btn-shuffle'),
    btnRepeat: document.getElementById('btn-repeat'),
    btnMute: document.getElementById('btn-mute'),
    btnFull: document.getElementById('btn-full'),
    btnTop: document.getElementById('btn-top'),
    btnBottom: document.getElementById('btn-bottom'),
    btnFavCurrent: document.getElementById('btn-fav-current'),
    iconPlayPause: document.getElementById('icon-playpause'),
    iconVol: document.getElementById('icon-vol'),
    iconFavCurrent: document.getElementById('icon-fav-current'),
    seek: document.getElementById('seek'),
    vol: document.getElementById('volume'),
    timeCur: document.getElementById('time-current'),
    timeTot: document.getElementById('time-total'),
    npCover: document.getElementById('np-cover'),
    npTitle: document.getElementById('np-title'),
    npSub: document.getElementById('np-sub'),

    // Settings
    btnSearch: document.getElementById('btn-search'),
    btnSettings: document.getElementById('btn-settings'),
    offSearch: document.getElementById('offcanvasSearch'),
    offSettings: document.getElementById('offcanvasSettings'),
    searchInput: document.getElementById('search-input'),
    searchResults: document.getElementById('search-results'),
    btnPick: document.getElementById('btn-pick'),
    inputFolder: document.getElementById('input-folder'),
    btnRescan: document.getElementById('btn-rescan'),
    btnCoverScan: document.getElementById('btn-cover-scan'),
    scanStatus: document.getElementById('scan-status'),
    accentPicker: document.getElementById('accent-picker'),
    density: document.getElementById('density'),
    autoScan: document.getElementById('auto-scan'),
    rememberState: document.getElementById('remember-state'),
    startSection: document.getElementById('start-section'),
    gridDensity: document.getElementById('grid-density'),
    hardPath: document.getElementById('hard-path'),
    btnBindHard: document.getElementById('btn-bind-hard'),
    hardAuto: document.getElementById('hard-auto'),
  };

  const offSearch = window.bootstrap ? new bootstrap.Offcanvas(el.offSearch) : null;
  const offSettings = window.bootstrap ? new bootstrap.Offcanvas(el.offSettings) : null;

  /* ------------------ INIT ------------------ */
  applySettings();

  el.navLinks.forEach(a => a.addEventListener('click', (ev) => {
    ev.preventDefault();
    const s = a.dataset.section;
    document.querySelectorAll('.main-tabs .nav-link').forEach(x => x.classList.remove('active'));
    a.classList.add('active');
    for (const [k, sec] of Object.entries(el.sections)) {
      sec.classList.toggle('d-none', k !== s);
    }
    window.scrollTo({top:0, behavior:'smooth'});
  }));

  el.btnSearch.addEventListener('click', () => offSearch && offSearch.show());
  el.btnSettings.addEventListener('click', () => offSettings && offSettings.show());

  // Folder
  el.btnPick.addEventListener('click', pickFolderAndBindLast);
  el.inputFolder.addEventListener('change', (e) => importFromFileList(e.target.files));
  el.btnRescan.addEventListener('click', () => {
    if (State.folderHandle) scanDirectory(State.folderHandle);
    else if (State.lastFiles) importFromFileList(State.lastFiles);
    else el.scanStatus.textContent = "Kein Ordner verknüpft – bitte zuerst auswählen.";
  });
  el.btnCoverScan.addEventListener('click', coverScan);

  // Hardcoded Path
  el.btnBindHard.addEventListener('click', bindHardPathHandle);
  el.hardPath.addEventListener('input', () => { Settings.hardPath = el.hardPath.value; saveSettings(); });
  el.hardAuto.addEventListener('change', () => { Settings.hardAuto = !!el.hardAuto.checked; saveSettings(); });

  // Settings
  el.accentPicker.addEventListener('input', (e) => {
    document.documentElement.style.setProperty('--accent', e.target.value);
    Settings.accent = e.target.value; saveSettings();
    refreshRangeFills();
  });
  el.density.addEventListener('change', (e) => {
    document.body.classList.toggle('compact', e.target.value === 'compact');
    Settings.density = e.target.value; saveSettings();
  });
  el.autoScan.addEventListener('change', (e) => { Settings.autoScan = !!e.target.checked; saveSettings(); });
  el.rememberState.addEventListener('change', (e) => { Settings.rememberState = !!e.target.checked; saveSettings(); });
  el.startSection.addEventListener('change', (e) => { Settings.startSection = e.target.value; saveSettings(); });

  el.gridDensity.querySelectorAll('button[data-cols]').forEach(btn => {
    btn.addEventListener('click', () => {
      const n = parseInt(btn.dataset.cols, 10) || 8;
      Settings.gridCols = n; saveSettings();
      applyGridCols();
    });
  });

  // Player Controls
  el.btnPlay.addEventListener('click', togglePlay);
  el.btnPrev.addEventListener('click', () => skip(-1));
  el.btnNext.addEventListener('click', () => skip(1));
  el.btnShuffle.addEventListener('click', toggleShuffle);
  el.btnRepeat.addEventListener('click', cycleRepeat);
  el.seek.addEventListener('input', onSeekInput);
  el.seek.addEventListener('change', onSeekChange);
  el.vol.addEventListener('input', onVolume);
  el.btnMute.addEventListener('click', toggleMute);
  el.btnFull.addEventListener('click', toggleFullscreen);
  el.btnTop.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
  el.btnBottom.addEventListener('click', () => window.scrollTo({top: document.body.scrollHeight, behavior:'smooth'}));
  el.btnFavCurrent.addEventListener('click', toggleFavoriteCurrent);

  el.audio.addEventListener('timeupdate', updateTime);
  el.audio.addEventListener('loadedmetadata', updateDuration);
  el.audio.addEventListener('play', updatePlayPauseUI);
  el.audio.addEventListener('pause', updatePlayPauseUI);
  el.audio.addEventListener('ended', onEnded);
  document.addEventListener('keydown', hotkeys);

  // Filters
  refillFilterBars();

  // Initial Slider fill
  refreshRangeFills();

  // Autostart
  if (Settings.rememberState) restorePlayerState();
  tryAutoScanOnStartV6();

  // Start-Tab
  setTimeout(() => switchToSection(Settings.startSection || 'home'), 0);

  /* ------------------ SETTINGS  ------------------ */
  function loadSettings() {
    try {
      const raw = localStorage.getItem(CONFIG.SAVE_KEY);
      const s = raw ? JSON.parse(raw) : {};
      return {
        accent: s.accent || CONFIG.DEFAULT_ACCENT,
        density: s.density || 'comfortable',
        autoScan: !!s.autoScan,
        rememberState: !!s.rememberState,
        sort: s.sort || 'alpha-asc',
        startSection: s.startSection || 'home',
        gridCols: s.gridCols || 8,
        hardPath: s.hardPath || "",
        hardAuto: !!s.hardAuto,
      };
    } catch { return { accent: CONFIG.DEFAULT_ACCENT, density: 'comfortable', autoScan: false, rememberState: false, sort:'alpha-asc', startSection:'home', gridCols:8, hardPath:"", hardAuto:false }; }
  }
  function saveSettings() { localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(Settings)); }
  function applySettings() {
    document.documentElement.style.setProperty('--accent', Settings.accent || CONFIG.DEFAULT_ACCENT);
    if ((Settings.density||'comfortable') === 'compact') document.body.classList.add('compact');
    el.accentPicker.value = Settings.accent || CONFIG.DEFAULT_ACCENT;
    el.density.value = Settings.density || 'comfortable';
    el.autoScan.checked = !!Settings.autoScan;
    el.rememberState.checked = !!Settings.rememberState;
    el.startSection.value = Settings.startSection || 'home';
    el.hardPath.value = Settings.hardPath || "";
    el.hardAuto.checked = !!Settings.hardAuto;
    applyGridCols();
  }
  function applyGridCols() {
    const n = Math.max(1, Math.min(24, Settings.gridCols || 8));
    document.documentElement.style.setProperty('--grid-cols', n);
  }

  /* ------------------ IndexedDB Folder Handles ------------------ */
  function idbOpen() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(CONFIG.HANDLE_DB, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(CONFIG.HANDLE_STORE)) db.createObjectStore(CONFIG.HANDLE_STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function idbPut(key, value) {
    const db = await idbOpen();
    return await new Promise((res, rej) => {
      const tx = db.transaction(CONFIG.HANDLE_STORE, 'readwrite');
      tx.objectStore(CONFIG.HANDLE_STORE).put(value, key);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  }
  async function idbGet(key) {
    const db = await idbOpen();
    return await new Promise((res, rej) => {
      const tx = db.transaction(CONFIG.HANDLE_STORE, 'readonly');
      const req = tx.objectStore(CONFIG.HANDLE_STORE).get(key);
      req.onsuccess = () => res(req.result || null);
      req.onerror = () => rej(req.error);
    });
  }

  /* ------------------ FAV ------------------ */
  function loadFavorites() { try { const raw = localStorage.getItem(CONFIG.FAV_KEY); return raw ? JSON.parse(raw) : {}; } catch { return {}; } }
  function saveFavorites() { localStorage.setItem(CONFIG.FAV_KEY, JSON.stringify(Favorites)); }
  function favKeyForTrack(t) { return (t && t.path) || ""; }
  function isFavorite(t) { return !!Favorites[favKeyForTrack(t)]; }
  function toggleFavorite(t) {
    const key = favKeyForTrack(t);
    if (!key) return;
    if (Favorites[key]) delete Favorites[key]; else Favorites[key] = Date.now();
    saveFavorites();
    document.querySelectorAll(`.btn-heart[data-path="${cssEscape(key)}"]`).forEach(btn => updateFavButton(btn, t));
    updateFavCurrentButton();
    renderHomeFavorites();
    renderFavorites();
  }
  function toggleFavoriteCurrent() { const t = currentTrack(); if (t) toggleFavorite(t); }
  function updateFavButton(btn, t) {
    const active = isFavorite(t);
    btn.classList.toggle('fav-active', active);
    const useEl = btn.querySelector('use'); useEl?.setAttribute('href', active ? '#i-heart-fill' : '#i-heart');
    btn.title = active ? 'Als Favorit markiert' : 'Als Favorit speichern';
  }
  function updateFavCurrentButton() {
    const t = currentTrack();
    if (!t) { el.iconFavCurrent.setAttribute('href', '#i-heart'); return; }
    el.iconFavCurrent.setAttribute('href', isFavorite(t) ? '#i-heart-fill' : '#i-heart');
  }
  function cssEscape(str) { return (str||"").replace(/["\\]/g, "\\$&"); }

  /* ------------------ SCAN ------------------ */
  async function pickFolderAndBindLast() {
    if (!window.showDirectoryPicker) {
      alert("Dein Browser unterstützt die moderne Ordnerauswahl nicht. Bitte nutze die 'Alternative Auswahl'.");
      return;
    }
    try {
      const handle = await window.showDirectoryPicker();
      State.folderHandle = handle;
      await idbPut(CONFIG.HANDLE_LAST_KEY, handle);
      await scanDirectory(handle);
    } catch (e) {
      console.warn(e);
      logScanStatus("Ordnerauswahl abgebrochen.");
    }
  }

  async function bindHardPathHandle() {
    if (!window.showDirectoryPicker) { alert("Moderne Ordnerauswahl wird benötigt (Chrome/Edge)."); return; }
    try {
      const handle = await window.showDirectoryPicker();
      await idbPut(CONFIG.HANDLE_HARD_KEY, handle);
      el.scanStatus.textContent = "Fester Pfad zugewiesen. (Der echte Zugriff ist jetzt gespeichert.)";
    } catch (e) {
      console.warn(e);
      el.scanStatus.textContent = "Zuweisung abgebrochen.";
    }
  }

  async function tryAutoScanOnStartV6() {
    if (Settings.hardAuto) {
      const hardHandle = await idbGet(CONFIG.HANDLE_HARD_KEY);
      if (hardHandle) {
        try {
          let perm = await hardHandle.queryPermission?.({ mode: 'read' });
          if (perm !== 'granted') perm = await hardHandle.requestPermission?.({ mode: 'read' });
          if (perm === 'granted') {
            State.folderHandle = hardHandle;
            await scanDirectory(hardHandle); return;
          } else { logScanStatus('Autoscan (fester Pfad): Zugriff verweigert – bitte erneut zuweisen.'); }
        } catch (e) { console.warn('autoscan hard', e); logScanStatus('Autoscan (fester Pfad): Fehler – bitte erneut zuweisen.'); }
      } else { logScanStatus('Autoscan (fester Pfad): kein gespeicherter Zugriff – bitte „Ordner zuweisen“ durchführen.'); }
    }
    if (Settings.autoScan) {
      const lastHandle = await idbGet(CONFIG.HANDLE_LAST_KEY);
      if (lastHandle) {
        try {
          let perm = await lastHandle.queryPermission?.({ mode: 'read' });
          if (perm !== 'granted') perm = await lastHandle.requestPermission?.({ mode: 'read' });
          if (perm === 'granted') {
            State.folderHandle = lastHandle;
            await scanDirectory(lastHandle); return;
          } else { logScanStatus('Autoscan (zuletzt): Zugriff verweigert – bitte Ordner erneut wählen.'); }
        } catch (e) { console.warn('autoscan last', e); logScanStatus('Autoscan (zuletzt): Fehler – bitte Ordner erneut wählen.'); }
      } else { logScanStatus('Autoscan (zuletzt): kein gemerkter Ordner vorhanden.'); }
    }
  }

  async function scanDirectory(dirHandle) {
    resetLibrary();
    logScanStatus("Scanne… (dies kann je nach Größe dauern)");
    const stack = [{ handle: dirHandle, path: "" }];
    let count = 0;

    while (stack.length) {
      const { handle, path } = stack.pop();
      for await (const [name, child] of handle.entries()) {
        if (child.kind === 'directory') {
          stack.push({ handle: child, path: path ? `${path}/${name}` : name });
        } else {
          const lower = name.toLowerCase();
          const ext = lower.slice(lower.lastIndexOf('.'));
          const file = await child.getFile();
          if (CONFIG.ACCEPTED_EXT.includes(ext)) {
            const folderPath = path || "";
            const url = URL.createObjectURL(file);
            const mtime = file.lastModified || Date.now();
            const track = createTrackFromFilename(name, { folderPath, url, file, mtime });
            addTrack(track);
            count++;
            if (count % 50 === 0) logScanStatus(`Scanne… ${count} Titel gefunden`);
          }
        }
      }
    }

    await findFolderCovers(dirHandle);
    buildLibrary();
    renderAll();
    logScanStatus(`Fertig – ${State.tracks.length} Titel gefunden, ${State.albums.length} Alben, ${State.folders.length} Ordner.`);
  }

  function importFromFileList(fileList) {
    resetLibrary();
    State.lastFiles = fileList;
    logScanStatus("Importiere aus alternativer Auswahl …");
    let count = 0;
    const coverMap = new Map();

    [...fileList].forEach(file => {
      const name = file.name.toLowerCase();
      const ext = name.slice(name.lastIndexOf('.'));
      const rel = (file.webkitRelativePath || "").split('/').slice(0, -1).join('/');
      const folderPath = rel || "";

      if (CONFIG.ACCEPTED_EXT.includes(ext)) {
        const url = URL.createObjectURL(file);
        const mtime = file.lastModified || Date.now();
        const track = createTrackFromFilename(file.name, { folderPath, url, file, mtime });
        addTrack(track);
        count++; return;
      }
      if ((ext === '.jpg' || ext === '.jpeg') && (name.includes('cov') || name.includes('cover'))) {
        const url = URL.createObjectURL(file);
        coverMap.set(folderPath, url);
      }
    });

    State.tracks.forEach(t => { if (coverMap.has(t.folderPath)) t.coverURL = coverMap.get(t.folderPath); });

    buildLibrary();
    renderAll();
    logScanStatus(`Fertig – ${State.tracks.length} Titel importiert, ${State.albums.length} Alben, ${State.folders.length} Ordner.`);
  }

  function resetLibrary() {
    State.tracks.forEach(t => t.url && URL.revokeObjectURL(t.url));
    State.tracks = []; State.albums = []; State.folders = [];
    State.queue = []; State.current = -1;
  }

  function logScanStatus(msg) { el.scanStatus.textContent = msg; }

  function createTrackFromFilename(fileName, { folderPath, url, file, mtime }) {
    const base = fileName.replace(/\.[^/.]+$/, '');
    let artist = "Unbekannt"; let title = base;
    let album = folderPath.split('/').pop() || "Unbekanntes Album";

    const parts = base.split(' - ');
    if (parts.length === 2) { artist = parts[0].trim() || artist; title = parts[1].trim() || title; }
    else { title = base.replace(/^\d+[\s\.\-\_]+/, '').trim(); }

    const id = crypto.randomUUID();
    return { id, name: title, artist, album, path: folderPath + "/" + fileName, fileName, file, url, folderPath, mtime };
  }

  async function findFolderCovers(rootHandle) {
    const covers = new Map();
    const stack = [{ handle: rootHandle, path: "" }];
    while (stack.length) {
      const { handle, path } = stack.pop();
      for await (const [name, child] of handle.entries()) {
        if (child.kind === 'directory') {
          stack.push({ handle: child, path: path ? `${path}/${name}` : name });
        } else {
          const lower = name.toLowerCase();
          if ((lower.endsWith('.jpg') || lower.endsWith('.jpeg')) && (lower.includes('cov') || lower.includes('cover'))) {
            const file = await child.getFile();
            const url = URL.createObjectURL(file);
            covers.set(path, url);
          }
        }
      }
    }
    State.tracks.forEach(t => { if (covers.has(t.folderPath)) t.coverURL = covers.get(t.folderPath); });
  }

  
  /* ------------------ COVER SCAN ------------------ */
  async function coverScan() {
    try {
      if (State.folderHandle) {
        await findFolderCovers(State.folderHandle);
        renderAll();
        logScanStatus("Albumcover neu indiziert (Handle).");
        return;
      }
      if (State.lastFiles) {
        const coverMap = new Map();
        [...State.lastFiles].forEach(file => {
          const name = file.name.toLowerCase();
          const ext = name.slice(name.lastIndexOf('.'));
          const rel = (file.webkitRelativePath || "").split('/').slice(0, -1).join('/');
          if ((ext === '.jpg' || ext === '.jpeg') && (name.includes('cov') || name.includes('cover'))) {
            const url = URL.createObjectURL(file);
            coverMap.set(rel, url);
          }
        });
        State.tracks.forEach(t => { if (coverMap.has(t.folderPath)) t.coverURL = coverMap.get(t.folderPath); });
        renderAll();
        logScanStatus("Albumcover neu indiziert (Alternative Auswahl).");
        return;
      }
      logScanStatus("Kein Ordner/Dateiliste verknüpft – bitte zuerst Musikquelle wählen.");
    } catch (e) {
      console.warn("coverScan error", e);
      logScanStatus("Cover-Scan Fehler — Details in Konsole.");
    }
  }


  /* ------------------ LIB BUILD & RENDER ------------------ */
  function addTrack(track) { State.tracks.push(track); }

  function buildLibrary() {
    const folderMap = new Map();
    for (const t of State.tracks) {
      if (!folderMap.has(t.folderPath)) {
        folderMap.set(t.folderPath, { name: t.folderPath.split('/').pop() || "ROOT", path: t.folderPath, coverURL: t.coverURL || null, trackIds: [] });
      }
      folderMap.get(t.folderPath).trackIds.push(t.id);
      if (!folderMap.get(t.folderPath).coverURL && t.coverURL) folderMap.get(t.folderPath).coverURL = t.coverURL;
    }
    State.folders = [...folderMap.values()];
    State.albums = State.folders.map(f => ({ name: f.name, folderPath: f.path, coverURL: f.coverURL, trackIds: f.trackIds.slice(0) }));
    State.queue = State.tracks.map(t => t.id);
    sortGlobal(Settings.sort || 'alpha-asc');
  }

  function renderAll() {
    renderHome(); renderAlbums(); renderTracks(); renderFolders(); renderFavorites();
    updatePlayerUI(); refillFilterBars(); refreshRangeFills(); updatePlayingHighlights(); updateFavCurrentButton();
  }

  function renderHome() {
    renderHomeFavorites();
    const a = el.home.albums; a.innerHTML = ""; sortAlbums(Settings.sort).slice(0,12).forEach(x=>a.appendChild(renderAlbumCard(x)));
    const t = el.home.tracks; t.innerHTML = ""; sortTracks(Settings.sort).slice(0,18).forEach(x=>t.appendChild(renderTrackRow(x)));
    const f = el.home.folders; f.innerHTML = ""; sortFolders(Settings.sort).slice(0,30).forEach(x=>f.appendChild(renderFolderRowHome(x)));
  }

  function renderHomeFavorites() {
    const cont = el.home.favorites; cont.innerHTML = "";
    const favEntries = Object.entries(Favorites);
    if (!favEntries.length) { const e = document.createElement('div'); e.className="text-dim small ps-2"; e.textContent="Noch keine Favoriten."; cont.appendChild(e); return; }
    const byPath = new Map(State.tracks.map(t => [t.path, t]));
    favEntries.sort((a,b)=> b[1]-a[1]);
    let n=0; for (const [path] of favEntries) { const t = byPath.get(path); if (!t) continue; cont.appendChild(renderTrackRow(t)); if(++n>=12) break; }
  }

  function renderFavorites() {
    const cont = el.favoritesList; cont.innerHTML = "";
    const byPath = new Map(State.tracks.map(t => [t.path, t]));
    const favs = Object.keys(Favorites).map(p => byPath.get(p)).filter(Boolean);
    if (!favs.length) { const e=document.createElement('div'); e.className="text-dim small ps-2"; e.textContent="Keine Favoriten gespeichert."; cont.appendChild(e); return; }
    sortArrayBySettings(favs).forEach(t => cont.appendChild(renderTrackRow(t)));
  }

  function renderAlbums() { el.albumsGrid.innerHTML=""; sortAlbums(Settings.sort).forEach(a=>el.albumsGrid.appendChild(renderAlbumCard(a))); }
  function renderTracks() { el.tracksList.innerHTML=""; sortTracks(Settings.sort).forEach(t=>el.tracksList.appendChild(renderTrackRow(t))); }
  function renderFolders() { el.foldersGrid.innerHTML=""; sortFolders(Settings.sort).forEach(f=>el.foldersGrid.appendChild(renderFolderCard(f))); }

  function renderAlbumCard(album) {
    const card = document.createElement('div');
    card.className = "album-card";
    card.innerHTML = `
      <img class="album-cover" src="${album.coverURL || 'assets/img/logo50.png'}" alt="Cover">
      <div class="album-meta">
        <div class="album-title text-truncate" title="${escapeHtml(stripParens(album.name))}">${escapeHtml(stripParens(album.name))}</div>
        <div class="album-sub text-truncate">${album.trackIds.length} Tracks</div>
        <div class="d-flex gap-2 mt-2">
          <button class="btn btn-primary btn-sm">Abspielen</button>
          <button class="btn btn-ghost btn-sm">Ansehen</button>
        </div>
      </div>
    `;
    const [btnPlay, btnView] = card.querySelectorAll('button');
    btnPlay.addEventListener('click', () => playAlbum(album));
    btnView.addEventListener('click', () => {
      switchToSection('tracks');
      const firstId = album.trackIds[0];
      const row = document.querySelector(`[data-track-id="${firstId}"]`);
      row && row.scrollIntoView({behavior:'smooth', block:'center'});
    });
    return card;
  }

  
  function renderFolderRowHome(folder) {
    // Container item
    const container = document.createElement('div');
    container.className = "list-group-item";

    // Header row (click to expand/collapse)
    const head = document.createElement('div');
    head.className = "folder-head d-flex align-items-center gap-3";
    head.innerHTML = `
      <img src="assets/img/folder6.png" class="icon" alt="Folder">
      <div class="folder-title text-truncate">${escapeHtml(stripParens(folder.name))}</div>
      <div class="ms-auto text-dim small">${folder.trackIds.length} Tracks</div>
    `;

    // Expand area
    const expand = document.createElement('div');
    expand.className = "folder-expand d-none";

    // Toggle behavior
    head.addEventListener('click', () => {
      const opening = expand.classList.contains('d-none');
      document.querySelectorAll('#home-folders .folder-expand').forEach(e => e.classList.add('d-none'));
      if (opening) {
        // First build if empty
        if (!expand.dataset.built) {
          const headerBar = document.createElement('div');
          headerBar.className = "d-flex align-items-center gap-2 mb-1";
          const playAll = document.createElement('button');
          playAll.className = "btn btn-ghost btn-sm";
          playAll.textContent = "Play all";
          playAll.addEventListener('click', (ev) => { ev.stopPropagation(); playFolder(folder); });
          headerBar.appendChild(playAll);
          expand.appendChild(headerBar);

          const list = document.createElement('div');
          folder.trackIds.forEach(id => {
            const t = trackById(id);
            if (!t) return;
            const row = document.createElement('div');
            row.className = "track-subrow track-item d-flex justify-content-between align-items-center";
            row.dataset.trackId = id;

            const left = document.createElement('div');
            left.className = "d-flex align-items-center gap-3 text-start";
            left.innerHTML = `
              <img src="${t.coverURL || 'assets/img/logo.png'}" class="rounded" style="width:32px;height:32px;object-fit:cover" alt="Cover">
              <div class="text-truncate">
                <div class="track-title text-truncate">${escapeHtml(stripParens(t.name))}</div>
                <div class="text-dim small text-truncate">${escapeHtml(stripParens(t.artist))}</div>
              </div>
            `;

            const right = document.createElement('div');
            right.className = "d-flex align-items-center gap-2";
            right.innerHTML = `<span class="badge" style="background: rgba(108,77,245,.15); border:1px solid var(--accent); color:#fff">${formatTimeShort(t.duration)}</span>`;

            const btn = document.createElement('button');
            btn.type = "button";
            btn.className = "btn btn-ghost btn-heart";
            btn.innerHTML = `<svg class="icon"><use href="#i-heart"></use></svg>`;
            btn.dataset.path = t.path;
            btn.addEventListener('click', (e) => { e.stopPropagation(); toggleFavorite(t); });
            right.appendChild(btn);

            row.appendChild(left);
            row.appendChild(right);

            row.addEventListener('click', (ev) => { ev.stopPropagation(); playTrack(id); });
            updateFavButton(btn, t);
            list.appendChild(row);
          });
          expand.appendChild(list);
          expand.dataset.built = "1";
        }
        expand.classList.remove('d-none');
      } else {
        expand.classList.add('d-none');
      }
    });

    container.appendChild(head);
    container.appendChild(expand);
    return container;
  }

  function renderFolderCard(folder) {
    const card = document.createElement('div');
    card.className = "folder-card";
    const imgSrc = CONFIG.SHOW_FOLDER_COVERS && folder.coverURL ? folder.coverURL : 'assets/img/folder.png';
    card.innerHTML = `
      <img class="album-cover" src="${imgSrc}" alt="Folder">
      <div class="album-meta">
        <div class="album-title text-truncate" title="${escapeHtml(stripParens(folder.name))}">${escapeHtml(stripParens(folder.name))}</div>
        <div class="album-sub text-truncate">${folder.trackIds.length} Tracks</div>
        <div class="d-flex gap-2 mt-2">
          <button class="btn btn-primary btn-sm">Abspielen</button>
          <button class="btn btn-ghost btn-sm">Öffnen</button>
        </div>
      </div>
    `;
    const [btnPlay, btnOpen] = card.querySelectorAll('button');
    btnPlay.addEventListener('click', () => playFolder(folder));
    btnOpen.addEventListener('click', () => {
      switchToSection('tracks');
      const firstId = folder.trackIds[0];
      const row = document.querySelector(`[data-track-id="${firstId}"]`);
      row && row.scrollIntoView({behavior:'smooth', block:'center'});
    });
    return card;
  }

  function renderTrackRow(track) {
    const item = document.createElement('div');
    item.className = "list-group-item track-item d-flex justify-content-between align-items-center";
    item.dataset.trackId = track.id;
    item.addEventListener('click', () => playTrack(track.id));

    const left = document.createElement('div');
    left.className = "d-flex align-items-center gap-3 text-start";
    left.innerHTML = `
      <img src="${track.coverURL || 'assets/img/logo.png'}" class="rounded" style="width:40px;height:40px;object-fit:cover" alt="Cover">
      <div class="text-truncate">
        <div class="track-title text-truncate">${escapeHtml(stripParens(track.name))}</div>
        <div class="text-dim small text-truncate">${escapeHtml(stripParens(track.artist))} • ${escapeHtml(stripParens(track.album))}</div>
      </div>
    `;

    const right = document.createElement('div');
    right.className = "d-flex align-items-center gap-2";
    right.innerHTML = `<span class="badge" style="background: rgba(108,77,245,.15); border:1px solid var(--accent); color:#fff">${formatTimeShort(track.duration)}</span>`;

    const btn = document.createElement('button');
    btn.type = "button";
    btn.className = "btn btn-ghost btn-heart";
    btn.innerHTML = `<svg class="icon"><use href="#i-heart"></use></svg>`;
    btn.dataset.path = track.path;
    btn.addEventListener('click', (e) => { e.stopPropagation(); toggleFavorite(track); });
    right.appendChild(btn);

    item.appendChild(left); item.appendChild(right);
    updateFavButton(btn, track);
    const ct = currentTrack(); if (ct && ct.id === track.id) item.classList.add('playing');
    return item;
  }

  function refillFilterBars() {
    document.querySelectorAll('.filter').forEach(area => {
      area.innerHTML = "";
      const select = document.createElement('select');
      select.className = 'form-select form-select-sm';
      select.innerHTML = `
        <option value="alpha-asc">A → Z</option>
        <option value="alpha-desc">Z → A</option>
        <option value="date-asc">Datum alt → neu</option>
        <option value="date-desc">Datum neu → alt</option>
      `;
      select.value = Settings.sort || 'alpha-asc';
      select.addEventListener('change', (e) => {
        Settings.sort = e.target.value; saveSettings();
        sortGlobal(Settings.sort); renderAll();
      });
      area.appendChild(select);
    });
  }

  function switchToSection(name) {
    const link = document.querySelector(`.main-tabs .nav-link[data-section="${name}"]`);
    if (link) link.click();
  }

  /* ------------------ SORT ------------------ */
  function sortGlobal(mode) {
    if (mode && mode.startsWith('alpha')) {
      State.queue.sort((a,b) => cmp(trackById(a).name, trackById(b).name) * (mode.endsWith('desc')?-1:1));
    } else {
      State.queue.sort((a,b) => (trackById(a).mtime - trackById(b).mtime) * (mode && mode.endsWith('desc')? -1:1));
    }
  }
  function sortArrayBySettings(arr) {
    const mode = Settings.sort || 'alpha-asc';
    const a = arr.slice(0);
    if (mode.startsWith('alpha')) a.sort((x,y)=>cmp(x.name,y.name)*(mode.endsWith('desc')?-1:1));
    else a.sort((x,y)=> (x.mtime-y.mtime)*(mode.endsWith('desc')?-1:1));
    return a;
  }
  function sortTracks(mode) {
    const arr = State.tracks.slice(0);
    if ((mode||'alpha-asc').startsWith('alpha')) arr.sort((a,b)=>cmp(a.name,b.name)*((mode||'alpha-asc').endsWith('desc')?-1:1));
    else arr.sort((a,b)=> (a.mtime-b.mtime)*((mode||'alpha-asc').endsWith('desc')?-1:1));
    return arr;
  }
  function sortAlbums(mode) {
    const arr = State.albums.slice(0);
    if ((mode||'alpha-asc').startsWith('alpha')) arr.sort((a,b)=>cmp(a.name,b.name)*((mode||'alpha-asc').endsWith('desc')?-1:1));
    else arr.sort((a,b)=> (minMtime(a)-minMtime(b))*((mode||'alpha-asc').endsWith('desc')?-1:1));
    return arr;
  }
  function sortFolders(mode) {
    const arr = State.folders.slice(0);
    if ((mode||'alpha-asc').startsWith('alpha')) arr.sort((a,b)=>cmp(a.name,b.name)*((mode||'alpha-asc').endsWith('desc')?-1:1));
    else arr.sort((a,b)=> (minMtime(a)-minMtime(b))*((mode||'alpha-asc').endsWith('desc')?-1:1));
    return arr;
  }
  function minMtime(group) {
    return (group.trackIds || []).map(id => trackById(id).mtime).reduce((a,b)=>Math.min(a,b), Number.MAX_SAFE_INTEGER);
  }

  /* ------------------ SEARCH ------------------ */
  el.searchInput.addEventListener('input', () => doSearch(el.searchInput.value.trim()));
  function doSearch(q) {
    const cont = el.searchResults; const res = [];
    if (!q) { cont.innerHTML = ""; return; }
    const ql = q.toLowerCase();
    State.tracks.forEach(t => {
      if ((t.name+" "+t.artist+" "+t.album).toLowerCase().includes(ql)) {
        res.push(renderSearchRow({type:'track', title:stripParens(t.name), sub:`${stripParens(t.artist)} • ${stripParens(t.album)}`, id:t.id, cover:t.coverURL}));
      }
    });
    State.albums.forEach(a => {
      if (a.name.toLowerCase().includes(ql)) {
        res.push(renderSearchRow({type:'album', title:stripParens(a.name), sub:`${a.trackIds.length} Tracks`, id:a.folderPath, cover:a.coverURL}));
      }
    });
    State.folders.forEach(f => {
      if (f.name.toLowerCase().includes(ql)) {
        res.push(renderSearchRow({type:'folder', title:stripParens(f.name), sub:f.path, id:f.path, cover:f.coverURL}));
      }
    });
    cont.innerHTML = "";
    if (!res.length) { const empty = document.createElement('div'); empty.className = "text-dim small"; empty.textContent = "Keine Treffer."; cont.appendChild(empty); }
    else { res.forEach(x => cont.appendChild(x)); }
  }

  function renderSearchRow({type, title, sub, id, cover}) {
    const item = document.createElement('button');
    item.className = "list-group-item list-group-item-action d-flex align-items-center gap-3 text-start";
    item.innerHTML = `
      <img src="${cover || 'assets/img/logo.png'}" class="rounded" style="width:40px;height:40px;object-fit:cover" alt="">
      <div class="flex-grow-1">
        <div class="track-title text-truncate">${escapeHtml(title)}</div>
        <div class="text-dim small text-truncate">${escapeHtml(sub||'')}</div>
      </div>
      <span class="badge" style="background: rgba(108,77,245,.15); border:1px solid var(--accent); color:#fff">${type}</span>
    `;
    item.addEventListener('click', () => {
      offSearch && offSearch.hide();
      if (type === 'track') playTrack(id);
      if (type === 'album') {
        const album = State.albums.find(a => a.folderPath === id);
        if (album) playAlbum(album);
      }
      if (type === 'folder') {
        const folder = State.folders.find(f => f.path === id);
        if (folder) playFolder(folder);
      }
    });
    return item;
  }

  /* ------------------ PLAYER ------------------ */
  function playAlbum(album) {
    State.queue = album.trackIds.slice(0); State.current = 0; loadCurrentAndPlay();
  }
  function playFolder(folder) {
    State.queue = folder.trackIds.slice(0); State.current = 0; loadCurrentAndPlay();
  }
  function playTrack(trackId) {
    State.queue = [trackId, ...State.tracks.filter(t=>t.id!==trackId).map(t=>t.id)];
    State.current = 0; loadCurrentAndPlay();
  }
  function trackById(id) { return State.tracks.find(t => t.id === id); }
  function currentTrack() { return State.queue.length ? trackById(State.queue[State.current]) : null; }

  function loadCurrentAndPlay(autoplay=true) {
    const t = currentTrack(); if (!t) return;
    el.audio.src = t.url;
    el.audio.playbackRate = 1.0;
    if (!isNaN(State.volume)) el.audio.volume = State.volume;
    el.npCover.src = t.coverURL || 'assets/img/logo.png';
    el.npTitle.textContent = stripParens(t.name) || "Unbekannt";
    el.npSub.textContent = `${stripParens(t.artist || 'Unbekannt')} • ${stripParens(t.album || '–')}`;

    if (autoplay) el.audio.play().catch(console.warn);
    updatePlayPauseUI(); updatePlayingHighlights(); updateFavCurrentButton(); savePlayerState();
  }

  function togglePlay() { if (el.audio.paused) el.audio.play(); else el.audio.pause(); updatePlayPauseUI(); }
  function updatePlayPauseUI() { el.iconPlayPause.setAttribute('href', el.audio.paused ? '#i-play' : '#i-pause'); }
  function skip(dir) {
    if (!State.queue.length) return;
    if (State.shuffle) {
      State.current = Math.floor(Math.random() * State.queue.length);
    } else {
      State.current += dir;
      if (State.current < 0) State.current = State.queue.length - 1;
      if (State.current >= State.queue.length) State.current = 0;
    }
    loadCurrentAndPlay(true);
  }
  function toggleShuffle() { State.shuffle = !State.shuffle; toggleBtnPrimary(el.btnShuffle, State.shuffle); }
  function cycleRepeat() {
    State.repeat = (State.repeat === 'off') ? 'one' : (State.repeat === 'one' ? 'all' : 'off');
    toggleBtnPrimary(el.btnRepeat, State.repeat !== 'off');
    el.btnRepeat.title = State.repeat === 'one' ? 'Repeat (Titel)' : (State.repeat === 'all' ? 'Repeat (Alle)' : 'Repeat aus');
  }
  function toggleBtnPrimary(btn, active) {
    btn.classList.toggle('btn-primary', !!active);
    btn.classList.toggle('btn-ghost', !active);
  }
  function onEnded() {
    if (State.repeat === 'one') { el.audio.currentTime = 0; el.audio.play(); }
    else if (State.shuffle) { skip(1); }
    else if (State.current < State.queue.length-1) { State.current++; loadCurrentAndPlay(true); }
    else if (State.repeat === 'all') { State.current = 0; loadCurrentAndPlay(true); }
    else { updatePlayPauseUI(); }
  }
  function onSeekInput() {
    const dur = el.audio.duration || 0;
    const val = (el.seek.value/100) * dur;
    el.audio.currentTime = val;
    paintRangeFill(el.seek);
  }
  function onSeekChange() {}
  function onVolume() { State.volume = parseFloat(el.vol.value); el.audio.volume = State.volume; paintRangeFill(el.vol); }
  function toggleMute() { State.muted = !State.muted; el.audio.muted = State.muted; el.iconVol.setAttribute('href', State.muted ? '#i-mute' : '#i-volume'); }
  function toggleFullscreen() { const elem = document.documentElement; if (!document.fullscreenElement) elem.requestFullscreen?.(); else document.exitFullscreen?.(); }
  function updateTime() {
    const cur = el.audio.currentTime || 0; const dur = el.audio.duration || 0;
    el.timeCur.textContent = formatTime(cur);
    el.timeTot.textContent = isFinite(dur) ? formatTime(dur) : "0:00";
    el.seek.value = dur ? Math.round((cur/dur)*100) : 0; paintRangeFill(el.seek);
  }
  function updateDuration() { const dur = el.audio.duration || 0; el.timeTot.textContent = isFinite(dur) ? formatTime(dur) : "0:00"; paintRangeFill(el.seek); }
  function updatePlayerUI() {
    toggleBtnPrimary(el.btnShuffle, State.shuffle);
    toggleBtnPrimary(el.btnRepeat, State.repeat !== 'off');
    el.iconVol.setAttribute('href', State.muted ? '#i-mute' : '#i-volume');
  }
  function hotkeys(e) {
    if (e.target.matches('input,textarea')) return;
    if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
    if (e.code === 'ArrowRight') { el.audio.currentTime += 5; }
    if (e.code === 'ArrowLeft') { el.audio.currentTime -= 5; }
    if (e.code === 'ArrowUp') { el.vol.value = Math.min(1, parseFloat(el.vol.value)+0.05); onVolume(); }
    if (e.code === 'ArrowDown') { el.vol.value = Math.max(0, parseFloat(el.vol.value)-0.05); onVolume(); }
    if (e.code === 'KeyF') { toggleFavoriteCurrent(); }
  }

  function updatePlayingHighlights() {
    const ct = currentTrack();
    document.querySelectorAll('.track-item').forEach(row => row.classList.remove('playing'));
    if (!ct) return;
    document.querySelectorAll(`.track-item[data-track-id="${ct.id}"]`).forEach(row => row.classList.add('playing'));
  }

  /* ------------------ Slider Fill Helpers ------------------ */
  function paintRangeFill(input) {
    const min = parseFloat(input.min || 0), max = parseFloat(input.max || 1), val = parseFloat(input.value || 0);
    const pct = 100 * (val - min) / (max - min || 1);
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    const bg = `linear-gradient(to right, ${accent} 0%, ${accent} ${pct}%, #3a3f47 ${pct}%, #3a3f47 100%)`;
    input.style.background = bg;
  }
  function refreshRangeFills() {
    document.querySelectorAll('.range-accent').forEach(paintRangeFill);
  }

  /* ------------------ HELPER ------------------ */
  function stripParens(str) { if (!str) return ""; return str.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s{2,}/g,' ').trim(); }
  function formatTime(sec) { const s = Math.floor(sec % 60).toString().padStart(2,'0'); const m = Math.floor(sec / 60); return `${m}:${s}`; }
  function formatTimeShort(sec) { if (!sec || !isFinite(sec)) return "–:–"; return formatTime(sec); }
  function cmp(a,b) { return a.localeCompare(b, undefined, {sensitivity:'base'}); }
  function escapeHtml(str) { return (str||"").replace(/[&<>\"']/g, (m)=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;" }[m])); }

  function savePlayerState() {
    if (!Settings.rememberState) return;
    const data = { queue: State.queue, current: State.current, volume: State.volume, muted: State.muted, shuffle: State.shuffle, repeat: State.repeat };
    localStorage.setItem(CONFIG.STATE_KEY, JSON.stringify(data));
  }
  function restorePlayerState() {
    try {
      const raw = localStorage.getItem(CONFIG.STATE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      State.queue = d.queue || [];
      State.current = typeof d.current==='number' ? d.current : -1;
      State.volume = typeof d.volume==='number' ? d.volume : 1;
      State.muted = !!d.muted;
      State.shuffle = !!d.shuffle;
      State.repeat = d.repeat || 'off';
      updatePlayerUI();
    } catch(e){ console.warn(e); }
  }

})(); 
