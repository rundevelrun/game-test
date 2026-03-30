// GameScene.js - Star Assault Main Game Scene

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  // ─────────────────────────────────────────
  //  초기화
  // ─────────────────────────────────────────
  init(data) {
    this._newGame = data ? data.newGame !== false : true;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this.W = W;
    this.H = H;

    // ── 레이아웃 상수 ──
    this.TOP_BAR_H = Math.floor(H * 0.07);
    this.SKILL_BAR_H = Math.floor(H * 0.08);
    this.HERO_PANEL_H = Math.floor(H * 0.35);
    this.BATTLE_H = H - this.TOP_BAR_H - this.SKILL_BAR_H - this.HERO_PANEL_H;
    this.BATTLE_Y = this.TOP_BAR_H;
    this.SKILL_Y = this.TOP_BAR_H + this.BATTLE_H;
    this.HERO_Y = this.SKILL_Y + this.SKILL_BAR_H;

    // ── 게임 상태 초기화 ──
    this._initState();

    // ── UI 레이어 순서 ──
    this._buildBackground();
    this._buildTopBar();
    this._buildBattleArea();
    this._buildSkillBar();
    this._buildHeroPanel();

    // ── 전투 초기화 ──
    this._spawnEnemy();

    // ── 입력 ──
    this.input.on('pointerdown', this._onTap, this);

    // ── 자동저장 ──
    this._autoSaveTimer = 0;

    // ── 발사체 풀 ──
    this._projectiles = [];

    // ── DPS 타이머 ──
    this._dpsTimer = 0;
    this._dpsInterval = 1000; // 1초마다 DPS 적용

    // ── 자동 발사 애니메이션 타이머 ──
    this._autoFireTimer = 0;
    this._autoFireInterval = 1500; // 1.5초마다 발사체

    // ── 카메라 페이드 인 ──
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  // ─────────────────────────────────────────
  //  상태 초기화
  // ─────────────────────────────────────────
  _initState() {
    const saved = this._loadSave();
    if (!this._newGame && saved) {
      this.gold = saved.gold || 0;
      this.stardust = saved.stardust || 0;
      this.stage = saved.stage || 1;
      this.heroLevels = saved.heroLevels || {};
      this.killCount = saved.killCount || 0;
    } else {
      this.gold = 0;
      this.stardust = 0;
      this.stage = 1;
      this.heroLevels = {};
      this.killCount = 0;
    }

    // 현재 적 처치 수 (스테이지 내)
    this.stageKills = 0;
    this.KILLS_PER_STAGE = 10;

    // 보스 타이머
    this._bossTimer = 0;
    this._bossTimeLimit = 30000;
    this._isBossActive = false;

    // 스킬 쿨다운 (ms)
    this._skills = {
      nova: { name: 'Nova Blast', key: 'nova', cooldown: 180000, remaining: 0, active: false, duration: 30000, activeRemaining: 0, color: 0xcc44ff, textColor: '#dd88ff' },
      warp: { name: 'Warp Strike', key: 'warp', cooldown: 300000, remaining: 0, active: false, duration: 0, activeRemaining: 0, color: 0x00ccff, textColor: '#88eeff' },
      over: { name: 'Overdrive', key: 'over', cooldown: 240000, remaining: 0, active: false, duration: 20000, activeRemaining: 0, color: 0xff8800, textColor: '#ffcc44' },
      rush: { name: 'Gold Rush', key: 'rush', cooldown: 360000, remaining: 0, active: false, duration: 30000, activeRemaining: 0, color: 0xffcc00, textColor: '#ffee88' }
    };

    // DPS 배수
    this._dpsMultiplier = 1;
    this._goldMultiplier = 1;
    this._tapMultiplier = 1;
    this._autoSpeedMultiplier = 1;
  }

  // ─────────────────────────────────────────
  //  배경
  // ─────────────────────────────────────────
  _buildBackground() {
    const W = this.W, H = this.H;
    // 전체 배경
    this.add.rectangle(W / 2, H / 2, W, H, 0x050510);

    // 별
    this._stars = [];
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H);
      const r = Math.random() * 1.5 + 0.2;
      const alpha = Math.random() * 0.6 + 0.2;
      const star = this.add.circle(x, y, r, 0xffffff, alpha);
      this._stars.push({ obj: star, baseAlpha: alpha, phase: Math.random() * Math.PI * 2, speed: Math.random() * 0.5 + 0.3 });
    }

    this._bgTime = 0;
  }

  // ─────────────────────────────────────────
  //  상단 바
  // ─────────────────────────────────────────
  _buildTopBar() {
    const W = this.W;
    const H = this.TOP_BAR_H;

    // 배경
    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0a20).setDepth(10);
    // 하단 선
    const g = this.add.graphics().setDepth(10);
    g.lineStyle(1, 0x00cfff, 0.4);
    g.beginPath();
    g.moveTo(0, H);
    g.lineTo(W, H);
    g.strokePath();

    const fs = Math.floor(H * 0.45);
    const cy = H / 2;

    this._stageText = this.add.text(8, cy, 'Stage 1', {
      fontSize: fs + 'px', fontFamily: 'Arial Black, Arial', color: '#ffffff'
    }).setOrigin(0, 0.5).setDepth(11);

    this._goldText = this.add.text(W / 2, cy, '💰 0', {
      fontSize: fs + 'px', fontFamily: 'Arial', color: '#ffdd44'
    }).setOrigin(0.5, 0.5).setDepth(11);

    this._dustText = this.add.text(W - 8, cy, '★ 0', {
      fontSize: fs + 'px', fontFamily: 'Arial', color: '#aaaaee'
    }).setOrigin(1, 0.5).setDepth(11);
  }

  // ─────────────────────────────────────────
  //  전투 영역
  // ─────────────────────────────────────────
  _buildBattleArea() {
    const W = this.W;
    const BY = this.BATTLE_Y;
    const BH = this.BATTLE_H;

    // 배경 구분선
    const g = this.add.graphics().setDepth(5);
    g.lineStyle(1, 0x112244, 1);
    g.beginPath();
    g.moveTo(0, BY + BH);
    g.lineTo(W, BY + BH);
    g.strokePath();

    // 전투 중앙 Y
    this._battleCY = BY + BH * 0.45;

    // 내 함선
    this._shipX = 120;
    this._shipY = this._battleCY;
    this._shipGraphic = this.add.graphics().setDepth(20);
    this._drawShip();

    // 엔진 파티클 (간단 구현)
    this._engineParticles = [];
    this._engineTimer = 0;

    // 적 HP 바 그래픽
    this._hpBarGraphic = this.add.graphics().setDepth(25);
    this._hpBarBgGraphic = this.add.graphics().setDepth(24);

    // 보스 타이머 바
    this._bossBarGraphic = this.add.graphics().setDepth(25);
    this._bossTimerText = this.add.text(W / 2, BY + BH * 0.08, '', {
      fontSize: Math.floor(W * 0.04) + 'px',
      fontFamily: 'Arial Black, Arial',
      color: '#ff4444',
      stroke: '#220000',
      strokeThickness: 3
    }).setOrigin(0.5, 0.5).setDepth(26).setVisible(false);

    // 적 이름/타입 텍스트
    this._enemyNameText = this.add.text(W / 2, BY + BH * 0.88, '', {
      fontSize: Math.floor(W * 0.038) + 'px',
      fontFamily: 'Arial',
      color: '#cccccc'
    }).setOrigin(0.5, 1).setDepth(25);

    // 데미지 팝업 풀
    this._popups = [];

    // 적 그래픽
    this._enemyGraphic = this.add.graphics().setDepth(22);
    this._enemyX = 0;
    this._enemyY = 0;

    // 발사체 그래픽
    this._projectileGraphic = this.add.graphics().setDepth(23);
  }

  // ─────────────────────────────────────────
  //  내 함선 그리기
  // ─────────────────────────────────────────
  _drawShip() {
    const g = this._shipGraphic;
    g.clear();
    const cx = this._shipX;
    const cy = this._shipY;
    const W = this.W;
    const size = W * 0.065;

    // 그림자/글로우
    g.fillStyle(0x00cfff, 0.08);
    g.fillCircle(cx, cy, size * 1.4);

    // 함선 본체
    g.fillStyle(0x00cfff, 0.95);
    g.beginPath();
    g.moveTo(cx + size, cy);
    g.lineTo(cx - size * 0.55, cy - size * 0.6);
    g.lineTo(cx - size * 0.25, cy);
    g.lineTo(cx - size * 0.55, cy + size * 0.6);
    g.closePath();
    g.fillPath();

    // 중앙 라인
    g.lineStyle(1.5, 0xffffff, 0.5);
    g.beginPath();
    g.moveTo(cx + size * 0.9, cy);
    g.lineTo(cx - size * 0.2, cy);
    g.strokePath();

    // 상단 날개
    g.fillStyle(0x0088bb, 0.9);
    g.beginPath();
    g.moveTo(cx + size * 0.2, cy - size * 0.15);
    g.lineTo(cx - size * 0.4, cy - size * 0.6);
    g.lineTo(cx - size * 0.1, cy - size * 0.15);
    g.closePath();
    g.fillPath();

    // 하단 날개
    g.fillStyle(0x0088bb, 0.9);
    g.beginPath();
    g.moveTo(cx + size * 0.2, cy + size * 0.15);
    g.lineTo(cx - size * 0.4, cy + size * 0.6);
    g.lineTo(cx - size * 0.1, cy + size * 0.15);
    g.closePath();
    g.fillPath();

    // 엔진 노즐
    g.fillStyle(0x004488, 1);
    g.fillRect(cx - size * 0.28, cy - size * 0.22, size * 0.1, size * 0.44);
  }

  // ─────────────────────────────────────────
  //  엔진 파티클
  // ─────────────────────────────────────────
  _emitEngineParticle() {
    const W = this.W;
    const size = W * 0.065;
    const x = this._shipX - size * 0.28;
    const y = this._shipY + (Math.random() - 0.5) * size * 0.3;
    const vx = -(Math.random() * 60 + 30);
    const vy = (Math.random() - 0.5) * 20;
    const life = Math.random() * 400 + 200;
    const color = Math.random() < 0.5 ? 0xff6600 : 0xffcc00;
    this._engineParticles.push({ x, y, vx, vy, life, maxLife: life, color, r: Math.random() * 3 + 1.5 });
  }

  // ─────────────────────────────────────────
  //  스킬 바
  // ─────────────────────────────────────────
  _buildSkillBar() {
    const W = this.W;
    const SY = this.SKILL_Y;
    const SH = this.SKILL_BAR_H;

    // 배경
    const bg = this.add.rectangle(W / 2, SY + SH / 2, W, SH, 0x080818).setDepth(10);

    const skillKeys = ['nova', 'warp', 'over', 'rush'];
    const shortNames = ['Nova\nBlast', 'Warp\nStrike', 'Over\ndrive', 'Gold\nRush'];
    const btnW = Math.floor(W / 4) - 4;
    const btnH = SH - 6;
    this._skillBtns = {};

    skillKeys.forEach((key, i) => {
      const skill = this._skills[key];
      const bx = i * (W / 4) + W / 8;
      const by = SY + SH / 2;

      const bg2 = this.add.rectangle(bx, by, btnW, btnH, skill.color, 0.25)
        .setDepth(11).setInteractive({ useHandCursor: true });
      bg2.setStrokeStyle(1, skill.color, 0.7);

      const txt = this.add.text(bx, by - 4, shortNames[i], {
        fontSize: Math.floor(SH * 0.22) + 'px',
        fontFamily: 'Arial Black, Arial',
        color: skill.textColor,
        align: 'center'
      }).setOrigin(0.5, 0.5).setDepth(12);

      const cdTxt = this.add.text(bx, by + btnH * 0.3, 'READY', {
        fontSize: Math.floor(SH * 0.2) + 'px',
        fontFamily: 'Arial',
        color: '#88ff88'
      }).setOrigin(0.5, 0.5).setDepth(12);

      bg2.on('pointerdown', () => this._activateSkill(key));
      bg2.on('pointerover', () => bg2.setFillStyle(skill.color, 0.45));
      bg2.on('pointerout', () => bg2.setFillStyle(skill.color, 0.25));

      this._skillBtns[key] = { bg: bg2, label: txt, cd: cdTxt };
    });
  }

  // ─────────────────────────────────────────
  //  스킬 발동
  // ─────────────────────────────────────────
  _activateSkill(key) {
    const skill = this._skills[key];
    if (skill.remaining > 0) return; // 쿨다운 중

    skill.remaining = skill.cooldown;
    skill.active = true;
    skill.activeRemaining = skill.duration;

    this._showPopup(this.W / 2, this.BATTLE_Y + this.BATTLE_H * 0.3, skill.name + '!', '#ffee44', 28, true);

    if (key === 'nova') {
      this._tapMultiplier = 10;
    } else if (key === 'warp') {
      // 즉시 적 HP 5% 제거
      if (this._enemy) {
        const dmg = this._enemy.hp * 0.05;
        this._dealDamage(dmg, true);
        skill.active = false;
        skill.activeRemaining = 0;
      }
    } else if (key === 'over') {
      this._autoSpeedMultiplier = 3;
    } else if (key === 'rush') {
      this._goldMultiplier = 10;
    }
  }

  // ─────────────────────────────────────────
  //  영웅 패널
  // ─────────────────────────────────────────
  _buildHeroPanel() {
    const W = this.W;
    const HY = this.HERO_Y;
    const HH = this.HERO_PANEL_H;

    // 배경
    this.add.rectangle(W / 2, HY + HH / 2, W, HH, 0x06060f).setDepth(10);

    // 상단 선
    const g = this.add.graphics().setDepth(10);
    g.lineStyle(1, 0x00cfff, 0.3);
    g.beginPath();
    g.moveTo(0, HY);
    g.lineTo(W, HY);
    g.strokePath();

    // 헤더
    this.add.text(10, HY + 4, 'HEROES', {
      fontSize: Math.floor(HH * 0.07) + 'px',
      fontFamily: 'Arial Black, Arial',
      color: '#00cfff'
    }).setDepth(11);

    // 총 DPS 표시
    this._heroDpsText = this.add.text(W - 10, HY + 4, 'DPS: 0', {
      fontSize: Math.floor(HH * 0.065) + 'px',
      fontFamily: 'Arial',
      color: '#88aaff'
    }).setOrigin(1, 0).setDepth(11);

    // 영웅 목록 (스크롤 가능)
    this._heroListY = HY + Math.floor(HH * 0.13);
    this._heroRowH = Math.floor(HH * 0.2);
    this._heroScrollY = 0;
    this._heroMaxScrollY = 0;
    this._heroListH = HH - Math.floor(HH * 0.13);

    // 마스크 (클리핑 영역)
    this._heroMaskGraphic = this.add.graphics().setDepth(9);
    this._heroMaskGraphic.fillStyle(0xffffff);
    this._heroMaskGraphic.fillRect(0, this._heroListY, W, this._heroListH);
    const heroMask = this._heroMaskGraphic.createGeometryMask();

    // 마스크용 컨테이너 (씬 전체 오브젝트들에 마스크 적용)
    this._heroMask = heroMask;

    this._heroRowObjects = [];
    this._buildHeroRows();

    // 스크롤 드래그 상태
    this._heroScrolling = false;
    this._heroScrollStartY = 0;
    this._heroScrollStartOffset = 0;
    this._heroScrollDelta = 0; // 드래그 총 이동량

    this.input.on('pointerdown', (p) => {
      if (p.y >= this._heroListY) {
        this._heroScrolling = true;
        this._heroScrollStartY = p.y;
        this._heroScrollStartOffset = this._heroScrollY;
        this._heroScrollDelta = 0;
      }
    });

    this.input.on('pointermove', (p) => {
      if (this._heroScrolling) {
        const dy = p.y - this._heroScrollStartY;
        this._heroScrollDelta = Math.abs(dy);
        this._heroScrollY = Phaser.Math.Clamp(
          this._heroScrollStartOffset + dy,
          -this._heroMaxScrollY,
          0
        );
        this._updateHeroScroll();
      }
    });

    this.input.on('pointerup', () => {
      this._heroScrolling = false;
    });
  }

  _buildHeroRows() {
    // 기존 오브젝트 제거
    for (const row of this._heroRowObjects) {
      row.rowBg.destroy();
      row.indicator.destroy();
      row.nameText.destroy();
      row.levelText.destroy();
      row.btn.destroy();
      row.btnText.destroy();
    }
    this._heroRowObjects = [];

    const W = this.W;
    const rowH = this._heroRowH;

    HEROES_DATA.forEach((hero, i) => {
      const level = this.heroLevels[hero.id] || 0;
      const cost = getHeroCost(hero, level);
      const dps = getHeroDps(hero, level);
      const canAfford = this.gold >= cost;
      // baseY는 스크롤 전 원래 위치 (스크롤 오프셋은 _updateHeroScroll에서 적용)
      const baseRowY = this._heroListY + i * rowH + rowH / 2;

      // 행 배경
      const rowBg = this.add.rectangle(W / 2, baseRowY, W - 4, rowH - 3,
        level > 0 ? 0x0a1525 : 0x080810, 1).setDepth(12).setMask(this._heroMask);
      rowBg.setStrokeStyle(1, level > 0 ? 0x1a3055 : 0x111122, 1);

      // 영웅 색상 인디케이터
      const heroColor = parseInt(hero.color.replace('#', ''), 16);
      const indicator = this.add.rectangle(10, baseRowY, 6, rowH * 0.7, heroColor, 0.9)
        .setDepth(13).setMask(this._heroMask);

      // 영웅 이름
      const nameColor = level > 0 ? hero.color : '#556677';
      const nameText = this.add.text(22, baseRowY - rowH * 0.2, hero.name, {
        fontSize: Math.floor(rowH * 0.26) + 'px',
        fontFamily: 'Arial Black, Arial',
        color: nameColor
      }).setOrigin(0, 0.5).setDepth(13).setMask(this._heroMask);

      // 레벨/설명
      const levelText = this.add.text(22, baseRowY + rowH * 0.2,
        level > 0 ? `Lv.${level}  DPS: ${formatNum(dps)}` : `미고용  ${hero.desc}`, {
        fontSize: Math.floor(rowH * 0.2) + 'px',
        fontFamily: 'Arial',
        color: level > 0 ? '#88aacc' : '#445566'
      }).setOrigin(0, 0.5).setDepth(13).setMask(this._heroMask);

      // 고용/레벨업 버튼
      const btnLabel = level === 0 ? `고용 ${formatNum(cost)}` : `Lv.UP ${formatNum(cost)}`;
      const btnColor = canAfford ? (level === 0 ? 0x22aa44 : 0x1155aa) : 0x333344;
      const btnW2 = Math.floor(W * 0.32);
      const btnH2 = rowH * 0.62;
      const btnX = W - btnW2 / 2 - 8;

      const btn = this.add.rectangle(btnX, baseRowY, btnW2, btnH2, btnColor, 1)
        .setDepth(13).setMask(this._heroMask);
      btn.setStrokeStyle(1, canAfford ? 0x44ddaa : 0x333355, 1);
      btn.setInteractive({ useHandCursor: true });

      const btnText = this.add.text(btnX, baseRowY, btnLabel, {
        fontSize: Math.floor(rowH * 0.19) + 'px',
        fontFamily: 'Arial',
        color: canAfford ? '#ffffff' : '#556677',
        align: 'center'
      }).setOrigin(0.5, 0.5).setDepth(14).setMask(this._heroMask);

      btn.on('pointerdown', (pointer) => {
        // 드래그(스크롤)이 아닐 때만 버튼 동작
        if (this._heroScrollDelta < 8) {
          this._buyHero(hero.id);
        }
        this._heroScrolling = false;
      });
      btn.on('pointerover', () => {
        if (this.gold >= getHeroCost(hero, this.heroLevels[hero.id] || 0)) {
          btn.setFillStyle(level === 0 ? 0x33cc55 : 0x2266cc, 1);
        }
      });
      btn.on('pointerout', () => {
        const lv = this.heroLevels[hero.id] || 0;
        const c2 = getHeroCost(hero, lv);
        btn.setFillStyle(this.gold >= c2 ? (lv === 0 ? 0x22aa44 : 0x1155aa) : 0x333344, 1);
      });

      this._heroRowObjects.push({ hero, baseRowY, rowBg, indicator, nameText, levelText, btn, btnText });
    });

    this._heroMaxScrollY = Math.max(0, HEROES_DATA.length * rowH - this._heroListH);
    this._updateHeroScroll();
  }

  _updateHeroScroll() {
    const offset = this._heroScrollY;
    for (const row of this._heroRowObjects) {
      const ny = row.baseRowY + offset;
      row.rowBg.setY(ny);
      row.indicator.setY(ny);
      row.nameText.setY(ny - this._heroRowH * 0.2);
      row.levelText.setY(ny + this._heroRowH * 0.2);
      row.btn.setY(ny);
      row.btnText.setY(ny);
    }
  }

  _refreshHeroRows() {
    this._heroRowObjects.forEach(({ hero, rowBg, indicator, nameText, levelText, btn, btnText }) => {
      const level = this.heroLevels[hero.id] || 0;
      const cost = getHeroCost(hero, level);
      const dps = getHeroDps(hero, level);
      const canAfford = this.gold >= cost;

      const heroColor = parseInt(hero.color.replace('#', ''), 16);
      indicator.setFillStyle(heroColor, level > 0 ? 0.9 : 0.3);

      rowBg.setFillStyle(level > 0 ? 0x0a1525 : 0x080810, 1);
      rowBg.setStrokeStyle(1, level > 0 ? 0x1a3055 : 0x111122, 1);

      nameText.setColor(level > 0 ? hero.color : '#556677');
      levelText.setText(level > 0 ? `Lv.${level}  DPS: ${formatNum(dps)}` : `미고용  ${hero.desc}`);
      levelText.setColor(level > 0 ? '#88aacc' : '#445566');

      const btnLabel = level === 0 ? `고용 ${formatNum(cost)}` : `Lv.UP ${formatNum(cost)}`;
      btnText.setText(btnLabel);
      btnText.setColor(canAfford ? '#ffffff' : '#556677');
      btn.setFillStyle(canAfford ? (level === 0 ? 0x22aa44 : 0x1155aa) : 0x333344, 1);
      btn.setStrokeStyle(1, canAfford ? 0x44ddaa : 0x333355, 1);
    });

    // 총 DPS 업데이트
    this._heroDpsText.setText('DPS: ' + formatNum(this._getTotalDps()));
  }

  // ─────────────────────────────────────────
  //  영웅 구매
  // ─────────────────────────────────────────
  _buyHero(heroId) {
    const hero = HEROES_DATA.find(h => h.id === heroId);
    if (!hero) return;
    const level = this.heroLevels[heroId] || 0;
    const cost = getHeroCost(hero, level);
    if (this.gold < cost) return;

    this.gold -= cost;
    this.heroLevels[heroId] = level + 1;

    this._showPopup(this.W / 2, this.BATTLE_Y + this.BATTLE_H * 0.5, `${hero.name} Lv.${level + 1}!`, hero.color, 22, false);
    this._refreshHeroRows();
    this._updateTopBar();
  }

  // ─────────────────────────────────────────
  //  총 DPS 계산
  // ─────────────────────────────────────────
  _getTotalDps() {
    let total = 0;
    HEROES_DATA.forEach(hero => {
      const level = this.heroLevels[hero.id] || 0;
      total += getHeroDps(hero, level);
    });
    return total * this._dpsMultiplier;
  }

  // ─────────────────────────────────────────
  //  탭 데미지 계산
  // ─────────────────────────────────────────
  _getTapDamage() {
    const dps = this._getTotalDps();
    let dmg = Math.max(1, dps * 0.5);
    const isCrit = Math.random() < 0.1;
    if (isCrit) dmg *= 2;
    return { dmg: dmg * this._tapMultiplier, isCrit };
  }

  // ─────────────────────────────────────────
  //  적 스폰
  // ─────────────────────────────────────────
  _spawnEnemy() {
    const isLastKill = this.stageKills === this.KILLS_PER_STAGE - 1;
    const isBossStage = this.stage % 5 === 0;

    let hp, isBoss, isMiniBoss;

    if (isLastKill && isBossStage) {
      hp = getBossHp(this.stage);
      isBoss = true;
      isMiniBoss = false;
    } else if (isLastKill) {
      hp = getMiniBossHp(this.stage);
      isMiniBoss = true;
      isBoss = false;
    } else {
      hp = getEnemyHp(this.stage);
      isBoss = false;
      isMiniBoss = false;
    }

    const enemyType = getEnemyType(this.stage);

    this._enemy = {
      hp: hp,
      maxHp: hp,
      type: enemyType,
      isBoss: isBoss,
      isMiniBoss: isMiniBoss,
      x: this.W - 80,
      y: this._battleCY,
      targetX: this.W * 0.58,
      moving: true,
      dead: false,
      hitFlash: 0
    };

    // 보스/미니보스 타이머 시작
    if (isBoss || isMiniBoss) {
      this._bossTimer = this._bossTimeLimit;
      this._isBossActive = true;
      this._bossTimerText.setVisible(true);
    } else {
      this._isBossActive = false;
      this._bossTimerText.setVisible(false);
    }

    this._drawEnemy();
    this._updateEnemyName();
  }

  // ─────────────────────────────────────────
  //  적 그리기
  // ─────────────────────────────────────────
  _drawEnemy() {
    const g = this._enemyGraphic;
    g.clear();
    if (!this._enemy) return;

    const e = this._enemy;
    const cx = e.x;
    const cy = e.y;
    const W = this.W;
    const baseSize = W * 0.06 * e.type.scale;
    const color = e.hitFlash > 0 ? 0xffffff : e.type.color;
    const alpha = e.hitFlash > 0 ? 0.95 : (e.isBoss ? 1 : (e.isMiniBoss ? 0.95 : 0.9));

    // 보스/미니보스 글로우
    if (e.isBoss) {
      g.fillStyle(0xff0000, 0.12);
      g.fillCircle(cx, cy, baseSize * 1.8);
      g.fillStyle(0xff4400, 0.08);
      g.fillCircle(cx, cy, baseSize * 2.2);
    } else if (e.isMiniBoss) {
      g.fillStyle(e.type.color, 0.1);
      g.fillCircle(cx, cy, baseSize * 1.5);
    }

    const shape = e.type.shape;

    if (shape === 'triangle') {
      // 좌향 삼각형 (적)
      g.fillStyle(color, alpha);
      g.beginPath();
      g.moveTo(cx - baseSize, cy);
      g.lineTo(cx + baseSize * 0.6, cy - baseSize * 0.7);
      g.lineTo(cx + baseSize * 0.6, cy + baseSize * 0.7);
      g.closePath();
      g.fillPath();
      g.lineStyle(1.5, 0xffffff, 0.3);
      g.beginPath();
      g.moveTo(cx - baseSize, cy);
      g.lineTo(cx + baseSize * 0.6, cy - baseSize * 0.7);
      g.lineTo(cx + baseSize * 0.6, cy + baseSize * 0.7);
      g.closePath();
      g.strokePath();

    } else if (shape === 'rect') {
      g.fillStyle(color, alpha);
      g.fillRect(cx - baseSize, cy - baseSize * 0.6, baseSize * 2, baseSize * 1.2);
      // 포문
      g.fillStyle(0x000000, 0.5);
      g.fillRect(cx - baseSize * 0.8, cy - baseSize * 0.3, baseSize * 0.3, baseSize * 0.6);
      g.lineStyle(1.5, 0xffffff, 0.3);
      g.strokeRect(cx - baseSize, cy - baseSize * 0.6, baseSize * 2, baseSize * 1.2);

    } else if (shape === 'pentagon') {
      g.fillStyle(color, alpha);
      g.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 * i / 5) - Math.PI / 2;
        const px = cx + Math.cos(angle) * baseSize;
        const py = cy + Math.sin(angle) * baseSize;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.closePath();
      g.fillPath();
      g.lineStyle(1.5, 0xffffff, 0.3);
      g.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 * i / 5) - Math.PI / 2;
        const px = cx + Math.cos(angle) * baseSize;
        const py = cy + Math.sin(angle) * baseSize;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.closePath();
      g.strokePath();

    } else if (shape === 'circle') {
      g.fillStyle(color, alpha);
      g.fillCircle(cx, cy, baseSize);
      // 눈
      g.fillStyle(0xff0000, 0.9);
      g.fillCircle(cx - baseSize * 0.2, cy - baseSize * 0.15, baseSize * 0.12);
      g.fillCircle(cx + baseSize * 0.2, cy - baseSize * 0.15, baseSize * 0.12);
      g.lineStyle(1.5, 0xffffff, 0.25);
      g.strokeCircle(cx, cy, baseSize);
    }

    // HP 바
    this._drawHpBar(cx, cy, e);
  }

  // ─────────────────────────────────────────
  //  HP 바
  // ─────────────────────────────────────────
  _drawHpBar(cx, cy, e) {
    const W = this.W;
    const barW = W * 0.55;
    const barH = 7;
    const barX = cx - barW / 2;
    const barY = cy - W * 0.06 * e.type.scale - barH - 8;
    const ratio = Math.max(0, e.hp / e.maxHp);

    const bg = this._hpBarBgGraphic;
    bg.clear();
    bg.fillStyle(0x222233, 0.8);
    bg.fillRect(barX, barY, barW, barH);

    const fg = this._hpBarGraphic;
    fg.clear();
    const hpColor = e.isBoss ? 0xff2222 : (e.isMiniBoss ? 0xff6600 : 0x44dd44);
    fg.fillStyle(hpColor, 1);
    fg.fillRect(barX, barY, barW * ratio, barH);

    // HP 텍스트
    // (간략하게 그래픽에 포함)
  }

  _updateEnemyName() {
    if (!this._enemy) return;
    const e = this._enemy;
    let label = e.type.name;
    if (e.isBoss) label = '⚠ BOSS: ' + label;
    else if (e.isMiniBoss) label = '★ MINI: ' + label;
    this._enemyNameText.setText(label);
    this._enemyNameText.setColor(e.isBoss ? '#ff4444' : (e.isMiniBoss ? '#ff8800' : '#cccccc'));
  }

  // ─────────────────────────────────────────
  //  탭 입력
  // ─────────────────────────────────────────
  _onTap(pointer) {
    // 영웅 패널 영역은 무시 (버튼 클릭용)
    if (pointer.y > this.HERO_Y) return;
    // 스킬 바 영역도 무시
    if (pointer.y > this.SKILL_Y && pointer.y < this.HERO_Y) return;

    if (!this._enemy || this._enemy.dead) return;

    const { dmg, isCrit } = this._getTapDamage();
    this._dealDamage(dmg, false);

    // 탭 팝업
    const px = pointer.x + Phaser.Math.Between(-20, 20);
    const py = pointer.y + Phaser.Math.Between(-10, 10);
    const color = isCrit ? '#ff4444' : '#ffee88';
    const size = isCrit ? 24 : 18;
    this._showPopup(px, py, formatNum(dmg) + (isCrit ? ' CRIT!' : ''), color, size, isCrit);

    // 발사체 (탭)
    this._fireProjectile(true);
  }

  // ─────────────────────────────────────────
  //  데미지 처리
  // ─────────────────────────────────────────
  _dealDamage(dmg, isSkill) {
    if (!this._enemy || this._enemy.dead) return;

    this._enemy.hp -= dmg;
    this._enemy.hitFlash = 100;

    if (this._enemy.hp <= 0) {
      this._enemy.hp = 0;
      this._killEnemy();
    }
  }

  // ─────────────────────────────────────────
  //  적 처치
  // ─────────────────────────────────────────
  _killEnemy() {
    if (this._enemy.dead) return;
    this._enemy.dead = true;

    const gold = Math.floor(getGoldReward(this.stage) * this._goldMultiplier);
    this.gold += gold;
    this.stageKills++;
    this.killCount++;

    // 골드 팝업
    this._showPopup(
      this._enemy.x,
      this._enemy.y - 30,
      `💰 +${formatNum(gold)}`,
      '#ffdd44',
      20,
      false
    );

    // 폭발 효과
    this._explodeEnemy(this._enemy.x, this._enemy.y, this._enemy.type.color);

    // 스테이지 진행
    if (this.stageKills >= this.KILLS_PER_STAGE) {
      this.stageKills = 0;
      this.stage++;
      this._showPopup(this.W / 2, this.BATTLE_Y + this.BATTLE_H * 0.3, `Stage ${this.stage}!`, '#00ffcc', 28, true);
    }

    this._isBossActive = false;
    this._bossTimerText.setVisible(false);

    // 잠시 후 다음 적
    this.time.delayedCall(600, () => {
      this._enemy = null;
      this._enemyGraphic.clear();
      this._hpBarGraphic.clear();
      this._hpBarBgGraphic.clear();
      this._enemyNameText.setText('');
      this._spawnEnemy();
      this._updateTopBar();
      this._refreshHeroRows();
    });
  }

  // ─────────────────────────────────────────
  //  보스 타임아웃
  // ─────────────────────────────────────────
  _bossTimeout() {
    this._isBossActive = false;
    this._bossTimerText.setVisible(false);

    // 이전 스테이지로 후퇴
    if (this.stage > 1) {
      this.stage = Math.max(1, this.stage - 1);
      this.stageKills = 0;
    }

    this._showPopup(this.W / 2, this.BATTLE_Y + this.BATTLE_H * 0.35, 'RETREAT!', '#ff4444', 30, true);

    this.time.delayedCall(800, () => {
      this._enemy = null;
      this._enemyGraphic.clear();
      this._hpBarGraphic.clear();
      this._hpBarBgGraphic.clear();
      this._enemyNameText.setText('');
      this.stageKills = 0;
      this._spawnEnemy();
      this._updateTopBar();
    });
  }

  // ─────────────────────────────────────────
  //  폭발 파티클
  // ─────────────────────────────────────────
  _explodeEnemy(x, y, color) {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 80 + 30;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const life = Math.random() * 500 + 300;
      this._engineParticles.push({
        x, y, vx, vy, life, maxLife: life,
        color: color,
        r: Math.random() * 4 + 2,
        isExplosion: true
      });
    }
  }

  // ─────────────────────────────────────────
  //  발사체
  // ─────────────────────────────────────────
  _fireProjectile(isTap) {
    if (!this._enemy) return;
    const sx = this._shipX + this.W * 0.065;
    const sy = this._shipY;
    const tx = this._enemy.x;
    const ty = this._enemy.y;
    const dx = tx - sx;
    const dy = ty - sy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = 350;
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;

    this._projectiles.push({
      x: sx, y: sy,
      vx, vy,
      targetX: tx, targetY: ty,
      life: 1000,
      isTap,
      color: isTap ? 0xffdd00 : 0x00cfff,
      r: isTap ? 3 : 2
    });
  }

  // ─────────────────────────────────────────
  //  데미지 팝업
  // ─────────────────────────────────────────
  _showPopup(x, y, text, color, size, bold) {
    const style = {
      fontSize: (size || 16) + 'px',
      fontFamily: bold ? 'Arial Black, Arial' : 'Arial',
      color: color || '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    };
    const t = this.add.text(x, y, text, style).setOrigin(0.5, 1).setDepth(50);
    this._popups.push({ text: t, vy: -60, life: 1200, maxLife: 1200 });
  }

  // ─────────────────────────────────────────
  //  상단 바 업데이트
  // ─────────────────────────────────────────
  _updateTopBar() {
    this._stageText.setText('Stage ' + this.stage);
    this._goldText.setText('💰 ' + formatNum(this.gold));
    this._dustText.setText('★ ' + formatNum(this.stardust));
  }

  // ─────────────────────────────────────────
  //  스킬 쿨다운 UI 업데이트
  // ─────────────────────────────────────────
  _updateSkillUI() {
    const skillKeys = ['nova', 'warp', 'over', 'rush'];
    for (const key of skillKeys) {
      const skill = this._skills[key];
      const btn = this._skillBtns[key];
      if (!btn) continue;

      if (skill.remaining <= 0) {
        btn.cd.setText('READY');
        btn.cd.setColor('#88ff88');
        btn.bg.setAlpha(1);
      } else {
        const sec = Math.ceil(skill.remaining / 1000);
        btn.cd.setText(sec + 's');
        btn.cd.setColor('#ff8888');
        btn.bg.setAlpha(0.5);
      }

      if (skill.active && skill.activeRemaining > 0) {
        const sec = Math.ceil(skill.activeRemaining / 1000);
        btn.cd.setText('ON ' + sec + 's');
        btn.cd.setColor('#ffff44');
      }
    }
  }

  // ─────────────────────────────────────────
  //  저장/불러오기
  // ─────────────────────────────────────────
  _save() {
    try {
      const data = {
        gold: this.gold,
        stardust: this.stardust,
        stage: this.stage,
        heroLevels: this.heroLevels,
        killCount: this.killCount
      };
      localStorage.setItem('starAssault_save', JSON.stringify(data));
    } catch (e) {}
  }

  _loadSave() {
    try {
      const raw = localStorage.getItem('starAssault_save');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  // ─────────────────────────────────────────
  //  메인 업데이트 루프
  // ─────────────────────────────────────────
  update(time, delta) {
    this._bgTime += delta * 0.001;

    // 별 반짝임
    for (const s of this._stars) {
      s.obj.setAlpha(s.baseAlpha * (0.5 + 0.5 * Math.sin(this._bgTime * s.speed + s.phase)));
    }

    // 적 이동
    if (this._enemy && !this._enemy.dead) {
      if (this._enemy.moving) {
        const speed = 60 * (delta / 1000);
        if (this._enemy.x > this._enemy.targetX) {
          this._enemy.x -= speed;
          if (this._enemy.x <= this._enemy.targetX) {
            this._enemy.x = this._enemy.targetX;
            this._enemy.moving = false;
          }
        } else {
          this._enemy.moving = false;
        }
      }

      // 히트 플래시 감소
      if (this._enemy.hitFlash > 0) {
        this._enemy.hitFlash -= delta;
      }

      // 보스 타이머
      if (this._isBossActive) {
        this._bossTimer -= delta;
        if (this._bossTimer <= 0) {
          this._bossTimer = 0;
          this._bossTimeout();
        }
        const sec = Math.ceil(this._bossTimer / 1000);
        this._bossTimerText.setText(`⏱ ${sec}s`);
        this._bossTimerText.setX(this.W / 2);
        this._bossTimerText.setY(this.BATTLE_Y + this.BATTLE_H * 0.1);
        this._bossTimerText.setColor(this._bossTimer < 10000 ? '#ff2222' : '#ff8844');
      }

      this._drawEnemy();
    }

    // DPS 자동 공격
    this._dpsTimer += delta;
    const dpsInterval = this._dpsInterval / this._autoSpeedMultiplier;
    if (this._dpsTimer >= dpsInterval) {
      this._dpsTimer = 0;
      if (this._enemy && !this._enemy.dead) {
        const totalDps = this._getTotalDps();
        if (totalDps > 0) {
          const dmgPerTick = totalDps; // 1초치 DPS
          this._dealDamage(dmgPerTick, false);

          // 자동 공격 팝업 (빈도 줄임)
          if (Math.random() < 0.4) {
            const px = this._enemy.x + Phaser.Math.Between(-25, 25);
            const py = this._enemy.y + Phaser.Math.Between(-20, 20);
            this._showPopup(px, py, formatNum(dmgPerTick), '#ddddff', 13, false);
          }
        }
      }
    }

    // 자동 발사체 애니메이션
    this._autoFireTimer += delta;
    const autoFireInterval = this._autoFireInterval / this._autoSpeedMultiplier;
    if (this._autoFireTimer >= autoFireInterval) {
      this._autoFireTimer = 0;
      if (this._enemy && !this._enemy.dead && this._getTotalDps() > 0) {
        this._fireProjectile(false);
      }
    }

    // 엔진 파티클 방출
    this._engineTimer += delta;
    if (this._engineTimer > 80) {
      this._engineTimer = 0;
      this._emitEngineParticle();
    }

    // 발사체 업데이트
    this._updateProjectiles(delta);

    // 파티클 업데이트 (엔진 + 폭발)
    this._updateParticles(delta);

    // 데미지 팝업 업데이트
    this._updatePopups(delta);

    // 스킬 쿨다운/액티브 업데이트
    this._updateSkills(delta);

    // 상단 바 업데이트 (60프레임마다)
    if (Math.floor(time / 200) !== Math.floor((time - delta) / 200)) {
      this._updateTopBar();
    }

    // 자동저장 (5초)
    this._autoSaveTimer += delta;
    if (this._autoSaveTimer >= 5000) {
      this._autoSaveTimer = 0;
      this._save();
    }
  }

  // ─────────────────────────────────────────
  //  발사체 업데이트
  // ─────────────────────────────────────────
  _updateProjectiles(delta) {
    const dt = delta / 1000;
    this._projectileGraphic.clear();

    for (let i = this._projectiles.length - 1; i >= 0; i--) {
      const p = this._projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= delta;

      // 적에 도달했는지 확인
      if (this._enemy && !this._enemy.dead) {
        const dx = p.x - this._enemy.x;
        const dy = p.y - this._enemy.y;
        if (Math.sqrt(dx * dx + dy * dy) < 20) {
          this._projectiles.splice(i, 1);
          continue;
        }
      }

      if (p.life <= 0) {
        this._projectiles.splice(i, 1);
        continue;
      }

      // 발사체 그리기
      this._projectileGraphic.fillStyle(p.color, 0.9);
      if (p.isTap) {
        // 탭: 노란 원
        this._projectileGraphic.fillCircle(p.x, p.y, p.r);
        this._projectileGraphic.fillStyle(0xffffff, 0.5);
        this._projectileGraphic.fillCircle(p.x, p.y, p.r * 0.5);
      } else {
        // 자동: 레이저 (선)
        this._projectileGraphic.lineStyle(2, p.color, 0.85);
        this._projectileGraphic.beginPath();
        this._projectileGraphic.moveTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04);
        this._projectileGraphic.lineTo(p.x, p.y);
        this._projectileGraphic.strokePath();
      }
    }
  }

  // ─────────────────────────────────────────
  //  파티클 업데이트
  // ─────────────────────────────────────────
  _updateParticles(delta) {
    const dt = delta / 1000;
    // 파티클 그래픽 (엔진은 shipGraphic 뒤에, 폭발은 앞에)
    // 간단히 하나의 그래픽으로 처리

    for (let i = this._engineParticles.length - 1; i >= 0; i--) {
      const p = this._engineParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= delta;

      if (p.life <= 0) {
        this._engineParticles.splice(i, 1);
        continue;
      }

      const alpha = (p.life / p.maxLife) * 0.85;
      const r = p.r * (p.life / p.maxLife);

      // 엔진 파티클은 배경에 직접 그리기 (임시: projectileGraphic 재사용)
      this._projectileGraphic.fillStyle(p.color, alpha);
      this._projectileGraphic.fillCircle(p.x, p.y, Math.max(0.5, r));
    }
  }

  // ─────────────────────────────────────────
  //  팝업 업데이트
  // ─────────────────────────────────────────
  _updatePopups(delta) {
    const dt = delta / 1000;
    for (let i = this._popups.length - 1; i >= 0; i--) {
      const p = this._popups[i];
      p.text.y += p.vy * dt;
      p.life -= delta;
      const ratio = p.life / p.maxLife;
      p.text.setAlpha(ratio < 0.3 ? ratio / 0.3 : 1);

      if (p.life <= 0) {
        p.text.destroy();
        this._popups.splice(i, 1);
      }
    }
  }

  // ─────────────────────────────────────────
  //  스킬 업데이트
  // ─────────────────────────────────────────
  _updateSkills(delta) {
    for (const key of Object.keys(this._skills)) {
      const skill = this._skills[key];

      if (skill.remaining > 0) {
        skill.remaining -= delta;
        if (skill.remaining < 0) skill.remaining = 0;
      }

      if (skill.active && skill.activeRemaining > 0) {
        skill.activeRemaining -= delta;
        if (skill.activeRemaining <= 0) {
          skill.activeRemaining = 0;
          skill.active = false;
          // 스킬 종료 → 배수 초기화
          if (key === 'nova') this._tapMultiplier = 1;
          if (key === 'over') this._autoSpeedMultiplier = 1;
          if (key === 'rush') this._goldMultiplier = 1;
        }
      }
    }

    this._updateSkillUI();
  }
}

// ─────────────────────────────────────────
//  유틸: 숫자 포맷
// ─────────────────────────────────────────
function formatNum(n) {
  if (n === undefined || n === null || isNaN(n)) return '0';
  n = Math.floor(n);
  if (n >= 1e12) return (n / 1e12).toFixed(2).replace(/\.?0+$/, '') + 'T';
  if (n >= 1e9)  return (n / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B';
  if (n >= 1e6)  return (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M';
  if (n >= 1e3)  return (n / 1e3).toFixed(2).replace(/\.?0+$/, '') + 'K';
  return n.toString();
}
