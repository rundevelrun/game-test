// main.js - Star Assault Entry Point

(function () {
  // 480×854 기준 비율 유지, 실제 화면에 맞게 스케일
  const config = {
    type: Phaser.AUTO,
    width: 480,
    height: 854,
    backgroundColor: '#050510',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 480,
      height: 854
    },
    scene: [MenuScene, GameScene],
    parent: document.body,
    dom: {
      createContainer: false
    },
    // 안티앨리어싱 설정
    render: {
      antialias: true,
      pixelArt: false
    },
    // 물리 엔진 (사용 안 하지만 기본값)
    physics: {
      default: 'arcade',
      arcade: { debug: false }
    }
  };

  const game = new Phaser.Game(config);

  // 리사이즈 처리
  window.addEventListener('resize', () => {
    game.scale.refresh();
  });
})();
