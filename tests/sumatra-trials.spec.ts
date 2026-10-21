import { test, expect, type Page } from '@playwright/test';

/** Levels 2-10 to 2-20 replayed by a scripted player. Each script reads the scene to decide where to aim (the way a
 * player looks at the screen) but only ever holds the player's keys: D/A drive, W/S nozzle, Q/E boom, Space spray.
 * The scene's loop is paused and stepped at 60 Hz for speed. A failing replay means a level became unsolvable. */
const PLAYERS: Record<number, string> = {
  // 2-10 Akar Jembatan: douse the root's foot, then keep the stream on the growing tip.
  25: `drive(2.5); aimTip(-.5, 1);
    for (let i = 0; i < 40 && s.fires.fires[0].lit; i++) { aimAt(780, 520); spray(.25); }
    const r = s.world.sm.trials.root;
    for (let i = 0; i < 160 && !r.latched; i++) { aimAt(r.def.x + r.def.len * r.f + 10, 534); spray(.25); }
    for (const f of s.fires.fires) for (let i = 0; i < 40 && f.lit; i++) { aimAt(f.def.x, f.def.y - 30, f.def.x > 1150); spray(.25); }`,
  // 2-11 Giring Rusa: fires first, then splash behind the deer (flat under the low roof, lobs past it).
  26: `const a = s.animal; drive(4); aimTip(-.5, 1);
    for (const f of s.fires.fires.slice(0, 2)) for (let i = 0; i < 50 && f.lit; i++) { aimAt(f.def.x, f.def.y - 30, true); spray(.25); }
    for (let i = 0; i < 400 && !a.arrived; i++) { const tx = a.px - 100; aimAt(tx, 540, tx > 1490); spray(.2); }`,
  // 2-12 Runtuhan Stalaktit: bring down all three, then the fires.
  27: `drive(3); aimTip(-.5, -1);
    for (const sp of s.world.sm.trials.spikes) { for (let i = 0; i < 40 && sp.state === 'hang'; i++) { aimAt(sp.def.x, sp.def.top + sp.def.len * .7); spray(.25); } sim(1.5); }
    for (const f of s.fires.fires) for (let i = 0; i < 50 && f.lit; i++) { aimAt(f.def.x, f.def.y - 30); spray(.25); }`,
  // 2-13 Sekat Bakar Gambut: keep soaking the drier of the two bushes ahead of the front until it stalls.
  28: `const b = s.world.sm.trials.brk; drive(2); aimTip(-.5, -1);
    for (let i = 0; i < 300 && !b.held && s.mode === 'playing'; i++) {
      const n1 = b.cells[b.front + 1], n2 = b.cells[b.front + 2], t = !n2 || n1.wet < n2.wet ? n1 : n2;
      aimAt(t.x, 540); spray(.2);
    }
    for (let k = 0; k < 4; k++) for (const f of s.fires.burning) for (let i = 0; i < 40 && f.lit; i++) { aimAt(f.def.x, f.def.y - 30); spray(.25); }`,
  // 2-14 Pancing Madu: the fire under the middle comb, then each swinging rope, leading the swing.
  29: `const tr = s.world.sm.trials, a = s.animal; drive(3); aimTip(-.5, -1);
    const f0 = s.fires.fires[0]; for (let i = 0; i < 40 && f0.lit; i++) { aimAt(f0.def.x, f0.def.y - 30); spray(.25); }
    for (const l of tr.lures) {
      for (let i = 0; i < 200 && l.state === 'hang'; i++) {
        const flight = (l.x - s.truck.cannon.nozzle.x) / 600;
        aimAt(l.def.x + Math.sin((l.t + flight) * 1.4) * l.def.swing, l.y); spray(.15);
      }
      sim(1);
    }
    for (let i = 0; i < 80 && !a.arrived; i++) { sim(.5); for (const f of s.fires.burning) for (let k = 0; k < 20 && f.lit; k++) { aimAt(f.def.x, f.def.y - 30); spray(.25); } }`,
  // 2-15 Hujan Bara: shoot falling embers, otherwise clear the fires in front of the calf.
  30: `const a = s.animal, e = s.world.sm.trials.ember; drive(2.5); aimTip(-.5, -1);
    for (let i = 0; i < 900 && !a.arrived && s.mode === 'playing'; i++) {
      if (s.water.supply < 10) { sim(.2); continue; }
      const m = e.list.find(m => m.hp > 0);
      const fire = s.fires.burning.filter(f => f.def.x < a.px + 60).sort((p, q) => q.def.x - p.def.x)[0];
      if (m) { const T = Math.max(.3, (m.x - s.truck.cannon.nozzle.x) / 560); aimAt(m.x, Math.min(m.y + m.vy * T + 150 * T * T, 520)); spray(.12); }
      else if (fire) { aimAt(fire.def.x, fire.def.y - 30); spray(.2); }
      else sim(.1);
    }
    for (const f of s.fires.burning) for (let k = 0; k < 30 && f.lit; k++) { aimAt(f.def.x, f.def.y - 30); spray(.25); }`,
  // 2-16 Tanggul Lumpur: lob onto the mud dam until the lake floods the tunnel, then wash the slip away.
  31: `const P = s.world.puzzles, dam = P.gate('tanggul'), slip = P.gate('longsor'); drive(3); aimTip(-.5, -1);
    for (let i = 0; i < 80 && !dam.open; i++) { aimAt(dam.x - 6, dam.body.bounds.min.y + 4, true); spray(.25); }
    for (let i = 0; i < 60 && !slip.open; i++) { aimAt(slip.x - 10, slip.body.bounds.min.y + 6); spray(.25); }
    sim(15);`,
  // 2-17 Lori Terbakar: lead the swinging cart (predicted along its swing) until its fire is out.
  32: `const c = s.world.sm.trials.cart, fire = s.fires.fires[0], mid = (c.def.x0 + c.def.x1) / 2, w = 2 * Math.PI / c.def.period;
    drive(2.5); aimTip(-.5, -1);
    const predict = T => mid + (c.x - mid) * Math.cos(w * T) + c.v / w * Math.sin(w * T);
    for (let i = 0; i < 300 && fire.lit; i++) { const T = (c.x - s.truck.cannon.nozzle.x) / (680 * Math.cos(s.truck.cannon.tip)); aimAt(predict(T + .05), fire.def.y - 30); spray(.1); }
    for (let i = 0; i < 100 && !c.latched; i++) sim(.1);
    for (let k = 0; k < 3; k++) for (const f of s.fires.burning) for (let i = 0; i < 40 && f.lit; i++) { aimAt(f.def.x, f.def.y - 30); spray(.25); }`,
  // 2-18 Sarang Rangkong: flat shot at the near fire, lobs for everything past the nest.
  33: `drive(3); aimTip(-.5, -1);
    for (const k of [0, 1, 2, 3]) { const f = s.fires.fires[k]; for (let i = 0; i < 60 && f.lit; i++) { aimAt(f.def.x + (k === 0 ? -15 : k === 1 ? 20 : 0), f.def.y - 25, k !== 0); spray(.15); } }`,
  // 2-19 Kereta Gantung: pylon and station fires, wind the car over (above the axle), wait, wind it home (below).
  34: `const g = s.world.sm.trials.gondola, wh = s.world.wheel; drive(2.5); aimTip(-.5, -1);
    for (const k of [0, 1]) { const f = s.fires.fires[k]; for (let i = 0; i < 60 && f.lit; i++) { aimAt(f.def.x, f.def.y - 30, k === 1); spray(.2); } }
    for (let i = 0; i < 200 && g.phase === 'go'; i++) { aimAt(wh.cx, wh.cy - wh.r * .7); spray(.2); }
    for (let i = 0; i < 100 && g.phase === 'docked'; i++) { sim(.2); for (const f of s.fires.burning) { aimAt(f.def.x, f.def.y - 30, true); spray(.2); } }
    for (let i = 0; i < 200 && g.phase === 'ride'; i++) { aimAt(wh.cx, wh.cy + wh.r * .7); spray(.2); }
    for (const f of s.fires.burning) for (let i = 0; i < 60 && f.lit; i++) { aimAt(f.def.x, f.def.y - 30, true); spray(.2); }`,
  // 2-20 boss: advance while clearing the road, douse the braziers whenever the shield is up, else hit the boss;
  // rest 11 s when the reserve runs dry.
  35: `const b = s.boss, sh = s.def.sm.shield;
    drive(1.2); aimTip(.2, 0); spray(4); drive(5);
    let rest = 0;
    for (let i = 0; i < 1500 && s.mode === 'playing' && !b.defeated; i++) {
      if (s.water.supply < 15) rest = 44;
      if (rest > 0) { rest--; sim(.25); continue; }
      if (s.truck.x < 1440 && s.driveLimits(1).max > s.truck.x + 8) { sim(.25, ['KeyD']); continue; }
      const brazier = sh.fires.map(k => s.fires.fires[k]).find(f => f.lit);
      const road = s.fires.burning.filter(f => f.def.x < 1650 && !sh.fires.includes(f.index)).sort((p, q) => p.def.x - q.def.x)[0];
      const tgt = road && (road.def.x < s.truck.x + 450 || i % 6 >= 4) ? { x: road.def.x, y: road.def.y - 30 } : brazier ? { x: brazier.def.x, y: brazier.def.y - 30 } : b.core;
      aimAt(tgt.x, tgt.y);
      sim(.25, s.pressureLock || s.pressure < 8 ? [] : ['Space']);
    }`,
};

