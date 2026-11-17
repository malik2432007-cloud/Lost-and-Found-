import { Link } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Search className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">Lost & Found</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              A digital platform for reporting, searching, and recovering lost items on campus.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/search" className="hover:text-white transition-colors">Search Items</Link></li>
              <li><Link to="/report/lost" className="hover:text-white transition-colors">Report Lost Item</Link></li>
              <li><Link to="/report/found" className="hover:text-white transition-colors">Report Found Item</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Account</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Register</Link></li>
              <li><Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link to="/my-reports" className="hover:text-white transition-colors">My Reports</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-xs text-gray-500">
            © {year} Lost & Found Items Finder. BCA Minor Project.
          </p>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Campus — Built with React & Firebase
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
