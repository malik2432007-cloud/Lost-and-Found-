import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout    from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout     from './layouts/AdminLayout';

// Guards
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute     from './components/AdminRoute';

// Public pages
import Home           from './pages/Home';
import Login          from './pages/Login';
import Register       from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import NotFound       from './pages/NotFound';
import SearchItems    from './pages/SearchItems';
import ItemDetails    from './pages/ItemDetails';

// Protected user pages
import Dashboard      from './pages/Dashboard';
import ReportLost     from './pages/ReportLost';
import ReportFound    from './pages/ReportFound';
import MyReports      from './pages/MyReports';
import Claims         from './pages/Claims';
import Notifications  from './pages/Notifications';
import Profile        from './pages/Profile';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers     from './pages/admin/AdminUsers';

const App = () => {
  console.log('✅ App component rendered');
  return (
    <Routes>

      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/"                element={<Home />} />
        <Route path="/login"           element={<Login />} />
        <Route path="/register"        element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/search"          element={<SearchItems />} />
        <Route path="/item/:id"        element={<ItemDetails />} />
      </Route>

      {/* Protected user routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard"     element={<Dashboard />} />
          <Route path="/report/lost"   element={<ReportLost />} />
          <Route path="/report/found"  element={<ReportFound />} />
          <Route path="/my-reports"    element={<MyReports />} />
          <Route path="/claims"        element={<Claims />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile"       element={<Profile />} />
        </Route>
      </Route>

      {/* Admin routes */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin"           element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users"     element={<AdminUsers />} />
          <Route path="/admin/items"     element={<AdminDashboard />} />
          <Route path="/admin/claims"    element={<AdminDashboard />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