async function open(page: Page, id: number) {
  await page.goto('/?unlock=all');
  await page.evaluate(() => localStorage.setItem('bararimba.v2', JSON.stringify({ campaignVersion: 3, settings: { zoom: 50, zoomSet: true }, progress: { stars: {}, best: {}, animals: [], tutorialSeen: true } })));
  await page.reload();
  await page.locator('[data-a=map]').click();
  await page.locator('[data-a=region][data-v=sumatra]').click({ force: true });
  await page.locator(`[data-a=select][data-v="${id}"]`).click();
  await page.locator('[data-a=start]').click();
  await page.locator('[data-a=go]').dispatchEvent('click');
  await expect.poll(() => page.evaluate(() => window.__BARARIMBA__!.snapshot().mode), { timeout: 15000 }).toBe('playing');
}

for (const [id, player] of Object.entries(PLAYERS)) {
  test(`Sumatra ${Number(id) - 15 >= 10 ? `2-${Number(id) - 15}` : id}: scripted player wins with key input only`, async ({ page }) => {
    test.setTimeout(180_000);
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await open(page, Number(id));
    const end = await page.evaluate((body: string) => {
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
      const spray = (secs: number) => sim(secs, ['Space']);
      const drive = (secs: number) => sim(secs, ['KeyD']);
      new Function('s', 'sim', 'aimTip', 'aimAt', 'spray', 'drive', body)(s, sim, aimTip, aimAt, spray, drive);
      for (let i = 0; i < 120 && s.mode === 'playing'; i++) sim(.5);   // let the animal finish walking
      return { mode: s.mode, won: s.result?.won ?? s.mode === 'ended', state: s.world.sm.status() };
    }, player);
    const snap = await page.evaluate(() => window.__BARARIMBA__!.snapshot());
    expect(errors).toEqual([]);
    expect(end.mode, JSON.stringify(end)).toBe('ended');
    expect(snap.animal.arrived, JSON.stringify(snap.sm)).toBe(true);
    expect(snap.fires.filter(f => f.lit)).toEqual([]);
  });
}
