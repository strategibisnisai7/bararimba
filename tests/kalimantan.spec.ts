import { test, expect, type Page } from '@playwright/test';

/** Every Kalimantan level (3-1 to 3-30) played by one generic scripted player. It reads what a player sees — the
 * yellow objective marker (sm.focus()), fires, ember balls, its own water — and only holds the player's keys:
 * D/A drive, W/S nozzle, Q/E boom, Space spray. The scene's loop is paused and stepped at 60 Hz for speed.
 * A failing level means its mission chain became unsolvable (or its tuning drifted). */
const PLAYER = `
  const sm = s.world.sm, kit = sm.kit;
  while (s.truck.x < 255 && s.mode === 'playing') drive(.1);
  aimTip(-.5, -1);
  let last = '', still = 0, high = false, lastWhat = '';
  for (let i = 0; i < 2400 && s.mode === 'playing'; i++) {
    // Low on water: back to the tower and wait there. Boss levels: let the pressure recover.
    if (s.water.supply < 14) { if (s.truck.x > 380) back(.5); else sim(3); continue; }
    if (s.boss && (s.pressureLock || s.pressure < 8)) { sim(.25); continue; }
    // Shoot down an ember ball heading for the truck.
    const n = s.truck.cannon.nozzle;
    const ball = s.boss?.shots?.find(b => b.life > 0 && b.kind === 'ball' && b.vx < 0 && b.x - n.x < 1050 && b.x > n.x + 150);
    if (ball) { const T = Math.max(.2, (ball.x - n.x) / 900); aimAt(ball.x + ball.vx * T, Math.min(520, ball.y + ball.vy * T + 250 * T * T)); sim(.15, ['Space']); continue; }
    let tgt = sm.focus();
    if (!tgt) { const f = s.fires.burning.slice().sort((p, q) => p.def.x - q.def.x)[0]; if (f) tgt = { x: f.def.x, y: f.def.y - 30, how: 'spray', what: 'fire' }; }
    if (!tgt) { sim(.25); continue; }
    // A fire on the road to a far target is cleared first, so the truck can drive closer.
    const road = s.fires.burning.find(f => f.def.y >= 540 && f.def.x > s.truck.x && f.def.x < tgt.x && tgt.x - n.x > 600 && Math.abs(f.def.y - s.world.groundAt(f.def.x)) < 10);
    if (road && tgt.what !== 'fire') tgt = { x: road.def.x, y: road.def.y - 30, how: 'spray', what: 'road-fire' };
    if (tgt.how === 'hold') { sim(.15); continue; }
    if (tgt.what !== lastWhat) { lastWhat = tgt.what; high = false; still = 0; }
    // Stay within the water's reach of the target.
    const gap = tgt.x - n.x;
    if (gap > (tgt.y < 300 ? 620 : 900)) { const x0 = s.truck.x; drive(.4); if (Math.abs(s.truck.x - x0) > 3) continue; }
    else if (gap < 250 && s.truck.x > 230) { back(.4); continue; }
    // No progress: try a lob instead of a flat shot, then drive nearer.
    const st = sm.status();
    const sig = JSON.stringify([st.kit, st.trials, st.raft, st.bridges, st.free, st.chain]) + s.fires.burning.map(f => f.intensity.toFixed(1)).join();
    if (sig === last) {
      ++still;
      if (still % 16 === 0 && tgt.how !== 'push') high = !high;
      if (still % 48 === 0 && gap > 300) { const x0 = s.truck.x; drive(.5); if (Math.abs(s.truck.x - x0) > 3) continue; }
      if (still > 400) break;
    } else { still = 0; last = sig; }
    // Logs are pushed with a flat stream from a lowered boom.
    const boom = tgt.how === 'push' ? 1 : -1;
    if (Math.abs(s.truck.cannon.boom - boom) > .05) aimTip(s.truck.cannon.tip, boom);
    aimAt(tgt.x, tgt.y, high);
    sim(tgt.how === 'spray' ? .2 : .12, ['Space']);
    if (tgt.how !== 'spray') sim(.08);
  }
  for (let i = 0; i < 80 && s.mode === 'playing'; i++) sim(.5);   // let the animal finish walking
`;

