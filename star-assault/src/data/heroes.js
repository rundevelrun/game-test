// heroes.js - Star Assault Hero Data
const HEROES_DATA = [
  {
    id: 1,
    name: 'Vega',
    baseCost: 50,
    baseDps: 1,
    color: '#00cfff',
    desc: '탭 데미지 강화'
  },
  {
    id: 2,
    name: 'Iron Rex',
    baseCost: 300,
    baseDps: 5,
    color: '#ff6b35',
    desc: '모든 데미지 +%'
  },
  {
    id: 3,
    name: 'Nova',
    baseCost: 1000,
    baseDps: 15,
    color: '#a855f7',
    desc: '보스 데미지 특화'
  },
  {
    id: 4,
    name: 'Kira',
    baseCost: 4000,
    baseDps: 50,
    color: '#22c55e',
    desc: '골드 획득 +%'
  },
  {
    id: 5,
    name: 'Titan-7',
    baseCost: 15000,
    baseDps: 175,
    color: '#f59e0b',
    desc: '광역 딜'
  },
  {
    id: 6,
    name: 'Echo',
    baseCost: 60000,
    baseDps: 600,
    color: '#ec4899',
    desc: '크리티컬 확률 +%'
  },
  {
    id: 7,
    name: 'Dr. Hale',
    baseCost: 200000,
    baseDps: 2000,
    color: '#06b6d4',
    desc: '영웅 데미지 +%'
  },
  {
    id: 8,
    name: 'Orion',
    baseCost: 700000,
    baseDps: 7000,
    color: '#f97316',
    desc: '모든 영웅 강화'
  }
];

// 마일스톤 레벨 정의 (Tap Titans 스타일)
// 각 구간에서 해당 배수를 적용
const HERO_MILESTONES = [
  { level: 10,  multiplier: 4 },
  { level: 25,  multiplier: 10 },
  { level: 50,  multiplier: 25 },
  { level: 100, multiplier: 50 },
  { level: 200, multiplier: 100 },
  { level: 400, multiplier: 200 },
  { level: 800, multiplier: 500 },
  { level: 1000, multiplier: 1000 },
];

// 특정 레벨에서의 마일스톤 배수 반환
// Tap Titans 방식: 도달한 가장 높은 마일스톤의 배수를 단독 적용 (누적 곱셈 아님)
// - 레벨  1~ 9: x1
// - 레벨 10~24: x4
// - 레벨 25~49: x10
// - 레벨 50~99: x25
// - 레벨 100~199: x50
// - 레벨 200~399: x100
// - 레벨 400~799: x200
// - 레벨 800~999: x500
// - 레벨 1000+:   x1000
function getHeroMilestoneMultiplier(level) {
  let mult = 1;
  for (const m of HERO_MILESTONES) {
    if (level >= m.level) {
      mult = m.multiplier; // 최고 달성 마일스톤으로 교체 (누적 아님)
    }
  }
  return mult;
}

// 다음 마일스톤 레벨 반환 (없으면 null)
function getNextMilestoneLevel(level) {
  for (const m of HERO_MILESTONES) {
    if (level < m.level) return m.level;
  }
  return null;
}

// 영웅 비용 계산 (레벨 n에서 다음 레벨 업 비용)
function getHeroCost(hero, level) {
  return Math.floor(hero.baseCost * Math.pow(1.07, level));
}

// 영웅 DPS 계산 (레벨 n일 때, 마일스톤 배수 포함)
function getHeroDps(hero, level) {
  if (level === 0) return 0;
  const baseDpsAtLevel = hero.baseDps * Math.pow(1.15, level - 1) * level;
  const milestone = getHeroMilestoneMultiplier(level);
  return baseDpsAtLevel * milestone;
}
