import { useState, useEffect, useCallback, useRef } from 'react';

// ===========================================
// TYPE DEFINITIONS
// ===========================================

type Position = { x: number; y: number };
type Bullet = Position & { id: number; vx?: number; vy?: number; piercing?: boolean; homing?: boolean; size?: number; bounces?: number; chain?: number };
type EnemyType = 'grunt' | 'speeder' | 'tank' | 'bomber' | 'sniper' | 'splitter' | 'zigzag' | 'elite';
type Enemy = Position & { id: number; type: EnemyType; health: number; maxHealth: number; shootCooldown: number; behavior: number; frozen?: number; burning?: number };
type BossType = 'mothership' | 'kraken' | 'deathstar' | 'hydra' | 'phoenix';
type Boss = Position & { id: number; type: BossType; phase: number; health: number; maxHealth: number; attackPattern: number; attackTimer: number; moveDirection: number; specialTimer: number; tentacles?: { angle: number; length: number }[]; charging?: boolean; frozen?: number; shields?: number; heads?: number };
type Particle = Position & { id: number; vx: number; vy: number; life: number; color: string; size?: number; text?: string };
type PowerUpType = 'rapid' | 'shield' | 'spread' | 'laser' | 'missile' | 'slowmo' | 'nuke' | 'extralife' | 'magnet' | 'ghost' | 'doublepoints' | 'freeze' | 'ricochet' | 'homing' | 'giant' | 'vampire' | 'berserk' | 'wingmen' | 'blackhole' | 'lightning' | 'firetrail' | 'minigun' | 'explosive' | 'orbital' | 'coin';
type PowerUp = Position & { id: number; type: PowerUpType };
type Wingman = Position & { id: number; side: 'left' | 'right' };
type Orbital = Position & { id: number; angle: number };
type BlackHole = Position & { id: number; life: number };
type FireTrail = Position & { id: number; life: number };
type Laser = { x: number; y: number; angle: number; life: number; id: number };

type ShopItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  maxLevel: number;
  emoji: string;
};

type PlayerData = {
  nickname: string;
  coins: number;
  gems: number;
  highScore: number;
  highestWave: number;
  gamesPlayed: number;
  bossesDefeated: number;
  upgrades: Record<string, number>;
};

type GameScreen = 'home' | 'shop' | 'game' | 'gameover' | 'victory';

// ===========================================
// CONSTANTS
// ===========================================
const GAME_WIDTH = 520;
const GAME_HEIGHT = 700;
const PLAYER_WIDTH = 36;
const PLAYER_HEIGHT = 28;
const BULLET_SPEED = 10;
const PLAYER_SPEED = 7;
const TOTAL_WAVES = 50;

const ENEMY_CONFIG: Record<EnemyType, { health: number; points: number; emoji: string; color: string }> = {
  grunt: { health: 1, points: 10, emoji: '👽', color: '#22c55e' },
  speeder: { health: 1, points: 20, emoji: '👻', color: '#ec4899' },
  tank: { health: 4, points: 50, emoji: '👾', color: '#f59e0b' },
  bomber: { health: 2, points: 30, emoji: '💣', color: '#ef4444' },
  sniper: { health: 2, points: 40, emoji: '🎯', color: '#8b5cf6' },
  splitter: { health: 3, points: 35, emoji: '🔮', color: '#06b6d4' },
  zigzag: { health: 2, points: 25, emoji: '⚡', color: '#facc15' },
  elite: { health: 6, points: 100, emoji: '🤖', color: '#f43f5e' },
};

const BOSS_CONFIG: Record<BossType, { name: string; emoji: string; color: string; baseHealth: number; width: number; height: number }> = {
  mothership: { name: 'MOTHERSHIP', emoji: '🛸', color: '#22c55e', baseHealth: 50, width: 120, height: 60 },
  kraken: { name: 'COSMIC KRAKEN', emoji: '🐙', color: '#a855f7', baseHealth: 80, width: 140, height: 100 },
  phoenix: { name: 'SPACE PHOENIX', emoji: '🦅', color: '#f97316', baseHealth: 100, width: 130, height: 80 },
  hydra: { name: 'CYBER HYDRA', emoji: '🐉', color: '#14b8a6', baseHealth: 130, width: 150, height: 110 },
  deathstar: { name: 'DEATH STAR', emoji: '🌑', color: '#ef4444', baseHealth: 180, width: 160, height: 160 },
};

const POWERUP_INFO: Record<PowerUpType, { emoji: string; name: string; color: string; rarity: number }> = {
  rapid: { emoji: '⚡', name: 'Rapid Fire', color: '#f97316', rarity: 1 },
  shield: { emoji: '🛡️', name: 'Shield', color: '#3b82f6', rarity: 1 },
  spread: { emoji: '🔱', name: 'Spread', color: '#a855f7', rarity: 1 },
  laser: { emoji: '💎', name: 'Laser', color: '#06b6d4', rarity: 1.5 },
  missile: { emoji: '🚀', name: 'Missiles', color: '#ef4444', rarity: 1.5 },
  slowmo: { emoji: '⏱️', name: 'Slow-Mo', color: '#22c55e', rarity: 1 },
  nuke: { emoji: '💥', name: 'NUKE', color: '#fbbf24', rarity: 6 },
  extralife: { emoji: '❤️', name: '+1 Life', color: '#ec4899', rarity: 6 },
  magnet: { emoji: '🧲', name: 'Magnet', color: '#6366f1', rarity: 1.5 },
  ghost: { emoji: '👻', name: 'Phase', color: '#e2e8f0', rarity: 2 },
  doublepoints: { emoji: '✨', name: '2X Points', color: '#fcd34d', rarity: 1.5 },
  freeze: { emoji: '❄️', name: 'Freeze', color: '#7dd3fc', rarity: 2 },
  ricochet: { emoji: '🔄', name: 'Ricochet', color: '#c084fc', rarity: 2 },
  homing: { emoji: '🎯', name: 'Homing', color: '#f472b6', rarity: 2 },
  giant: { emoji: '🔴', name: 'Giant', color: '#dc2626', rarity: 1.5 },
  vampire: { emoji: '🧛', name: 'Lifesteal', color: '#7f1d1d', rarity: 3 },
  berserk: { emoji: '😤', name: 'Berserk', color: '#b91c1c', rarity: 3 },
  wingmen: { emoji: '👥', name: 'Wingmen', color: '#0ea5e9', rarity: 3 },
  blackhole: { emoji: '🕳️', name: 'Black Hole', color: '#1e1b4b', rarity: 4 },
  lightning: { emoji: '⛈️', name: 'Lightning', color: '#a5b4fc', rarity: 3 },
  firetrail: { emoji: '🔥', name: 'Fire Trail', color: '#ea580c', rarity: 2 },
  minigun: { emoji: '🔫', name: 'Minigun', color: '#737373', rarity: 3 },
  explosive: { emoji: '💣', name: 'Explosive', color: '#dc2626', rarity: 3 },
  orbital: { emoji: '🌙', name: 'Orbitals', color: '#fef08a', rarity: 4 },
  coin: { emoji: '🪙', name: 'Coin', color: '#fbbf24', rarity: 1 },
};

const SHOP_ITEMS: ShopItem[] = [
  { id: 'maxHealth', name: 'Max Health', description: '+1 starting life', price: 100, maxLevel: 5, emoji: '❤️' },
  { id: 'startShield', name: 'Start Shield', description: 'Begin with shield', price: 150, maxLevel: 3, emoji: '🛡️' },
  { id: 'damage', name: 'Damage Up', description: '+1 bullet damage', price: 200, maxLevel: 5, emoji: '⚔️' },
  { id: 'fireRate', name: 'Fire Rate', description: 'Shoot faster', price: 150, maxLevel: 5, emoji: '⚡' },
  { id: 'magnetRange', name: 'Magnet Range', description: 'Attract pickups', price: 100, maxLevel: 5, emoji: '🧲' },
  { id: 'coinBonus', name: 'Coin Bonus', description: '+10% coins earned', price: 250, maxLevel: 10, emoji: '🪙' },
  { id: 'startRapid', name: 'Start Rapid', description: 'Begin with rapid fire', price: 300, maxLevel: 1, emoji: '🔥' },
  { id: 'startSpread', name: 'Start Spread', description: 'Begin with spread shot', price: 400, maxLevel: 1, emoji: '🔱' },
  { id: 'bulletSize', name: 'Bullet Size', description: 'Larger bullets', price: 175, maxLevel: 3, emoji: '🔴' },
  { id: 'luck', name: 'Lucky Drops', description: 'Better power-up drops', price: 200, maxLevel: 5, emoji: '🍀' },
  { id: 'speed', name: 'Move Speed', description: 'Move faster', price: 125, maxLevel: 3, emoji: '👟' },
  { id: 'revive', name: 'Auto Revive', description: 'Revive once per game', price: 500, maxLevel: 1, emoji: '💫' },
];

