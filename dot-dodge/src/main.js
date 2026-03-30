const GAME_WIDTH = Math.min(window.innerWidth, 480);
const GAME_HEIGHT = window.innerHeight;

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#050510',
  scene: [MenuScene, GameScene, StageCompleteScene, GameOverScene],
  parent: document.body,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

window.BEST_STAGE = 1;

new Phaser.Game(config);
