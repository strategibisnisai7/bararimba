export type Quality = 'Rendah' | 'Sedang' | 'Tinggi';
export interface Settings { music: number; sfx: number; quality: Quality; control: 'Sentuh' | 'Mouse'; language: 'Indonesia'; zoom: number;
  /** True once the player picked a zoom; until then it follows the device (phone 80%, desktop 50%). */
  zoomSet?: boolean;
  /** True once the player picked a quality; until then it follows the device. */
  qualitySet?: boolean }
export interface Progress { stars: Record<number, number>; best: Record<number, number>; animals: string[]; tutorialSeen: boolean }

const KEY = 'bararimba.v2';

/** Starting quality from the hardware: few cores or little memory means an older phone. */
function deviceQuality(): Quality {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency || 4, mem = nav.deviceMemory ?? 4;
  const phone = matchMedia('(pointer: coarse)').matches;
  if (cores <= 4 || mem <= 3) return 'Rendah';
  return phone ? 'Sedang' : 'Tinggi';
}
const defaults = (): { campaignVersion: number; settings: Settings; progress: Progress } => ({
  campaignVersion: 3,
  settings: { music: 40, sfx: 80, quality: 'Tinggi', control: 'Sentuh', language: 'Indonesia', zoom: 80 },
  progress: { stars: {}, best: {}, animals: [], tutorialSeen: false },
});

/** Per-browser convenience storage only; the game works identically when storage is blocked. */
class Store {
  data = defaults();
  constructor() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.data = { campaignVersion: 3, settings: { ...this.data.settings, ...parsed.settings }, progress: { ...this.data.progress, ...parsed.progress } };
        // The former Sumatra finale (25) moves to 35; never award its score to a new rescue mission.
        if (parsed.campaignVersion !== 3) {
          for (const scores of [this.data.progress.stars, this.data.progress.best]) {
            if (scores[25] !== undefined) { scores[35] = Math.max(scores[35] ?? 0, scores[25]); delete scores[25]; }
          }
          this.save();
        }
      }
    } catch { /* storage unavailable */ }
    if (!this.data.settings.qualitySet) this.data.settings.quality = deviceQuality();
    if (!this.data.settings.zoomSet) this.data.settings.zoom = matchMedia('(pointer: coarse)').matches ? 80 : 50;
  }
  get settings() { return this.data.settings; }
  get progress() { return this.data.progress; }
  save() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch { /* ignore */ } }
  /** `?unlock=all` in the URL opens every level (testing shortcut; progress itself is untouched). */
  readonly unlockAll = new URLSearchParams(location.search).get('unlock') === 'all';
  unlocked(level: number) { return this.unlockAll || level === 1 || (this.progress.stars[level] ?? 0) > 0 || (this.progress.stars[level - 1] ?? 0) > 0; }
  record(level: number, stars: number, score: number, animal?: string) {
    const p = this.progress;
    p.stars[level] = Math.max(p.stars[level] ?? 0, stars);
    const isRecord = score > (p.best[level] ?? 0);
    if (isRecord) p.best[level] = score;
    if (animal && !p.animals.includes(animal)) p.animals.push(animal);
    this.save();
    return isRecord;
  }
  get totalStars() { return Object.values(this.progress.stars).reduce((a, b) => a + b, 0); }
}

export const store = new Store();
export const qualityFactor = () => ({ Rendah: .45, Sedang: .75, Tinggi: 1 })[store.settings.quality];
/** Canvas pixels per world pixel: the fill-rate cost of every frame grows with its square. */
export const renderScale = () => Math.min(window.devicePixelRatio || 1, ({ Rendah: 1, Sedang: 1.5, Tinggi: 2 })[store.settings.quality]);
