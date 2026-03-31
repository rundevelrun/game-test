// enemies.js - Star Assault Enemy Data

const ENEMY_TYPES = [
  {
    id: 'fighter',
    name: '소형 전투기',
    shape: 'triangle',
    color: 0xff2244,
    scale: 1.0,
    stageMin: 1,
    stageMax: 20
  },
  {
    id: 'cruiser',
    name: '중형 순양함',
    shape: 'rect',
    color: 0xff8800,
    scale: 1.3,
    stageMin: 21,
    stageMax: 50
  },
  {
    id: 'destroyer',
    name: '대형 구축함',
    shape: 'pentagon',
    color: 0xaa44ff,
    scale: 1.6,
    stageMin: 51,
    stageMax: 100
  },
  {
    id: 'alien',
    name: '외계 생명체',
    shape: 'circle',
    color: 0x00ff88,
    scale: 1.8,
    stageMin: 101,
    stageMax: Infinity
  }
];

function getEnemyType(stage) {
  for (let i = ENEMY_TYPES.length - 1; i >= 0; i--) {
    if (stage >= ENEMY_TYPES[i].stageMin) {
      return ENEMY_TYPES[i];
    }
  }
  return ENEMY_TYPES[0];
}

// 적 기본 HP
// 초반(1~10): 빠르게 처치 가능, 중반(10~30): 영웅 고용하며 자연스럽게 버팀, 후반(30+): DPS 없으면 막힘
function getEnemyHp(stage) {
  return Math.floor(10 * Math.pow(1.4, stage - 1)); // 1.5 → 1.4로 완화
}

// 미니보스 HP
function getMiniBossHp(stage) {
  return getEnemyHp(stage) * 10;
}

// 보스 HP (5스테이지마다)
function getBossHp(stage) {
  return getEnemyHp(stage) * 50;
}

// 골드 획득량 (초반 보상 증가로 빠른 영웅 고용 유도)
function getGoldReward(stage) {
  return Math.floor(stage * 8 * Math.pow(1.12, stage - 1)); // 5→8, 1.1→1.12
}