async function open(page: Page, id: number) {
  await page.goto('/?unlock=all');
  await page.evaluate(() => localStorage.setItem('bararimba.v2', JSON.stringify({ campaignVersion: 3, settings: { zoom: 50, zoomSet: true }, progress: { stars: {}, best: {}, animals: [], tutorialSeen: true } })));
  await page.reload();
  await page.locator('[data-a=play]').click();
  await page.locator('[data-a=region][data-v=kalimantan]').click({ force: true });
  await page.locator(`[data-a=select][data-v="${id}"]`).click();
  await page.locator('[data-a=start]').click();
  await page.locator('[data-a=go]').dispatchEvent('click');
  await expect.poll(() => page.evaluate(() => window.__BARARIMBA__!.snapshot().mode), { timeout: 15000 }).toBe('playing');
}

test('Kalimantan board: 30 levels, two boss tiles, only 3-1 open on a fresh save', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.removeItem('bararimba.v2'));
  await page.reload();
  await page.locator('[data-a=play]').click();
  await page.locator('[data-a=region][data-v=kalimantan]').click({ force: true });
  await expect(page.locator('.title-plank b')).toHaveText('KALIMANTAN');
  await expect(page.locator('.tile')).toHaveCount(30);
  await expect(page.locator('.tile.boss')).toHaveCount(2);
  await expect(page.locator('[data-a=select][data-v="36"]')).not.toHaveClass(/locked/);
  await expect(page.locator('[data-a=select][data-v="37"]')).toHaveClass(/locked/);
});

for (let id = 36; id <= 65; id++) {
  test(`Kalimantan 3-${id - 35}: generic player wins with key input only`, async ({ page }) => {
    test.setTimeout(300_000);
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await open(page, id);
    await page.evaluate((body: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = (window as any).__dbgScene;
      s.sys.pause();
      let T = performance.now();
      const sim = (secs: number, keys: string[] = []) => {
        for (const k of keys) s.keys.add(k);
        for (let i = 0, n = Math.round(secs * 60); i < n && s.mode === 'playing'; i++) { T += 1000 / 60; s.update(T, 1000 / 60); s.tweens.update(T, 1000 / 60); s.time.update(T, 1000 / 60); }
        for (const k of keys) s.keys.delete(k);
      };
      // Hold the aim keys just long enough: nozzle turns .7 rad/s (W up, S down), boom 1.1 /s (Q, E).
      const aimTip = (tip: number, boom?: number) => {
        const c = s.truck.cannon;
        if (boom !== undefined && Math.abs(boom - c.boom) > .01) sim(Math.abs(boom - c.boom) / 1.1, [boom > c.boom ? 'KeyE' : 'KeyQ']);
        if (Math.abs(tip - c.tip) > .01) sim(Math.abs(tip - c.tip) / .7, [tip > c.tip ? 'KeyS' : 'KeyW']);
      };
      // Nozzle angle whose ballistic arc passes (x, y); `high` takes the lob instead of the flat shot.
      const aimAt = (x: number, y: number, high = false) => {
        for (let k = 0; k < 3; k++) {
          const n = s.truck.cannon.nozzle, dx = x - n.x, dy = y - n.y;
          const a = 560 * dx * dx / (2 * 680 * 680), disc = dx * dx - 4 * a * (a - dy);
          aimTip(Math.max(-1.4, Math.min(.55, Math.atan((-dx + (high ? -1 : 1) * Math.sqrt(Math.max(0, disc))) / (2 * a)))));
        }
      };
      const drive = (secs: number) => sim(secs, ['KeyD']);
      const back = (secs: number) => sim(secs, ['KeyA']);
      new Function('s', 'sim', 'aimTip', 'aimAt', 'drive', 'back', body)(s, sim, aimTip, aimAt, drive, back);
    }, PLAYER);
    const snap = await page.evaluate(() => window.__BARARIMBA__!.snapshot());
    expect(errors).toEqual([]);
    expect(snap.mode, JSON.stringify(snap.sm)).toBe('ended');
    expect(snap.animal.arrived, JSON.stringify(snap.sm)).toBe(true);
    expect(snap.fires.filter(f => f.lit)).toEqual([]);
  });
}
