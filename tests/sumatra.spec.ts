import { test, expect, type Page } from '@playwright/test';

const snap = (page: Page) => page.evaluate(() => window.__BARARIMBA__!.snapshot());

/** Opens a Sumatra level from Peta Indonesia like a player would. `local` is the tile number on the Sumatra board. */
async function startSumatra(page: Page, local = 1) {
  await page.goto('/?unlock=all');
  await page.evaluate(() => localStorage.setItem('bararimba.v2', JSON.stringify({ settings: { zoom: 50, zoomSet: true }, progress: { stars: {}, best: {}, animals: [], tutorialSeen: true } })));
  await page.reload();
  await page.locator('[data-a=map]').click();
  await page.locator('[data-a=region][data-v=sumatra]').click({ force: true });
  await page.locator(`[data-a=select][data-v="${15 + local}"]`).click();
  await page.locator('[data-a=start]').click();
  await page.locator('[data-a=go]').dispatchEvent('click');
  await expect.poll(async () => (await snap(page)).mode, { timeout: 12000 }).toBe('playing');
}
async function hold(page: Page, key: string, ms: number) { await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key); }

test('Peta Indonesia opens the Sumatra board; its first level is open, the rest unlock in order', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.removeItem('bararimba.v2'));
  await page.reload();
  await page.locator('[data-a=map]').click();
  await page.locator('[data-a=region][data-v=sumatra]').click({ force: true });
  await expect(page.locator('.title-plank b')).toHaveText('SUMATRA');
  await expect(page.locator('.tile')).toHaveCount(10);
  await expect(page.locator('.tile.boss')).toHaveCount(1);
  await expect(page.locator('[data-a=select][data-v="16"]')).not.toHaveClass(/locked/);
  await expect(page.locator('[data-a=select][data-v="17"]')).toHaveClass(/locked/);
  await expect(page.locator('.info-card strong')).toHaveText('Batu Pembuka');
});

test('Sumatra 2-1: boulder opens the cave door, fire out, the calf walks to the flag and the level is won', async ({ page }) => {
  test.setTimeout(90_000);
  await startSumatra(page, 1);
  const s0 = await snap(page);
  expect(s0.gates).toEqual([{ id: 'cave', open: false }]);
  expect(s0.animal.arrived).toBe(false);
  // Roll forward, lower the nozzle onto the ledge and wash the boulder off onto the pressure stone.
  await hold(page, 'KeyD', 1200);
  await hold(page, 'KeyS', 1050);
  await hold(page, 'Space', 3000);
  await expect.poll(async () => (await snap(page)).gates[0].open, { timeout: 10000 }).toBe(true);
  // Lift the nozzle into a lob and keep spraying until both fires are out.
  await hold(page, 'KeyW', 600);
  for (let i = 0; i < 6 && (await snap(page)).fires.some(f => f.lit); i++) await hold(page, 'Space', 1500);
  await expect.poll(async () => (await snap(page)).fires.filter(f => f.lit).length, { timeout: 10000 }).toBe(0);
  await expect.poll(async () => (await snap(page)).animal.arrived, { timeout: 20000 }).toBe(true);
  await expect(page.getByRole('dialog', { name: 'Level selesai' })).toBeVisible({ timeout: 10000 });
});

test('Sumatra 2-1 restart restores the door, boulder, fires and calf', async ({ page }) => {
  test.setTimeout(60_000);
  await startSumatra(page, 1);
  const s0 = await snap(page);
  await hold(page, 'KeyD', 1200);
  await hold(page, 'KeyS', 1050);
  await hold(page, 'Space', 3000);
  await expect.poll(async () => (await snap(page)).gates[0].open, { timeout: 10000 }).toBe(true);
  await page.getByRole('button', { name: 'Ulang level' }).click();
  await page.getByRole('button', { name: 'Ya' }).click();
  await expect.poll(async () => (await snap(page)).mode, { timeout: 12000 }).toBe('playing');
  const s1 = await snap(page);
  expect(s1.gates[0].open).toBe(false);
  expect(s1.animal.x).toBe(s0.animal.x);
  expect(Math.round(s1.props[0].x)).toBe(Math.round(s0.props[0].x));
  expect(s1.fires.filter(f => f.lit).length).toBe(s0.fires.filter(f => f.lit).length);
  expect(s1.water).toBe(100);
});

test('Sumatra 2-7 restart restores the lowered bridge, the stopper boulder and the burnt lock', async ({ page }) => {
  test.setTimeout(60_000);
  await startSumatra(page, 7);
  const s0 = await snap(page);
  expect(s0.sm?.bridges).toEqual(['bridge:locked:90']);
  // Fast-forward the real scene with player keys only: boulder into the socket, lock fire out, both pins released.
  await page.evaluate(() => {
    type S = { sys: { pause(): void; resume(): void }; keys: Set<string>; mode: string; update(t: number, d: number): void; tweens: { update(t: number, d: number): void }; time: { update(t: number, d: number): void }; truck: { cannon: { tip: number; boom: number } } };
    const s = (window as unknown as { __dbgScene: S }).__dbgScene;
    s.sys.pause();
    let T = performance.now();
    const sim = (secs: number, keys: string[] = []) => { for (const k of keys) s.keys.add(k); for (let i = 0; i < secs * 60; i++) { T += 1000 / 60; s.update(T, 1000 / 60); s.tweens.update(T, 1000 / 60); s.time.update(T, 1000 / 60); } for (const k of keys) s.keys.delete(k); };
    const aim = (tip: number, boom: number) => { const c = s.truck.cannon; sim(Math.abs(boom - c.boom) / 1.1, [boom > c.boom ? 'KeyE' : 'KeyQ']); sim(Math.abs(tip - c.tip) / .7, [tip > c.tip ? 'KeyS' : 'KeyW']); };
    sim(2, ['KeyD']); aim(-.4, 0); sim(1.2, ['Space']); sim(2.5); aim(-.7, 0); sim(9, ['Space']); aim(-.3, 0); sim(1.5, ['Space']); sim(3);
    s.sys.resume();
  });
  const s1 = await snap(page);
  expect(s1.sm?.bridges).toEqual(['bridge:down:0']);
  await page.getByRole('button', { name: 'Ulang level' }).click();
  await page.getByRole('button', { name: 'Ya' }).click();
  await expect.poll(async () => (await snap(page)).mode, { timeout: 12000 }).toBe('playing');
  const s2 = await snap(page);
  expect(s2.sm?.bridges).toEqual(['bridge:locked:90']);
  expect(s2.props.map(p => Math.round(p.x))).toEqual(s0.props.map(p => Math.round(p.x)));
  expect(s2.fires.map(f => f.lit)).toEqual(s0.fires.map(f => f.lit));
  expect(s2.animal.x).toBe(s0.animal.x);
});
