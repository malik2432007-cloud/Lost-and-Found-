import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import AdminSidebar from './AdminSidebar';

const AdminLayout = () => (
  <div className="min-h-screen bg-gray-50">
    <Navbar />
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  </div>
);

export default AdminLayout;