// ===========================================
// HELPER FUNCTIONS
// ===========================================
let nextId = 0;
const getId = () => ++nextId;

const createExplosion = (x: number, y: number, color: string, size: number = 8): Particle[] => {
  const particles: Particle[] = [];
  for (let i = 0; i < size; i++) {
    const angle = (Math.PI * 2 * i) / size + Math.random() * 0.5;
    const speed = 2 + Math.random() * 3;
    particles.push({ id: getId(), x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 25 + Math.random() * 15, color, size: 2 + Math.random() * 3 });
  }
  return particles;
};

const createTextParticle = (x: number, y: number, text: string, color: string): Particle => ({ id: getId(), x, y, vx: 0, vy: -2, life: 60, color, text });

const rectCollision = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean => 
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

const distance = (a: Position, b: Position): number => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

const getRandomPowerUp = (luck: number = 0): PowerUpType => {
  const types = Object.keys(POWERUP_INFO).filter(t => t !== 'coin') as PowerUpType[];
  const weights = types.map(t => (1 / POWERUP_INFO[t].rarity) * (1 + luck * 0.1));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < types.length; i++) {
    random -= weights[i];
    if (random <= 0) return types[i];
  }
  return 'rapid';
};

const getBossForWave = (wave: number): BossType => {
  const bossWaves: BossType[] = ['mothership', 'kraken', 'phoenix', 'hydra', 'deathstar'];
  const bossIndex = Math.floor((wave / 5) - 1) % 5;
  return bossWaves[bossIndex];
};

const createEnemyWave = (wave: number): Enemy[] => {
  if (wave % 5 === 0) return [];
  
  const enemies: Enemy[] = [];
  const formation = wave % 4;
  
  const baseCount = 8 + Math.floor(wave / 2);
  const rows = Math.min(2 + Math.floor(wave / 8), 6);
  const cols = Math.min(4 + Math.floor(wave / 6), 10);
  
  if (formation === 0) {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        enemies.push(createEnemy(50 + col * 48, 40 + row * 38, wave, row));
      }
    }
  } else if (formation === 1) {
    for (let i = 0; i < baseCount; i++) {
      const row = Math.abs(i - baseCount / 2);
      enemies.push(createEnemy(GAME_WIDTH / 2 - 120 + i * 25, 30 + row * 20, wave));
    }
  } else if (formation === 2) {
    const count = 6 + Math.floor(wave / 3);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const x = GAME_WIDTH / 2 + Math.cos(angle) * (60 + wave * 2);
      const y = 140 + Math.sin(angle) * (40 + wave);
      enemies.push(createEnemy(x, y, wave));
    }
  } else {
    for (let i = 0; i < baseCount; i++) {
      enemies.push(createEnemy(40 + Math.random() * (GAME_WIDTH - 80), 30 + Math.random() * 140, wave));
    }
  }
  
  return enemies;
};

const createEnemy = (x: number, y: number, wave: number, row?: number): Enemy => {
  let type: EnemyType;
  const rand = Math.random();
  const difficulty = Math.min(wave, 50);
  
  if (wave >= 40 && rand < 0.1) type = 'elite';
  else if (wave >= 25 && rand < 0.12) type = 'splitter';
  else if (wave >= 20 && rand < 0.15) type = 'sniper';
  else if (wave >= 15 && rand < 0.18) type = 'bomber';
  else if (wave >= 10 && rand < 0.2) type = 'zigzag';
  else if (row === 0 || rand < 0.12 + difficulty * 0.01) type = 'tank';
  else if (rand < 0.3) type = 'speeder';
  else type = 'grunt';
  
  const config = ENEMY_CONFIG[type];
  const healthMult = 1 + Math.floor(wave / 10) * 0.5;
  return {
    id: getId(), x, y, type,
    health: Math.ceil(config.health * healthMult),
    maxHealth: Math.ceil(config.health * healthMult),
    shootCooldown: Math.random() * 60,
    behavior: Math.random() * Math.PI * 2,
  };
};

const createBoss = (wave: number): Boss => {
  const type = getBossForWave(wave);
  const config = BOSS_CONFIG[type];

  // Progressive scaling: bosses get stronger each time you fight them
  // Wave 5 = first encounter (1x), Wave 10 = second cycle starts
  // Each full cycle (every 25 waves) adds significant difficulty
  const cycleNumber = Math.floor((wave - 5) / 25); // 0, 1 for waves 5-50
  const waveInCycle = ((wave - 5) % 25) / 25; // 0 to ~1 within each cycle

  // Health scales: base * (1.5^cycle) * (1 + 0.3 * waveProgress)
  const healthScale = Math.pow(1.5, cycleNumber) * (1 + waveInCycle * 0.4);

  const boss: Boss = {
    id: getId(), type,
    x: GAME_WIDTH / 2 - config.width / 2,
    y: -config.height - 20,
    phase: 1,
    health: Math.ceil(config.baseHealth * healthScale),
    maxHealth: Math.ceil(config.baseHealth * healthScale),
    attackPattern: 0, attackTimer: 0, moveDirection: 1, specialTimer: 0,
  };

  // Kraken gets more tentacles at higher waves
  if (type === 'kraken') {
    const tentacleCount = 6 + cycleNumber * 2; // 6, 8 tentacles
    boss.tentacles = Array(tentacleCount).fill(0).map((_, i) => ({
      angle: (Math.PI * 2 * i) / tentacleCount,
      length: 60 + wave * 0.5
    }));
  }

  // Death Star gets more shields at higher waves
  if (type === 'deathstar') {
    boss.shields = 3 + cycleNumber * 2; // 3, 5 shields
    boss.charging = false;
  }

  // Hydra gets more heads at higher waves
  if (type === 'hydra') {
    boss.heads = 3 + cycleNumber; // 3, 4 heads
  }

  return boss;
};

