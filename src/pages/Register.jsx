import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, Search } from 'lucide-react';
import { registerUser } from '../firebase/authService';
import { validateRegisterForm } from '../utils/validators';
import { getFirebaseErrorMessage } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ─── Field component defined OUTSIDE Register so React never remounts it ───
const Field = ({ id, label, type = 'text', autoComplete, placeholder, rightElement, value, onChange, error }) => (
  <div className="form-group">
    <label htmlFor={id} className="form-label">{label}</label>
    <div className="relative">
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`input-field ${rightElement ? 'pr-10' : ''} ${error ? 'input-error' : ''}`}
      />
      {rightElement && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
      )}
    </div>
    {error && <p className="form-error">{error}</p>}
  </div>
);

const Register = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in — using useEffect to avoid render-phase navigation
  useEffect(() => {
    if (currentUser) navigate('/dashboard', { replace: true });
  }, [currentUser, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    // Clear field error as user types
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const validationErrors = validateRegisterForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    try {
      await registerUser(form);
      toast.success('Account created successfully! Welcome aboard 🎉');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      // Log real error for debugging
      console.error('Registration error:', err.code, err.message, err);
      const message = getFirebaseErrorMessage(err);
      // Show real error code in dev so we can diagnose
      setErrors({ general: `${message} (code: ${err.code || 'unknown'})` });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const pwToggle = (
    <button
      type="button"
      onClick={() => setShowPw(s => !s)}
      className="text-gray-400 hover:text-gray-600"
      aria-label="Toggle password visibility"
    >
      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">Lost & Found</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create an account</h1>
          <p className="text-gray-500 text-sm mt-1">Join the campus Lost & Found community</p>
        </div>

        <div className="card p-8">

          {/* General error banner */}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <Field
              id="name"
              label="Full Name"
              placeholder="e.g. Ravi Sharma"
              autoComplete="name"
              value={form.name}
              onChange={handleChange}
              error={errors.name}
            />
            <Field
              id="email"
              label="Email Address"
              type="email"
              placeholder="you@college.edu"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
            />
            <Field
              id="password"
              label="Password"
              type={showPw ? 'text' : 'password'}
              placeholder="Min. 6 characters"
              autoComplete="new-password"
              rightElement={pwToggle}
              value={form.password}
              onChange={handleChange}
              error={errors.password}
            />
            <Field
              id="confirmPassword"
              label="Confirm Password"
              type={showPw ? 'text' : 'password'}
              placeholder="Repeat your password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
            />

            {/* Phone — optional, inline since it's simpler */}
            <div className="form-group">
              <label htmlFor="phone" className="form-label">
                Phone Number <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <p className="text-xs text-gray-400 mb-4">Password must be at least 6 characters.</p>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              <UserPlus className="w-4 h-4" />
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
