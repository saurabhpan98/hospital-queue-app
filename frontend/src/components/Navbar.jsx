import { Link, useNavigate } from 'react-router-dom';
import { Activity, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const roleHome = {
  admin: '/admin',
  owner: '/owner',
  doctor: '/doctor',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white shadow-soft">
            <Activity size={18} />
          </span>
          <span className="text-lg font-bold text-ink-900">MediQueue</span>
        </Link>

        <nav className="flex items-center gap-3">
          {!user && (
            <>
              <Link to="/" className="px-3 py-2 text-sm font-medium text-ink-600 hover:text-ink-900">
                Find a Hospital
              </Link>
              <Link to="/login" className="btn-secondary !px-4 !py-2">
                Login
              </Link>
              <Link to="/register" className="btn-primary !px-4 !py-2">
                Join as Owner / Doctor
              </Link>
            </>
          )}

          {user && (
            <>
              <Link to={roleHome[user.role]} className="px-3 py-2 text-sm font-medium text-ink-600 hover:text-ink-900">
                Dashboard
              </Link>
              <NotificationBell />
              <span className="badge bg-ink-100 text-ink-600 capitalize">{user.role}</span>
              <button onClick={handleLogout} className="btn-secondary !px-4 !py-2">
                <LogOut size={15} /> Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
