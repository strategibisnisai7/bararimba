import Phaser from 'phaser';

/** Small grayscale particle textures drawn once; particles tint/blend them at runtime. */
export function createParticleTextures(scene: Phaser.Scene) {
  const make = (key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) => {
    if (scene.textures.exists(key)) return;
    const tex = scene.textures.createCanvas(key, w, h)!;
    draw(tex.getContext());
    tex.refresh();
  };
  const radial = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, stops: [number, string][]) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    for (const [o, c] of stops) g.addColorStop(o, c);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  };
  make('p-soft', 64, 64, ctx => radial(ctx, 32, 32, 32, [[0, 'rgba(255,255,255,1)'], [.4, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]));
  make('p-glow', 128, 128, ctx => radial(ctx, 64, 64, 64, [[0, 'rgba(255,255,255,.9)'], [.35, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']]));
  make('p-spark', 16, 16, ctx => radial(ctx, 8, 8, 8, [[0, 'rgba(255,255,255,1)'], [.35, 'rgba(255,255,255,.9)'], [1, 'rgba(255,255,255,0)']]));
  // Flame lick: solid teardrop pointing up with a softened rim, so stacked particles read as tongues of fire.
  make('p-flame', 48, 80, ctx => {
    ctx.filter = 'blur(2.5px)';
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.beginPath();
    ctx.moveTo(24, 5);
    ctx.bezierCurveTo(30, 26, 42, 40, 41, 56);
    ctx.bezierCurveTo(40, 70, 32, 75, 24, 75);
    ctx.bezierCurveTo(16, 75, 8, 70, 7, 56);
    ctx.bezierCurveTo(6, 40, 18, 26, 24, 5);
    ctx.fill();
    ctx.filter = 'none';
    radial(ctx, 24, 56, 14, [[0, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']]);
  });
  // Lumpy smoke puff from overlapping blobs so rotated particles never look like discs.
  make('p-smoke', 96, 96, ctx => {
    const blobs = [[48, 50, 30], [34, 42, 20], [62, 40, 22], [40, 62, 20], [60, 62, 21], [48, 32, 18]];
    for (const [x, y, r] of blobs) radial(ctx, x, y, r, [[0, 'rgba(255,255,255,.55)'], [.6, 'rgba(255,255,255,.28)'], [1, 'rgba(255,255,255,0)']]);
  });
  // Water droplet: bright rim and specular highlight, mostly opaque so a dense jet reads as solid water.
  make('p-drop', 32, 32, ctx => {
    radial(ctx, 16, 16, 15, [[0, 'rgba(255,255,255,1)'], [.68, 'rgba(255,255,255,.95)'], [.86, 'rgba(255,255,255,.5)'], [1, 'rgba(255,255,255,0)']]);
  });
  make('p-shine', 32, 32, ctx => radial(ctx, 13, 12, 7, [[0, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']]));
  make('p-heart', 32, 32, ctx => {
    ctx.fillStyle = '#ff4f7b'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(16, 28); ctx.bezierCurveTo(-6, 14, 6, -2, 16, 9); ctx.bezierCurveTo(26, -2, 38, 14, 16, 28); ctx.fill(); ctx.stroke();
  });
  make('p-tear', 16, 24, ctx => {
    ctx.fillStyle = '#7fd8ff'; ctx.strokeStyle = '#1b6ea8'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(8, 2); ctx.quadraticCurveTo(15, 14, 8, 22); ctx.quadraticCurveTo(1, 14, 8, 2); ctx.fill(); ctx.stroke();
  });
}
