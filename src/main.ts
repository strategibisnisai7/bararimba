import Phaser from 'phaser';
import { LevelScene, sound } from './scenes/LevelScene';
import { WIDTH, HEIGHT, RENDER_SCALE } from './config/level';
import { GameUI, type Controller } from './ui/GameUI';
import './style.css';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game', width: WIDTH * RENDER_SCALE, height: HEIGHT * RENDER_SCALE,
  backgroundColor: '#7cc6e0',
  render: { antialias: true, pixelArt: false, roundPixels: false, powerPreference: 'high-performance' },
  // EXPAND fills any screen ratio: a 20:9 phone simply sees a wider slice of the world (720 tall stays fixed).
  scale: { mode: Phaser.Scale.EXPAND, autoCenter: Phaser.Scale.CENTER_BOTH, width: WIDTH * RENDER_SCALE, height: HEIGHT * RENDER_SCALE },
  physics: { default: 'matter', matter: { gravity: { x: 0, y: 1 }, enableSleeping: false, debug: false } },
  input: { activePointers: 4 },
  audio: { noAudio: true },
  scene: [],
});

let currentLevel = 1;
const scene = () => game.scene.getScene('level') as LevelScene;
const controller: Controller = {
  startLevel(id) { currentLevel = id; scene().scene.restart({ level: id, mode: 'play' }); },
  restart() { scene().scene.restart({ level: currentLevel, mode: 'play' }); },
  exitToMenu(screen) { scene().scene.restart({ level: 1, mode: 'attract' }); ui.show(screen); },
  pause() { scene().scene.pause(); sound.stopAll(); },
  resume() { scene().scene.resume(); },
  unlockAudio() { sound.unlock(); },
  click() { sound.click(); },
};
const ui = new GameUI(controller);
game.registry.set('ui', ui);
game.scene.add('level', LevelScene, true, { level: 1, mode: 'attract' });

// Keep the canvas matched to the stage after rotation, browser-bar changes or entering fullscreen.
const stage = document.querySelector<HTMLElement>('#stage')!;
new ResizeObserver(() => game.scale.refresh()).observe(stage);
document.addEventListener('fullscreenchange', () => setTimeout(() => game.scale.refresh(), 60));

if (import.meta.hot) import.meta.hot.dispose(() => game.destroy(true));
