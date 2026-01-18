import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SIZE = 20;
const BULLET_SIZE = 6;
const ENEMY_SIZE = 18;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 10;
const ENEMY_SPEED = 2;

export default function Game() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('menu'); // menu, playing, gameover
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(4);
  const [weaponLevel, setWeaponLevel] = useState(1);
  const [showBestGun, setShowBestGun] = useState(false);
  const [stage, setStage] = useState(1);
  const [showStageUp, setShowStageUp] = useState(false);
  const [showBoss, setShowBoss] = useState(false);
  
  const gameRef = useRef({
    player: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
    bullets: [],
    enemies: [],
    keys: {},
    mouse: { x: 0, y: 0 },
    lastShot: 0,
    spawnTimer: 0,
    score: 0,
    lives: 4,
    invincible: 0,
    kills: 0,
    weaponLevel: 1,
    stage: 1
  });

  const resetGame = useCallback(() => {
    gameRef.current = {
      player: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
      bullets: [],
      enemies: [],
      keys: gameRef.current.keys,
      mouse: gameRef.current.mouse,
      lastShot: 0,
      spawnTimer: 0,
      score: 0,
      lives: 4,
      invincible: 0,
      kills: 0,
      weaponLevel: 1,
      stage: 1
    };
    setScore(0);
    setLives(4);
    setWeaponLevel(1);
    setShowBestGun(false);
    setStage(1);
    setShowStageUp(false);
    setShowBoss(false);
    setGameState('playing');
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;

    const handleKeyDown = (e) => {
      gameRef.current.keys[e.key.toLowerCase()] = true;
      if (e.key === ' ') {
        e.preventDefault();
        shoot();
      }
    };

    const handleKeyUp = (e) => {
      gameRef.current.keys[e.key.toLowerCase()] = false;
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      gameRef.current.mouse = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const shoot = () => {
      const game = gameRef.current;
      const now = Date.now();
      
      // Fire rate based on weapon level
      const fireRates = [150, 130, 120, 100, 80, 60, 50, 40, 35, 30];
      const fireRate = fireRates[Math.min(game.weaponLevel - 1, 9)];
      
      if (now - game.lastShot < fireRate) return;
      
      game.lastShot = now;
      const angle = Math.atan2(
        game.mouse.y - game.player.y,
        game.mouse.x - game.player.x
      );
      
      // Bullet patterns based on weapon level
      if (game.weaponLevel >= 9) {
        // Minigun - 5 bullets spread
        for (let i = -2; i <= 2; i++) {
          const spread = i * 0.15;
          game.bullets.push({
            x: game.player.x,
            y: game.player.y,
            vx: Math.cos(angle + spread) * BULLET_SPEED * 1.3,
            vy: Math.sin(angle + spread) * BULLET_SPEED * 1.3
          });
        }
      } else if (game.weaponLevel >= 7) {
        // Shotgun - 5 bullets wide spread
        for (let i = -2; i <= 2; i++) {
          const spread = i * 0.25;
          game.bullets.push({
            x: game.player.x,
            y: game.player.y,
            vx: Math.cos(angle + spread) * BULLET_SPEED,
            vy: Math.sin(angle + spread) * BULLET_SPEED
          });
        }
      } else if (game.weaponLevel >= 5) {
        // AK-47 - 3 bullets tight spread, fast
        for (let i = -1; i <= 1; i++) {
          const spread = i * 0.1;
          game.bullets.push({
            x: game.player.x,
            y: game.player.y,
            vx: Math.cos(angle + spread) * BULLET_SPEED * 1.2,
            vy: Math.sin(angle + spread) * BULLET_SPEED * 1.2
          });
        }
      } else if (game.weaponLevel >= 4) {
        // Triple shot
        for (let i = -1; i <= 1; i++) {
          const spread = i * 0.2;
          game.bullets.push({
            x: game.player.x,
            y: game.player.y,
            vx: Math.cos(angle + spread) * BULLET_SPEED,
            vy: Math.sin(angle + spread) * BULLET_SPEED
          });
        }
      } else if (game.weaponLevel >= 2) {
        // Double shot
        for (let i = -1; i <= 1; i += 2) {
          const spread = i * 0.15;
          game.bullets.push({
            x: game.player.x,
            y: game.player.y,
            vx: Math.cos(angle + spread) * BULLET_SPEED,
            vy: Math.sin(angle + spread) * BULLET_SPEED
          });
        }
      } else {
        // Single shot
        game.bullets.push({
          x: game.player.x,
          y: game.player.y,
          vx: Math.cos(angle) * BULLET_SPEED,
          vy: Math.sin(angle) * BULLET_SPEED
        });
      }
    };

    const handleClick = () => {
      shoot();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    const spawnEnemy = () => {
      const side = Math.floor(Math.random() * 4);
      let x, y;
      
      switch (side) {
        case 0: x = Math.random() * CANVAS_WIDTH; y = -ENEMY_SIZE; break;
        case 1: x = CANVAS_WIDTH + ENEMY_SIZE; y = Math.random() * CANVAS_HEIGHT; break;
        case 2: x = Math.random() * CANVAS_WIDTH; y = CANVAS_HEIGHT + ENEMY_SIZE; break;
        default: x = -ENEMY_SIZE; y = Math.random() * CANVAS_HEIGHT;
      }
      
      gameRef.current.enemies.push({ x, y, health: 3 });
    };

    const gameLoop = () => {
      const game = gameRef.current;
      
      // Move player
      if (game.keys['w'] || game.keys['arrowup']) game.player.y -= PLAYER_SPEED;
      if (game.keys['s'] || game.keys['arrowdown']) game.player.y += PLAYER_SPEED;
      if (game.keys['a'] || game.keys['arrowleft']) game.player.x -= PLAYER_SPEED;
      if (game.keys['d'] || game.keys['arrowright']) game.player.x += PLAYER_SPEED;
      
      // Clamp player position
      game.player.x = Math.max(PLAYER_SIZE, Math.min(CANVAS_WIDTH - PLAYER_SIZE, game.player.x));
      game.player.y = Math.max(PLAYER_SIZE, Math.min(CANVAS_HEIGHT - PLAYER_SIZE, game.player.y));
      
      // Move bullets
      game.bullets = game.bullets.filter(b => {
        b.x += b.vx;
        b.y += b.vy;
        return b.x > 0 && b.x < CANVAS_WIDTH && b.y > 0 && b.y < CANVAS_HEIGHT;
      });
      
      // Spawn enemies - faster spawning at higher stages
      game.spawnTimer++;
      const spawnRate = Math.max(40, 120 - (game.stage - 1) * 10);
      if (game.spawnTimer > spawnRate) {
        spawnEnemy();
        game.spawnTimer = 0;
      }
      
      // Move enemies toward player - faster at higher stages
      const enemySpeed = 2.0 + (game.stage - 1) * 0.3;
      game.enemies.forEach(e => {
        const angle = Math.atan2(game.player.y - e.y, game.player.x - e.x);
        const speed = e.isBoss ? 1.0 : enemySpeed;
        e.x += Math.cos(angle) * speed;
        e.y += Math.sin(angle) * speed;
      });
      
      // Check bullet-enemy collisions
      game.bullets = game.bullets.filter(bullet => {
        let hit = false;
        game.enemies = game.enemies.filter(enemy => {
          const enemySize = enemy.isBoss ? 40 : ENEMY_SIZE;
          const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
          if (dist < enemySize) {
            hit = true;
            enemy.health--;
            
            if (enemy.health <= 0) {
              game.score += enemy.isBoss ? 100 : 10;
              game.kills++;
              setScore(game.score);
              
              // Upgrade weapon every 5 kills (max level 10)
              const newLevel = Math.min(10, 1 + Math.floor(game.kills / 5));
              if (newLevel > game.weaponLevel) {
                game.weaponLevel = newLevel;
                setWeaponLevel(newLevel);
                
                // Show BEST GUN notification when reaching DEATH CANNON
                if (newLevel === 10) {
                  setShowBestGun(true);
                  setTimeout(() => setShowBestGun(false), 2000);
                }
              }
              
              // Upgrade stage every 15 kills
              const newStage = 1 + Math.floor(game.kills / 15);
              if (newStage > game.stage) {
                game.stage = newStage;
                setStage(newStage);
                setShowStageUp(true);
                setTimeout(() => setShowStageUp(false), 1500);
                
                // Spawn boss every 3 stages
                if (newStage % 3 === 0) {
                  setShowBoss(true);
                  setTimeout(() => setShowBoss(false), 2000);
                  
                  // Spawn boss from random side
                  const side = Math.floor(Math.random() * 4);
                  let bx, by;
                  switch (side) {
                    case 0: bx = Math.random() * CANVAS_WIDTH; by = -50; break;
                    case 1: bx = CANVAS_WIDTH + 50; by = Math.random() * CANVAS_HEIGHT; break;
                    case 2: bx = Math.random() * CANVAS_WIDTH; by = CANVAS_HEIGHT + 50; break;
                    default: bx = -50; by = Math.random() * CANVAS_HEIGHT;
                  }
                  game.enemies.push({ x: bx, y: by, health: 10, isBoss: true });
                }
              }
              
              return false;
            }
            return true;
          }
          return true;
        });
        return !hit;
      });
      
      // Check player-enemy collisions
      if (game.invincible > 0) {
        game.invincible--;
      } else {
        for (let i = game.enemies.length - 1; i >= 0; i--) {
          const enemy = game.enemies[i];
          const enemySize = enemy.isBoss ? 40 : ENEMY_SIZE;
          const dist = Math.hypot(game.player.x - enemy.x, game.player.y - enemy.y);
          if (dist < PLAYER_SIZE + enemySize - 5) {
            game.lives--;
            setLives(game.lives);
            if (!enemy.isBoss) {
              game.enemies.splice(i, 1); // Remove regular enemies that hit
            }
            game.invincible = 90; // 1.5 seconds of invincibility at 60fps
            
            if (game.lives <= 0) {
              setHighScore(prev => Math.max(prev, game.score));
              setGameState('gameover');
              return;
            }
            break;
          }
        }
      }
      
      // Draw forest background
      // Sky/clearing gradient
      const gradient = ctx.createRadialGradient(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 0, CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 400);
      gradient.addColorStop(0, '#2d5a27');
      gradient.addColorStop(1, '#1a3d15');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Draw grass texture
      ctx.fillStyle = '#1e4d1a';
      for (let i = 0; i < 200; i++) {
        const gx = (i * 47) % CANVAS_WIDTH;
        const gy = (i * 31) % CANVAS_HEIGHT;
        ctx.fillRect(gx, gy, 3, 8);
      }
      
      // Draw darker grass patches
      ctx.fillStyle = '#163d12';
      for (let i = 0; i < 100; i++) {
        const gx = (i * 73) % CANVAS_WIDTH;
        const gy = (i * 59) % CANVAS_HEIGHT;
        ctx.beginPath();
        ctx.ellipse(gx, gy, 15, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw bushes around the edges
      const drawBush = (x, y, size) => {
        ctx.fillStyle = '#2d6b28';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3d8b38';
        ctx.beginPath();
        ctx.arc(x - size/3, y - size/3, size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4a9a45';
        ctx.beginPath();
        ctx.arc(x + size/4, y - size/4, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
      };
      
      // Bushes around edges
      for (let i = 0; i < 15; i++) {
        drawBush((i * 60) % CANVAS_WIDTH, 15 + (i % 3) * 10, 20 + (i % 4) * 5);
        drawBush((i * 55 + 30) % CANVAS_WIDTH, CANVAS_HEIGHT - 15 - (i % 3) * 10, 20 + (i % 4) * 5);
      }
      for (let i = 0; i < 10; i++) {
        drawBush(15 + (i % 3) * 10, (i * 70) % CANVAS_HEIGHT, 18 + (i % 4) * 5);
        drawBush(CANVAS_WIDTH - 15 - (i % 3) * 10, (i * 65 + 30) % CANVAS_HEIGHT, 18 + (i % 4) * 5);
      }
      
      // Draw trees around the edges
      const drawTree = (x, y) => {
        // Trunk
        ctx.fillStyle = '#4a3728';
        ctx.fillRect(x - 8, y, 16, 40);
        ctx.fillStyle = '#5c4633';
        ctx.fillRect(x - 6, y + 5, 4, 30);
        
        // Foliage layers
        ctx.fillStyle = '#1a5c14';
        ctx.beginPath();
        ctx.moveTo(x, y - 60);
        ctx.lineTo(x + 40, y + 10);
        ctx.lineTo(x - 40, y + 10);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#228b22';
        ctx.beginPath();
        ctx.moveTo(x, y - 45);
        ctx.lineTo(x + 35, y + 5);
        ctx.lineTo(x - 35, y + 5);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#2ca02c';
        ctx.beginPath();
        ctx.moveTo(x, y - 30);
        ctx.lineTo(x + 28, y);
        ctx.lineTo(x - 28, y);
        ctx.closePath();
        ctx.fill();
      };
      
      // Trees along edges
      drawTree(40, 80);
      drawTree(120, 60);
      drawTree(CANVAS_WIDTH - 50, 70);
      drawTree(CANVAS_WIDTH - 130, 55);
      drawTree(50, CANVAS_HEIGHT - 30);
      drawTree(140, CANVAS_HEIGHT - 40);
      drawTree(CANVAS_WIDTH - 60, CANVAS_HEIGHT - 35);
      drawTree(CANVAS_WIDTH - 150, CANVAS_HEIGHT - 45);
      
      // Some flowers/details
      const colors = ['#ff6b6b', '#ffd93d', '#fff', '#ff9ff3'];
      for (let i = 0; i < 30; i++) {
        const fx = 100 + (i * 67) % (CANVAS_WIDTH - 200);
        const fy = 100 + (i * 43) % (CANVAS_HEIGHT - 200);
        ctx.fillStyle = colors[i % 4];
        ctx.beginPath();
        ctx.arc(fx, fy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Fallen leaves
      ctx.fillStyle = '#8B4513';
      for (let i = 0; i < 20; i++) {
        const lx = (i * 97) % CANVAS_WIDTH;
        const ly = (i * 71) % CANVAS_HEIGHT;
        ctx.beginPath();
        ctx.ellipse(lx, ly, 4, 2, (i * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw player tank (blink when invincible)
      if (game.invincible === 0 || Math.floor(game.invincible / 5) % 2 === 0) {
        const angle = Math.atan2(game.mouse.y - game.player.y, game.mouse.x - game.player.x);
        
        ctx.save();
        ctx.translate(game.player.x, game.player.y);
        
        // Tank body (doesn't rotate)
        ctx.fillStyle = game.invincible > 0 ? '#6b8e5a' : '#4a6b3a';
        ctx.fillRect(-18, -12, 36, 24);
        
        // Tank tracks
        ctx.fillStyle = '#2d2d2d';
        ctx.fillRect(-20, -14, 40, 5);
        ctx.fillRect(-20, 9, 40, 5);
        
        // Track details
        ctx.fillStyle = '#3d3d3d';
        for (let i = -18; i < 20; i += 6) {
          ctx.fillRect(i, -14, 3, 5);
          ctx.fillRect(i, 9, 3, 5);
        }
        
        // Turret base
        ctx.fillStyle = game.invincible > 0 ? '#7a9e6a' : '#5a7b4a';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Rotating turret and barrel
        ctx.rotate(angle);
        
        // Tank barrel
        ctx.fillStyle = game.invincible > 0 ? '#5a7b4a' : '#3a5b2a';
        ctx.fillRect(5, -3, 28, 6);
        
        // Barrel tip
        ctx.fillStyle = '#2a4a1a';
        ctx.fillRect(30, -4, 6, 8);
        
        // Barrel detail
        ctx.fillStyle = '#4a6b3a';
        ctx.fillRect(8, -2, 3, 4);
        ctx.fillRect(16, -2, 3, 4);
        
        ctx.restore();
      }
      
      // Draw bullets
      ctx.fillStyle = '#fbbf24';
      game.bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, BULLET_SIZE, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Draw enemies with health indicator
      game.enemies.forEach(e => {
        const size = e.isBoss ? 40 : ENEMY_SIZE;
        
        if (e.isBoss) {
          // Boss appearance - darker purple/magenta
          ctx.fillStyle = '#8b008b';
          ctx.beginPath();
          ctx.arc(e.x, e.y, size, 0, Math.PI * 2);
          ctx.fill();
          
          // Boss inner circle
          ctx.fillStyle = '#4b0082';
          ctx.beginPath();
          ctx.arc(e.x, e.y, size * 0.7, 0, Math.PI * 2);
          ctx.fill();
          
          // Boss eye
          ctx.fillStyle = '#ff0000';
          ctx.beginPath();
          ctx.arc(e.x, e.y, size * 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#000';
          ctx.beginPath();
          ctx.arc(e.x, e.y, size * 0.15, 0, Math.PI * 2);
          ctx.fill();
          
          // Boss health bar
          ctx.fillStyle = '#000';
          ctx.fillRect(e.x - 30, e.y - size - 12, 60, 8);
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(e.x - 28, e.y - size - 10, (e.health / 10) * 56, 4);
        } else {
          // Regular enemy
          const healthColors = ['#ff2222', '#ff6644', '#ef4444'];
          ctx.fillStyle = healthColors[Math.min(e.health - 1, 2)];
          ctx.beginPath();
          ctx.arc(e.x, e.y, size, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw health pips
          ctx.fillStyle = '#000';
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(e.x - 8 + i * 8, e.y - size - 6, 3, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#4ade80';
          for (let i = 0; i < e.health; i++) {
            ctx.beginPath();
            ctx.arc(e.x - 8 + i * 8, e.y - size - 6, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });
      
      // Draw score and lives
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(`Score: ${game.score}`, 20, 40);
      
      // Draw weapon level
      const weaponNames = ['Pistol', 'Dual Shot', 'Fast Dual', 'Triple Shot', 'AK-47', 'Fast AK', 'Shotgun', 'Auto Shotgun', 'Minigun', 'DEATH CANNON'];
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(`Gun: ${weaponNames[game.weaponLevel - 1]}`, 20, 70);
      
      // Draw stage
      ctx.fillStyle = '#60a5fa';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(`Stage: ${game.stage}`, 20, 95);
      
      // Draw lives as hearts
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 28px monospace';
      let heartsText = '';
      for (let i = 0; i < game.lives; i++) {
        heartsText += '♥ ';
      }
      ctx.fillText(heartsText, CANVAS_WIDTH - 150, 40);
      
      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [gameState]);

  if (gameState === 'menu') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <Link to="/" className="absolute top-4 left-4 text-white/70 hover:text-white text-sm flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Games
        </Link>
        {/* AK-47 Drawing */}
        <svg width="400" height="120" viewBox="0 0 400 120" className="mb-4">
          {/* Gun body - receiver */}
          <rect x="80" y="45" width="180" height="30" fill="#2d2d2d" rx="2"/>
          <rect x="80" y="45" width="180" height="8" fill="#3d3d3d"/>
          
          {/* Barrel */}
          <rect x="260" y="50" width="120" height="12" fill="#1a1a1a"/>
          <rect x="260" y="50" width="120" height="4" fill="#2a2a2a"/>
          {/* Muzzle brake */}
          <rect x="370" y="47" width="25" height="18" fill="#1a1a1a" rx="1"/>
          <rect x="375" y="50" width="3" height="12" fill="#0a0a0a"/>
          <rect x="382" y="50" width="3" height="12" fill="#0a0a0a"/>
          <rect x="389" y="50" width="3" height="12" fill="#0a0a0a"/>
          
          {/* Gas tube */}
          <rect x="180" y="38" width="100" height="8" fill="#4a4a4a"/>
          <rect x="180" y="38" width="100" height="3" fill="#5a5a5a"/>
          
          {/* Front sight */}
          <rect x="350" y="35" width="6" height="15" fill="#1a1a1a"/>
          <rect x="351" y="32" width="4" height="5" fill="#1a1a1a"/>
          
          {/* Rear sight */}
          <rect x="200" y="38" width="15" height="8" fill="#2a2a2a"/>
          
          {/* Magazine - curved AK style */}
          <path d="M140 75 L160 75 L165 115 Q163 120 155 120 L145 120 Q137 120 135 115 Z" fill="#2d2d2d"/>
          <path d="M142 75 L158 75 L162 110 L148 110 Z" fill="#3d3d3d"/>
          
          {/* Trigger guard */}
          <path d="M165 68 Q165 85 175 85 L185 85 Q195 85 195 68" fill="none" stroke="#2d2d2d" strokeWidth="4"/>
          
          {/* Trigger */}
          <rect x="177" y="70" width="4" height="12" fill="#1a1a1a" rx="1"/>
          
          {/* Pistol grip */}
          <path d="M195 68 L200 68 L205 105 Q205 115 195 115 L185 115 Q180 115 182 105 L190 68 Z" fill="#5c3d2e"/>
          <path d="M192 72 L198 72 L202 100 L188 100 Z" fill="#6d4c3d"/>
          {/* Grip texture lines */}
          <line x1="190" y1="78" x2="200" y2="78" stroke="#4a3020" strokeWidth="1"/>
          <line x1="189" y1="84" x2="201" y2="84" stroke="#4a3020" strokeWidth="1"/>
          <line x1="188" y1="90" x2="202" y2="90" stroke="#4a3020" strokeWidth="1"/>
          <line x1="187" y1="96" x2="203" y2="96" stroke="#4a3020" strokeWidth="1"/>
          
          {/* Wooden stock */}
          <path d="M30 42 L80 42 L80 78 L30 78 Q5 60 30 42" fill="#6d4c3d"/>
          <path d="M35 45 L78 45 L78 75 L35 75 Q15 60 35 45" fill="#7d5c4d"/>
          {/* Stock texture */}
          <line x1="40" y1="50" x2="40" y2="70" stroke="#5c3d2e" strokeWidth="1"/>
          <line x1="50" y1="48" x2="50" y2="72" stroke="#5c3d2e" strokeWidth="1"/>
          <line x1="60" y1="46" x2="60" y2="74" stroke="#5c3d2e" strokeWidth="1"/>
          
          {/* Wooden handguard */}
          <rect x="100" y="40" width="70" height="6" fill="#6d4c3d" rx="2"/>
          <rect x="100" y="40" width="70" height="3" fill="#7d5c4d" rx="2"/>
          
          {/* Selector switch */}
          <circle cx="215" cy="55" r="4" fill="#3d3d3d"/>
          <rect x="213" y="52" width="4" height="10" fill="#2d2d2d"/>
          
          {/* Dust cover ridges */}
          <line x1="90" y1="48" x2="90" y2="52" stroke="#4d4d4d" strokeWidth="2"/>
          <line x1="110" y1="48" x2="110" y2="52" stroke="#4d4d4d" strokeWidth="2"/>
          <line x1="130" y1="48" x2="130" y2="52" stroke="#4d4d4d" strokeWidth="2"/>
          
          {/* Shine/highlight */}
          <rect x="85" y="47" width="170" height="2" fill="#4a4a4a" opacity="0.5"/>
        </svg>
        
        {/* Tank Warfare Sign */}
        <div className="relative mb-6">
          <div className="bg-yellow-500 border-4 border-yellow-700 px-8 py-3 transform -rotate-2 shadow-lg">
            <div className="bg-yellow-400 border-2 border-yellow-600 px-4 py-2">
              <span className="text-black font-black text-3xl tracking-wider" style={{textShadow: '2px 2px 0 #b45309'}}>
                ⚠️ TANK WARFARE ⚠️
              </span>
            </div>
          </div>
          {/* Sign post */}
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-3 h-8 bg-gray-600"></div>
        </div>
        
        <h1 className="text-5xl font-bold mb-4 text-green-400">SURVIVE</h1>
        <p className="text-gray-400 mb-8">A simple survival shooter</p>
        <div className="text-gray-300 mb-8 text-center">
          <p className="mb-2">WASD or Arrow Keys to move</p>
          <p className="mb-2">Mouse to aim</p>
          <p>Click or Spacebar to shoot</p>
        </div>
        <button
          onClick={resetGame}
          className="px-8 py-4 bg-green-500 hover:bg-green-600 text-black font-bold text-xl rounded-lg transition-colors"
        >
          START GAME
        </button>
        {highScore > 0 && (
          <p className="mt-4 text-yellow-400">High Score: {highScore}</p>
        )}
      </div>
    );
  }

  if (gameState === 'gameover') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <Link to="/" className="absolute top-4 left-4 text-white/70 hover:text-white text-sm flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Games
        </Link>
        <h1 className="text-5xl font-bold mb-4 text-red-500">GAME OVER</h1>
        <p className="text-3xl mb-2">Score: {score}</p>
        <p className="text-yellow-400 mb-8">High Score: {highScore}</p>
        <button
          onClick={resetGame}
          className="px-8 py-4 bg-green-500 hover:bg-green-600 text-black font-bold text-xl rounded-lg transition-colors"
        >
          PLAY AGAIN
        </button>
        <button
          onClick={() => setGameState('menu')}
          className="mt-4 px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Main Menu
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 relative">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-gray-700 cursor-crosshair"
      />
      
      {/* BEST GUN notification */}
      {showBestGun && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400 p-2 rounded-lg animate-pulse shadow-2xl">
            <div className="bg-black px-12 py-6 rounded">
              <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-red-400 to-yellow-300" style={{textShadow: '0 0 20px #fbbf24, 0 0 40px #ef4444'}}>
                🔥 BEST GUN 🔥
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Stage Up notification */}
      {showStageUp && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-gradient-to-r from-blue-400 via-purple-500 to-blue-400 p-2 rounded-lg animate-pulse shadow-2xl">
            <div className="bg-black px-12 py-6 rounded">
              <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-400 to-blue-300" style={{textShadow: '0 0 20px #60a5fa, 0 0 40px #a855f7'}}>
                ⚔️ STAGE {stage} ⚔️
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Boss notification */}
      {showBoss && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-gradient-to-r from-red-600 via-purple-700 to-red-600 p-2 rounded-lg animate-pulse shadow-2xl">
            <div className="bg-black px-12 py-6 rounded">
              <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-purple-500 to-red-400" style={{textShadow: '0 0 20px #dc2626, 0 0 40px #7c3aed'}}>
                💀 BOSS INCOMING 💀
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
