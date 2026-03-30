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

// 영웅 비용 계산 (레벨 n에서 다음 레벨 업 비용)
function getHeroCost(hero, level) {
  return Math.floor(hero.baseCost * Math.pow(1.07, level));
}

// 영웅 DPS 계산 (레벨 n일 때)
function getHeroDps(hero, level) {
  if (level === 0) return 0;
  return hero.baseDps * Math.pow(1.05, level) * level;
}
