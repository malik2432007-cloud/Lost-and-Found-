import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  Search,
  FileText,
  Bell,
  User,
  Shield,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/report/lost', icon: PlusCircle, label: 'Report Lost Item' },
  { to: '/report/found', icon: PlusCircle, label: 'Report Found Item' },
  { to: '/search', icon: Search, label: 'Browse Items' },
  { to: '/my-reports', icon: FileText, label: 'My Reports' },
  { to: '/claims', icon: ClipboardList, label: 'Claims' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const Sidebar = () => {
  const { isAdmin } = useAuth();

  return (
    <aside className="w-60 flex-shrink-0 hidden md:flex flex-col border-r border-gray-100 bg-white min-h-screen pt-6 px-3">
      <nav className="space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link ${ isActive ? 'active' : '' }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''} !text-blue-700 font-semibold`
            }
          >
            <Shield className="w-4 h-4 flex-shrink-0" /> Admin Panel
          </NavLink>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
