import { test, expect, type Page } from '@playwright/test';

/** Sumatra levels 2-1 to 2-9 replayed with a known solution (2-10 to 2-20: sumatra-trials.spec.ts). The scene's own loop is paused and stepped at 60 Hz for
 * speed, but the only thing the test does is hold the player's keys: D drive, W/S nozzle, Q/E boom, Space spray.
 * No game state is written. A failing replay means a level became unsolvable (or its tuning drifted). */
type Step = ['drive', number] | ['aim', number, number?] | ['spray', number] | ['wait', number] | ['duel'];

const SOLUTIONS: Record<number, Step[]> = {
  16: [['drive', 1.2], ['aim', .15], ['spray', 2.5], ['wait', 1.5], ['aim', -.3], ['spray', 4]],
  17: [['drive', 1.5], ['aim', .8], ['spray', 2], ['aim', .55], ['spray', 2], ['aim', .4], ['spray', 2], ['aim', .3], ['spray', 1.4], ['wait', 1.5],
    ['aim', -.7], ['spray', 3], ['aim', -.55], ['spray', 3]],
  18: [['drive', 1.5], ['aim', -.05], ['spray', 2.5], ['wait', 2], ['aim', .05], ['spray', 2.5], ['wait', 3], ['aim', -.6], ['spray', 3], ['aim', -.45], ['spray', 3]],
  19: [['drive', 2], ['aim', .5, 0], ['wait', .5], ['spray', .45], ['wait', 1], ['aim', -.7, -1], ['wait', .5], ['spray', 15], ['wait', 2], ['aim', -.6, 0], ['spray', 6]],
  20: [['drive', 2], ['aim', -.2, -1], ['spray', 3], ['aim', .3, 0], ['spray', .5], ['wait', 1.5], ['aim', -.2, -1], ['spray', 6], ['wait', 2],
    ['aim', -.6, 0], ['spray', 6], ['aim', .45, -1], ['spray', 3]],
  21: [['drive', 2], ['aim', .35, -1], ['spray', 2.5], ['aim', .25], ['spray', 2.5], ['wait', 1], ['aim', -.5], ['spray', 8], ['aim', -.4, 0], ['spray', 3], ['aim', .2], ['spray', 3]],
  22: [['drive', 2], ['aim', -.4, 0], ['spray', 1.2], ['wait', 2.5], ['aim', -.7], ['spray', 9], ['aim', -.3], ['spray', 1.5], ['wait', 3], ['aim', -.5], ['spray', 6]],
  23: [['drive', 2], ['aim', -.1, -1], ['spray', 2.5], ['aim', .5], ['spray', .4], ['wait', 3], ['aim', -.1], ['spray', 6], ['aim', .5], ['spray', .4],
    ['aim', -.1], ['spray', 3], ['aim', -.4], ['spray', .5], ['wait', 3], ['aim', -.1], ['spray', 6]],
  24: [['drive', 2], ['aim', -.35, -1], ['spray', 2.5], ['aim', -.5], ['spray', 3], ['aim', .1], ['spray', 6], ['aim', .3], ['spray', 1]],
};

async function open(page: Page, id: number) {
  await page.goto('/?unlock=all');
  await page.evaluate(() => localStorage.setItem('bararimba.v2', JSON.stringify({ settings: { zoom: 50, zoomSet: true }, progress: { stars: {}, best: {}, animals: [], tutorialSeen: true } })));
  await page.reload();
  await page.locator('[data-a=map]').click();
  await page.locator('[data-a=region][data-v=sumatra]').click({ force: true });
  await page.locator(`[data-a=select][data-v="${id}"]`).click();
  await page.locator('[data-a=start]').click();
  await page.locator('[data-a=go]').dispatchEvent('click');
  await expect.poll(() => page.evaluate(() => window.__BARARIMBA__!.snapshot().mode), { timeout: 15000 }).toBe('playing');
}

for (const [id, steps] of Object.entries(SOLUTIONS)) {
  test(`Sumatra level ${id}: known solution wins through key input only`, async ({ page }) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await open(page, Number(id));
    const end = await page.evaluate(async (steps: Step[]) => {
      type Scene = { sys: { pause(): void }; keys: Set<string>; mode: string; update(t: number, d: number): void; tweens: { update(t: number, d: number): void }; time: { update(t: number, d: number): void };
        truck: { cannon: { tip: number; boom: number } }; boss?: { defeated: boolean; core: { x: number; y: number } }; fires: { burning: { def: { x: number; y: number } }[] };
        water: { supply: number }; pressure: number; pressureLock: boolean; solveTip(x: number, y: number): number };
      const s = (window as unknown as { __dbgScene: Scene }).__dbgScene;
      s.sys.pause();
      let T = performance.now();
      const sim = (secs: number, keys: string[] = []) => {
        for (const k of keys) s.keys.add(k);
        for (let i = 0, n = Math.round(secs * 60); i < n && s.mode !== 'ended'; i++) { T += 1000 / 60; s.update(T, 1000 / 60); s.tweens.update(T, 1000 / 60); s.time.update(T, 1000 / 60); }
        for (const k of keys) s.keys.delete(k);
      };
      // Hold the aim keys just long enough: nozzle turns .7 rad/s (W up, S down), boom 1.1 /s (Q, E).
      const aim = (tip: number, boom?: number) => {
        const c = s.truck.cannon;
        if (boom !== undefined && Math.abs(boom - c.boom) > .01) sim(Math.abs(boom - c.boom) / 1.1, [boom > c.boom ? 'KeyE' : 'KeyQ']);
        if (Math.abs(tip - c.tip) > .01) sim(Math.abs(tip - c.tip) / .7, [tip > c.tip ? 'KeyS' : 'KeyW']);
      };
      for (const st of steps) {
        if (st[0] === 'drive') sim(st[1], ['KeyD']);
        if (st[0] === 'aim') aim(st[1], st[2]);
        if (st[0] === 'spray') sim(st[1], ['Space']);
        if (st[0] === 'wait') sim(st[1]);
        if (st[0] === 'duel') {
          // Track the boss core, douse fires on our bank between volleys, rest 11 s when the reserve runs dry.
          let rest = 0;
          for (let i = 0; i < 900 && s.mode === 'playing' && !s.boss!.defeated; i++) {
            if (s.water.supply < 15) rest = 44;
            if (rest > 0) { rest--; sim(.25); continue; }
            const near = s.fires.burning.find(f => f.def.x < 1650);
            const tgt = near && i % 6 >= 4 ? { x: near.def.x, y: near.def.y - 30 } : s.boss!.core;
            aim(s.solveTip(tgt.x, tgt.y), -1);
            sim(.25, s.pressureLock || s.pressure < 8 ? [] : ['Space']);
          }
        }
      }
      for (let i = 0; i < 120 && s.mode === 'playing'; i++) sim(.5);   // let the animal finish walking
      return { mode: s.mode };
    }, steps);
    const snap = await page.evaluate(() => window.__BARARIMBA__!.snapshot());
    expect(errors).toEqual([]);
    expect(end.mode).toBe('ended');
    expect(snap.animal.arrived, JSON.stringify(snap)).toBe(true);
    expect(snap.fires.filter(f => f.lit)).toEqual([]);
  });
}
