import { LEVELS, ANIMALS, REGIONS, regionOf, type LevelDef, type RegionId } from '../config/levels';
import { store, type Quality } from '../systems/Save';
import { ASSETS } from '../config/level';
import type { ResultInfo } from '../scenes/LevelScene';

export interface Controller {
  startLevel(id: number): void; restart(): void; exitToMenu(screen: Screen): void;
  pause(): void; resume(): void; unlockAudio(): void; click(): void;
  setQuality(): void; backdrop(visible: boolean): void;
}
export type Screen = 'menu' | 'map' | 'levels' | 'collection';
export interface HudData {
  water: number; burn: number; out: number; total: number; animalHp: number; animalDanger: boolean;
  refilling: boolean; stars: boolean[]; firing: boolean; tip: number; boom: number;
}

const A = (k: string) => `/assets/ui/${k}.webp`;
const ico = {
  play: '<svg viewBox="0 0 24 24"><path d="M7 4.5v15l12-7.5z" fill="currentColor"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M12 21s-8-5.3-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.7-8 11-8 11z" fill="currentColor"/></svg>',
  paw: '<svg viewBox="0 0 24 24" fill="currentColor"><ellipse cx="6" cy="10" rx="2.2" ry="3"/><ellipse cx="10" cy="6" rx="2.2" ry="3"/><ellipse cx="14.5" cy="6" rx="2.2" ry="3"/><ellipse cx="18.5" cy="10" rx="2.2" ry="3"/><path d="M12 11c-3 0-6.5 4.3-6.5 6.6 0 1.6 1.3 2.4 3 2.4 1.4 0 2.2-.8 3.5-.8s2.1.8 3.5.8c1.7 0 3-.8 3-2.4C18.5 15.3 15 11 12 11z"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L15 3.3h-4l-.4 2.6a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.4 7.4 0 0 0 1.7 1l.4 2.6h4l.4-2.6a7.4 7.4 0 0 0 1.7-1l2.5 1 2-3.5zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" transform="translate(-1 0)"/></svg>',
};
const star = (on: boolean) => `<img class="star" src="${A(on ? 'star-gold' : 'star-silver')}" alt="${on ? 'bintang' : 'belum'}"/>`;

export class GameUI {
  driveDir = 0;
  tipDir = 0;
  boomDir = 0;
  sprayHeld = false;
  /** Pending zoom steps from the HUD buttons (+1 in, -1 out), consumed by the scene. */
  zoomRequest = 0;
  private root = document.querySelector<HTMLDivElement>('#ui')!;
  private screen: HTMLDivElement;
  private overlay: HTMLDivElement;
  private hudEl: HTMLDivElement;
  private toastEl: HTMLDivElement;
  private toastTimer: number | undefined;
  private level: LevelDef = LEVELS[0];
  private selected = 1;
  /** Region whose level board is shown. */
  private region: RegionId = 'jawa';
  private current: Screen = 'menu';
  private els: Record<string, HTMLElement> = {};
  private paused = false;

  constructor(private c: Controller) {
    this.root.innerHTML = `
      <div class="hud" hidden></div>
      <div class="screen"></div>
      <div class="overlay" hidden></div>
      <div class="toast" role="status" aria-live="polite"></div>`;
    this.hudEl = this.root.querySelector('.hud')!;
    this.screen = this.root.querySelector('.screen')!;
    this.overlay = this.root.querySelector('.overlay')!;
    this.toastEl = this.root.querySelector('.toast')!;
    this.root.addEventListener('click', this.onClick);
    // Keep the Pengaturan toggle in sync when fullscreen is left via the browser (back gesture, Esc).
    document.addEventListener('fullscreenchange', () => { if (this.overlay.querySelector('.panel.settings')) this.openSettings(); });
    this.buildHud();
    this.show('menu');
  }

