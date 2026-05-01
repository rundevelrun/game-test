const config = {
  type: Phaser.AUTO,
  width: 400,
  height: 700,
  backgroundColor: '#050510',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 400,
    height: 700
  },
  scene: [MenuScene, GameScene, GameOverScene],
  render: { antialias: true }
};
const game = new Phaser.Game(config);
window.addEventListener('resize', () => game.scale.refresh());
