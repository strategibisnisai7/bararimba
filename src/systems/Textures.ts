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
  // Ice block: translucent cyan crystal block with bevelled borders and frosty specular facets.
  make('ice-block', 64, 64, ctx => {
    ctx.fillStyle = 'rgba(150, 225, 255, 0.78)';
    ctx.beginPath();
    ctx.roundRect(3, 3, 58, 58, 8);
    ctx.fill();
    const g = ctx.createLinearGradient(0, 0, 64, 64);
    g.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    g.addColorStop(0.5, 'rgba(70, 180, 240, 0.2)');
    g.addColorStop(1, 'rgba(30, 130, 210, 0.55)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(4, 4, 56, 56, 7);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(12, 12); ctx.lineTo(32, 20); ctx.lineTo(52, 14);
    ctx.moveTo(32, 20); ctx.lineTo(28, 48); ctx.lineTo(14, 50);
    ctx.moveTo(28, 48); ctx.lineTo(50, 46);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.ellipse(18, 16, 7, 3, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(215, 245, 255, 0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(3, 3, 58, 58, 8);
    ctx.stroke();
  });
  // HD Giant Waterwheel: 320x320 heavy timber wheel with 8 buckets and brass hub
  make('hd-giant-wheel', 320, 320, ctx => {
    const cx = 160, cy = 160, r = 145;
    // Outer wooden rim
    ctx.lineWidth = 18;
    ctx.strokeStyle = '#5a381e';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    // Iron banding
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#2b313b';
    ctx.beginPath(); ctx.arc(cx, cy, r + 7, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r - 7, 0, Math.PI * 2); ctx.stroke();

    // 8 heavy spokes and catchment buckets
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const cos = Math.cos(a), sin = Math.sin(a);
      // Main beam
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#7c532d';
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + cos * r, cy + sin * r); ctx.stroke();
      // Highlight on beam
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#a6723e';
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + cos * (r - 10), cy + sin * (r - 10)); ctx.stroke();

      // Catchment bucket paddle
      const px = cx + cos * r, py = cy + sin * r;
      const pa = a + Math.PI / 2;
      ctx.fillStyle = '#6b4524';
      ctx.strokeStyle = '#321d0d';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(px, py, 22, a - 0.6, a + 1.8);
      ctx.fill(); ctx.stroke();

      // Brass rivet
      ctx.fillStyle = '#d4a34b';
      ctx.beginPath();
      ctx.arc(cx + cos * (r * 0.6), cy + sin * (r * 0.6), 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Central iron hub
    ctx.fillStyle = '#3a414d';
    ctx.beginPath(); ctx.arc(cx, cy, 38, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = '#1e2229'; ctx.stroke();
    // Brass inner plate
    ctx.fillStyle = '#d4a34b';
    ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1c1f24';
    ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2); ctx.fill();
  });

  // HD Ferry Boat: 260x70 wide timber raft/barge with deck and railings
  make('hd-ferry-boat', 260, 70, ctx => {
    // Hull
    ctx.fillStyle = '#4a2f18';
    ctx.beginPath();
    ctx.roundRect(10, 24, 240, 42, [0, 0, 16, 16]);
    ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#27170a'; ctx.stroke();

    // Wood plank grooves
    ctx.fillStyle = '#7a522e';
    ctx.beginPath();
    ctx.roundRect(12, 26, 236, 18, 4);
    ctx.fill();
    ctx.strokeStyle = '#3d2511'; ctx.lineWidth = 2;
    for (let x = 25; x < 240; x += 22) {
      ctx.beginPath(); ctx.moveTo(x, 26); ctx.lineTo(x, 44); ctx.stroke();
    }

    // Railing posts & rope
    ctx.fillStyle = '#9c6c3e';
    for (let x = 20; x <= 240; x += 44) {
      ctx.fillRect(x - 3, 6, 6, 20);
    }
    ctx.strokeStyle = '#d9c59c'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(16, 12);
    for (let x = 20; x <= 240; x += 44) {
      ctx.quadraticCurveTo(x + 22, 16, x + 44, 12);
    }
    ctx.stroke();

    // Mooring cleats & flag
    ctx.fillStyle = '#3a414d';
    ctx.fillRect(16, 20, 10, 6);
    ctx.fillRect(234, 20, 10, 6);
  });

  // HD Lift Car Platform: 240x70 industrial mountain hoist platform
  make('hd-lift-car', 240, 70, ctx => {
    // Heavy timber platform
    ctx.fillStyle = '#5c3e24';
    ctx.fillRect(10, 36, 220, 28);
    // Steel reinforcement trim
    ctx.strokeStyle = '#3d4552'; ctx.lineWidth = 5;
    ctx.strokeRect(10, 36, 220, 28);
    // Metal rivets
    ctx.fillStyle = '#bcc6d4';
    for (let x = 16; x < 230; x += 18) {
      ctx.beginPath(); ctx.arc(x, 50, 3, 0, Math.PI * 2); ctx.fill();
    }
    // Suspension cage bars
    ctx.strokeStyle = '#2b303a'; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(16, 36); ctx.lineTo(36, 4); ctx.lineTo(120, 0);
    ctx.lineTo(204, 4); ctx.lineTo(224, 36);
    ctx.stroke();
    // Central pulley eye
    ctx.fillStyle = '#d4a34b';
    ctx.beginPath(); ctx.arc(120, 4, 8, 0, Math.PI * 2); ctx.fill();
  });

  // HD Rope Bridge: 320x40 sagging suspension footway
  make('hd-rope-bridge', 320, 40, ctx => {
    // Sagging hemp ropes
    ctx.strokeStyle = '#a68a5d'; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 4); ctx.quadraticCurveTo(160, 28, 320, 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 32); ctx.quadraticCurveTo(160, 38, 320, 32);
    ctx.stroke();

    // Wooden planks
    for (let i = 0; i <= 20; i++) {
      const u = i / 20;
      const x = u * 320;
      const sag = Math.sin(u * Math.PI) * 14;
      ctx.fillStyle = i % 2 ? '#6e4a2c' : '#57381e';
      ctx.fillRect(x - 6, 22 + sag, 12, 10);
      ctx.strokeStyle = '#2b1a0d'; ctx.lineWidth = 1;
      ctx.strokeRect(x - 6, 22 + sag, 12, 10);
    }
  });

  // Papua Honai Hut: 140x130 native Papua thatched conical dwelling
  make('papua-honai', 140, 130, ctx => {
    // Drop shadow
    ctx.fillStyle = 'rgba(10, 16, 22, 0.45)';
    ctx.beginPath(); ctx.ellipse(70, 122, 58, 8, 0, 0, Math.PI * 2); ctx.fill();

    // Round timber wall
    const wallGrad = ctx.createLinearGradient(20, 60, 120, 60);
    wallGrad.addColorStop(0, '#422815');
    wallGrad.addColorStop(0.5, '#6e4526');
    wallGrad.addColorStop(1, '#3b2211');
    ctx.fillStyle = wallGrad;
    ctx.beginPath();
    ctx.roundRect(24, 60, 92, 60, [8, 8, 4, 4]);
    ctx.fill();

    // Vertical wooden slats
    ctx.strokeStyle = '#2d180b'; ctx.lineWidth = 1.5;
    for (let x = 32; x < 114; x += 10) {
      ctx.beginPath(); ctx.moveTo(x, 62); ctx.lineTo(x, 118); ctx.stroke();
    }

    // Arched low doorway
    ctx.fillStyle = '#180d06';
    ctx.beginPath();
    ctx.arc(70, 100, 14, Math.PI, 0);
    ctx.lineTo(84, 120); ctx.lineTo(56, 120);
    ctx.closePath();
    ctx.fill();
    // Warm interior lantern glow
    ctx.fillStyle = 'rgba(255, 170, 68, 0.4)';
    ctx.beginPath(); ctx.arc(70, 104, 9, 0, Math.PI * 2); ctx.fill();

    // Conical Thatch Roof
    const roofGrad = ctx.createLinearGradient(70, 0, 70, 75);
    roofGrad.addColorStop(0, '#d4a45b');
    roofGrad.addColorStop(0.4, '#b0813e');
    roofGrad.addColorStop(1, '#7a5120');
    ctx.fillStyle = roofGrad;
    ctx.beginPath();
    ctx.moveTo(70, 6);
    ctx.quadraticCurveTo(40, 35, 12, 70);
    ctx.quadraticCurveTo(70, 76, 128, 70);
    ctx.quadraticCurveTo(100, 35, 70, 6);
    ctx.closePath();
    ctx.fill();

    // Layered thatch fringes
    ctx.strokeStyle = '#573814'; ctx.lineWidth = 2;
    for (let row = 1; row <= 3; row++) {
      const y = 15 + row * 16, w = 24 + row * 32;
      ctx.beginPath();
      ctx.moveTo(70 - w / 2, y);
      for (let x = 70 - w / 2; x <= 70 + w / 2; x += 8) {
        ctx.lineTo(x + 4, y + 4);
        ctx.lineTo(x + 8, y);
      }
      ctx.stroke();
    }

    // Roof peak crown & straw tuft
    ctx.fillStyle = '#8f632c';
    ctx.beginPath(); ctx.arc(70, 8, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e0b56c'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(70, 8); ctx.lineTo(66, -2);
    ctx.moveTo(70, 8); ctx.lineTo(70, -4);
    ctx.moveTo(70, 8); ctx.lineTo(74, -2);
    ctx.stroke();
  });
}
