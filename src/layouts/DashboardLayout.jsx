import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const DashboardLayout = () => (
  <div className="min-h-screen bg-gray-50">
    <Navbar />
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 max-w-5xl">
        <Outlet />
      </main>
    </div>
  </div>
);

export default DashboardLayout;