// ===========================================
// MAIN COMPONENT
// ===========================================
export default function SpaceInvadersComplete() {
  const [screen, setScreen] = useState<GameScreen>('home');
  const [playerData, setPlayerData] = useState<PlayerData>({
    nickname: 'Player',
    coins: 0,
    gems: 0,
    highScore: 0,
    highestWave: 0,
    gamesPlayed: 0,
    bossesDefeated: 0,
    upgrades: {},
  });
  const [lastGameStats, setLastGameStats] = useState({ score: 0, wave: 0, coinsEarned: 0 });
  const [editingName, setEditingName] = useState(false);

  // Use refs for functions that GameScreen needs - this prevents GameScreen from being recreated
  const setPlayerDataRef = useRef(setPlayerData);
  const setLastGameStatsRef = useRef(setLastGameStats);
  const setScreenRef = useRef(setScreen);
  const playerDataRef = useRef(playerData);

  // Keep refs updated
  useEffect(() => {
    setPlayerDataRef.current = setPlayerData;
    setLastGameStatsRef.current = setLastGameStats;
    setScreenRef.current = setScreen;
    playerDataRef.current = playerData;
  });

  // ===========================================
  // HOME SCREEN
  // ===========================================
  const HomeScreen = () => (
    <div className="w-full max-w-lg mx-auto min-h-screen bg-gradient-to-b from-red-700 via-red-600 to-red-800 p-4 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg">
          👤 {editingName ? (
            <input
              type="text"
              value={playerData.nickname}
              onChange={(e) => setPlayerData(p => ({ ...p, nickname: e.target.value.slice(0, 15) }))}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
              className="bg-orange-600 text-white px-2 py-1 rounded w-28"
              autoFocus
            />
          ) : (
            <span onClick={() => setEditingName(true)} className="cursor-pointer">{playerData.nickname}</span>
          )}
        </div>
        <div className="text-3xl font-bold text-white drop-shadow-lg">🚀 SPACE WARS</div>
        <div className="w-20" />
      </div>

      {/* Currency */}
      <div className="bg-gray-900/80 rounded-xl p-3 mb-4">
        <div className="flex justify-around">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🪙</span>
            <span className="text-yellow-400 font-bold text-xl">{playerData.coins.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">💎</span>
            <span className="text-purple-400 font-bold text-xl">{playerData.gems}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gray-900/80 rounded-xl p-3 mb-4 grid grid-cols-2 gap-2 text-sm">
        <div className="text-gray-400">🏆 High Score: <span className="text-white">{playerData.highScore.toLocaleString()}</span></div>
        <div className="text-gray-400">🌊 Best Wave: <span className="text-white">{playerData.highestWave}</span></div>
        <div className="text-gray-400">🎮 Games: <span className="text-white">{playerData.gamesPlayed}</span></div>
        <div className="text-gray-400">👹 Bosses: <span className="text-white">{playerData.bossesDefeated}</span></div>
      </div>

      {/* Character Display */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          <div className="text-9xl animate-bounce">🚀</div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-black/30 rounded-full blur-sm" />
        </div>
      </div>

      {/* Upgrades Preview */}
      <div className="bg-gray-900/80 rounded-xl p-3 mb-4">
        <div className="text-gray-400 text-sm mb-2">Active Upgrades:</div>
        <div className="flex flex-wrap gap-1">
          {Object.entries(playerData.upgrades).filter(([_, level]) => level > 0).map(([id, level]) => {
            const item = SHOP_ITEMS.find(i => i.id === id);
            return item ? (
              <span key={id} className="bg-gray-800 px-2 py-1 rounded text-xs">
                {item.emoji} {item.name} Lv.{level}
              </span>
            ) : null;
          })}
          {Object.keys(playerData.upgrades).filter(k => playerData.upgrades[k] > 0).length === 0 && (
            <span className="text-gray-500 text-xs">None - visit the shop!</span>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="space-y-3">
        <button
          onClick={() => setScreen('game')}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white font-bold text-2xl py-4 rounded-xl shadow-lg transform hover:scale-105 transition-all"
        >
          ▶️ PLAY
        </button>
        <button
          onClick={() => setScreen('shop')}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-bold text-xl py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all"
        >
          🛒 SHOP
        </button>
      </div>

      {/* Wave Info */}
      <div className="text-center text-gray-300 text-sm mt-4">
        50 Waves • Boss every 5 waves • Earn coins to upgrade!
      </div>
    </div>
  );

  // ===========================================
  // SHOP SCREEN
  // ===========================================
  const ShopScreen = () => {
    const buyUpgrade = (item: ShopItem) => {
      const currentLevel = playerData.upgrades[item.id] || 0;
      if (currentLevel >= item.maxLevel) return;
      const price = item.price * (currentLevel + 1);
      if (playerData.coins < price) return;
      
      setPlayerData(p => ({
        ...p,
        coins: p.coins - price,
        upgrades: { ...p.upgrades, [item.id]: currentLevel + 1 },
      }));
    };

    return (
      <div className="w-full max-w-lg mx-auto min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setScreen('home')} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">
            ← Back
          </button>
          <div className="text-2xl font-bold text-white">🛒 SHOP</div>
          <div className="flex items-center gap-2 bg-gray-900/80 px-3 py-1 rounded-lg">
            <span className="text-xl">🪙</span>
            <span className="text-yellow-400 font-bold">{playerData.coins.toLocaleString()}</span>
          </div>
        </div>

        {/* Items Grid */}
        <div className="grid gap-3">
          {SHOP_ITEMS.map(item => {
            const currentLevel = playerData.upgrades[item.id] || 0;
            const isMaxed = currentLevel >= item.maxLevel;
            const price = item.price * (currentLevel + 1);
            const canAfford = playerData.coins >= price;

            return (
              <div key={item.id} className={`bg-gray-900/80 rounded-xl p-3 flex items-center gap-3 ${isMaxed ? 'opacity-60' : ''}`}>
                <div className="text-3xl w-12 text-center">{item.emoji}</div>
                <div className="flex-1">
                  <div className="font-bold text-white">{item.name}</div>
                  <div className="text-gray-400 text-sm">{item.description}</div>
                  <div className="text-xs text-gray-500">Level {currentLevel}/{item.maxLevel}</div>
                </div>
                <button
                  onClick={() => buyUpgrade(item)}
                  disabled={isMaxed || !canAfford}
                  className={`px-4 py-2 rounded-lg font-bold ${
                    isMaxed ? 'bg-gray-700 text-gray-500' :
                    canAfford ? 'bg-green-600 hover:bg-green-500 text-white' :
                    'bg-gray-700 text-gray-500'
                  }`}
                >
                  {isMaxed ? 'MAX' : `🪙 ${price}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ===========================================
  // GAME SCREEN
  // ===========================================
  const GameScreen = () => {
    const gameRef = useRef<HTMLDivElement>(null);

    const getInitialGameState = () => {
      const upgrades = playerDataRef.current.upgrades;
      return {
        player: { x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2, y: GAME_HEIGHT - 70 },
        playerBullets: [] as Bullet[],
        enemyBullets: [] as Bullet[],
        enemies: createEnemyWave(1),
        boss: null as Boss | null,
        bossLasers: [] as Laser[],
        particles: [] as Particle[],
        powerUps: [] as PowerUp[],
        wingmen: [] as Wingman[],
        orbitals: [] as Orbital[],
        blackHoles: [] as BlackHole[],
        fireTrails: [] as FireTrail[],
        score: 0,
        coinsCollected: 0,
        lives: 3 + (upgrades.maxHealth || 0),
        maxLives: 3 + (upgrades.maxHealth || 0),
        wave: 1,
        gameOver: false,
        hasShield: (upgrades.startShield || 0) > 0,
        shieldHits: upgrades.startShield || 0,
        rapidFire: (upgrades.startRapid || 0) > 0,
        spreadShot: (upgrades.startSpread || 0) > 0,
        hasLaser: false, hasMissile: false, slowMo: false,
        hasMagnet: (upgrades.magnetRange || 0) > 0,
        isGhost: false, doublePoints: false, hasRicochet: false,
        hasHoming: false, hasGiant: (upgrades.bulletSize || 0) > 0,
        hasVampire: false, isBerserk: false, hasLightning: false,
        hasFireTrail: false, hasMinigun: false, hasExplosive: false, hasOrbital: false,
        activePowerUps: [] as { type: PowerUpType; timer: number }[],
        ghostTimer: 0, freezeTimer: 0, berserkTimer: 0,
        screenShake: 0, combo: 0, comboTimer: 0,
        bossIntro: false, bossIntroTimer: 0,
        usedRevive: false,
        bossesKilled: 0,
      };
    };

    const gameRef2 = useRef<ReturnType<typeof getInitialGameState> | null>(null);
    if (gameRef2.current === null) {
      gameRef2.current = getInitialGameState();
    }
    const [, forceUpdate] = useState(0);
    const game = gameRef2.current;
    const setGame = (updater: (prev: typeof game) => typeof game) => {
      gameRef2.current = updater(gameRef2.current!);
      forceUpdate(n => n + 1);
    };
    const keysPressed = useRef<Set<string>>(new Set());
    const lastShot = useRef<number>(0);
    const enemyDirection = useRef<number>(1);
    const enemyMoveTimer = useRef<number>(0);
    const frameCount = useRef<number>(0);

    // Mobile touch controls
    const touchActive = useRef<boolean>(false);
    const touchTarget = useRef<{ x: number; y: number }>({ x: GAME_WIDTH / 2, y: GAME_HEIGHT - 70 });
    const [isMobile, setIsMobile] = useState(false);

    const upgrades = playerDataRef.current.upgrades;
    const damageBonus = upgrades.damage || 0;
    const fireRateBonus = upgrades.fireRate || 0;
    const magnetRange = 50 + (upgrades.magnetRange || 0) * 30;
    const coinBonus = 1 + (upgrades.coinBonus || 0) * 0.1;
    const luck = upgrades.luck || 0;
    const speedBonus = 1 + (upgrades.speed || 0) * 0.15;
    const bulletSizeBonus = (upgrades.bulletSize || 0) * 2;
    const hasAutoRevive = (upgrades.revive || 0) > 0;

    // Detect mobile device
    useEffect(() => {
      const checkMobile = () => {
        setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Input handling
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        const key = e.key === ' ' ? ' ' : e.key.toLowerCase();
        if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' ', 'a', 'd', 'w', 's', 'z', 'x', 'escape'].includes(key)) {
          e.preventDefault();
        }
        keysPressed.current.add(key);
        if (key === 'escape') {
          setTimeout(() => setScreenRef.current('home'), 0);
        }
      };
      const handleKeyUp = (e: KeyboardEvent) => {
        const key = e.key === ' ' ? ' ' : e.key.toLowerCase();
        keysPressed.current.delete(key);
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);

      // Auto-focus the game
      if (gameRef.current) {
        gameRef.current.focus();
      }

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      };
    }, []);

    // Touch controls
    const getTouchPos = useCallback((e: React.TouchEvent, gameRect: DOMRect) => {
      const touch = e.touches[0];
      const x = touch.clientX - gameRect.left;
      const y = touch.clientY - gameRect.top;
      return { x, y };
    }, []);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
      e.preventDefault();
      const gameRect = gameRef.current?.querySelector('.game-canvas')?.getBoundingClientRect();
      if (!gameRect) return;

      touchActive.current = true;
      const pos = getTouchPos(e, gameRect);
      touchTarget.current = {
        x: Math.max(PLAYER_WIDTH / 2, Math.min(GAME_WIDTH - PLAYER_WIDTH / 2, pos.x)),
        y: Math.max(GAME_HEIGHT - 280, Math.min(GAME_HEIGHT - 40, pos.y))
      };
      keysPressed.current.add(' '); // Auto-fire on touch
    }, [getTouchPos]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
      e.preventDefault();
      if (!touchActive.current) return;

      const gameRect = gameRef.current?.querySelector('.game-canvas')?.getBoundingClientRect();
      if (!gameRect) return;

      const pos = getTouchPos(e, gameRect);
      touchTarget.current = {
        x: Math.max(PLAYER_WIDTH / 2, Math.min(GAME_WIDTH - PLAYER_WIDTH / 2, pos.x)),
        y: Math.max(GAME_HEIGHT - 280, Math.min(GAME_HEIGHT - 40, pos.y))
      };
    }, [getTouchPos]);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
      e.preventDefault();
      touchActive.current = false;
      keysPressed.current.delete(' ');
    }, []);

    // Game loop
    const gameLoop = useCallback(() => {
      setGame(prev => {
        if (prev.gameOver) return prev;

        frameCount.current++;
        const berserkMult = prev.isBerserk ? 1.5 : 1;
        const slowFactor = prev.slowMo ? 0.4 : 1;

        let state = { ...prev };
        let {
          player, playerBullets, enemyBullets, enemies, boss, bossLasers, particles,
          powerUps, wingmen, orbitals, blackHoles, fireTrails,
          score, coinsCollected, lives, wave, hasShield, shieldHits, rapidFire, 
          spreadShot, hasLaser, hasMissile, slowMo, hasMagnet, isGhost,
          doublePoints, hasRicochet, hasHoming, hasGiant, hasVampire,
          isBerserk, hasLightning, hasFireTrail, hasMinigun, hasExplosive, hasOrbital,
          activePowerUps, ghostTimer, freezeTimer, berserkTimer,
          screenShake, combo, comboTimer, bossIntro, bossIntroTimer, usedRevive
        } = state;

        // Boss intro
        if (bossIntro) {
          bossIntroTimer--;
          if (bossIntroTimer <= 0) bossIntro = false;
          if (boss && boss.y < 80) boss = { ...boss, y: boss.y + 2 };
          return { ...state, boss, bossIntro, bossIntroTimer };
        }

        // Player Movement
        const keys = keysPressed.current;
        let newPlayerX = player.x;
        let newPlayerY = player.y;
        const speed = PLAYER_SPEED * berserkMult * speedBonus;

        // Keyboard controls
        if (keys.has('arrowleft') || keys.has('a')) newPlayerX -= speed;
        if (keys.has('arrowright') || keys.has('d')) newPlayerX += speed;
        if (keys.has('arrowup') || keys.has('w')) newPlayerY -= speed * 0.6;
        if (keys.has('arrowdown') || keys.has('s')) newPlayerY += speed * 0.6;

        // Touch controls - smooth movement towards touch target
        if (touchActive.current) {
          const targetX = touchTarget.current.x - PLAYER_WIDTH / 2;
          const targetY = touchTarget.current.y - PLAYER_HEIGHT / 2;
          const dx = targetX - newPlayerX;
          const dy = targetY - newPlayerY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 5) {
            const moveSpeed = Math.min(speed * 1.2, dist);
            newPlayerX += (dx / dist) * moveSpeed;
            newPlayerY += (dy / dist) * moveSpeed;
          }
        }

        newPlayerX = Math.max(0, Math.min(GAME_WIDTH - PLAYER_WIDTH, newPlayerX));
        newPlayerY = Math.max(GAME_HEIGHT - 280, Math.min(GAME_HEIGHT - 40, newPlayerY));
        player = { x: newPlayerX, y: newPlayerY };

        // Fire trail
        if (hasFireTrail && frameCount.current % 3 === 0) {
          fireTrails = [...fireTrails, { id: getId(), x: player.x + PLAYER_WIDTH / 2, y: player.y + PLAYER_HEIGHT, life: 60 }];
        }

        // Orbitals
        orbitals = orbitals.map(o => ({ ...o, angle: o.angle + 0.08 }));

        // Shooting
        const now = Date.now();
        let fireRate = 180 - fireRateBonus * 15;
        if (rapidFire) fireRate *= 0.55;
        if (hasMinigun) fireRate = 40;
        if (isBerserk) fireRate *= 0.6;

        const isShooting = keys.has(' ') || keys.has('z') || keys.has('x');
        if (isShooting && now - lastShot.current > fireRate) {
          lastShot.current = now;

          const bulletX = player.x + PLAYER_WIDTH / 2 - 2;
          const bulletY = player.y;
          const bulletSize = (hasGiant ? 12 : 4) + bulletSizeBonus;
          
          const createBullet = (x: number, y: number, vx: number = 0, vy: number = -BULLET_SPEED): Bullet => ({
            id: getId(), x, y, vx, vy,
            piercing: hasLaser, homing: hasHoming, size: bulletSize,
            bounces: hasRicochet ? 3 : 0, chain: hasLightning ? 3 : 0,
          });

          if (spreadShot) {
            for (let angle = -0.4; angle <= 0.4; angle += 0.2) {
              playerBullets = [...playerBullets, createBullet(bulletX, bulletY, Math.sin(angle) * 5, -BULLET_SPEED)];
            }
          } else if (hasMinigun) {
            const spread = (Math.random() - 0.5) * 2;
            playerBullets = [...playerBullets, createBullet(bulletX + spread * 5, bulletY, spread, -BULLET_SPEED * 1.2)];
          } else {
            playerBullets = [...playerBullets, createBullet(bulletX, bulletY)];
          }
          
          wingmen.forEach(w => {
            playerBullets = [...playerBullets, createBullet(w.x + 10, w.y, 0, -BULLET_SPEED)];
          });
          
          if (hasMissile && frameCount.current % 15 === 0) {
            playerBullets = [...playerBullets, 
              { ...createBullet(bulletX - 15, bulletY), homing: true, size: 6 },
              { ...createBullet(bulletX + 15, bulletY), homing: true, size: 6 }
            ];
          }
        }

        // Orbital shooting
        if (hasOrbital && frameCount.current % 20 === 0) {
          orbitals.forEach(o => {
            const ox = player.x + PLAYER_WIDTH / 2 + Math.cos(o.angle) * 40;
            const oy = player.y + PLAYER_HEIGHT / 2 + Math.sin(o.angle) * 40;
            playerBullets = [...playerBullets, { id: getId(), x: ox, y: oy, vx: 0, vy: -8, size: 3 }];
          });
        }

        // Move bullets with homing
        playerBullets = playerBullets.map(b => {
          let { x, y, vx = 0, vy = -BULLET_SPEED, homing, bounces = 0 } = b;
          
          if (homing) {
            let target: Position | null = null;
            if (boss && boss.y >= 60) {
              const config = BOSS_CONFIG[boss.type];
              target = { x: boss.x + config.width / 2, y: boss.y + config.height / 2 };
            } else if (enemies.length > 0) {
              target = enemies.reduce((closest, e) => distance({ x, y }, e) < distance({ x, y }, closest) ? e : closest, enemies[0]);
            }
            if (target) {
              const dx = target.x - x;
              const dy = target.y - y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              vx += (dx / dist) * 0.5;
              vy += (dy / dist) * 0.5;
              const speed = Math.sqrt(vx * vx + vy * vy);
              vx = (vx / speed) * 10;
              vy = (vy / speed) * 10;
            }
          }
          
          x += vx * slowFactor;
          y += vy * slowFactor;
          
          if (bounces > 0) {
            if (x < 0 || x > GAME_WIDTH) { vx = -vx; bounces--; }
            if (y < 0) { vy = -vy; bounces--; }
          }
          
          return { ...b, x, y, vx, vy, bounces };
        }).filter(b => b.y > -20 && b.y < GAME_HEIGHT + 20 && b.x > -20 && b.x < GAME_WIDTH + 20);

        // Black holes
        blackHoles = blackHoles.map(bh => ({ ...bh, life: bh.life - 1 })).filter(bh => bh.life > 0);
        blackHoles.forEach(bh => {
          enemies = enemies.map(e => {
            const dx = bh.x - e.x;
            const dy = bh.y - e.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150 && dist > 10) {
              const force = 300 / (dist * dist);
              return { ...e, x: e.x + dx * force, y: e.y + dy * force };
            }
            if (dist < 20) {
              particles = [...particles, ...createExplosion(e.x + 15, e.y + 13, ENEMY_CONFIG[e.type].color, 8)];
              score += ENEMY_CONFIG[e.type].points * (doublePoints ? 2 : 1);
              return { ...e, health: -999 };
            }
            return e;
          });
          enemyBullets = enemyBullets.filter(b => distance(bh, b) > 30);
        });

        // Fire trails damage
        fireTrails = fireTrails.map(f => ({ ...f, life: f.life - 1 })).filter(f => f.life > 0);
        fireTrails.forEach(f => {
          enemies = enemies.map(e => {
            if (rectCollision({ x: f.x - 8, y: f.y - 8, w: 16, h: 16 }, { x: e.x, y: e.y, w: 30, h: 26 })) {
              return { ...e, health: e.health - 0.05, burning: 30 };
            }
            return e;
          });
        });

        // Move enemies
        if (freezeTimer <= 0 && !boss) {
          enemyMoveTimer.current += slowFactor;
          const moveInterval = Math.max(5, 25 - Math.floor(wave / 3));
          
          enemies = enemies.map(e => {
            if (e.frozen && e.frozen > 0) return { ...e, frozen: e.frozen - 1 };
            let { x, y, behavior } = e;
            behavior += 0.02 * slowFactor;
            
            if (e.type === 'zigzag') x += Math.sin(behavior * 3) * 3 * slowFactor;
            else if (e.type === 'speeder') y += 0.3 * slowFactor;
            else if (e.type === 'bomber' && Math.abs(player.x - x) < 30) y += 1 * slowFactor;
            
            return { ...e, x, y, behavior, shootCooldown: e.shootCooldown - slowFactor };
          });

          if (enemyMoveTimer.current >= moveInterval) {
            enemyMoveTimer.current = 0;
            const leftMost = Math.min(...enemies.map(e => e.x), GAME_WIDTH);
            const rightMost = Math.max(...enemies.map(e => e.x), 0);
            
            let moveDown = false;
            if (rightMost > GAME_WIDTH - 40 && enemyDirection.current > 0) { enemyDirection.current = -1; moveDown = true; }
            else if (leftMost < 20 && enemyDirection.current < 0) { enemyDirection.current = 1; moveDown = true; }
            
            enemies = enemies.map(e => ({
              ...e,
              x: e.x + enemyDirection.current * (6 + wave * 0.3),
              y: moveDown ? e.y + 12 + wave * 0.5 : e.y,
            }));
          }
        }

        // Enemy shooting
        let newEnemyBullets: Bullet[] = [];
        if (freezeTimer <= 0 && !boss) {
          enemies = enemies.map(enemy => {
            if (enemy.frozen && enemy.frozen > 0) return enemy;
            if (enemy.shootCooldown <= 0) {
              const baseRate = 150 - wave * 2;
              let newCooldown = Math.max(40, baseRate) + Math.random() * 60;
              
              if (enemy.type === 'sniper') {
                const dx = player.x - enemy.x;
                const dy = player.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                newEnemyBullets.push({ id: getId(), x: enemy.x + 15, y: enemy.y + 25, vx: (dx / dist) * 5, vy: (dy / dist) * 5 });
              } else if (enemy.type === 'bomber') {
                for (let i = -1; i <= 1; i++) {
                  newEnemyBullets.push({ id: getId(), x: enemy.x + 15 + i * 10, y: enemy.y + 25, vx: i * 0.5, vy: 3 });
                }
              } else if (enemy.type === 'splitter') {
                for (let i = 0; i < 8; i++) {
                  const angle = (Math.PI * 2 * i) / 8;
                  newEnemyBullets.push({ id: getId(), x: enemy.x + 15, y: enemy.y + 15, vx: Math.cos(angle) * 3, vy: Math.sin(angle) * 3 });
                }
                newCooldown *= 2;
              } else if (enemy.type === 'elite') {
                const dx = player.x - enemy.x;
                const dy = player.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                for (let i = -1; i <= 1; i++) {
                  newEnemyBullets.push({ id: getId(), x: enemy.x + 15, y: enemy.y + 25, vx: (dx / dist) * 5 + i, vy: (dy / dist) * 5 });
                }
              } else {
                newEnemyBullets.push({ id: getId(), x: enemy.x + 15, y: enemy.y + 25, vy: 3 + wave * 0.15 });
              }
              return { ...enemy, shootCooldown: newCooldown };
            }
            return enemy;
          });
        }
        enemyBullets = [...enemyBullets, ...newEnemyBullets];

        // Boss AI - scales with wave number
        if (boss && freezeTimer <= 0 && (!boss.frozen || boss.frozen <= 0)) {
          const config = BOSS_CONFIG[boss.type];

          // Wave-based scaling for boss behavior
          const bulletSpeed = 3 + wave * 0.05; // Faster bullets at higher waves
          const moveSpeed = (1.5 + boss.phase * 0.3) * (1 + wave * 0.01); // Faster movement

          if (boss.y < 60) {
            boss = { ...boss, y: boss.y + 1.5 };
          } else {
            boss = { ...boss, attackTimer: boss.attackTimer + slowFactor, specialTimer: boss.specialTimer + slowFactor };
            boss = { ...boss, x: boss.x + boss.moveDirection * moveSpeed };
            if (boss.x < 20) boss = { ...boss, moveDirection: 1 };
            if (boss.x > GAME_WIDTH - config.width - 20) boss = { ...boss, moveDirection: -1 };

            const bossCenter = boss.x + config.width / 2;

            // Attack faster at higher waves (80 -> down to 50 at wave 50)
            const attackCooldown = Math.max(50, 80 - wave * 0.6) - boss.phase * 5;

            if (boss.attackTimer > attackCooldown) {
              boss = { ...boss, attackTimer: 0, attackPattern: (boss.attackPattern + 1) % 4 };

              // Number of bullets scales with wave
              const bulletCount = Math.min(5 + Math.floor(wave / 10), 8); // 5 to 8 bullets

              // Attack patterns - scale with wave
              if (boss.attackPattern === 0) {
                // Spread shot - more bullets at higher waves
                for (let i = -Math.floor(bulletCount / 2); i <= Math.floor(bulletCount / 2); i++) {
                  newEnemyBullets.push({ id: getId(), x: bossCenter, y: boss.y + config.height, vx: i * 0.8, vy: bulletSpeed });
                }
              } else if (boss.attackPattern === 1) {
                // Aimed shot - more bullets at higher waves
                const dx = player.x - bossCenter;
                const dy = player.y - boss.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const aimedCount = 3 + Math.floor(wave / 15); // 3-5 aimed bullets
                for (let i = 0; i < aimedCount; i++) {
                  const offset = (i - (aimedCount - 1) / 2) * 15;
                  newEnemyBullets.push({ id: getId(), x: bossCenter + offset, y: boss.y + config.height, vx: (dx / dist) * (bulletSpeed + 1), vy: (dy / dist) * (bulletSpeed + 1) });
                }
              } else if (boss.attackPattern === 2) {
                // Spiral shot - more bullets at higher waves
                const spiralCount = 6 + Math.floor(wave / 10); // 6 to 10
                for (let i = 0; i < spiralCount; i++) {
                  const angle = (Math.PI * 2 * i) / spiralCount + frameCount.current * 0.05;
                  newEnemyBullets.push({ id: getId(), x: bossCenter, y: boss.y + config.height / 2, vx: Math.cos(angle) * (bulletSpeed - 0.5), vy: Math.sin(angle) * 2 + 2 });
                }
              } else {
                // Spawn minions - more at higher waves
                const minionCount = 2 + Math.floor(wave / 20); // 2-4 minions
                if (enemies.length < 6) {
                  for (let i = 0; i < minionCount; i++) {
                    enemies = [...enemies, createEnemy(boss.x + 20 + i * 35, boss.y + config.height + 10, wave)];
                  }
                }
              }
            }
            
            const healthPercent = boss.health / boss.maxHealth;
            if (healthPercent < 0.3 && boss.phase < 3) boss = { ...boss, phase: 3 };
            else if (healthPercent < 0.6 && boss.phase < 2) boss = { ...boss, phase: 2 };
          }
          enemyBullets = [...enemyBullets, ...newEnemyBullets];
        }

        // Move enemy bullets
        enemyBullets = enemyBullets
          .map(b => ({ ...b, x: b.x + (b.vx || 0) * slowFactor, y: b.y + (b.vy || 4) * slowFactor }))
          .filter(b => b.y < GAME_HEIGHT + 20 && b.y > -20 && b.x > -20 && b.x < GAME_WIDTH + 20);

        // Collision detection
        const hitEnemyIds = new Set<number>();
        const hitBulletIds = new Set<number>();
        let newParticles: Particle[] = [];
        let newPowerUps: PowerUp[] = [];
        let scoreGained = 0;
        let healthGained = 0;

        // Player bullets vs Boss
        if (boss && boss.y >= 60) {
          const config = BOSS_CONFIG[boss.type];
          for (const bullet of playerBullets) {
            if (!boss) break; // Boss was killed, exit loop
            const bulletSize = bullet.size || 4;
            if (rectCollision(
              { x: bullet.x, y: bullet.y, w: bulletSize, h: bulletSize * 2 },
              { x: boss.x, y: boss.y, w: config.width, h: config.height }
            )) {
              if (!bullet.piercing) hitBulletIds.add(bullet.id);

              if (boss.type === 'deathstar' && boss.shields && boss.shields > 0) {
                boss = { ...boss, shields: boss.shields - 1 };
                newParticles.push(...createExplosion(bullet.x, bullet.y, '#3b82f6', 6));
              } else {
                let damage = (2 + damageBonus) * (hasExplosive ? 3 : 1);  // Base 2 damage to bosses
                boss = { ...boss, health: boss.health - damage };
                newParticles.push(...createExplosion(bullet.x, bullet.y, config.color, hasExplosive ? 10 : 4));
                screenShake = Math.max(screenShake, 2);

                if (boss.health <= 0) {
                  for (let i = 0; i < 25; i++) {
                    const ex = boss.x + Math.random() * config.width;
                    const ey = boss.y + Math.random() * config.height;
                    newParticles.push(...createExplosion(ex, ey, config.color, 8));
                  }
                  const bossScore = (500 + wave * 50) * (doublePoints ? 2 : 1);
                  scoreGained += bossScore;
                  coinsCollected += Math.floor(wave * 2);
                  newParticles.push(createTextParticle(boss.x + config.width / 2, boss.y + config.height / 2, `+${bossScore}`, '#ffd700'));
                  screenShake = 25;

                  for (let i = 0; i < 6; i++) {
                    newPowerUps.push({ id: getId(), x: boss.x + 15 + i * 18, y: boss.y + config.height / 2, type: getRandomPowerUp(luck) });
                  }
                  newPowerUps.push({ id: getId(), x: boss.x + config.width / 2 - 15, y: boss.y + config.height / 2 + 20, type: 'coin' });
                  newPowerUps.push({ id: getId(), x: boss.x + config.width / 2 + 15, y: boss.y + config.height / 2 + 20, type: 'coin' });
                  newPowerUps.push({ id: getId(), x: boss.x + config.width / 2, y: boss.y + config.height / 2 + 40, type: 'extralife' });

                  if (lives < state.maxLives) lives++;
                  state.bossesKilled++;
                  boss = null;
                  break; // Exit loop after boss is killed
                }
              }
            }
          }
        }

        // Player bullets vs Enemies
        for (const bullet of playerBullets) {
          if (hitBulletIds.has(bullet.id)) continue;
          const bulletSize = bullet.size || 4;
          
          for (const enemy of enemies) {
            if (hitEnemyIds.has(enemy.id)) continue;
            
            if (rectCollision(
              { x: bullet.x, y: bullet.y, w: bulletSize, h: bulletSize * 2 },
              { x: enemy.x, y: enemy.y, w: 30, h: 26 }
            )) {
              if (!bullet.piercing) hitBulletIds.add(bullet.id);
              
              let damage = (1 + damageBonus) * (hasExplosive ? 2 : 1);
              enemy.health -= damage;
              
              if (hasExplosive) {
                newParticles.push(...createExplosion(enemy.x + 15, enemy.y + 13, '#ff6b00', 8));
                enemies.forEach(e => { if (e.id !== enemy.id && distance(enemy, e) < 50) e.health -= 1; });
              }
              
              if (enemy.health <= 0) {
                hitEnemyIds.add(enemy.id);
                const config = ENEMY_CONFIG[enemy.type];
                
                combo++;
                comboTimer = 90;
                const comboMult = Math.min(combo, 10);
                const points = config.points * comboMult * (doublePoints ? 2 : 1);
                scoreGained += points;
                
                if (hasVampire) healthGained += 0.05;
                
                newParticles.push(...createExplosion(enemy.x + 15, enemy.y + 13, config.color, 8));
                if (combo > 1) newParticles.push(createTextParticle(enemy.x + 15, enemy.y, `x${comboMult}`, '#ffd700'));
                
                if (enemy.type === 'splitter') {
                  enemies = [...enemies,
                    { ...createEnemy(enemy.x - 20, enemy.y, wave), type: 'speeder' as EnemyType, health: 1, maxHealth: 1 },
                    { ...createEnemy(enemy.x + 20, enemy.y, wave), type: 'speeder' as EnemyType, health: 1, maxHealth: 1 }
                  ];
                }
                
                // Drops
                if (Math.random() < 0.12 + luck * 0.02) {
                  newPowerUps.push({ id: getId(), x: enemy.x + 5, y: enemy.y, type: getRandomPowerUp(luck) });
                }
                if (Math.random() < 0.15) {
                  newPowerUps.push({ id: getId(), x: enemy.x + 15, y: enemy.y, type: 'coin' });
                }
              } else {
                newParticles.push(...createExplosion(bullet.x, bullet.y, '#fff', 2));
              }
              break;
            }
          }
        }

        playerBullets = playerBullets.filter(b => !hitBulletIds.has(b.id));
        enemies = enemies.filter(e => !hitEnemyIds.has(e.id) && e.health > 0);
        score += scoreGained;
        if (healthGained > 0 && lives < state.maxLives) lives = Math.min(state.maxLives, lives + healthGained);
        if (comboTimer > 0) { comboTimer--; if (comboTimer === 0) combo = 0; }

        // Enemy bullets vs Player
        if (!isGhost) {
          for (const bullet of enemyBullets) {
            if (rectCollision(
              { x: bullet.x - 3, y: bullet.y - 3, w: 8, h: 8 },
              { x: player.x + 5, y: player.y + 5, w: PLAYER_WIDTH - 10, h: PLAYER_HEIGHT - 10 }
            )) {
              if (hasShield && shieldHits > 0) {
                shieldHits--;
                if (shieldHits === 0) hasShield = false;
                newParticles.push(...createExplosion(bullet.x, bullet.y, '#3b82f6', 6));
              } else {
                lives--;
                combo = 0;
                screenShake = 10;
                newParticles.push(...createExplosion(player.x + PLAYER_WIDTH/2, player.y + PLAYER_HEIGHT/2, '#ef4444', 12));
                enemyBullets = enemyBullets.filter(b => distance(b, player) > 80);
                
                // Auto revive
                if (lives <= 0 && hasAutoRevive && !usedRevive) {
                  lives = 1;
                  usedRevive = true;
                  newParticles.push(createTextParticle(player.x + PLAYER_WIDTH/2, player.y - 20, 'REVIVED!', '#4ade80'));
                  screenShake = 15;
                }
              }
              enemyBullets = enemyBullets.filter(b => b.id !== bullet.id);
              break;
            }
          }
        }

        // Wingmen position
        wingmen = wingmen.map(w => ({ ...w, x: player.x + (w.side === 'left' ? -30 : PLAYER_WIDTH + 10), y: player.y + 10 }));

        // Power-up collection
        powerUps = [...powerUps, ...newPowerUps].map(p => {
          let { x, y } = p;
          y += 1.5;
          if (hasMagnet || (upgrades.magnetRange || 0) > 0) {
            const dx = player.x + PLAYER_WIDTH / 2 - x;
            const dy = player.y + PLAYER_HEIGHT / 2 - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < magnetRange) { x += dx * 0.1; y += dy * 0.1; }
          }
          return { ...p, x, y };
        }).filter(p => p.y < GAME_HEIGHT + 20);
        
        for (const powerUp of powerUps) {
          if (rectCollision(
            { x: powerUp.x, y: powerUp.y, w: 24, h: 24 },
            { x: player.x - 5, y: player.y - 5, w: PLAYER_WIDTH + 10, h: PLAYER_HEIGHT + 10 }
          )) {
            powerUps = powerUps.filter(p => p.id !== powerUp.id);
            
            if (powerUp.type === 'coin') {
              const coinValue = Math.ceil((1 + wave * 0.1) * coinBonus);
              coinsCollected += coinValue;
              newParticles.push(createTextParticle(powerUp.x, powerUp.y - 10, `+${coinValue}🪙`, '#fbbf24'));
            } else {
              const info = POWERUP_INFO[powerUp.type];
              newParticles.push(...createExplosion(powerUp.x + 12, powerUp.y + 12, info.color, 6));
              
              const duration = 600;
              switch (powerUp.type) {
                case 'shield': hasShield = true; shieldHits = 3; break;
                case 'rapid': rapidFire = true; activePowerUps = [...activePowerUps, { type: 'rapid', timer: duration }]; break;
                case 'spread': spreadShot = true; hasLaser = false; hasMinigun = false; activePowerUps = [...activePowerUps, { type: 'spread', timer: duration }]; break;
                case 'laser': hasLaser = true; spreadShot = false; hasMinigun = false; activePowerUps = [...activePowerUps, { type: 'laser', timer: duration }]; break;
                case 'missile': hasMissile = true; activePowerUps = [...activePowerUps, { type: 'missile', timer: duration }]; break;
                case 'slowmo': slowMo = true; activePowerUps = [...activePowerUps, { type: 'slowmo', timer: 400 }]; break;
                case 'magnet': hasMagnet = true; activePowerUps = [...activePowerUps, { type: 'magnet', timer: duration }]; break;
                case 'ghost': isGhost = true; ghostTimer = 180; break;
                case 'doublepoints': doublePoints = true; activePowerUps = [...activePowerUps, { type: 'doublepoints', timer: duration }]; break;
                case 'freeze': freezeTimer = 180; enemies = enemies.map(e => ({ ...e, frozen: 180 })); if (boss) boss = { ...boss, frozen: 180 }; break;
                case 'ricochet': hasRicochet = true; activePowerUps = [...activePowerUps, { type: 'ricochet', timer: duration }]; break;
                case 'homing': hasHoming = true; activePowerUps = [...activePowerUps, { type: 'homing', timer: duration }]; break;
                case 'giant': hasGiant = true; activePowerUps = [...activePowerUps, { type: 'giant', timer: duration }]; break;
                case 'vampire': hasVampire = true; activePowerUps = [...activePowerUps, { type: 'vampire', timer: duration }]; break;
                case 'berserk': isBerserk = true; berserkTimer = 400; break;
                case 'wingmen': if (wingmen.length < 2) wingmen = [{ id: getId(), x: player.x - 30, y: player.y + 10, side: 'left' }, { id: getId(), x: player.x + PLAYER_WIDTH + 10, y: player.y + 10, side: 'right' }]; break;
                case 'blackhole': blackHoles = [...blackHoles, { id: getId(), x: GAME_WIDTH / 2, y: 200, life: 300 }]; break;
                case 'lightning': hasLightning = true; activePowerUps = [...activePowerUps, { type: 'lightning', timer: duration }]; break;
                case 'firetrail': hasFireTrail = true; activePowerUps = [...activePowerUps, { type: 'firetrail', timer: duration }]; break;
                case 'minigun': hasMinigun = true; spreadShot = false; hasLaser = false; activePowerUps = [...activePowerUps, { type: 'minigun', timer: duration }]; break;
                case 'explosive': hasExplosive = true; activePowerUps = [...activePowerUps, { type: 'explosive', timer: duration }]; break;
                case 'orbital': hasOrbital = true; if (orbitals.length < 4) orbitals = Array(4).fill(0).map((_, i) => ({ id: getId(), x: player.x, y: player.y, angle: (Math.PI * 2 * i) / 4 })); activePowerUps = [...activePowerUps, { type: 'orbital', timer: duration }]; break;
                case 'nuke':
                  enemies.forEach(e => { newParticles.push(...createExplosion(e.x + 15, e.y + 13, '#ffd93d', 6)); score += ENEMY_CONFIG[e.type].points; });
                  enemies = [];
                  if (boss) { boss = { ...boss, health: boss.health - 50, shields: 0 }; if (boss.health <= 0) boss = null; }
                  enemyBullets = [];
                  screenShake = 25;
                  break;
                case 'extralife': lives = Math.min(lives + 1, state.maxLives); break;
              }
            }
          }
        }

        // Update power-up timers
        activePowerUps = activePowerUps.map(p => ({ ...p, timer: p.timer - 1 })).filter(p => {
          if (p.timer <= 0) {
            switch (p.type) {
              case 'rapid': rapidFire = (upgrades.startRapid || 0) > 0; break;
              case 'spread': spreadShot = (upgrades.startSpread || 0) > 0; break;
              case 'laser': hasLaser = false; break;
              case 'missile': hasMissile = false; break;
              case 'slowmo': slowMo = false; break;
              case 'magnet': hasMagnet = (upgrades.magnetRange || 0) > 0; break;
              case 'doublepoints': doublePoints = false; break;
              case 'ricochet': hasRicochet = false; break;
              case 'homing': hasHoming = false; break;
              case 'giant': hasGiant = (upgrades.bulletSize || 0) > 0; break;
              case 'vampire': hasVampire = false; break;
              case 'lightning': hasLightning = false; break;
              case 'firetrail': hasFireTrail = false; break;
              case 'minigun': hasMinigun = false; break;
              case 'explosive': hasExplosive = false; break;
              case 'orbital': hasOrbital = false; orbitals = []; break;
            }
            return false;
          }
          return true;
        });
        
        if (ghostTimer > 0) { ghostTimer--; if (ghostTimer === 0) isGhost = false; }
        if (freezeTimer > 0) freezeTimer--;
        if (berserkTimer > 0) { berserkTimer--; if (berserkTimer === 0) isBerserk = false; }
        if (screenShake > 0) screenShake -= 0.5;

        // Particles
        particles = [...particles, ...newParticles]
          .map(p => ({ ...p, x: p.x + p.vx * slowFactor, y: p.y + p.vy * slowFactor, vy: p.text ? p.vy : p.vy + 0.1, life: p.life - 1 }))
          .filter(p => p.life > 0);

        // Wave completion
        if (enemies.length === 0 && !boss && !bossIntro) {
          wave++;
          coinsCollected += Math.floor(5 + wave * 0.5);
          
          if (wave > TOTAL_WAVES) {
            // Victory!
            const totalCoins = Math.floor(coinsCollected * coinBonus);
            const bossesKilledThisGame = state.bossesKilled;
            setTimeout(() => {
              setLastGameStatsRef.current({ score, wave: wave - 1, coinsEarned: totalCoins });
              setPlayerDataRef.current(p => ({
                ...p,
                coins: p.coins + totalCoins,
                highScore: Math.max(p.highScore, score),
                highestWave: Math.max(p.highestWave, wave - 1),
                gamesPlayed: p.gamesPlayed + 1,
                bossesDefeated: p.bossesDefeated + bossesKilledThisGame,
              }));
              setScreenRef.current('victory');
            }, 0);
            return { ...state, gameOver: true };
          }
          
          if (wave % 5 === 0) {
            boss = createBoss(wave);
            bossIntro = true;
            bossIntroTimer = 120;
            enemyBullets = [];
          } else {
            enemies = createEnemyWave(wave);
            enemyDirection.current = 1;
            enemyBullets = [];
          }
        }

        // Game over check
        if (lives <= 0 || enemies.some(e => e.y > GAME_HEIGHT - 100)) {
          const totalCoins = Math.floor(coinsCollected * coinBonus);
          const bossesKilledThisGame = state.bossesKilled;
          setTimeout(() => {
            setLastGameStatsRef.current({ score, wave, coinsEarned: totalCoins });
            setPlayerDataRef.current(p => ({
              ...p,
              coins: p.coins + totalCoins,
              highScore: Math.max(p.highScore, score),
              highestWave: Math.max(p.highestWave, wave),
              gamesPlayed: p.gamesPlayed + 1,
              bossesDefeated: p.bossesDefeated + bossesKilledThisGame,
            }));
            setScreenRef.current('gameover');
          }, 0);
          return { ...state, gameOver: true };
        }

        return {
          ...state,
          player, playerBullets, enemyBullets, enemies, boss, bossLasers, particles,
          powerUps, wingmen, orbitals, blackHoles, fireTrails,
          score, coinsCollected, lives, wave, hasShield, shieldHits, rapidFire, spreadShot,
          hasLaser, hasMissile, slowMo, hasMagnet, isGhost, doublePoints, hasRicochet,
          hasHoming, hasGiant, hasVampire, isBerserk, hasLightning, hasFireTrail,
          hasMinigun, hasExplosive, hasOrbital, activePowerUps,
          ghostTimer, freezeTimer, berserkTimer, screenShake, combo, comboTimer,
          bossIntro, bossIntroTimer, usedRevive
        };
      });
    }, [upgrades, damageBonus, fireRateBonus, magnetRange, coinBonus, luck, speedBonus, bulletSizeBonus, hasAutoRevive]);

    useEffect(() => {
      const interval = setInterval(gameLoop, 1000 / 60);
      return () => clearInterval(interval);
    }, [gameLoop]);

    const { player, playerBullets, enemyBullets, enemies, boss, particles, powerUps, wingmen, orbitals, blackHoles, fireTrails, score, coinsCollected, lives, wave, hasShield, shieldHits, isGhost, isBerserk, freezeTimer, combo, screenShake, activePowerUps, bossIntro } = game;
    const shakeX = screenShake ? (Math.random() - 0.5) * screenShake : 0;
    const shakeY = screenShake ? (Math.random() - 0.5) * screenShake : 0;

    return (
      <div ref={gameRef} tabIndex={0} className="flex flex-col items-center justify-center min-h-screen bg-black p-2 outline-none">
        {/* HUD */}
        <div className="flex justify-between w-full max-w-lg mb-1 text-white font-mono text-sm">
          <div className="text-green-400">SCORE: {score.toLocaleString()}</div>
          <div className="text-yellow-400">WAVE {wave}/{TOTAL_WAVES}</div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">🪙{coinsCollected}</span>
            <span className="text-red-400">{'❤️'.repeat(Math.ceil(lives))}</span>
          </div>
        </div>

        {/* Active buffs */}
        <div className="flex flex-wrap gap-1 mb-1 max-w-lg justify-center h-5">
          {activePowerUps.slice(0, 8).map((p, i) => (
            <span key={i} className="text-xs" style={{ opacity: p.timer < 100 ? 0.5 : 1 }}>{POWERUP_INFO[p.type].emoji}</span>
          ))}
          {isGhost && <span className="text-xs opacity-50">👻</span>}
          {isBerserk && <span className="text-xs animate-pulse">😤</span>}
          {freezeTimer > 0 && <span className="text-xs">❄️</span>}
          {combo > 1 && <span className="text-xs text-yellow-400">x{Math.min(combo, 10)}</span>}
        </div>

        {/* Game canvas */}
        <div className="relative overflow-hidden rounded border-2 border-purple-600 game-canvas"
             style={{ width: GAME_WIDTH, height: GAME_HEIGHT,
                      background: boss ? `linear-gradient(to bottom, #1a0505 0%, #0a0a1a 100%)` : 'linear-gradient(to bottom, #0a0a1a 0%, #1a0a2e 50%, #0a1a2a 100%)',
                      transform: `translate(${shakeX}px, ${shakeY}px)`,
                      touchAction: 'none' }}
             onTouchStart={handleTouchStart}
             onTouchMove={handleTouchMove}
             onTouchEnd={handleTouchEnd}
             onTouchCancel={handleTouchEnd}>
          
          {/* Stars */}
          {[...Array(60)].map((_, i) => (
            <div key={i} className="absolute bg-white rounded-full"
                 style={{ width: 1 + Math.random(), height: 1 + Math.random(),
                          left: Math.random() * GAME_WIDTH, top: ((frameCount.current * 0.3 + i * 30) % GAME_HEIGHT),
                          opacity: 0.3 + Math.random() * 0.4 }} />
          ))}

          {/* Black holes */}
          {blackHoles.map(bh => (
            <div key={bh.id} className="absolute rounded-full animate-spin"
                 style={{ left: bh.x - 40, top: bh.y - 40, width: 80, height: 80,
                          background: 'radial-gradient(circle, #000 0%, #1e1b4b 50%, transparent 70%)',
                          boxShadow: '0 0 30px #6366f1' }} />
          ))}

          {/* Fire trails */}
          {fireTrails.map(f => (
            <div key={f.id} className="absolute rounded-full"
                 style={{ left: f.x - 5, top: f.y - 5, width: 10, height: 10,
                          background: 'radial-gradient(circle, #ff6b00 0%, transparent 100%)',
                          opacity: f.life / 60 }} />
          ))}

          {/* Boss */}
          {boss && (
            <div className="absolute" style={{ left: boss.x, top: boss.y }}>
              <div className="relative" style={{ width: BOSS_CONFIG[boss.type].width, height: BOSS_CONFIG[boss.type].height }}>
                <div className="absolute inset-0 rounded-lg"
                     style={{ background: `radial-gradient(ellipse, ${BOSS_CONFIG[boss.type].color} 0%, #1a1a1a 100%)`,
                              boxShadow: `0 0 30px ${BOSS_CONFIG[boss.type].color}` }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl">
                  {BOSS_CONFIG[boss.type].emoji}
                </div>
                <div className="absolute -bottom-6 left-0 w-full h-2 bg-gray-800 rounded">
                  <div className="h-full rounded transition-all" style={{ width: `${(boss.health / boss.maxHealth) * 100}%`, background: BOSS_CONFIG[boss.type].color }} />
                </div>
              </div>
            </div>
          )}

          {/* Boss intro */}
          {bossIntro && boss && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center animate-pulse">
                <div className="text-5xl mb-2">{BOSS_CONFIG[boss.type].emoji}</div>
                <div className="text-2xl font-bold text-red-500">{BOSS_CONFIG[boss.type].name}</div>
              </div>
            </div>
          )}

          {/* Wingmen */}
          {wingmen.map(w => (
            <div key={w.id} className="absolute" style={{ left: w.x, top: w.y }}>
              <div className="w-4 h-3 bg-cyan-500" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
            </div>
          ))}

          {/* Orbitals */}
          {orbitals.map(o => {
            const ox = player.x + PLAYER_WIDTH / 2 + Math.cos(o.angle) * 40 - 5;
            const oy = player.y + PLAYER_HEIGHT / 2 + Math.sin(o.angle) * 40 - 5;
            return <div key={o.id} className="absolute w-2.5 h-2.5 bg-yellow-400 rounded-full" style={{ left: ox, top: oy, boxShadow: '0 0 6px #fef08a' }} />;
          })}

          {/* Player */}
          <div className="absolute" style={{ left: player.x, top: player.y, opacity: isGhost ? 0.4 : 1 }}>
            <div className="relative" style={{ width: PLAYER_WIDTH, height: PLAYER_HEIGHT }}>
              <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[18px] border-r-[18px] border-b-[24px] border-l-transparent border-r-transparent ${isBerserk ? 'border-b-red-500' : 'border-b-cyan-400'}`} />
              <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-b-[14px] border-l-transparent border-r-transparent ${isBerserk ? 'border-b-red-700' : 'border-b-cyan-600'}`} />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-3 bg-orange-500 rounded-full blur-sm animate-pulse" />
            </div>
            {hasShield && <div className="absolute -inset-3 border-2 border-blue-400 rounded-full animate-pulse" style={{ opacity: 0.3 + shieldHits * 0.2 }} />}
          </div>

          {/* Player bullets */}
          {playerBullets.map(b => (
            <div key={b.id} className="absolute rounded-full bg-cyan-400"
                 style={{ left: b.x - (b.size || 4) / 2, top: b.y, width: b.size || 4, height: (b.size || 4) * 2, boxShadow: '0 0 6px #22d3ee' }} />
          ))}

          {/* Enemies */}
          {enemies.map(e => (
            <div key={e.id} className="absolute text-2xl" style={{ left: e.x, top: e.y, filter: e.frozen ? 'hue-rotate(180deg)' : 'none' }}>
              {ENEMY_CONFIG[e.type].emoji}
            </div>
          ))}

          {/* Enemy bullets */}
          {enemyBullets.map(b => (
            <div key={b.id} className="absolute w-2 h-2 bg-red-500 rounded-full" style={{ left: b.x - 1, top: b.y - 1, boxShadow: '0 0 4px #ef4444' }} />
          ))}

          {/* Power-ups */}
          {powerUps.map(p => (
            <div key={p.id} className="absolute w-6 h-6 flex items-center justify-center text-sm animate-bounce rounded-full border"
                 style={{ left: p.x, top: p.y, borderColor: POWERUP_INFO[p.type].color, backgroundColor: `${POWERUP_INFO[p.type].color}33` }}>
              {POWERUP_INFO[p.type].emoji}
            </div>
          ))}

          {/* Particles */}
          {particles.map(p => (
            p.text ? (
              <div key={p.id} className="absolute text-xs font-bold pointer-events-none"
                   style={{ left: p.x, top: p.y, color: p.color, opacity: p.life / 60 }}>{p.text}</div>
            ) : (
              <div key={p.id} className="absolute rounded-full"
                   style={{ left: p.x, top: p.y, width: p.size || 2, height: p.size || 2, backgroundColor: p.color, opacity: p.life / 40 }} />
            )
          ))}
        </div>

        <div className="text-gray-500 text-xs mt-2">
          {isMobile ? 'Touch and drag to move • Auto-fires while touching' : 'ESC to quit • Arrow keys/WASD to move • Space to shoot'}
        </div>

        {/* Mobile back button */}
        {isMobile && (
          <button
            onClick={() => setScreenRef.current('home')}
            className="mt-3 bg-gray-800 hover:bg-gray-700 text-white font-bold px-6 py-2 rounded-lg"
          >
            ← Back to Menu
          </button>
        )}
      </div>
    );
  };

  // ===========================================
  // GAME OVER / VICTORY SCREENS
  // ===========================================
  const ResultScreen = ({ isVictory }: { isVictory: boolean }) => (
    <div className="w-full max-w-lg mx-auto min-h-screen bg-gradient-to-b from-gray-900 to-black p-4 flex flex-col items-center justify-center">
      <div className="text-6xl mb-4">{isVictory ? '🏆' : '💥'}</div>
      <div className={`text-4xl font-bold mb-4 ${isVictory ? 'text-yellow-400' : 'text-red-500'}`}>
        {isVictory ? 'VICTORY!' : 'GAME OVER'}
      </div>
      
      <div className="bg-gray-800 rounded-xl p-6 mb-6 w-full max-w-sm">
        <div className="text-center mb-4">
          <div className="text-gray-400">Final Score</div>
          <div className="text-3xl font-bold text-white">{lastGameStats.score.toLocaleString()}</div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-gray-400 text-sm">Wave Reached</div>
            <div className="text-xl text-white">{lastGameStats.wave}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Coins Earned</div>
            <div className="text-xl text-yellow-400">🪙 {lastGameStats.coinsEarned}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button onClick={() => setScreen('game')}
                className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-3 rounded-xl">
          ▶️ Play Again
        </button>
        <button onClick={() => setScreen('home')}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-6 py-3 rounded-xl">
          🏠 Home
        </button>
      </div>
    </div>
  );

  // ===========================================
  // MAIN RENDER
  // ===========================================
  return (
    <div className="min-h-screen bg-black">
      {screen === 'home' && <HomeScreen />}
      {screen === 'shop' && <ShopScreen />}
      {screen === 'game' && <GameScreen />}
      {screen === 'gameover' && <ResultScreen isVictory={false} />}
      {screen === 'victory' && <ResultScreen isVictory={true} />}
    </div>
  );
}
