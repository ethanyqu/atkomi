import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

const W = 800;
const H = 450;
const GY = H - 55;

type BgStar = { x: number; y: number; r: number; tw: number; sp: number };
type BgBuilding = { x: number; w: number; h: number; hue: number };

type Player = {
  x: number; y: number; w: number; h: number;
  vy: number; jumps: number; maxJumps: number; grounded: boolean;
  attacking: boolean; atkTimer: number;
  hp: number; maxHp: number; iframes: number;
  trail: { x: number; y: number; life: number }[];
};

type Enemy = {
  x: number; y: number; w: number; h: number;
  frac: string; hp: number; maxHp: number;
  color: string; color2: string;
  speed: number; pts: number; flying: boolean;
  hitThisSlash?: boolean;
};

type Particle = {
  x: number; y: number; vx: number; vy: number;
  color: string; life: number; maxLife: number; r: number;
  text?: string;
};

type Slash = { x: number; y: number; w: number; h: number; life: number };

type GameData = {
  player: Player;
  enemies: Enemy[];
  particles: Particle[];
  slashes: Slash[];
  bgStars: BgStar[];
  bgBuildings: BgBuilding[];
  score: number;
  kills: number;
  speed: number;
  frame: number;
  gridOffset: number;
  keys: Record<string, boolean>;
};

const MONSTER_TYPES = [
  { frac: '1/2', w: 48, h: 48, maxHp: 2, color: '#0f0', color2: '#060', speed: 1, pts: 50 },
  { frac: '1/3', w: 44, h: 50, maxHp: 3, color: '#f0f', color2: '#606', speed: 1.2, pts: 75 },
  { frac: '1/4', w: 50, h: 50, maxHp: 1, color: '#ff0', color2: '#660', speed: 1.5, pts: 40 },
  { frac: '3/4', w: 55, h: 55, maxHp: 4, color: '#f60', color2: '#630', speed: 0.8, pts: 100 },
];

function makeStars(): BgStar[] {
  const stars: BgStar[] = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * W, y: Math.random() * (GY - 30), r: Math.random() * 1.5 + 0.2, tw: Math.random() * 6.28, sp: Math.random() * 0.4 + 0.05 });
  }
  return stars;
}

function makeBuildings(): BgBuilding[] {
  const buildings: BgBuilding[] = [];
  for (let i = 0; i < 10; i++) {
    buildings.push({ x: i * 100 - 50, w: 40 + Math.random() * 60, h: 50 + Math.random() * 120, hue: 180 + Math.random() * 60 });
  }
  return buildings;
}

function makePlayer(): Player {
  return {
    x: 100, y: GY - 44, w: 34, h: 44,
    vy: 0, jumps: 0, maxJumps: 2, grounded: true,
    attacking: false, atkTimer: 0,
    hp: 5, maxHp: 5, iframes: 0, trail: [],
  };
}

function initGameData(): GameData {
  return {
    player: makePlayer(),
    enemies: [],
    particles: [],
    slashes: [],
    bgStars: makeStars(),
    bgBuildings: makeBuildings(),
    score: 0,
    kills: 0,
    speed: 4,
    frame: 0,
    gridOffset: 0,
    keys: {},
  };
}

function rectHit(x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number): boolean {
  return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
}

function neonGlow(ctx: CanvasRenderingContext2D, color: string, blur: number) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}

