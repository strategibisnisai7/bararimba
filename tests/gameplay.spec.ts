import { test, expect, type Page } from '@playwright/test';

const snap = (page: Page) => page.evaluate(() => window.__BARARIMBA__!.snapshot());

async function startLevel(page: Page, level = 1) {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('bararimba.v2', JSON.stringify({ progress: { stars: { 1: 1, 2: 1 }, best: {}, animals: [], tutorialSeen: true } })));
  await page.reload();
  await page.locator('[data-a=play]').click();
  await page.locator(`[data-a=select][data-v="${level}"]`).click();
  await page.locator('[data-a=start]').click();
  await page.locator('[data-a=go]').dispatchEvent('click');
  await expect.poll(async () => (await snap(page)).mode, { timeout: 9000 }).toBe('playing');
}

test('menu shows all Game Board entries and every screen opens', async ({ page }) => {
  await page.goto('/');
  for (const label of ['Main', 'Peta Indonesia', 'Koleksi Satwa', 'Pengaturan']) await expect(page.getByRole('button', { name: label })).toBeVisible();
  await page.locator('[data-a=map]').click();
  await expect(page.locator('.region')).toHaveCount(5);
  await page.locator('.region.open').click();
  await expect(page.locator('.tile')).toHaveCount(15);
  await expect(page.locator('.tile.boss')).toHaveCount(1);
  await expect(page.locator('.tile.boss')).toContainText('BOSS');
  await page.locator('[data-a=menu]').click();
  await page.locator('[data-a=collection]').click();
  await expect(page.locator('.animal-card')).toHaveCount(14);
  await page.locator('[data-a=menu]').click();
  await page.locator('[data-a=settings]').click();
  await expect(page.getByRole('dialog', { name: 'Pengaturan' })).toBeVisible();
});

test('truck drives forward and backward; boom and nozzle are set only by the player', async ({ page }) => {
  await startLevel(page);
  const s0 = await snap(page);
  await page.keyboard.down('KeyD'); await page.waitForTimeout(900); await page.keyboard.up('KeyD');
  const s1 = await snap(page);
  expect(s1.truck.x).toBeGreaterThan(s0.truck.x + 80);
  await page.keyboard.down('KeyA'); await page.waitForTimeout(1300); await page.keyboard.up('KeyA');
  expect((await snap(page)).truck.x).toBeLessThan(s1.truck.x - 40);
  // Pointer movement over the world no longer aims; the nozzle button does.
  const before = (await snap(page)).nozzle.angle;
  await page.mouse.move(900, 200); await page.mouse.move(1100, 500); await page.waitForTimeout(300);
  expect((await snap(page)).nozzle.angle).toBeCloseTo(before, 2);
  const up = page.getByRole('button', { name: 'Naikkan nozzle' });
  const b = (await up.boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down(); await page.waitForTimeout(500); await page.mouse.up();
  await page.waitForTimeout(400);
  expect((await snap(page)).nozzle.angle).toBeLessThan(before - .1);
});

test('fires grow over time and spread when ignored', async ({ page }) => {
  await startLevel(page);
  const lit0 = (await snap(page)).fires.filter(f => f.lit);
  await page.waitForTimeout(12000);
  const s = await snap(page);
  const lit1 = s.fires.filter(f => f.lit);
  expect(lit1[0].i).toBeGreaterThan(lit0[0].i);
  expect(s.burn).toBeGreaterThan(0);
});

test('pause, confirm dialog and resume keep the level state', async ({ page }) => {
  await startLevel(page);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Jeda' })).toBeVisible();
  await page.getByRole('button', { name: 'Keluar level' }).click();
  await expect(page.getByRole('alertdialog', { name: 'Keluar level?' })).toBeVisible();
  await page.getByRole('button', { name: 'Tidak' }).first().click();
  await page.getByRole('button', { name: 'Lanjutkan' }).click();
  expect((await snap(page)).mode).toBe('playing');
});
