import { Link } from 'react-router-dom';
import {
  Search, PlusCircle, MapPin, Shield, CheckCircle,
  Users, Package, ArrowRight, Star, Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { icon: PlusCircle, title: 'Report Lost Items', description: 'Quickly report your lost belongings with photos, location, and details to help others identify them.', color: 'bg-red-100 text-red-600' },
  { icon: Search, title: 'Search & Filter', description: 'Search through all reports by category, location, date, and keywords to find matching items.', color: 'bg-blue-100 text-blue-600' },
  { icon: Bell, title: 'Smart Notifications', description: 'Get notified when someone claims your item or when a potential match is found.', color: 'bg-yellow-100 text-yellow-600' },
  { icon: Shield, title: 'Secure & Private', description: 'Your personal contact information is never exposed. Claim items through our safe messaging system.', color: 'bg-green-100 text-green-600' },
  { icon: CheckCircle, title: 'Claim System', description: 'Submit a claim with proof of ownership. Reporters review and approve genuine claims.', color: 'bg-purple-100 text-purple-600' },
  { icon: Users, title: 'Admin Oversight', description: 'Dedicated admins moderate all reports to keep the platform authentic and trustworthy.', color: 'bg-indigo-100 text-indigo-600' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Create an Account', description: 'Register with your college email to join the campus Lost & Found community.' },
  { step: '02', title: 'Report or Search', description: 'Report a lost or found item, or search through existing reports to find your belongings.' },
  { step: '03', title: 'Submit a Claim', description: 'If you spot your item, submit a claim with identifying details. The reporter will verify.' },
  { step: '04', title: 'Reunite!', description: 'Once the claim is approved, coordinate to return the item safely. Mark it as returned.' },
];

const Home = () => {
  const { currentUser } = useAuth();

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-blue-400 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-indigo-400 blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-blue-700/50 border border-blue-500/30 rounded-full px-4 py-1.5 text-sm text-blue-200 mb-6">
              <MapPin className="w-4 h-4" /> Campus Lost & Found Platform
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              Lost something?<br />
              <span className="text-blue-300">Found something?</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8 leading-relaxed">
              Report it, search for it, and help return it to its rightful owner.
              A digital platform built for our campus community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/report/lost"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
              >
                <PlusCircle className="w-5 h-5" /> Report Lost Item
              </Link>
              <Link
                to="/report/found"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors"
              >
                <Package className="w-5 h-5" /> Report Found Item
              </Link>
              <Link
                to="/search"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-colors"
              >
                <Search className="w-5 h-5" /> Browse Items
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-blue-700 py-6">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-3 gap-4 text-center text-white">
          {[
            { label: 'Items Reported', icon: '📋' },
            { label: 'Items Returned', icon: '✅' },
            { label: 'Happy Users', icon: '😊' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl mb-1">{s.icon}</p>
              <p className="text-xs text-blue-200">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How It Works</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Getting started is easy. Follow these simple steps to find your lost items or help others recover theirs.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-extrabold text-blue-100 mb-3">{step.step}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Key Features</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Everything you need to report, discover, and recover lost items on campus.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="card p-6 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-2xl mx-auto px-4 text-center text-white">
          <Star className="w-10 h-10 mx-auto mb-4 text-yellow-300" />
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-blue-100 mb-8">
            Join your campus community in the effort to reunite people with their belongings.
          </p>
          {currentUser ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
            >
              Go to Dashboard <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
              >
                Create Account <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-700 text-white font-semibold rounded-xl border border-blue-500 hover:bg-blue-800 transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