  // ---------- navigation ----------
  show(s: Screen) {
    this.current = s; this.hudEl.hidden = true; this.overlay.hidden = true; this.screen.hidden = false;
    this.root.dataset.screen = s;
    this.c.backdrop(s !== 'map');
    if (s === 'menu') this.screen.innerHTML = this.menuHtml();
    if (s === 'map') this.screen.innerHTML = this.mapHtml();
    if (s === 'levels') this.screen.innerHTML = this.levelsHtml();
    if (s === 'collection') this.screen.innerHTML = this.collectionHtml();
  }
  private onClick = (e: MouseEvent) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-a]');
    if (!t) return;
    this.c.unlockAudio(); this.c.click();
    const a = t.dataset.a!, v = t.dataset.v;
    switch (a) {
      case 'play': this.show('map'); break;
      case 'fullscreen': this.toggleFullscreen(); break;
      case 'map': this.show('map'); break;
      case 'collection': this.show('collection'); break;
      case 'settings': this.openSettings(); break;
      case 'menu': this.show('menu'); break;
      case 'region': {
        const r = REGIONS[v as RegionId];
        if (!r) { this.toast('Wilayah ini segera hadir. Selesaikan Jawa dulu!'); break; }
        this.region = r.id;
        if (regionOf(LEVELS[this.selected - 1] ?? LEVELS[0]).id !== r.id) this.selected = r.first;
        this.show('levels'); break;
      }
      case 'select': {
        const id = Number(v);
        if (!this.isOpen(id) || id > LEVELS.length) { this.toast(id > LEVELS.length ? 'Level ini segera hadir.' : 'Selesaikan level sebelumnya untuk membuka.'); break; }
        this.selected = id; this.show('levels'); break;
      }
      case 'start': this.openTutorial(this.selected); break;
      case 'go': this.overlay.hidden = true; store.progress.tutorialSeen = true; store.save(); this.c.startLevel(Number(v)); break;
      case 'pause': this.requestPause(); break;
      case 'zoom-in': this.zoomRequest += 1; break;
      case 'zoom-out': this.zoomRequest -= 1; break;
      case 'resume': this.closeOverlay(); this.c.resume(); this.paused = false; break;
      case 'ask-restart': this.confirm('restart'); break;
      case 'ask-exit': this.confirm('exit'); break;
      case 'restart': this.closeOverlay(); this.paused = false; this.c.restart(); break;
      case 'exit': this.closeOverlay(); this.paused = false; this.c.exitToMenu('levels'); break;
      case 'no': this.paused ? this.openPause() : this.closeOverlay(); break;
      case 'close-settings': this.paused ? this.openPause() : this.closeOverlay(); break;
      case 'help': this.openTutorial(this.level.id, true); break;
      case 'close-help': this.paused ? this.openPause() : (this.closeOverlay(), this.c.resume()); break;
      case 'to-map': this.closeOverlay(); this.c.exitToMenu('levels'); break;
      case 'retry': this.closeOverlay(); this.c.restart(); break;
      case 'next': {
        this.closeOverlay();
        const n = this.level.id + 1;
        if (n <= LEVELS.length) { this.selected = n; this.c.startLevel(n); } else this.c.exitToMenu('collection');
        break;
      }
      case 'cycle': this.cycle(t.dataset.k!, Number(v)); break;
    }
  };
  /** Fullscreen + landscape lock where the browser allows it (Android Chrome; iOS needs "Add to Home Screen"). */
  private async toggleFullscreen() {
    try {
      if (document.fullscreenElement) { await document.exitFullscreen(); return; }
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
      await o.lock?.('landscape').catch(() => {});
    } catch { this.toast('Layar penuh tidak didukung browser ini. Gunakan "Tambahkan ke layar utama".', 3000); }
  }
  private closeOverlay() { this.overlay.hidden = true; this.overlay.innerHTML = ''; }
  /** Unlocked levels: the first level of every region is always open, then each needs the one before it. */
  private isOpen(id: number) { return id <= LEVELS.length && (store.unlocked(id) || Object.values(REGIONS).some(r => r.first === id)); }
  private regionStars(id: RegionId) {
    return LEVELS.filter(l => regionOf(l).id === id).reduce((s, l) => s + (store.progress.stars[l.id] ?? 0), 0);
  }

  // ---------- menu (Game Board main menu) ----------
  private menuHtml() {
    const btn = (a: string, img: string, label: string) => `<button class="mimg m-${a}" data-a="${a}" aria-label="${label}"><img src="${A(img)}" alt=""/></button>`;
    return `<div class="menu">
      <img class="menu-orangutan" src="/assets/animals/orangutan-sit.webp" alt=""/>
      <img class="menu-rangkong" src="/assets/animals/rangkong-perch.webp" alt=""/>
      <img class="menu-logo" src="${A('menu-logo')}" alt="BaraRimba"/>
      <p class="menu-tagline">Padamkan Api, Selamatkan Rimba</p>
      <nav class="menu-buttons">
        ${btn('play', 'btn-main', 'Main')}
        ${btn('map', 'btn-peta', 'Peta Indonesia')}
        ${btn('collection', 'btn-koleksi', 'Koleksi Satwa')}
        ${btn('settings', 'btn-pengaturan', 'Pengaturan')}
      </nav>
    </div>`;
  }

  // ---------- Peta Indonesia (layers sliced from referensiasset/Indonesia Adventure Map.png) ----------
  private mapHtml() {
    // Badge rects (reference px) over each open card's baked star counter, and over Sumatra's baked padlock.
    const counts: Partial<Record<RegionId, number[]>> = { jawa: [421, 582, 60, 28], sumatra: [289, 300, 58, 26], kalimantan: [852, 307, 58, 26] };
    const checks: Partial<Record<RegionId, number[]>> = { sumatra: [386, 284, 50, 52], kalimantan: [949, 291, 50, 52] };
    // Rects are [x, y, w, h] in reference pixels (1672x941); see MAP in scripts/prepare_ui_assets.py.
    const W = 1672, H = 941;
    const at = (x: number, y: number, w: number, h: number) => `left:${(x / W) * 100}%;top:${(y / H) * 100}%;width:${(w / W) * 100}%;height:${(h / H) * 100}%`;
    const inside = (o: number[], r: number[]) => `left:${((r[0] - o[0]) / o[2]) * 100}%;top:${((r[1] - o[1]) / o[3]) * 100}%;width:${(r[2] / o[2]) * 100}%;height:${(r[3] / o[3]) * 100}%`;
    const regions: [string, string, number[], number[]][] = [
      ['sumatra', 'Sumatra', [180, 205, 258, 146], [181, 207, 45, 54]],
      ['kalimantan', 'Kalimantan', [743, 212, 259, 141], [744, 215, 45, 54]],
      ['sulawesi', 'Sulawesi', [1210, 224, 256, 141], [1211, 226, 44, 54]],
      ['jawa', 'Jawa', [308, 500, 256, 130], [310, 503, 44, 53]],
      ['bali', 'Bali', [740, 638, 230, 127], [742, 641, 43, 51]],
      ['nusa', 'Nusa Tenggara', [1009, 650, 272, 122], [1011, 653, 43, 53]],
      ['papua', 'Papua', [1407, 578, 245, 141], [1409, 580, 42, 52]],
    ];
    const cards = regions.map(([id, name, r, pin], k) => {
      const reg = REGIONS[id as RegionId], open = !!reg;
      const got = open ? this.regionStars(reg.id) : 0, max = open ? reg.total * 3 : 0;
      const label = open ? `${name}: terbuka, ${got} dari ${max} bintang` : `${name}: terkunci, segera hadir`;
      const count = counts[id as RegionId], check = checks[id as RegionId];
      return `<button class="mreg ${open ? 'open' : 'locked'}" data-a="region" data-v="${id}" aria-label="${label}" style="${at(r[0], r[1], r[2], r[3])};--d:${k * -0.37}s">
        <img class="mreg-card" src="${A(`map-card-${id}`)}" alt="" draggable="false"/>
        ${open && count ? `<span class="mreg-count" style="${inside(r, count)}">${got}/${max}</span>` : ''}
        ${open && check ? `<img class="mreg-check" src="${A('round-check')}" alt="" draggable="false" style="${inside(r, check)}"/>` : ''}
        <img class="mreg-pin" src="${A(`map-pin-${id}`)}" alt="" draggable="false" style="${inside(r, pin)}"/>
      </button>`;
    }).join('');
    const clouds: [string, number[]][] = [['tl', [300, 0, 230, 95]], ['tr', [1500, 0, 172, 90]], ['r', [1500, 160, 172, 200]], ['l', [0, 420, 120, 120]], ['bl', [30, 740, 330, 201]], ['br', [1340, 840, 230, 101]]];
    const dots = [[441, 630], [478, 649], [615, 682], [660, 696], [697, 705]];
    return `<div class="map">
      <div class="map-blur" style="background-image:url(${A('map-blur')})"></div>
      <div class="map-box">
        <img class="map-img" src="${A('map-base')}" alt="Peta Indonesia" draggable="false"/>
        <div class="map-glint" aria-hidden="true"></div>
        ${clouds.map(([k, r]) => `<img class="map-cloud c-${k}" src="${A(`map-cloud-${k}`)}" alt="" aria-hidden="true" style="${at(r[0], r[1], r[2], r[3])}"/>`).join('')}
        ${dots.map(([x, y], k) => `<i class="map-dot" aria-hidden="true" style="${at(x - 4, y - 4, 22, 22)};--d:${k * 0.28}s"></i>`).join('')}
        <img class="map-truck" src="${A('map-truck')}" alt="Posisi truk: Jawa" style="${at(484, 628, 128, 72)}"/>
        <img class="map-pin-solo" src="${A('map-pin-poso')}" alt="" aria-hidden="true" style="${at(1015, 352, 44, 52)}"/>
        ${cards}
        <button class="map-back" data-a="menu" aria-label="Kembali" style="${at(24, 20, 116, 94)}"><img src="${A('map-back')}" alt="" draggable="false"/></button>
      </div>
    </div>`;
  }

  // ---------- level select (Game Board region panel) ----------
  private levelsHtml() {
    const R = REGIONS[this.region];
    // A boss tile shows that boss's own art (Kalimantan bosses are not the Pembakar Hutan).
    const bossImg = (id: number) => { const k = LEVELS[id - 1]?.boss?.sprite; return k ? `/assets/${ASSETS[k]}.webp` : '/assets/boss/boss.webp'; };
    const tiles = Array.from({ length: R.total }, (_, i) => {
      const id = R.first + i, open = this.isOpen(id), s = store.progress.stars[id] ?? 0;
      if (id === R.boss || id === R.midBoss) return open ? `<button class="tile boss ${id === this.selected ? 'sel' : ''}" data-a="select" data-v="${id}" aria-label="Level boss"><img src="${bossImg(id)}" alt=""/><small>BOSS</small><span class="tile-stars">${[0, 1, 2].map(k => `<i class="${k < s ? 'on' : ''}"></i>`).join('')}</span></button>`
        : `<button class="tile boss locked" data-a="select" data-v="${id}" aria-label="Level boss terkunci"><img src="${bossImg(id)}" alt=""/><small>BOSS</small><em>Terkunci</em></button>`;
      if (!open) return `<button class="tile locked" data-a="select" data-v="${id}" aria-label="Level ${i + 1} terkunci"><img src="${A('lock')}" alt=""/></button>`;
      return `<button class="tile ${id === this.selected ? 'sel' : ''}" data-a="select" data-v="${id}" aria-label="Level ${i + 1}"><b>${i + 1}</b><span class="tile-stars">${[0, 1, 2].map(k => `<i class="${k < s ? 'on' : ''}"></i>`).join('')}</span></button>`;
    }).join('');
    const l = LEVELS[this.selected - 1];
    return `<div class="levels">
      <div class="board ${R.total > 20 ? 'expanded huge' : R.total > 15 ? 'expanded' : ''}">
        <button class="wood-btn back" data-a="menu" aria-label="Kembali"><img src="${A('wood-left')}" alt=""/></button>
        <div class="title-plank"><b>${R.name}</b><small>${R.subtitle}</small></div>
        <div class="grid">${tiles}</div>
        <div class="info-card">
          <img class="thumb" src="${A(`thumb-${l.id}`)}" alt="Pratinjau ${l.name}"/>
          <div class="info">
            <b>Level ${l.code}</b><strong>${l.name}</strong>
            <ul>${l.boss ? `<li>${star(true)}Kalahkan ${l.boss.name ?? 'Pembakar Hutan'}</li><li>${star(true)}Nyawa truk tetap ≥ 50%</li><li>${star(true)}Jaga hutan terbakar &lt; 50%</li>` : `<li>${star(true)}Padamkan api &amp; selamatkan satwa</li><li>${star(true)}Hemat penggunaan air</li><li>${star(true)}Cegah api menjalar</li>`}</ul>
            <button class="green-btn" data-a="start">${ico.play}<span>Main</span></button>
          </div>
        </div>
      </div>
    </div>`;
  }

  // ---------- Koleksi Satwa ----------
  private collectionHtml() {
    const got = store.progress.animals;
    const cards = ANIMALS.map(a => {
      const has = got.includes(a.key);
      return `<div class="animal-card ${has ? 'has' : ''}">
        <div class="animal-pic"><img src="/assets/animals/${a.key}.webp" alt="${has ? a.name : 'Belum diselamatkan'}"/></div>
        <b>${has ? a.name : '???'}</b>
        <small>${has ? 'Terselamatkan ♥' : LEVELS[a.level - 1] ? `Selamatkan di Level ${LEVELS[a.level - 1].code}` : 'Segera hadir'}</small>
      </div>`;
    }).join('');
    return `<div class="levels">
      <div class="board wide">
        <button class="wood-btn back" data-a="menu" aria-label="Kembali"><img src="${A('wood-left')}" alt=""/></button>
        <div class="title-plank"><b>KOLEKSI SATWA</b><small>${got.length} / ${ANIMALS.length} terselamatkan</small></div>
        <div class="animal-grid">${cards}</div>
      </div>
    </div>`;
  }

  // ---------- Pengaturan (sheet 19 panel with live controls) ----------
  openSettings() {
    const s = store.settings;
    this.overlay.hidden = false;
    this.overlay.innerHTML = `<div class="scrim"></div>
      <div class="panel settings" role="dialog" aria-label="Pengaturan">
        <img src="${A('settings-panel')}" alt=""/>
        <button class="hit" style="left:85%;top:4%;width:13%;height:14%" data-a="close-settings" aria-label="Tutup"></button>
        ${[['music', 'Musik', 28], ['sfx', 'Efek Suara', 40.8]].map(([k, label, top]) => `
          <label class="set-row slider" style="top:${top}%"><input type="range" min="0" max="100" value="${s[k as 'music']}" data-k="${k}" aria-label="${label}"/><span class="pct">${s[k as 'music']}%</span></label>`).join('')}
        <div class="set-extra">
          <div class="set-zoom"><span>Zoom kamera</span><button data-a="cycle" data-k="zoom" data-v="-1" aria-label="Perkecil">‹</button><span class="pill">${s.zoom}%</span><button data-a="cycle" data-k="zoom" data-v="1" aria-label="Perbesar">›</button></div>
          ${document.fullscreenEnabled ? `<div class="set-zoom set-fs"><span>Layar penuh</span><button class="pill ${document.fullscreenElement ? 'on' : ''}" data-a="fullscreen" aria-pressed="${!!document.fullscreenElement}">${document.fullscreenElement ? 'Aktif' : 'Mati'}</button></div>` : ''}
        </div>
        ${[['quality', s.quality, 55.2], ['control', s.control, 69.1], ['language', s.language, 83]].map(([k, val, top]) => `
          <div class="set-row cycle" style="top:${top}%"><button data-a="cycle" data-k="${k}" data-v="-1" aria-label="Sebelumnya">‹</button><span class="pill">${val}</span><button data-a="cycle" data-k="${k}" data-v="1" aria-label="Berikutnya">›</button></div>`).join('')}
      </div>`;
    this.overlay.querySelectorAll<HTMLInputElement>('input[type=range]').forEach(inp => inp.addEventListener('input', () => {
      store.settings[inp.dataset.k as 'music' | 'sfx'] = Number(inp.value);
      inp.nextElementSibling!.textContent = `${inp.value}%`;
      inp.style.setProperty('--v', `${inp.value}%`);
      store.save();
    }));
    this.overlay.querySelectorAll<HTMLInputElement>('input[type=range]').forEach(inp => inp.style.setProperty('--v', `${inp.value}%`));
  }
  private cycle(k: string, dir: number) {
    if (k === 'zoom') { store.settings.zoom = Math.max(50, Math.min(100, store.settings.zoom + dir * 10)); store.settings.zoomSet = true; store.save(); this.openSettings(); return; }
    const opts: Record<string, string[]> = { quality: ['Rendah', 'Sedang', 'Tinggi'], control: ['Sentuh', 'Mouse'], language: ['Indonesia'] };
    const list = opts[k]; const cur = (store.settings as unknown as Record<string, string>)[k];
    const next = list[(list.indexOf(cur) + dir + list.length) % list.length];
    if (k === 'quality') { store.settings.quality = next as Quality; store.settings.qualitySet = true; this.c.setQuality(); }
    if (k === 'control') store.settings.control = next as 'Sentuh' | 'Mouse';
    store.save(); this.openSettings();
    this.hudEl.classList.toggle('touch', store.settings.control === 'Sentuh');
  }

  // ---------- tutorial (sheet 16 cards) ----------
  openTutorial(id: number, fromHud = false) {
    const l = LEVELS[id - 1];
    const cards = (store.progress.tutorialSeen || fromHud) && !fromHud ? l.tutorial : [...new Set([1, 2, 3, ...l.tutorial])];
    if (fromHud && !this.paused) this.c.pause();
    this.overlay.hidden = false;
    this.overlay.innerHTML = `<div class="scrim"></div>
      <div class="panel tutorial" role="dialog" aria-labelledby="tut-title">
        <div class="title-plank small"><b id="tut-title">${l.code} · ${l.name}</b></div>
        <p class="brief">${l.brief}</p>
        <div class="cards">${cards.map(n => `<img src="${A(`tutorial-${n}`)}" alt="Petunjuk ${n}"/>`).join('')}</div>
        <p class="keys">Tombol: ◀ ▶ / A D gerak truk · Lengan ▲▼ / Q E · Nozzle ▲▼ / W S · Semprot / Spasi</p>
        ${fromHud ? `<button class="green-btn" data-a="close-help">${ico.play}<span>Lanjut</span></button>`
          : `<button class="img-btn mulai" data-a="go" data-v="${id}"><img src="${A('btn-mulai')}" alt="Mulai"/></button>`}
      </div>`;
  }

  // ---------- HUD ----------
  private buildHud() {
    const hold = (dir: number) => `data-hold="${dir}"`;
    this.hudEl.className = `hud ${store.settings.control === 'Sentuh' ? 'touch' : ''}`;
    this.hudEl.innerHTML = `
      <div class="hud-banner"><span class="code"></span><span class="name"></span><span class="hstars"></span></div>
      <div class="mission-progress" hidden></div>
      <div class="hud-status">
        <div class="chip animal"><img class="ani" alt=""/><div class="bar"><span></span></div></div>
      </div>
      <div class="hud-objective"><img src="${A('objective-panel')}" alt=""/><b class="count">0/0</b></div>
      <div class="hud-actions">
        <button class="round" data-a="help" aria-label="Petunjuk"><img src="${A('gb-hint')}" alt=""/></button>
        <button class="round" data-a="ask-restart" aria-label="Ulang level"><img src="${A('gb-reset')}" alt=""/></button>
        <button class="round" data-a="pause" aria-label="Jeda"><img src="${A('gb-pause')}" alt=""/></button>
      </div>
      <div class="water-ind"><img src="${A('gb-drop')}" alt=""/><div class="wtrack"><span></span></div><small class="refill">Mengisi air…</small></div>
      <div class="drive">
        <button class="wood-btn" data-ctl="drive" ${hold(-1)} aria-label="Mundur"><img src="${A('wood-left')}" alt=""/></button>
        <button class="wood-btn" data-ctl="drive" ${hold(1)} aria-label="Maju"><img src="${A('wood-right')}" alt=""/></button>
      </div>
      <div class="aim">
        <div class="aim-group"><span>LENGAN <b class="boom-v">50%</b></span>
          <div><button class="wood-btn up" data-ctl="boom" ${hold(-1)} aria-label="Naikkan lengan"><img src="${A('wood-left')}" alt=""/></button><button class="wood-btn down" data-ctl="boom" ${hold(1)} aria-label="Turunkan lengan"><img src="${A('wood-left')}" alt=""/></button></div></div>
        <div class="aim-group"><span>NOZZLE <b class="tip-v">30°</b></span>
          <div><button class="wood-btn up" data-ctl="tip" ${hold(-1)} aria-label="Naikkan nozzle"><img src="${A('wood-left')}" alt=""/></button><button class="wood-btn down" data-ctl="tip" ${hold(1)} aria-label="Turunkan nozzle"><img src="${A('wood-left')}" alt=""/></button></div></div>
        <button class="spray" data-ctl="spray" ${hold(1)} aria-label="Tahan untuk menyemprot"><img src="${A('round-drop')}" alt=""/><span>SEMPROT</span></button>
      </div>
      <div class="boss-hud">
        <div class="bh-bar bh-pressure"><img loading="lazy" src="/assets/boss/hud-pressure.webp" alt=""/><div class="bh-track" style="left:24.9%;width:69.4%;top:45.5%;height:34.4%"><span></span></div></div>
        <div class="bh-bar bh-reserve"><img loading="lazy" src="/assets/boss/hud-reserve.webp" alt=""/><div class="bh-track" style="left:25.5%;width:68.4%;top:45.6%;height:34.8%"><span></span></div><small class="bh-wait">Mengisi…</small></div>
        <div class="bh-bar bh-life"><img loading="lazy" src="/assets/vehicle/truck.webp" alt=""/><b>NYAWA TRUK</b><div class="bh-track green"><span></span></div></div>
        <div class="bh-bar bh-fuel"><b>CADANGAN API BOSS</b><div class="bh-track fire"><span></span></div><small class="bh-reload">Boss mengisi api… serang!</small></div>
        <div class="bh-bar bh-boss"><img loading="lazy" src="/assets/boss/hud-bossbar.webp" alt=""/><div class="bh-track red" style="left:17.7%;width:77.1%;top:56.5%;height:27.4%"><span></span></div></div>
        <button class="bh-pause" data-a="pause" aria-label="Jeda"><img loading="lazy" src="/assets/boss/hud-pause.webp" alt=""/></button>
        <img class="bh-mission" loading="lazy" src="/assets/boss/hud-mission.webp" alt="Misi boss: Kalahkan Pembakar Hutan, tahan semprotan air dan tekan balik, hindari bola api"/>
        <button class="bh-spray" data-ctl="spray" data-hold="1" aria-label="Tahan untuk menyemprot"><img loading="lazy" src="/assets/boss/hud-spray.webp" alt=""/></button>
      </div>
      <div class="ind left"><img src="${A('round-fire')}" alt="Api di kiri"/></div>
      <div class="ind right"><img src="${A('round-fire')}" alt="Api di kanan"/></div>`;
    const q = (s: string) => this.hudEl.querySelector<HTMLElement>(s)!;
    this.els = {
      code: q('.code'), name: q('.name'), mission: q('.mission-progress'), hstars: q('.hstars'), aniImg: q('.ani'), aniBar: q('.animal .bar span'), aniChip: q('.chip.animal'),
      count: q('.count'), wfill: q('.wtrack span'), refill: q('.refill'), tipV: q('.tip-v'), boomV: q('.boom-v'),
      spray: q('.spray'), bossSpray: q('.bh-spray'), pres: q('.bh-pressure span'), resv: q('.bh-reserve span'), life: q('.bh-life span'), fuel: q('.bh-fuel span'), fuelWrap: q('.bh-fuel'), waitWrap: q('.bh-reserve'), bhp: q('.bh-boss span'), indL: q('.ind.left'), indR: q('.ind.right'), wtrack: q('.wtrack'),
    };
    this.hudEl.querySelectorAll<HTMLElement>('[data-hold]').forEach(b => {
      const ctl = b.dataset.ctl!, dir = Number(b.dataset.hold);
      const set = (on: boolean) => {
        if (ctl === 'drive') this.driveDir = on ? dir : (this.driveDir === dir ? 0 : this.driveDir);
        if (ctl === 'tip') this.tipDir = on ? dir : (this.tipDir === dir ? 0 : this.tipDir);
        if (ctl === 'boom') this.boomDir = on ? dir : (this.boomDir === dir ? 0 : this.boomDir);
        if (ctl === 'spray') this.sprayHeld = on;
        b.classList.toggle('held', on);
      };
      b.addEventListener('pointerdown', e => { e.preventDefault(); b.setPointerCapture(e.pointerId); this.c.unlockAudio(); set(true); });
      for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(ev, () => set(false));
      b.addEventListener('contextmenu', e => e.preventDefault());
    });
  }
  enterLevel(def: LevelDef) {
    this.missionHud('');
    this.level = def; this.selected = def.id; this.region = regionOf(def).id; this.paused = false;
    this.screen.hidden = true; this.screen.innerHTML = ''; this.closeOverlay();
    this.root.dataset.screen = 'game'; this.c.backdrop(true);
    this.els.code.textContent = def.code; this.els.name.textContent = def.name;
    (this.els.aniImg as HTMLImageElement).src = `/assets/animals/${def.animal.key}.webp`;
    this.els.refill.hidden = true;
    this.hudEl.classList.toggle('boss-mode', !!def.boss);
    this.root.classList.toggle('boss', !!def.boss);
    this.releaseControls();
  }
  setZoomLevel(z: number) { const v = this.hudEl.querySelector('.zval'); if (v) v.textContent = `${Math.round(z * 100)}%`; }
  missionHud(text: string) { this.els.mission.textContent = text; this.els.mission.hidden = !text; }
  showHud(on: boolean) { this.hudEl.hidden = !on; if (!on) this.releaseControls(); }
  private releaseControls() {
    this.driveDir = this.tipDir = this.boomDir = 0; this.sprayHeld = false;
    this.hudEl.querySelectorAll('.held').forEach(b => b.classList.remove('held'));
  }
  hud(d: HudData) {
    const e = this.els;
    e.wfill.style.width = `${d.water}%`; e.wtrack.classList.toggle('low', d.water < 25);
    e.aniBar.style.width = `${d.animalHp}%`; e.aniChip.classList.toggle('danger', d.animalDanger);
    e.count.textContent = `${d.out}/${d.total}`;
    e.hstars.innerHTML = d.stars.map(star).join('');
    e.refill.hidden = !d.refilling;
    e.tipV.textContent = `${d.tip}°`; e.boomV.textContent = `${d.boom}%`;
    e.spray.classList.toggle('firing', d.firing);
  }
  bossHud(pressure: number, reserve: number, truckHp: number, bossHp: number, bossFuel: number, bossReload: boolean, locked: boolean, refilling: boolean) {
    const e = this.els;
    e.pres.style.width = `${pressure}%`; e.pres.parentElement!.classList.toggle('locked', locked);
    e.resv.style.width = `${reserve}%`; e.resv.parentElement!.classList.toggle('low', reserve < 25);
    e.waitWrap.classList.toggle('waiting', refilling);
    e.life.style.width = `${truckHp}%`; e.life.parentElement!.classList.toggle('low', truckHp < 30);
    e.fuel.style.width = `${bossFuel}%`; e.fuelWrap.classList.toggle('reloading', bossReload);
    e.bhp.style.width = `${bossHp}%`;
    e.bossSpray.classList.toggle('firing', this.els.spray.classList.contains('firing'));
  }
  indicators(list: { side: number; y: number }[]) {
    const l = list.find(i => i.side < 0), r = list.find(i => i.side > 0);
    this.els.indL.classList.toggle('on', !!l); this.els.indR.classList.toggle('on', !!r);
    if (l) this.els.indL.style.top = `${l.y / 7.2}%`;
    if (r) this.els.indR.style.top = `${r.y / 7.2}%`;
  }

  // ---------- pause & confirm (sheet 19 panels) ----------
  requestPause() {
    if (this.paused || this.hudEl.hidden) return;
    this.paused = true; this.releaseControls(); this.c.pause(); this.openPause();
  }
  private openPause() {
    this.overlay.hidden = false;
    const rows = [['resume', 'Lanjutkan'], ['ask-restart', 'Ulang level'], ['settings', 'Pengaturan'], ['ask-exit', 'Keluar level']];
    this.overlay.innerHTML = `<div class="scrim"></div><div class="panel pause" role="dialog" aria-label="Jeda">
      <img src="${A('pause-panel')}" alt=""/>
      ${rows.map(([a, label], i) => `<button class="hit" data-a="${a}" aria-label="${label}" style="left:50.6%;width:41%;top:${23.7 + i * 15.9}%;height:13.6%"></button>`).join('')}
    </div>`;
    this.focusFirst();
  }
  private confirm(kind: 'restart' | 'exit') {
    if (!this.paused && !this.hudEl.hidden) { this.paused = true; this.releaseControls(); this.c.pause(); }
    this.overlay.hidden = false;
    const r = kind === 'exit' ? { img: 'confirm-exit', no: [15, 59.4, 34.7, 24.3], yes: [52.6, 59.4, 33.5, 24.3], x: [83.8, 7, 14, 20] }
      : { img: 'confirm-restart', no: [14.8, 59.3, 34.7, 25], yes: [52.4, 59.3, 33.6, 25], x: [83.8, 5.2, 14, 21] };
    const box = (b: number[]) => `left:${b[0]}%;top:${b[1]}%;width:${b[2]}%;height:${b[3]}%`;
    this.overlay.innerHTML = `<div class="scrim"></div><div class="panel confirm" role="alertdialog" aria-label="${kind === 'exit' ? 'Keluar level?' : 'Ulang level?'}">
      <img src="${A(r.img)}" alt=""/>
      <button class="hit" data-a="no" style="${box(r.no)}" aria-label="Tidak"></button>
      <button class="hit" data-a="${kind}" style="${box(r.yes)}" aria-label="Ya"></button>
      <button class="hit round-hit" data-a="no" style="${box(r.x)}" aria-label="Tutup"></button>
    </div>`;
    this.focusFirst();
  }
  private focusFirst() { requestAnimationFrame(() => this.overlay.querySelector<HTMLElement>('button')?.focus({ preventScroll: true })); }

  // ---------- results (sheet 20 panels with live rows) ----------
  showResult(r: ResultInfo) {
    this.paused = false;
    this.overlay.hidden = false;
    const won = r.won;
    const mark = (ok: boolean) => `<img class="mark" src="${A(ok ? 'round-check' : 'round-x')}" alt="${ok ? 'berhasil' : 'gagal'}"/>`;
    const reason = r.reason === 'water' ? 'Air habis sebelum api padam.' : r.reason === 'burn' ? 'Hutan habis terbakar oleh Pembakar Hutan!' : r.reason === 'truck' ? 'Truk rusak parah terkena serangan boss!' : r.note ?? '';
    const rows = `
      ${r.boss ? `<div class="rrow"><span>Nyawa truk ≥ 50%</span><em>${r.truckHp ?? 0}%</em>${mark(won && r.water.ok)}</div>`
        : `<div class="rrow"><span>Hemat air (maks ${r.water.budget} L)</span><em>${Math.round(r.water.used)} L</em>${mark(won && r.water.ok)}</div>`}
      <div class="rrow"><span>Selamatkan ${r.animal.name}</span><em>${won ? '1/1' : '0/1'}</em>${mark(won)}</div>
      ${r.boss ? `<div class="rrow"><span>Hutan terbakar &lt; 50%</span><em>${won ? (r.stars === 3 || (r.stars === 2 && !r.water.ok) ? 'Ya' : 'Tidak') : '-'}</em>${mark(won && (r.stars === 3 || (r.stars === 2 && !r.water.ok)))}</div>`
        : `<div class="rrow"><span>Cegah api menjalar</span><em>${r.spread ? `${r.spread}×` : 'Aman'}</em>${mark(won && !r.spread)}</div>`}`;
    const starsDim = won ? [0, 1, 2].filter(i => i >= r.stars).map(i => `<img class="dim s${i}" src="${A('star-silver')}" alt=""/>`).join('') : '';
    const btn = (a: string, b: number[], label: string) => `<button class="hit" data-a="${a}" aria-label="${label}" style="left:${b[0]}%;top:${b[1]}%;width:${b[2]}%;height:${b[3]}%"></button>`;
    this.overlay.innerHTML = `<div class="scrim ${won ? 'win' : 'lose'}"></div>
      <div class="panel result ${won ? 'won' : 'lost'}" role="dialog" aria-label="${won ? 'Level selesai' : 'Level gagal'}">
        <img src="${A(won ? 'win-panel' : 'fail-panel')}" alt=""/>
        ${starsDim}
        <div class="rrows">${rows}</div>
        <div class="rscore"><span>Skor</span><b>${r.score.toLocaleString('id-ID')}</b>${r.record ? `<img src="${A('badge-record')}" alt="Rekor baru"/>` : ''}</div>
        <div class="animal-badge ${won ? 'happy' : 'sad'}"><img src="/assets/animals/${r.animal.key}.webp" alt="${r.animal.name} ${won ? 'senang' : 'menangis'}"/>${won ? '<i class="h1">♥</i><i class="h2">♥</i><i class="h3">♥</i>' : '<i class="t1"></i><i class="t2"></i>'}</div>
        <p class="rnote">${won ? (r.boss ? `${r.level.boss?.name ?? 'Pembakar Hutan'} dikalahkan! ${regionOf(r.level).forest} selamat!` : `${r.animal.name} senang dan masuk Koleksi Satwa!`) : reason}</p>
        ${won ? btn('to-map', [6.4, 85.3, 28.4, 11.2], 'Kembali ke peta') + btn('retry', [35.1, 85.3, 28.3, 11.2], 'Ulangi') + btn('next', [64.4, 85.3, 31.4, 11.2], 'Lanjut')
          : btn('to-map', [5.6, 86.6, 29.8, 11], 'Kembali ke peta') + btn('retry', [36.7, 86.6, 27.3, 11], 'Ulangi') + btn('retry', [65, 86.6, 30.7, 11], 'Coba lagi')}
      </div>`;
    this.focusFirst();
  }

  toast(msg: string, ms = 2400) {
    this.toastEl.textContent = msg; this.toastEl.classList.add('visible');
    window.clearTimeout(this.toastTimer); this.toastTimer = window.setTimeout(() => this.toastEl.classList.remove('visible'), ms);
  }
  get screenName() { return this.current; }
}
