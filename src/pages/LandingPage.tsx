import { Link } from 'react-router-dom';

type Game = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  gradient: string;
  path: string;
  status: 'playable' | 'coming-soon';
};

const games: Game[] = [
  {
    id: 'space-invaders',
    title: 'Space Invaders',
    description: '50 waves of alien mayhem! Defeat 5 epic bosses, collect power-ups, and upgrade your ship.',
    emoji: '🚀',
    gradient: 'from-purple-600 via-pink-500 to-red-500',
    path: '/space-invaders',
    status: 'playable',
  },
  {
    id: 'tank-warfare',
    title: 'Tank Warfare',
    description: 'Survive endless waves of enemies! Upgrade your weapons from pistol to DEATH CANNON.',
    emoji: '🪖',
    gradient: 'from-green-600 via-emerald-500 to-lime-500',
    path: '/tank-warfare',
    status: 'playable',
  },
  {
    id: 'snake',
    title: 'Snake',
    description: 'Classic snake game with modern twists. Eat, grow, and survive!',
    emoji: '🐍',
    gradient: 'from-green-500 via-emerald-500 to-teal-500',
    path: '/snake',
    status: 'coming-soon',
  },
  {
    id: 'tetris',
    title: 'Tetris',
    description: 'Stack blocks, clear lines, and chase high scores in this timeless puzzle.',
    emoji: '🧱',
    gradient: 'from-blue-500 via-cyan-500 to-sky-500',
    path: '/tetris',
    status: 'coming-soon',
  },
  {
    id: 'pong',
    title: 'Pong',
    description: 'The original arcade classic. Challenge a friend or play against AI.',
    emoji: '🏓',
    gradient: 'from-yellow-500 via-orange-500 to-amber-500',
    path: '/pong',
    status: 'coming-soon',
  },
  {
    id: 'breakout',
    title: 'Breakout',
    description: 'Smash bricks with a bouncing ball. Power-ups and multiple levels!',
    emoji: '🧨',
    gradient: 'from-red-500 via-rose-500 to-pink-500',
    path: '/breakout',
    status: 'coming-soon',
  },
  {
    id: 'flappy',
    title: 'Flappy Bird',
    description: 'Tap to fly through pipes. Simple but addictive!',
    emoji: '🐦',
    gradient: 'from-sky-400 via-blue-400 to-indigo-500',
    path: '/flappy',
    status: 'coming-soon',
  },
];

function GameCard({ game }: { game: Game }) {
  const isPlayable = game.status === 'playable';

  const cardContent = (
    <div
      className={`relative group overflow-hidden rounded-2xl bg-gradient-to-br ${game.gradient} p-1 transition-all duration-300 ${
        isPlayable ? 'hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 cursor-pointer' : 'opacity-60'
      }`}
    >
      <div className="relative bg-gray-900 rounded-xl p-6 h-full min-h-[220px] flex flex-col">
        {/* Emoji background */}
        <div className="absolute top-4 right-4 text-6xl opacity-20 group-hover:opacity-30 transition-opacity">
          {game.emoji}
        </div>

        {/* Status badge */}
        {!isPlayable && (
          <div className="absolute top-3 left-3 bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded-full">
            Coming Soon
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col">
          <div className="text-4xl mb-3">{game.emoji}</div>
          <h3 className="text-xl font-bold text-white mb-2">{game.title}</h3>
          <p className="text-gray-400 text-sm flex-1">{game.description}</p>

          {/* Play button */}
          {isPlayable && (
            <div className="mt-4">
              <span className={`inline-flex items-center gap-2 bg-gradient-to-r ${game.gradient} text-white font-bold px-4 py-2 rounded-lg text-sm group-hover:shadow-lg transition-all`}>
                Play Now
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isPlayable) {
    return <Link to={game.path}>{cardContent}</Link>;
  }

  return cardContent;
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-950 to-pink-900/20" />
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full animate-pulse"
              style={{
                width: Math.random() * 3 + 1,
                height: Math.random() * 3 + 1,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5 + 0.1,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${Math.random() * 3 + 2}s`,
              }}
            />
          ))}
        </div>

        {/* Hero content */}
        <div className="relative z-10 px-4 py-20 sm:py-32 text-center">
          <h1 className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 mb-6">
            ATKOMI GAMES
          </h1>
          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-8">
            Classic arcade games reimagined for the modern web. Play instantly in your browser!
          </p>
          <div className="flex justify-center gap-4 text-4xl">
            <span className="animate-bounce" style={{ animationDelay: '0s' }}>🎮</span>
            <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>👾</span>
            <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>🕹️</span>
            <span className="animate-bounce" style={{ animationDelay: '0.3s' }}>🎯</span>
            <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>🏆</span>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="relative z-10 px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8 text-center">
            Choose Your Game
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 text-center text-gray-500 text-sm">
        <p>Built with React + TypeScript + Tailwind CSS</p>
        <p className="mt-2">Made with ❤️ by Atkomi</p>
      </footer>
    </div>
  );
}
