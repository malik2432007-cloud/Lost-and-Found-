import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Calendar, FileText, Loader, Image } from 'lucide-react';
import { createItem } from '../firebase/firestoreService';
import { uploadItemImage } from '../firebase/storageService';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES } from '../utils/constants';
import { validateItemForm } from '../utils/validators';
import ImageUpload from '../components/ImageUpload';
import toast from 'react-hot-toast';

// Field component defined outside parent to avoid re-rendering and input resets
const Field = ({ id, label, required = true, hint, error, children }) => (
  <div className="form-group">
    <label htmlFor={id} className="form-label">
      {label} {required && <span className="text-red-500">*</span>}
      {!required && <span className="text-gray-400 font-normal"> (optional)</span>}
    </label>
    {children}
    {hint && <p className="form-hint">{hint}</p>}
    {error && <p className="form-error">{error}</p>}
  </div>
);

const ReportFound = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    date: '',
    location: '',
    brand: '',
    color: '',
    additionalInfo: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent duplicate submissions

    // Validate form with required location
    const validationErrors = validateItemForm(form, true);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the errors before submitting.');
      return;
    }

    if (!currentUser?.uid) {
      toast.error('You must be logged in to submit a report.');
      return;
    }

    setLoading(true);
    try {
      // 1. Upload image first if one was selected
      let uploadedImageUrl = '';
      if (imageFile) {
        try {
          uploadedImageUrl = await uploadItemImage(
            imageFile,
            `found_${Date.now()}_${currentUser.uid.slice(0, 6)}`
          );
        } catch (imgErr) {
          console.error('Image upload failed:', imgErr);
        }
      }

      // 2. Create the Firestore item document atomically with location and imageUrl included
      const itemData = {
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim(),
        date: form.date,
        location: form.location.trim(),
        brand: form.brand?.trim() || '',
        color: form.color?.trim() || '',
        additionalInfo: form.additionalInfo?.trim() || '',
        userId: currentUser.uid,
        userEmail: currentUser.email || '',
        userName: userProfile?.name || 'Community Member',
        type: 'found',
        status: 'active',
        imageUrl: uploadedImageUrl || '',
      };

      const itemId = await createItem(itemData);

      toast.success('Found item reported successfully!');
      navigate(`/item/${itemId}`);
    } catch (err) {
      console.error('Submit report error:', err);
      toast.error(`Failed to submit report: ${err?.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h1 className="page-title">Report Found Item</h1>
            <p className="page-subtitle">Help return this item to its rightful owner</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} noValidate>
            <div className="section-card">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> Item Information
              </h2>

              <Field id="title" label="Item Name" hint="Describe it clearly, e.g. 'Blue Backpack with name tag'" error={errors.title}>
                <input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="e.g. Blue Jansport Backpack"
                  value={form.title}
                  onChange={handleChange}
                  className={`input-field ${errors.title ? 'input-error' : ''}`}
                  maxLength={100}
                  autoComplete="off"
                  disabled={loading}
                />
              </Field>

              <Field id="category" label="Category" error={errors.category}>
                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className={`input-field ${errors.category ? 'input-error' : ''}`}
                  disabled={loading}
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              <Field id="description" label="Description" hint={`${form.description.length}/1000 — Describe what you found`} error={errors.description}>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  placeholder="Describe the item in detail. What did it look like? Any contents visible? What condition is it in?"
                  value={form.description}
                  onChange={handleChange}
                  className={`input-field resize-none ${errors.description ? 'input-error' : ''}`}
                  maxLength={1000}
                  disabled={loading}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field id="brand" label="Brand" required={false} error={errors.brand}>
                  <input
                    id="brand"
                    name="brand"
                    type="text"
                    placeholder="e.g. Apple, Adidas, Casio"
                    value={form.brand}
                    onChange={handleChange}
                    className="input-field"
                    autoComplete="off"
                    disabled={loading}
                  />
                </Field>
                <Field id="color" label="Color" required={false} error={errors.color}>
                  <input
                    id="color"
                    name="color"
                    type="text"
                    placeholder="e.g. Red, Silver, Black"
                    value={form.color}
                    onChange={handleChange}
                    className="input-field"
                    autoComplete="off"
                    disabled={loading}
                  />
                </Field>
              </div>
            </div>

            {/* When and Where Was It Found? */}
            <div className="section-card">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" /> When and Where Was It Found?
              </h2>
              <div className="space-y-4">
                <Field id="date" label="When was it found?" error={errors.date}>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    max={today}
                    value={form.date}
                    onChange={handleChange}
                    className={`input-field ${errors.date ? 'input-error' : ''}`}
                    disabled={loading}
                  />
                </Field>

                <Field id="location" label="Where was it found?" error={errors.location}>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    placeholder="Enter the location where you found the item (e.g. College Canteen, Main Gate, Lucknow)"
                    value={form.location}
                    onChange={handleChange}
                    className={`input-field ${errors.location ? 'input-error' : ''}`}
                    disabled={loading}
                    autoComplete="off"
                  />
                </Field>
              </div>
            </div>

            <div className="section-card">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Image className="w-4 h-4 text-blue-600" /> Photo <span className="text-gray-400 font-normal text-sm">(optional)</span>
              </h2>
              <ImageUpload onFileSelect={setImageFile} onClear={() => setImageFile(null)} />
            </div>

            <div className="section-card">
              <h2 className="font-semibold text-gray-900 mb-4">
                Additional Details <span className="text-gray-400 font-normal text-sm">(optional)</span>
              </h2>
              <textarea
                name="additionalInfo"
                rows={3}
                placeholder="Any other helpful details about where it was found or its current condition..."
                value={form.additionalInfo}
                onChange={handleChange}
                className="input-field resize-none"
                maxLength={500}
                disabled={loading}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-secondary flex-1"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                style={{ background: '#16a34a' }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  'Submit Found Report'
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-1">
          <div className="card p-5 sticky top-20">
            <h3 className="font-semibold text-gray-900 mb-3">🤝 Good Samaritan Guide</h3>
            <ul className="space-y-2.5 text-sm text-gray-600">
              {[
                'Only include details that help identify the owner — avoid revealing unique contents so that only the real owner can describe them.',
                'Keep the item in a safe place until the owner is identified.',
                "If it's urgent (ID card, keys, medicines), inform campus security or administration.",
                'Provide the specific location where you picked up or noticed the item.',
                'Your contact info is protected — claimants contact you through our verification system.',
                'You can update the status to "Returned" once the item is back with its owner.',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-500 font-bold flex-shrink-0">{i + 1}.</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportFound;
