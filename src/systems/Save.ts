export type Quality = 'Rendah' | 'Sedang' | 'Tinggi';
export interface Settings { music: number; sfx: number; quality: Quality; control: 'Sentuh' | 'Mouse'; language: 'Indonesia' }
export interface Progress { stars: Record<number, number>; best: Record<number, number>; animals: string[]; tutorialSeen: boolean }

const KEY = 'bararimba.v2';
const defaults = (): { settings: Settings; progress: Progress } => ({
  settings: { music: 40, sfx: 80, quality: 'Tinggi', control: 'Sentuh', language: 'Indonesia' },
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
        this.data = { settings: { ...this.data.settings, ...parsed.settings }, progress: { ...this.data.progress, ...parsed.progress } };
      }
    } catch { /* storage unavailable */ }
  }
  get settings() { return this.data.settings; }
  get progress() { return this.data.progress; }
  save() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch { /* ignore */ } }
  unlocked(level: number) { return level === 1 || (this.progress.stars[level - 1] ?? 0) > 0; }
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
