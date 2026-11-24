import { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, Save, Calendar, Camera, Upload, Trash2 } from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../firebase/firestoreService';
import { uploadAvatarImage } from '../firebase/storageService';
import { formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

const Profile = () => {
  // ✅ FIX: Use currentUser.uid (from Firebase Auth — always reliable) instead of userProfile?.uid
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    name: userProfile?.name || '',
    phone: userProfile?.phone || '',
  });
  const [avatarPreview, setAvatarPreview] = useState(userProfile?.photoURL || currentUser?.photoURL || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Sync state if userProfile finishes loading or updates
  useEffect(() => {
    if (userProfile) {
      setForm({
        name: userProfile.name || '',
        phone: userProfile.phone || '',
      });
      if (userProfile.photoURL) {
        setAvatarPreview(userProfile.photoURL);
      }
    }
  }, [userProfile]);

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Please select a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB.');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || form.name.trim().length < 2) {
      toast.error('Full name must be at least 2 characters.');
      return;
    }
    if (!currentUser?.uid) {
      toast.error('You must be logged in to update your profile.');
      return;
    }

    setLoading(true);
    try {
      let photoURL = userProfile?.photoURL || currentUser?.photoURL || '';

      // Upload avatar if a new image file was chosen
      if (avatarFile) {
        try {
          photoURL = await uploadAvatarImage(avatarFile, currentUser.uid);
        } catch (imgErr) {
          console.warn('Avatar upload warning:', imgErr);
          toast.error('Could not upload photo, but updating other profile details.');
        }
      }

      // 1. Update Firestore user document
      await updateUserProfile(currentUser.uid, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        ...(photoURL ? { photoURL } : {}),
      });

      // 2. Also sync Firebase Auth profile (displayName, photoURL)
      if (auth.currentUser) {
        try {
          await updateProfile(auth.currentUser, {
            displayName: form.name.trim(),
            ...(photoURL ? { photoURL } : {}),
          });
        } catch (authErr) {
          console.warn('Auth update warning (non-fatal):', authErr);
        }
      }

      await refreshProfile();
      setAvatarFile(null);
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Profile update error:', err);
      if (err?.code === 'permission-denied') {
        toast.error('Permission denied. Please ensure you are logged in.');
      } else if (err?.code === 'not-found') {
        toast.error('Profile document not found. Please contact support.');
      } else {
        toast.error(`Failed to update profile: ${err?.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your account information and preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Avatar card */}
        <div className="card p-6 text-center">
          <div className="relative w-24 h-24 rounded-full mx-auto mb-3 overflow-hidden border-2 border-blue-100 shadow-sm bg-blue-600 flex items-center justify-center group">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-white">
                {userProfile?.name?.charAt(0)?.toUpperCase() || currentUser?.email?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Change Profile Picture"
            >
              <Camera className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-medium">Change</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 mb-2"
          >
            <Camera className="w-3.5 h-3.5" /> Change Photo
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleAvatarSelect}
            className="hidden"
          />

          <h2 className="font-semibold text-gray-900 mt-2">{userProfile?.name || form.name || 'User'}</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {userProfile?.role === 'admin' ? '🛡 Administrator' : '👤 Student / Staff Member'}
          </p>
          <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-center gap-1">
            <Calendar className="w-3 h-3" />
            Joined {formatDate(userProfile?.createdAt)}
          </div>
          <div className="mt-2 text-[11px] text-gray-400 font-mono break-all bg-gray-50 p-1.5 rounded">
            UID: {currentUser?.uid?.slice(0, 16)}...
          </div>
        </div>

        {/* Edit form */}
        <div className="card p-6 md:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-5">Edit Information</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="prof-name" className="form-label">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="prof-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input-field pl-9"
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={userProfile?.email || currentUser?.email || ''}
                  disabled
                  className="input-field pl-9 bg-gray-50 text-gray-400 cursor-not-allowed"
                />
              </div>
              <p className="form-hint">Email address cannot be changed.</p>
            </div>

            <div className="form-group">
              <label htmlFor="prof-phone" className="form-label">
                Phone Number <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="prof-phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="input-field pl-9"
                  autoComplete="tel"
                />
              </div>
              <p className="form-hint">Your phone number is kept private and only used to contact you if your item is found.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setForm({ name: userProfile?.name || '', phone: userProfile?.phone || '' })}
                className="btn-secondary"
                disabled={loading}
              >
                Reset
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
