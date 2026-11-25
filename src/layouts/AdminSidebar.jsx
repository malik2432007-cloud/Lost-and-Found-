import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Package, Shield } from 'lucide-react';

const ADMIN_NAV = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/items', icon: Package, label: 'Items' },
];

const AdminSidebar = () => (
  <aside className="w-56 flex-shrink-0 hidden md:flex flex-col border-r border-gray-100 bg-white min-h-screen pt-6 px-3">
    <div className="flex items-center gap-2 px-3 mb-6">
      <Shield className="w-5 h-5 text-blue-600" />
      <span className="font-bold text-gray-900 text-sm">Admin Panel</span>
    </div>
    <nav className="space-y-0.5">
      {ADMIN_NAV.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `sidebar-link ${ isActive ? 'active' : ''}`
          }
        >
          <Icon className="w-4 h-4 flex-shrink-0" />
          {label}
        </NavLink>
      ))}
    </nav>
  </aside>
);

export default AdminSidebar;
