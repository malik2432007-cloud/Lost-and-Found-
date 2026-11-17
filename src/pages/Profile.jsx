import { useState } from 'react';
import { User, Mail, Phone, Save, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../firebase/firestoreService';
import { formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

const Profile = () => {
  const { userProfile, refreshProfile } = useAuth();
  const [form, setForm] = useState({ name: userProfile?.name || '', phone: userProfile?.phone || '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || form.name.length < 2) {
      toast.error('Full name must be at least 2 characters.');
      return;
    }
    setLoading(true);
    try {
      await updateUserProfile(userProfile.uid, { name: form.name.trim(), phone: form.phone.trim() });
      await refreshProfile();
      toast.success('Profile updated successfully!');
    } catch {
      toast.error('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your account information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Avatar card */}
        <div className="card p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl font-bold text-white">
              {userProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <h2 className="font-semibold text-gray-900">{userProfile?.name}</h2>
          <p className="text-sm text-gray-400 mt-1">{userProfile?.role === 'admin' ? '🛡 Administrator' : 'User'}</p>
          <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-center gap-1">
            <Calendar className="w-3 h-3" />
            Joined {formatDate(userProfile?.createdAt)}
          </div>
        </div>

        {/* Edit form */}
        <div className="card p-6 md:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-5">Edit Information</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="prof-name" className="form-label">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="prof-name"
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input-field pl-9"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="email" value={userProfile?.email || ''} disabled className="input-field pl-9 bg-gray-50 text-gray-400 cursor-not-allowed" />
              </div>
              <p className="form-hint">Email cannot be changed.</p>
            </div>
            <div className="form-group">
              <label htmlFor="prof-phone" className="form-label">Phone Number <span className="text-gray-400 font-normal">(optional)</span></label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="prof-phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="input-field pl-9"
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
