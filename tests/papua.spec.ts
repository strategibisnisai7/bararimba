import { test, expect } from '@playwright/test';

test('Papua expedition: multi-floor arena, descending lift, and sailing ferry', async ({ page }) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/?unlock=all');
  await page.evaluate(() => localStorage.setItem('bararimba.v2', JSON.stringify({ campaignVersion: 3, settings: { zoom: 50, zoomSet: true }, progress: { stars: {}, best: {}, animals: [], tutorialSeen: true } })));
  await page.reload();
  await page.locator('[data-a=map]').click();
  await page.locator('[data-a=region][data-v=papua]').click({ force: true });
  await page.locator('[data-a=select][data-v="66"]').click();
  await page.locator('[data-a=start]').click();
  await page.locator('[data-a=go]').dispatchEvent('click');
  await expect.poll(() => page.evaluate(() => window.__BARARIMBA__!.snapshot().mode), { timeout: 30000 }).toBe('playing');

  const result = await page.evaluate(() => {
    const s = (window as any).__dbgScene;
    s.sys.pause();
    let T = performance.now();
    const sim = (secs: number, keys: string[] = []) => {
      keys.forEach(k => s.keys.add(k));
      for (let i = 0; i < Math.round(secs * 60) && s.mode === 'playing'; i++) {
        T += 1000 / 60; s.update(T, 1000 / 60); s.tweens.update(T, 1000 / 60); s.time.update(T, 1000 / 60);
      }
      keys.forEach(k => s.keys.delete(k));
    };
    const aimAt = (x: number, y: number) => {
      const tip = s.solveTip(x, y, true);
      s.truck.cannon.setTip(tip);
      sim(.2);
    };
    const shoot = (x: number, y: number, secs = .8) => { aimAt(x, y); sim(secs, ['Space']); sim(1.2); };

    // 1. Drive forward up the hill onto the lift at 880
    sim(3.8, ['KeyD']);
    const hillX = s.truck.x;
    const truckAtLift = s.world.truckOnLift(s.truck.x);

    // 2. Shoot water into the lift bucket to trigger descent
    for (let k = 0; k < 8 && !s.world.lift.latched; k++) {
      shoot(1040, 250, 1.4);
    }
    const liftLatched = s.world.lift.latched;

    // Wait for lift to descend
    sim(3.5);
    const liftDescended = Math.abs(s.world.lift.currentY - s.world.lift.y1) <= 10;

    // 3. Drive onto the ferry at 1120
    sim(2.5, ['KeyD']);
    const onFerry = s.world.truckOnFerry(s.truck.x);

    // 4. Spray water to sail ferry across the lake
    for (let k = 0; k < 8 && s.world.ferry.x < s.world.ferry.x1 - 25; k++) {
      sim(1.2, ['Space']);
    }
    const ferryDocked = s.world.ferry.x >= s.world.ferry.x1 - 35;

    // 5. Drive off ferry onto far shore
    sim(2.5, ['KeyD']);
    const farShoreX = s.truck.x;

    // 6. Shoot water at the roof ice block ahead to slide it into the red button
    for (let k = 0; k < 12 && !s.world.lever.pressed; k++) {
      const ice = s.world.props.find((p: any) => p.kind === 'ice' || p.kind === 'ice-block');
      const targetX = ice ? ice.body.position.x : 2250;
      shoot(targetX, 190, 1.2);
    }
    const gateOpened = s.world.lever.pressed;

    // 7. Douse fires in Floor 2 and Floor 1
    shoot(2280, 350, 1.4);
    shoot(2320, 480, 1.4);

    return {
      hillX, truckAtLift, liftLatched, liftDescended,
      onFerry, ferryDocked, farShoreX, gateOpened,
      truckX: s.truck.x,
      ferryX: s.world.ferry?.x,
      liftCurrentY: s.world.lift?.currentY,
    };
  });

  console.log('PAPUA TEST RESULT:', JSON.stringify(result, null, 2));
  expect(errors).toEqual([]);
  expect(result.hillX).toBeGreaterThan(700);
  expect(result.truckAtLift).toBe(true);
  expect(result.liftLatched).toBe(true);
  expect(result.liftDescended).toBe(true);
  expect(result.onFerry).toBe(true);
  expect(result.ferryDocked).toBe(true);
  expect(result.gateOpened).toBe(true);
});
