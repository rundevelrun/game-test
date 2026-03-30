class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.stage = data.stage || 1;
    this.hp = data.hp || 100;
    this.maxHp = data.maxHp || 100;
    this.defense = data.defense || 0;
    this.cash = data.cash || 0;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this.W = W;
    this.H = H;

    this.cameras.main.setBackgroundColor('#050510');
    this._createStars(W, H);

    // State
    this.alive = true;
    this.invincible = false;
    this.enemies = [];
    this.stageTime = 15;
    this.timeLeft = this.stageTime;

    // Enemy stats scale with stage
    this.enemyDamage = 5 + this.stage * 3;
    this.enemySpeed = 130 + this.stage * 18;
    this.spawnDelay = Math.max(400, 1000 - this.stage * 60);

    // Player (square)
    const PS = 32;
    this.playerSize = PS;
    this.player = this.add.rectangle(W / 2, H * 0.65, PS, PS, 0x00cfff).setDepth(10);

    // Player HP text
    this.playerHpText = this.add.text(W / 2, H * 0.65, `${this.hp}`, {
      fontSize: '13px', fontFamily: 'Arial', fontStyle: 'bold', color: '#050510'
    }).setOrigin(0.5).setDepth(11);

    // Joystick
    this.joystick = { active: false, baseX: 0, baseY: 0, stickX: 0, stickY: 0, radius: 65, dx: 0, dy: 0 };
    this.joyGfx = this.add.graphics().setDepth(15).setAlpha(0);

    this.input.on('pointerdown', (ptr) => {
      if (!this.alive) return;
      Object.assign(this.joystick, { active: true, baseX: ptr.x, baseY: ptr.y, stickX: ptr.x, stickY: ptr.y, dx: 0, dy: 0 });
      this.joyGfx.setAlpha(1);
    });

    this.input.on('pointermove', (ptr) => {
      if (!this.alive || !ptr.isDown || !this.joystick.active) return;
      const dx = ptr.x - this.joystick.baseX;
      const dy = ptr.y - this.joystick.baseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxR = this.joystick.radius;
      this.joystick.stickX = dist > maxR ? this.joystick.baseX + (dx / dist) * maxR : ptr.x;
      this.joystick.stickY = dist > maxR ? this.joystick.baseY + (dy / dist) * maxR : ptr.y;
      this.joystick.dx = this.joystick.stickX - this.joystick.baseX;
      this.joystick.dy = this.joystick.stickY - this.joystick.baseY;
    });

    this.input.on('pointerup', () => {
      this.joystick.active = false;
      this.joystick.dx = 0;
      this.joystick.dy = 0;
      this.joyGfx.setAlpha(0);
    });

    // UI
    this._createUI();

    // Spawner
    this.enemyTimer = this.time.addEvent({
      delay: this.spawnDelay,
      callback: this._spawnEnemy,
      callbackScope: this,
      loop: true
    });

    // Stage countdown
    this.stageTimer = this.time.addEvent({
      delay: 1000,
      callback: this._tickTimer,
      callbackScope: this,
      loop: true
    });
  }

  _createStars(W, H) {
    for (let i = 0; i < 90; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H);
      const r = Phaser.Math.FloatBetween(0.5, 1.8);
      const star = this.add.circle(x, y, r, 0xffffff, Phaser.Math.FloatBetween(0.2, 0.8)).setDepth(0);
      this.tweens.add({
        targets: star, alpha: 0.05,
        duration: Phaser.Math.Between(1000, 4000),
        yoyo: true, repeat: -1,
        delay: Phaser.Math.Between(0, 3000)
      });
    }
  }

  _createUI() {
    const W = this.W;
    const H = this.H;

    // Stage label
    this.add.text(W / 2, 28, `STAGE ${this.stage}`, {
      fontSize: '13px', fontFamily: 'Arial', color: '#667799', letterSpacing: 5
    }).setOrigin(0.5).setDepth(20);

    // Cash display
    this.cashText = this.add.text(W - 12, 28, `💰 ${this.cash}`, {
      fontSize: '13px', fontFamily: 'Arial', color: '#ffd700'
    }).setOrigin(1, 0.5).setDepth(20);

    // Timer
    this.timerText = this.add.text(W / 2, 52, '15', {
      fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5).setDepth(20);

    // HP bar background
    const barW = W * 0.7;
    const barX = (W - barW) / 2;
    this.add.rectangle(W / 2, H - 36, barW, 12, 0x112233).setDepth(20);
    this.hpBar = this.add.rectangle(barX + barW / 2, H - 36, barW, 12, 0x00cfff).setDepth(21).setOrigin(0.5);
    this.hpBarW = barW;
    this.hpBarX = barX;

    // HP text
    this.hpText = this.add.text(W / 2, H - 36, `${this.hp} / ${this.maxHp}`, {
      fontSize: '11px', fontFamily: 'Arial', color: '#ffffff'
    }).setOrigin(0.5).setDepth(22);
  }

  _tickTimer() {
    if (!this.alive) return;
    this.timeLeft--;
    this.timerText.setText(`${this.timeLeft}`);

    if (this.timeLeft <= 5) {
      this.timerText.setColor('#ff4466');
    }

    if (this.timeLeft <= 0) {
      this._stageClear();
    }
  }

  _spawnEnemy() {
    if (!this.alive) return;
    const W = this.W, H = this.H;
    const side = Phaser.Math.Between(0, 3);
    let x, y, vx, vy;

    // Target: player position with slight random offset
    const tx = this.player.x + Phaser.Math.FloatBetween(-60, 60);
    const ty = this.player.y + Phaser.Math.FloatBetween(-60, 60);

    switch (side) {
      case 0: x = Phaser.Math.Between(0, W); y = -30; break;
      case 1: x = W + 30; y = Phaser.Math.Between(80, H - 60); break;
      case 2: x = Phaser.Math.Between(0, W); y = H + 30; break;
      case 3: x = -30; y = Phaser.Math.Between(80, H - 60); break;
    }

    const dx = tx - x, dy = ty - y;
    const len = Math.sqrt(dx * dx + dy * dy);
    vx = (dx / len) * this.enemySpeed;
    vy = (dy / len) * this.enemySpeed;

    // Damage varies ±20% per enemy
    const dmg = Math.round(this.enemyDamage * Phaser.Math.FloatBetween(0.8, 1.2));
    const size = Phaser.Math.Between(18, 28);

    // Color by damage intensity
    const ratio = Math.min(dmg / 60, 1);
    const r = 255;
    const g = Math.round(180 - ratio * 150);
    const b = Math.round(ratio * 60);
    const hex = (r << 16) | (g << 8) | b;

    const enemy = this.add.rectangle(x, y, size, size, hex).setDepth(3);
    const dmgText = this.add.text(x, y, `${dmg}`, {
      fontSize: '10px', fontFamily: 'Arial', fontStyle: 'bold', color: '#050510'
    }).setOrigin(0.5).setDepth(4);

    enemy._vx = vx;
    enemy._vy = vy;
    enemy._dmg = dmg;
    enemy._size = size / 2;
    enemy._text = dmgText;
    this.enemies.push(enemy);
  }

  _updateHPDisplay() {
    const ratio = Math.max(this.hp / this.maxHp, 0);
    const newW = this.hpBarW * ratio;
    this.hpBar.width = newW;
    this.hpBar.x = this.hpBarX + newW / 2;
    this.hpText.setText(`${Math.max(this.hp, 0)} / ${this.maxHp}`);
    this.playerHpText.setText(`${Math.max(this.hp, 0)}`);

    // Color shift
    if (ratio < 0.3) this.hpBar.setFillStyle(0xff2255);
    else if (ratio < 0.6) this.hpBar.setFillStyle(0xff9900);
    else this.hpBar.setFillStyle(0x00cfff);
  }

  _hitPlayer(dmg) {
    if (this.invincible || !this.alive) return;
    const actual = Math.max(1, Math.round(dmg * (1 - this.defense / 100)));
    this.hp -= actual;
    this._updateHPDisplay();

    // Damage popup
    const popup = this.add.text(this.player.x, this.player.y - 20, `-${actual}`, {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ff4466'
    }).setOrigin(0.5).setDepth(25);
    this.tweens.add({
      targets: popup, y: popup.y - 40, alpha: 0, duration: 700,
      onComplete: () => popup.destroy()
    });

    if (this.hp <= 0) { this._gameOver(); return; }

    this.invincible = true;
    this.cameras.main.shake(150, 0.01);

    this.tweens.add({
      targets: this.player, alpha: 0.2,
      duration: 80, yoyo: true, repeat: 4,
      onComplete: () => { this.player.setAlpha(1); this.invincible = false; }
    });
  }

  _stageClear() {
    this.alive = false;
    this.enemyTimer.remove();
    this.stageTimer.remove();

    // Clear all enemies
    this.enemies.forEach(e => { e._text?.destroy(); e.destroy(); });
    this.enemies = [];

    this.cameras.main.flash(400, 0, 207, 255, false);

    this.time.delayedCall(600, () => {
      this.scene.start('StageCompleteScene', {
        stage: this.stage,
        hp: this.hp,
        maxHp: this.maxHp,
        defense: this.defense,
        cash: this.cash
      });
    });
  }

  _gameOver() {
    this.alive = false;
    this.enemyTimer.remove();
    this.stageTimer.remove();

    this.tweens.add({
      targets: this.player,
      alpha: 0, scaleX: 3, scaleY: 3,
      duration: 400, ease: 'Power2',
      onComplete: () => {
        this.time.delayedCall(300, () => {
          this.scene.start('GameOverScene', { stage: this.stage });
        });
      }
    });
  }

  _drawJoystick() {
    const j = this.joystick;
    this.joyGfx.clear();
    this.joyGfx.lineStyle(2, 0x00cfff, 0.3);
    this.joyGfx.strokeCircle(j.baseX, j.baseY, j.radius);
    this.joyGfx.fillStyle(0x00cfff, 0.35);
    this.joyGfx.fillCircle(j.stickX, j.stickY, 22);
  }

  update(time, delta) {
    if (!this.alive) return;

    const dt = delta / 1000;
    const W = this.W, H = this.H;
    const PS = this.playerSize / 2;

    // Joystick movement
    if (this.joystick.active) {
      const speed = 310;
      const mag = Math.sqrt(this.joystick.dx ** 2 + this.joystick.dy ** 2);
      const ratio = Math.min(mag / this.joystick.radius, 1);
      if (ratio > 0.05) {
        const nx = this.joystick.dx / mag;
        const ny = this.joystick.dy / mag;
        this.player.x = Phaser.Math.Clamp(this.player.x + nx * speed * ratio * dt, PS + 5, W - PS - 5);
        this.player.y = Phaser.Math.Clamp(this.player.y + ny * speed * ratio * dt, 80 + PS, H - 55 - PS);
      }
      this._drawJoystick();
    }

    // Sync HP text to player
    this.playerHpText.x = this.player.x;
    this.playerHpText.y = this.player.y;

    const px = this.player.x, py = this.player.y;

    // Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.x += e._vx * dt;
      e.y += e._vy * dt;
      e._text.x = e.x;
      e._text.y = e.y;

      const margin = 80;
      if (e.x < -margin || e.x > W + margin || e.y < -margin || e.y > H + margin) {
        e._text.destroy();
        e.destroy();
        this.enemies.splice(i, 1);
        // 피했을 때 캐시 획득
        const earned = Math.max(1, Math.floor(e._dmg * 0.5));
        this.cash += earned;
        this.cashText.setText(`💰 ${this.cash}`);
        continue;
      }

      // AABB collision
      if (!this.invincible) {
        const hw = e._size + PS;
        if (Math.abs(e.x - px) < hw && Math.abs(e.y - py) < hw) {
          const dmg = e._dmg;
          e._text.destroy();
          e.destroy();
          this.enemies.splice(i, 1);
          this._hitPlayer(dmg);
        }
      }
    }
  }
}