function noGlow(ctx: CanvasRenderingContext2D) {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

function spawnPart(g: GameData, x: number, y: number, vx: number, vy: number, color: string, life: number, r: number, text?: string) {
  g.particles.push({ x, y, vx, vy, color, life, maxLife: life, r, text });
}

function drawNinja(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, attacking: boolean, airborne: boolean, fr: number) {
  const cx = x + w / 2;
  ctx.save();

  neonGlow(ctx, '#0ff', 15);

  const legAnim = airborne ? 0.3 : Math.sin(fr * 0.25) * 0.4;
  ctx.strokeStyle = '#0ae'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx - 4, y + h * 0.6); ctx.lineTo(cx - 8 - legAnim * 8, y + h); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 4, y + h * 0.6); ctx.lineTo(cx + 8 + legAnim * 8, y + h); ctx.stroke();

  const bodyGrad = ctx.createLinearGradient(x, y, x, y + h);
  bodyGrad.addColorStop(0, '#0cf'); bodyGrad.addColorStop(1, '#06a');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(cx, y + h * 0.4, w * 0.35, h * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  neonGlow(ctx, '#0ff', 20);
  ctx.fillStyle = '#0be';
  ctx.beginPath(); ctx.arc(cx, y + h * 0.15, w * 0.28, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#050520';
  ctx.fillRect(cx - w * 0.25, y + h * 0.08, w * 0.5, h * 0.08);

  neonGlow(ctx, '#f0f', 10);
  ctx.fillStyle = '#f0f';
  ctx.beginPath(); ctx.arc(cx - 5, y + h * 0.13, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 5, y + h * 0.13, 2.5, 0, Math.PI * 2); ctx.fill();

  neonGlow(ctx, '#f0f', 8);
  ctx.strokeStyle = '#f0f'; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.2, y + h * 0.2);
  ctx.quadraticCurveTo(x - 10, y + h * 0.15 + Math.sin(fr * 0.1) * 6, x - 15, y + h * 0.3 + Math.sin(fr * 0.08) * 8);
  ctx.stroke();

  neonGlow(ctx, '#0ff', 12);
  ctx.strokeStyle = '#0ff'; ctx.lineWidth = 2.5;
  if (attacking) {
    ctx.beginPath(); ctx.moveTo(cx + 6, y + h * 0.35); ctx.lineTo(cx + w + 15, y + h * 0.1); ctx.stroke();
    neonGlow(ctx, '#fff', 18);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx + w + 15, y + h * 0.1); ctx.lineTo(cx + w + 30, y - 5); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(cx + 6, y + h * 0.35); ctx.lineTo(cx + w * 0.4, y + h * 0.55); ctx.stroke();
  }

  noGlow(ctx);
  ctx.restore();
}

function drawMonster(ctx: CanvasRenderingContext2D, e: Enemy) {
  const { x, y, w, h, frac, hp, maxHp, color, color2 } = e;
  const cx = x + w / 2, cy = y + h / 2;
  ctx.save();

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(cx, y + h + 3, w * 0.4, 5, 0, 0, Math.PI * 2); ctx.fill();

  neonGlow(ctx, color, 18);
  ctx.fillStyle = color;

  if (frac === '1/2') {
    ctx.beginPath(); ctx.arc(cx, cy, w * 0.45, -Math.PI / 2, Math.PI / 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = color2;
    ctx.beginPath(); ctx.arc(cx, cy, w * 0.45, Math.PI / 2, Math.PI * 1.5); ctx.closePath(); ctx.fill();
    neonGlow(ctx, '#fff', 6);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, cy - w * 0.45); ctx.lineTo(cx, cy + w * 0.45); ctx.stroke();
  } else if (frac === '1/3') {
    ctx.beginPath();
    ctx.moveTo(cx, y + 4); ctx.lineTo(x + w - 2, y + h - 2); ctx.lineTo(x + 2, y + h - 2);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = color2;
    ctx.beginPath();
    ctx.moveTo(cx, y + h * 0.35); ctx.lineTo(cx + w * 0.22, y + h - 6); ctx.lineTo(cx - w * 0.22, y + h - 6);
    ctx.closePath(); ctx.fill();
  } else if (frac === '1/4') {
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, w * 0.45, -Math.PI * 0.25, Math.PI * 0.25); ctx.closePath(); ctx.fill();
    ctx.fillStyle = color2;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, w * 0.45, Math.PI * 0.25, Math.PI * 1.75); ctx.closePath(); ctx.fill();
  } else if (frac === '3/4') {
    const r = w * 0.45, sides = 6;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) { const a = Math.PI * 2 / sides * i - Math.PI / 2; ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#0a0a20';
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r + 2, -Math.PI * 0.25, Math.PI * 0.25); ctx.closePath(); ctx.fill();
    ctx.fillStyle = color2;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) { const a = Math.PI * 2 / sides * i - Math.PI / 2; ctx.lineTo(cx + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.5); }
    ctx.closePath(); ctx.fill();
  }

  neonGlow(ctx, '#ff0', 8);
  ctx.fillStyle = '#ff0';
  const eyeY = frac === '1/3' ? y + h * 0.5 : cy - 3;
  ctx.beginPath(); ctx.arc(cx - 7, eyeY, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 7, eyeY, 3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#f00'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx - 11, eyeY - 5); ctx.lineTo(cx - 4, eyeY - 3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 11, eyeY - 5); ctx.lineTo(cx + 4, eyeY - 3); ctx.stroke();

  noGlow(ctx);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Orbitron, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const labelY = frac === '1/3' ? y + h * 0.75 : cy + 10;
  ctx.fillText(frac, cx, labelY);

  if (hp < maxHp) {
    const bw = w * 0.8, bh = 4, bx = cx - bw / 2, by = y - 10;
    ctx.fillStyle = '#300'; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = color; ctx.fillRect(bx, by, bw * (hp / maxHp), bh);
  }

  noGlow(ctx);
  ctx.restore();
}

