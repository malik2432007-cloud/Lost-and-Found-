import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search, Menu, X, LogOut, User, LayoutDashboard, Shield,
  FileText, Bell, ClipboardList, AlertCircle, Package, Home
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../firebase/authService';
import NotificationBell from '../components/NotificationBell';
import toast from 'react-hot-toast';

const Navbar = ({ hideNavLinks = false }) => {
  const { currentUser, userProfile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const shouldShowNavLinks = !hideNavLinks && !currentUser;

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/');
      toast.success('Logged out successfully');
    } catch {
      toast.error('Failed to logout');
    }
  };

  const navLinks = [
    { to: '/search', label: 'Browse Items' },
    { to: '/report/lost', label: 'Report Lost' },
    { to: '/report/found', label: 'Report Found' },
  ];

  // Mobile menu links — full list for authenticated users
  const mobileAuthLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/search', icon: Search, label: 'Browse Items' },
    { to: '/report/lost', icon: AlertCircle, label: 'Report Lost Item' },
    { to: '/report/found', icon: Package, label: 'Report Found Item' },
    { to: '/my-reports', icon: FileText, label: 'My Reports' },
    { to: '/claims', icon: ClipboardList, label: 'Claims' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={currentUser ? '/dashboard' : '/'} className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Search className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 hidden sm:block">Lost & Found</span>
          </Link>

          {/* Desktop Nav - hidden on dashboard / for authenticated users */}
          {shouldShowNavLinks && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    location.pathname === link.to
                      ? 'text-blue-700 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2">
            {currentUser ? (
              <>
                <NotificationBell />
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    aria-label="User menu"
                  >
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                      {userProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden sm:block">
                      {userProfile?.name?.split(' ')[0] || 'User'}
                    </span>
                  </button>

                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                      <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-40 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                          <p className="text-sm font-semibold text-gray-900 truncate">{userProfile?.name}</p>
                          <p className="text-xs text-gray-400 truncate">{userProfile?.email}</p>
                        </div>
                        <Link to="/dashboard" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                          <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </Link>
                        <Link to="/my-reports" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                          <FileText className="w-4 h-4" /> My Reports
                        </Link>
                        <Link to="/notifications" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                          <Bell className="w-4 h-4" /> Notifications
                        </Link>
                        <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                          <User className="w-4 h-4" /> Profile
                        </Link>
                        {isAdmin && (
                          <Link to="/admin" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50">
                            <Shield className="w-4 h-4" /> Admin Panel
                          </Link>
                        )}
                        <div className="border-t border-gray-100">
                          <button
                            onClick={() => { setProfileOpen(false); handleLogout(); }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                          >
                            <LogOut className="w-4 h-4" /> Logout
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary text-sm">Login</Link>
                <Link to="/register" className="btn-primary text-sm">Register</Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {currentUser ? (
            <>
              {mobileAuthLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    location.pathname === link.to
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 rounded-lg"
                >
                  <Shield className="w-4 h-4" /> Admin Panel
                </Link>
              )}
              <div className="border-t border-gray-100 pt-2 mt-2">
                <button
                  onClick={() => { setMobileOpen(false); handleLogout(); }}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg w-full"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </>
          ) : (
            <>
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex gap-2 pt-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-secondary text-sm flex-1 justify-center">Login</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary text-sm flex-1 justify-center">Register</Link>
              </div>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
