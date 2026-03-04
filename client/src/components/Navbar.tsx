import { Link, useLocation } from 'react-router-dom';

const links = [
  { to: '/odds', label: 'Odds' },
  { to: '/bets', label: 'Bets' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/events/new', label: 'New Event' },
];

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-14 gap-8">
          <Link to="/odds" className="text-lg font-bold text-orange-400 tracking-tight">
            March Madness
          </Link>
          <div className="flex gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === link.to
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