export default function FractionFighter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [displayScore, setDisplayScore] = useState(0);
  const [displayKills, setDisplayKills] = useState(0);
  const [displayHp, setDisplayHp] = useState(100);
  const [highScore, setHighScore] = useState(0);

  const gameRef = useRef<GameData>(initGameData());

  const resetGame = useCallback(() => {
    gameRef.current = initGameData();
    setDisplayScore(0);
    setDisplayKills(0);
    setDisplayHp(100);
    setGameState('playing');
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const g = gameRef.current;

    const doJump = () => {
      const P = g.player;
      if (P.jumps < P.maxJumps) {
        P.vy = P.jumps === 0 ? -13 : -11;
        P.jumps++;
        P.grounded = false;
        for (let i = 0; i < 5; i++) {
          spawnPart(g, P.x + P.w / 2, P.y + P.h, (Math.random() - 0.5) * 3, Math.random() * 2 + 1, '#0ff', 15, 3);
        }
      }
    };

    const doAttack = () => {
      const P = g.player;
      if (P.attacking) return;
      P.attacking = true;
      P.atkTimer = 12;
      g.slashes.push({ x: P.x + P.w, y: P.y - 5, w: 40, h: P.h + 10, life: 8 });
      for (let i = 0; i < 8; i++) {
        spawnPart(g, P.x + P.w + 20, P.y + P.h * 0.3, Math.random() * 6 + 2, (Math.random() - 0.5) * 5, '#fff', 12, 2 + Math.random() * 2);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      g.keys[e.code] = true;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        doJump();
      }
      if (e.code === 'KeyX' || e.code === 'KeyZ') {
        doAttack();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      g.keys[e.code] = false;
    };

    const handleMouseDown = () => {
      doAttack();
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      doJump();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('touchstart', handleTouchStart);

    const spawnEnemy = () => {
      const type = MONSTER_TYPES[Math.floor(Math.random() * MONSTER_TYPES.length)];
      const isFlying = Math.random() < 0.3;
      const ey = isFlying ? GY - type.h - 40 - Math.random() * 60 : GY - type.h;
      g.enemies.push({
        x: W + 20, y: ey, w: type.w, h: type.h,
        frac: type.frac, hp: type.maxHp, maxHp: type.maxHp,
        color: type.color, color2: type.color2,
        speed: type.speed, pts: type.pts, flying: isFlying,
      });
    };

    const update = () => {
      g.frame++;
      g.speed = 4 + g.score / 600;

      const P = g.player;
      P.vy += 0.7;
      P.y += P.vy;
      if (P.y >= GY - P.h) { P.y = GY - P.h; P.vy = 0; P.grounded = true; P.jumps = 0; }

      if (P.attacking) { P.atkTimer--; if (P.atkTimer <= 0) P.attacking = false; }
      if (P.iframes > 0) P.iframes--;

      if (!P.grounded) P.trail.push({ x: P.x + P.w / 2, y: P.y + P.h / 2, life: 10 });
      P.trail = P.trail.filter(t => { t.life--; return t.life > 0; });

      const spawnRate = Math.max(50, 100 - Math.floor(g.score / 150));
      if (g.frame % spawnRate === 0) spawnEnemy();

      for (const e of g.enemies) {
        e.x -= g.speed * e.speed;

        for (const s of g.slashes) {
          if (s.life > 0 && rectHit(s.x, s.y, s.w, s.h, e.x, e.y, e.w, e.h)) {
            if (!e.hitThisSlash) {
              e.hp--;
              e.hitThisSlash = true;
              for (let i = 0; i < 6; i++) spawnPart(g, e.x + e.w / 2, e.y + e.h / 2, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, e.color, 18, 3);
              if (e.hp <= 0) {
                g.kills++;
                g.score += e.pts;
                for (let i = 0; i < 15; i++) spawnPart(g, e.x + e.w / 2, e.y + e.h / 2, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, e.color, 25, 2 + Math.random() * 3);
                spawnPart(g, e.x + e.w / 2, e.y, 0, -2, '#fff', 40, 0, e.frac + ' SLASHED!');
              }
            }
          }
        }

        if (e.hp > 0 && P.iframes <= 0 && rectHit(P.x + 4, P.y + 4, P.w - 8, P.h - 4, e.x + 4, e.y + 4, e.w - 8, e.h - 8)) {
          P.hp--;
          P.iframes = 45;
          if (P.hp <= 0) {
            for (let i = 0; i < 25; i++) {
              spawnPart(g, P.x + P.w / 2, P.y + P.h / 2, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12, ['#0ff', '#f0f', '#ff0'][i % 3], 35, 2 + Math.random() * 4);
            }
            setHighScore(prev => Math.max(prev, g.score));
            setDisplayScore(g.score);
            setDisplayKills(g.kills);
            setGameState('gameover');
            return;
          } else {
            for (let i = 0; i < 8; i++) spawnPart(g, P.x + P.w / 2, P.y + P.h / 2, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, '#f00', 20, 3);
          }
        }
      }

      g.enemies = g.enemies.filter(e => e.x > -80 && e.hp > 0);

      for (const s of g.slashes) s.life--;
      g.slashes = g.slashes.filter(s => s.life > 0);

      for (const p of g.particles) { p.x += p.vx; p.y += p.vy; p.life--; }
      g.particles = g.particles.filter(p => p.life > 0);

      for (const s of g.bgStars) { s.x -= s.sp; s.tw += 0.04; if (s.x < -5) s.x = W + 5; }
      for (const b of g.bgBuildings) { b.x -= g.speed * 0.3; if (b.x + b.w < -10) { b.x = W + 10; b.h = 50 + Math.random() * 120; b.w = 40 + Math.random() * 60; } }

      g.gridOffset = (g.gridOffset + g.speed * 0.5) % 30;

      if (g.frame % 5 === 0) g.score++;
      setDisplayScore(g.score);
      setDisplayKills(g.kills);
      setDisplayHp(Math.round((P.hp / P.maxHp) * 100));
    };

    const draw = () => {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#05050f'); grad.addColorStop(0.7, '#0a0a30'); grad.addColorStop(1, '#10103a');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

      for (const s of g.bgStars) {
        const a = 0.3 + 0.5 * Math.sin(s.tw);
        ctx.fillStyle = `rgba(100,200,255,${a})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      }

      for (const b of g.bgBuildings) {
        ctx.fillStyle = `hsla(${b.hue},60%,8%,0.8)`;
        ctx.fillRect(b.x, GY - b.h, b.w, b.h);
        neonGlow(ctx, `hsl(${b.hue},80%,60%)`, 4);
        ctx.fillStyle = `hsla(${b.hue},80%,60%,0.4)`;
        for (let wy = GY - b.h + 8; wy < GY - 8; wy += 14) {
          for (let wx = b.x + 6; wx < b.x + b.w - 6; wx += 10) {
            if (Math.random() > 0.3) ctx.fillRect(wx, wy, 4, 6);
          }
        }
        noGlow(ctx);
      }

      ctx.fillStyle = '#0a0a20'; ctx.fillRect(0, GY, W, H - GY);

      ctx.strokeStyle = 'rgba(0,255,255,0.12)'; ctx.lineWidth = 1;
      for (let gx = -g.gridOffset; gx < W; gx += 30) {
        ctx.beginPath(); ctx.moveTo(gx, GY); ctx.lineTo(gx, H); ctx.stroke();
      }
      for (let gy = GY; gy < H; gy += 15) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
      }

      neonGlow(ctx, '#0ff', 12);
      ctx.strokeStyle = '#0ff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, GY); ctx.lineTo(W, GY); ctx.stroke();
      noGlow(ctx);

      const P = g.player;

      for (const t of P.trail) {
        const a = t.life / 10;
        ctx.fillStyle = `rgba(0,255,255,${a * 0.25})`; ctx.beginPath(); ctx.arc(t.x, t.y, 8 * a, 0, Math.PI * 2); ctx.fill();
      }

      for (const s of g.slashes) {
        const a = s.life / 8;
        neonGlow(ctx, '#fff', 20);
        ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(s.x + s.w / 2, s.y + s.h / 2, 25, -0.8, 0.8);
        ctx.stroke();
        noGlow(ctx);
      }

      if (P.iframes > 0 && Math.floor(P.iframes / 3) % 2 === 0) {
        ctx.globalAlpha = 0.4;
      }
      drawNinja(ctx, P.x, P.y, P.w, P.h, P.attacking, !P.grounded, g.frame);
      ctx.globalAlpha = 1;

      for (const e of g.enemies) {
        if (e.hp > 0) drawMonster(ctx, e);
      }

      for (const p of g.particles) {
        const a = p.life / p.maxLife;
        ctx.globalAlpha = a;
        if (p.text) {
          ctx.fillStyle = p.color; ctx.font = 'bold 13px Orbitron, monospace'; ctx.textAlign = 'center';
          ctx.fillText(p.text, p.x, p.y);
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * a, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    const gameLoop = () => {
      update();
      draw();
      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('touchstart', handleTouchStart);
    };
  }, [gameState]);

  if (gameState === 'menu') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&display=swap" rel="stylesheet" />
        <Link to="/" className="absolute top-4 left-4 text-white/70 hover:text-white text-sm flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Games
        </Link>
        <h1 className="text-5xl font-black mb-2" style={{ color: '#0ff', textShadow: '0 0 30px #0ff, 0 0 60px #08f', letterSpacing: '3px' }}>
          FRACTION FIGHTER
        </h1>
        <p className="text-gray-500 text-sm mb-1 tracking-wider">Neon Runner</p>
        <p className="text-sm mb-8 tracking-wider" style={{ color: '#f0f', textShadow: '0 0 10px #f0f' }}>
          // SLASH THE FRACTIONS //
        </p>
        <div className="text-gray-400 mb-8 text-center text-sm tracking-wider">
          <p className="mb-2"><span style={{ color: '#0ff' }}>SPACE/UP</span> jump &bull; <span style={{ color: '#0ff' }}>DOUBLE JUMP</span> in air</p>
          <p><span style={{ color: '#0ff' }}>X / CLICK</span> slash attack</p>
        </div>
        <button
          onClick={resetGame}
          className="px-12 py-4 rounded-lg text-lg font-bold tracking-widest transition-all"
          style={{ border: '2px solid #0ff', background: 'transparent', color: '#0ff', textShadow: '0 0 10px #0ff' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#0ff'; e.currentTarget.style.color = '#050520'; e.currentTarget.style.boxShadow = '0 0 30px #0ff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0ff'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          LAUNCH
        </button>
        {highScore > 0 && (
          <p className="mt-4 text-sm" style={{ color: '#f0f', textShadow: '0 0 10px #f0f' }}>BEST: {highScore}</p>
        )}
      </div>
    );
  }

  if (gameState === 'gameover') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&display=swap" rel="stylesheet" />
        <Link to="/" className="absolute top-4 left-4 text-white/70 hover:text-white text-sm flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Games
        </Link>
        <h1 className="text-5xl font-bold mb-4 text-red-500">GAME OVER</h1>
        <p className="text-2xl mb-2" style={{ color: '#0ff', textShadow: '0 0 15px #0ff' }}>SCORE: {displayScore}</p>
        <p className="text-sm mb-2 text-gray-400">DEFEATED: {displayKills}</p>
        {displayScore >= highScore && highScore > 0 ? (
          <p className="text-sm mb-8" style={{ color: '#f0f', textShadow: '0 0 10px #f0f' }}>NEW HIGH SCORE</p>
        ) : (
          <p className="text-sm mb-8" style={{ color: '#f0f' }}>BEST: {highScore}</p>
        )}
        <button
          onClick={resetGame}
          className="px-12 py-4 rounded-lg text-lg font-bold tracking-widest transition-all"
          style={{ border: '2px solid #0ff', background: 'transparent', color: '#0ff', textShadow: '0 0 10px #0ff' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#0ff'; e.currentTarget.style.color = '#050520'; e.currentTarget.style.boxShadow = '0 0 30px #0ff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0ff'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          REBOOT
        </button>
        <button
          onClick={() => setGameState('menu')}
          className="mt-4 px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm"
        >
          Main Menu
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950">
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&display=swap" rel="stylesheet" />
      {/* HUD */}
      <div className="flex justify-between items-center w-[800px] max-w-full px-4 py-2 text-white" style={{ fontFamily: 'Orbitron, monospace', fontSize: '14px' }}>
        <div className="text-center">
          <div style={{ color: '#0ff', fontSize: '10px', letterSpacing: '2px' }}>SCORE</div>
          <div style={{ fontSize: '20px', textShadow: '0 0 10px #0ff' }}>{displayScore}</div>
        </div>
        <div className="text-center">
          <div style={{ color: '#0ff', fontSize: '10px', letterSpacing: '2px' }}>DEFEATED</div>
          <div style={{ fontSize: '20px', textShadow: '0 0 10px #0ff' }}>{displayKills}</div>
        </div>
        <div className="text-center">
          <div style={{ color: '#0ff', fontSize: '10px', letterSpacing: '2px' }}>HEALTH</div>
          <div className="w-[120px] h-2 rounded mt-1" style={{ background: '#1a1a3a', border: '1px solid rgba(0,255,255,0.2)' }}>
            <div className="h-full rounded transition-all duration-300" style={{ width: `${displayHp}%`, background: 'linear-gradient(90deg, #0f0, #0ff)' }} />
          </div>
        </div>
        <div className="text-center">
          <div style={{ color: '#0ff', fontSize: '10px', letterSpacing: '2px' }}>BEST</div>
          <div style={{ fontSize: '20px', textShadow: '0 0 10px #0ff' }}>{highScore}</div>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="block"
        style={{ borderRadius: '12px', boxShadow: '0 0 80px rgba(0,255,255,0.15), 0 0 30px rgba(0,255,255,0.1)' }}
      />
    </div>
  );
}
