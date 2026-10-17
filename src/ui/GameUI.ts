import { LEVELS, ANIMALS, REGION, type LevelDef } from '../config/levels';
import { store, type Quality } from '../systems/Save';
import type { ResultInfo } from '../scenes/LevelScene';

export interface Controller {
  startLevel(id: number): void; restart(): void; exitToMenu(screen: Screen): void;
  pause(): void; resume(): void; unlockAudio(): void; click(): void;
}
export type Screen = 'menu' | 'map' | 'levels' | 'collection';
export interface HudData {
  water: number; burn: number; out: number; total: number; animalHp: number; animalDanger: boolean;
  refilling: boolean; stars: boolean[]; firing: boolean; tip: number; boom: number; timeLeft: number; critical: boolean;
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
    this.buildHud();
    this.show('menu');
  }

  // ---------- navigation ----------
  show(s: Screen) {
    this.current = s; this.hudEl.hidden = true; this.overlay.hidden = true; this.screen.hidden = false;
    this.root.dataset.screen = s;
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
      case 'play': this.show('levels'); break;
      case 'map': this.show('map'); break;
      case 'collection': this.show('collection'); break;
      case 'settings': this.openSettings(); break;
      case 'menu': this.show('menu'); break;
      case 'region': v === 'jawa' ? this.show('levels') : this.toast('Wilayah ini segera hadir. Selesaikan Jawa dulu!'); break;
      case 'select': {
        const id = Number(v);
        if (id === REGION.boss) { this.toast('Lawan Bos Jawa — segera hadir!'); break; }
        if (!store.unlocked(id) || id > LEVELS.length) { this.toast(id > LEVELS.length ? 'Level ini segera hadir.' : 'Selesaikan level sebelumnya untuk membuka.'); break; }
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
  private closeOverlay() { this.overlay.hidden = true; this.overlay.innerHTML = ''; }

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

  // ---------- Peta Indonesia (Game Board map panel) ----------
  private mapHtml() {
    const jawaStars = LEVELS.reduce((s, l) => s + (store.progress.stars[l.id] ?? 0), 0);
    const card = (id: string, name: string, sub: string, box: number[], count: string, locked: boolean, wide = false) => {
      const [x0, y0, x1, y1] = box;
      return `<button class="region ${locked ? 'locked' : 'open'} ${wide ? 'wide' : ''}" data-a="region" data-v="${id}" style="left:${x0 / 5.6}%;top:${y0 / 4.32}%;width:${(x1 - x0) / 5.6}%;height:${(y1 - y0) / 4.32}%">
        <span class="region-card"><b>${name}</b><small>${sub}</small></span>
        <span class="region-count"><img src="${A('star-gold')}" alt=""/>${count}</span>
        <span class="region-lock ${locked ? '' : 'ok'}"><img src="${A(locked ? 'lock' : 'round-check')}" alt="${locked ? 'terkunci' : 'terbuka'}"/></span>
      </button>`;
    };
    return `<div class="map">
      <div class="map-blur" style="background-image:url(${A('map-board')})"></div>
      <div class="map-box">
        <img class="map-img" src="${A('map-board')}" alt="Peta Indonesia"/>
        <button class="map-back" data-a="menu" aria-label="Kembali"></button>
        ${card('sumatra', 'SUMATRA', 'Hutan Hujan Tropis', [42, 150, 186, 230], '0/24', true)}
        ${card('kalimantan', 'KALIMANTAN', 'Hutan Gambut &amp; Sungai', [220, 133, 380, 212], '0/24', true, true)}
        ${card('sulawesi', 'SULAWESI', 'Hutan Tropis &amp; Karst', [414, 163, 556, 242], '0/24', true)}
        ${card('jawa', 'JAWA', 'Hutan Pegunungan', [90, 291, 250, 372], `${jawaStars}/${LEVELS.length * 3}`, false)}
        ${card('papua', 'PAPUA', 'Hutan Dataran Rendah', [328, 298, 496, 374], '0/24', true)}
        <div class="map-marker" style="left:${252 / 5.6}%;top:${262 / 4.32}%"><img class="pin" src="${A('gb-pin')}" alt=""/><img class="mini-truck" src="/assets/vehicle/truck.webp" alt="Posisi truk: Jawa"/></div>
      </div>
    </div>`;
  }

  // ---------- level select (Game Board region panel) ----------
  private levelsHtml() {
    const tiles = Array.from({ length: REGION.total }, (_, i) => {
      const id = i + 1, exists = id <= LEVELS.length, open = exists && store.unlocked(id), s = store.progress.stars[id] ?? 0;
      if (id === REGION.boss) return `<button class="tile boss" data-a="select" data-v="${id}" aria-label="Lawan bos, segera hadir"><img src="${A('alert')}" alt=""/><small>BOS</small><em>Segera hadir</em></button>`;
      if (!open) return `<button class="tile locked" data-a="select" data-v="${id}" aria-label="Level ${id} terkunci"><img src="${A('lock')}" alt=""/></button>`;
      return `<button class="tile ${id === this.selected ? 'sel' : ''}" data-a="select" data-v="${id}" aria-label="Level ${id}"><b>${id}</b><span class="tile-stars">${[0, 1, 2].map(k => `<i class="${k < s ? 'on' : ''}"></i>`).join('')}</span></button>`;
    }).join('');
    const l = LEVELS[this.selected - 1];
    return `<div class="levels">
      <div class="board">
        <button class="wood-btn back" data-a="menu" aria-label="Kembali"><img src="${A('wood-left')}" alt=""/></button>
        <div class="title-plank"><b>${REGION.name}</b><small>${REGION.subtitle}</small></div>
        <div class="grid">${tiles}</div>
        <div class="info-card">
          <img class="thumb" src="${A(`thumb-${l.id}`)}" alt="Pratinjau ${l.name}"/>
          <div class="info">
            <b>Level ${l.id}</b><strong>${l.name}</strong>
            <ul><li>${star(true)}Padamkan api &amp; selamatkan satwa</li><li>${star(true)}Hemat penggunaan air</li><li>${star(true)}Selesai dalam ${l.time} detik</li></ul>
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
        <small>${has ? 'Terselamatkan ♥' : a.level ? `Selamatkan di Level 1-${a.level}` : 'Segera hadir'}</small>
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
    const opts: Record<string, string[]> = { quality: ['Rendah', 'Sedang', 'Tinggi'], control: ['Sentuh', 'Mouse'], language: ['Indonesia'] };
    const list = opts[k]; const cur = (store.settings as unknown as Record<string, string>)[k];
    const next = list[(list.indexOf(cur) + dir + list.length) % list.length];
    if (k === 'quality') store.settings.quality = next as Quality;
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
      <div class="hud-status">
        <div class="chip animal"><img class="ani" alt=""/><div class="bar"><span></span></div></div>
        <div class="chip timer" role="timer" aria-label="Waktu standar"><span class="clock"></span><b class="tval">0:00</b><small class="tlabel">WAKTU</small></div>
      </div>
      <div class="hud-objective"><img src="${A('objective-panel')}" alt=""/><b class="count">0/0</b></div>
      <div class="zoom" role="group" aria-label="Zoom kamera">
        <button class="zbtn" data-a="zoom-in" aria-label="Perbesar (Z)"><svg viewBox="0 0 24 24"><circle cx="10" cy="10" r="6.5"/><path d="M15 15l5.5 5.5M7 10h6M10 7v6"/></svg></button>
        <span class="zval">100%</span>
        <button class="zbtn" data-a="zoom-out" aria-label="Perkecil (X)"><svg viewBox="0 0 24 24"><circle cx="10" cy="10" r="6.5"/><path d="M15 15l5.5 5.5M7 10h6"/></svg></button>
      </div>
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
      <div class="ind left"><img src="${A('round-fire')}" alt="Api di kiri"/></div>
      <div class="ind right"><img src="${A('round-fire')}" alt="Api di kanan"/></div>`;
    const q = (s: string) => this.hudEl.querySelector<HTMLElement>(s)!;
    this.els = {
      code: q('.code'), name: q('.name'), hstars: q('.hstars'), aniImg: q('.ani'), aniBar: q('.animal .bar span'), aniChip: q('.chip.animal'),
      timer: q('.chip.timer'), tval: q('.tval'), tlabel: q('.tlabel'), count: q('.count'), wfill: q('.wtrack span'), refill: q('.refill'), tipV: q('.tip-v'), boomV: q('.boom-v'),
      spray: q('.spray'), indL: q('.ind.left'), indR: q('.ind.right'), wtrack: q('.wtrack'),
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
    this.level = def; this.selected = def.id; this.paused = false;
    this.screen.hidden = true; this.screen.innerHTML = ''; this.closeOverlay();
    this.root.dataset.screen = 'game';
    this.els.code.textContent = def.code; this.els.name.textContent = def.name;
    (this.els.aniImg as HTMLImageElement).src = `/assets/animals/${def.animal.key}.webp`;
    this.els.refill.hidden = true;
    this.releaseControls();
  }
  setZoomLevel(z: number) { const v = this.hudEl.querySelector('.zval'); if (v) v.textContent = `${Math.round(z * 100)}%`; }
  showHud(on: boolean) { this.hudEl.hidden = !on; if (!on) this.releaseControls(); }
  private releaseControls() {
    this.driveDir = this.tipDir = this.boomDir = 0; this.sprayHeld = false;
    this.hudEl.querySelectorAll('.held').forEach(b => b.classList.remove('held'));
  }
  hud(d: HudData) {
    const e = this.els;
    e.wfill.style.width = `${d.water}%`; e.wtrack.classList.toggle('low', d.water < 25);
    const t = Math.max(0, Math.ceil(d.timeLeft));
    e.tval.textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
    e.tlabel.textContent = d.critical ? 'KRITIS!' : 'WAKTU';
    e.timer.classList.toggle('critical', d.critical);
    e.timer.classList.toggle('warn', !d.critical && d.timeLeft < 20);
    e.aniBar.style.width = `${d.animalHp}%`; e.aniChip.classList.toggle('danger', d.animalDanger);
    e.count.textContent = `${d.out}/${d.total}`;
    e.hstars.innerHTML = d.stars.map(star).join('');
    e.refill.hidden = !d.refilling;
    e.tipV.textContent = `${d.tip}°`; e.boomV.textContent = `${d.boom}%`;
    e.spray.classList.toggle('firing', d.firing);
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
    const reason = r.reason === 'animal' ? `Terlambat! ${r.animal.name} terbakar api.` : r.reason === 'water' ? 'Air habis sebelum api padam.' : '';
    const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
    const rows = `
      <div class="rrow"><span>Hemat air (maks ${r.water.budget} L)</span><em>${Math.round(r.water.used)} L</em>${mark(won && r.water.ok)}</div>
      <div class="rrow"><span>Selamatkan ${r.animal.name}</span><em>${won ? '1/1' : '0/1'}</em>${mark(won)}</div>
      <div class="rrow"><span>Selesaikan dalam ${r.par} detik</span><em>${clock(r.time)}</em>${mark(won && r.time <= r.par)}</div>`;
    const starsDim = won ? [0, 1, 2].filter(i => i >= r.stars).map(i => `<img class="dim s${i}" src="${A('star-silver')}" alt=""/>`).join('') : '';
    const btn = (a: string, b: number[], label: string) => `<button class="hit" data-a="${a}" aria-label="${label}" style="left:${b[0]}%;top:${b[1]}%;width:${b[2]}%;height:${b[3]}%"></button>`;
    this.overlay.innerHTML = `<div class="scrim ${won ? 'win' : 'lose'}"></div>
      <div class="panel result ${won ? 'won' : 'lost'}" role="dialog" aria-label="${won ? 'Level selesai' : 'Level gagal'}">
        <img src="${A(won ? 'win-panel' : 'fail-panel')}" alt=""/>
        ${starsDim}
        <div class="rrows">${rows}</div>
        <div class="rscore"><span>Skor</span><b>${r.score.toLocaleString('id-ID')}</b>${r.record ? `<img src="${A('badge-record')}" alt="Rekor baru"/>` : ''}</div>
        <div class="animal-badge ${won ? 'happy' : 'sad'}"><img src="/assets/animals/${r.animal.key}.webp" alt="${r.animal.name} ${won ? 'senang' : 'menangis'}"/>${won ? '<i class="h1">♥</i><i class="h2">♥</i><i class="h3">♥</i>' : '<i class="t1"></i><i class="t2"></i>'}</div>
        <p class="rnote">${won ? `${r.animal.name} senang dan masuk Koleksi Satwa!` : reason}</p>
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
