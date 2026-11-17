import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div className="text-center">
      <p className="text-8xl font-extrabold text-blue-200 mb-4">404</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
      <p className="text-gray-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
      <div className="flex gap-4 justify-center">
        <Link to="/" className="btn-primary"><Home className="w-4 h-4" /> Go Home</Link>
        <Link to="/search" className="btn-secondary"><Search className="w-4 h-4" /> Browse Items</Link>
      </div>
    </div>
  </div>
);

export default NotFound;
