import { Link, Outlet, useLocation } from 'react-router-dom';
import charactersData from '@/data/characters.json';

const characters = Object.values(charactersData);

const navLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/runewords', label: 'Runewords' },
  { to: '/stash', label: 'Stash' },
  { to: '/recommendations', label: 'Recommendations' },
];

export function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <Link to="/" className="text-xl font-bold text-foreground hover:text-primary/80">
              D2R S13 Build Guide
            </Link>
            <span className="text-xs text-muted-foreground">Season 13 — Rise of the Warlock</span>
          </div>
          <nav className="flex flex-wrap gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  location.pathname === link.to
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <span className="border-l border-border mx-2" />
            {characters.map(char => (
              <Link
                key={char.id}
                to={`/character/${char.id}`}
                className={`px-2 py-1.5 rounded-md text-sm transition-colors ${
                  location.pathname === `/character/${char.id}`
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                {char.name}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        <Outlet />
      </main>
      <footer className="border-t border-border py-3 text-center text-xs text-muted-foreground">
        D2R Season 13 — Rise of the Warlock | Build Guide
      </footer>
    </div>
  );
}
