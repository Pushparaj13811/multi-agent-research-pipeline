import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { Plus, History, Settings as SettingsIcon, LogOut, Loader2 } from 'lucide-react';
import { useAuthStore } from './store/authStore';

// Lazy-loaded pages
const Home = lazy(() => import('./pages/Home'));
const Research = lazy(() => import('./pages/Research'));
const RunHistory = lazy(() => import('./pages/RunHistory'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));

function NavItem({ to, icon: Icon, label }: { to: string; icon: typeof Plus; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          isActive
            ? 'bg-indigo-500/10 text-indigo-400'
            : 'text-gray-400 hover:text-white hover:bg-gray-800'
        }`
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, logout, token } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <nav className="sticky top-0 z-50 border-b border-gray-800/50 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white">
              Research<span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Agent</span>
            </span>
          </NavLink>
          {token && (
            <div className="flex items-center gap-1">
              <NavItem to="/" icon={Plus} label="New" />
              <NavItem to="/history" icon={History} label="History" />
              <NavItem to="/settings" icon={SettingsIcon} label="Settings" />
              <div className="ml-3 pl-3 border-l border-gray-800 flex items-center gap-2">
                <NavLink
                  to="/settings"
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-800/50 transition-all"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                    {(user?.full_name || user?.email || '?')[0].toUpperCase()}
                  </div>
                  <span className="text-xs text-gray-400 max-w-[120px] truncate">{user?.full_name || user?.email}</span>
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
      <main className="px-6 py-8">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<AuthGuard><Home /></AuthGuard>} />
            <Route path="/research/:runId" element={<AuthGuard><Research /></AuthGuard>} />
            <Route path="/history" element={<AuthGuard><RunHistory /></AuthGuard>} />
            <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
