class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }
  create() { this.scene.start('MenuScene'); }
}
