import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, MapPin, Calendar, FileText, Loader, Image } from 'lucide-react';
import { createItem } from '../firebase/firestoreService';
import { uploadItemImage } from '../firebase/storageService';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, LOCATIONS } from '../utils/constants';
import { validateItemForm } from '../utils/validators';
import ImageUpload from '../components/ImageUpload';
import toast from 'react-hot-toast';

const ReportFound = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '', category: '', description: '', location: '',
    date: '', brand: '', color: '', additionalInfo: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(e => ({ ...e, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateItemForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the errors before submitting.');
      return;
    }
    setLoading(true);
    try {
      const itemData = {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        userId: currentUser.uid,
        type: 'found',
        imageUrl: '',
      };
      const itemId = await createItem(itemData);

      if (imageFile) {
        try {
          const url = await uploadItemImage(imageFile, itemId);
          await import('../firebase/firestoreService').then(m => m.updateItem(itemId, { imageUrl: url }));
        } catch {
          // Image upload optional — item still saved
        }
      }

      toast.success('Found item reported successfully!');
      navigate(`/item/${itemId}`);
    } catch {
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const Field = ({ id, label, required = true, hint, children }) => (
    <div className="form-group">
      <label htmlFor={id} className="form-label">
        {label} {required && <span className="text-red-500">*</span>}
        {!required && <span className="text-gray-400 font-normal"> (optional)</span>}
      </label>
      {children}
      {hint && <p className="form-hint">{hint}</p>}
      {errors[id] && <p className="form-error">{errors[id]}</p>}
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
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

              <Field id="title" label="Item Name" hint="Describe it clearly, e.g. 'Blue Backpack with name tag'">
                <input
                  id="title" name="title" type="text"
                  placeholder="e.g. Blue Jansport Backpack"
                  value={form.title} onChange={handleChange}
                  className={`input-field ${errors.title ? 'input-error' : ''}`}
                  maxLength={100}
                />
              </Field>

              <Field id="category" label="Category">
                <select
                  id="category" name="category"
                  value={form.category} onChange={handleChange}
                  className={`input-field ${errors.category ? 'input-error' : ''}`}
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              <Field id="description" label="Description" hint={`${form.description.length}/1000 — Describe what you found`}>
                <textarea
                  id="description" name="description"
                  rows={4}
                  placeholder="Describe the item in detail. What did it look like? Any contents visible? What condition is it in?"
                  value={form.description} onChange={handleChange}
                  className={`input-field resize-none ${errors.description ? 'input-error' : ''}`}
                  maxLength={1000}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field id="brand" label="Brand" required={false}>
                  <input
                    id="brand" name="brand" type="text"
                    placeholder="e.g. Apple, Adidas"
                    value={form.brand} onChange={handleChange}
                    className="input-field"
                  />
                </Field>
                <Field id="color" label="Color" required={false}>
                  <input
                    id="color" name="color" type="text"
                    placeholder="e.g. Red, Silver"
                    value={form.color} onChange={handleChange}
                    className="input-field"
                  />
                </Field>
              </div>
            </div>

            <div className="section-card">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" /> Where & When Found
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field id="location" label="Location Found">
                  <select
                    id="location" name="location"
                    value={form.location} onChange={handleChange}
                    className={`input-field ${errors.location ? 'input-error' : ''}`}
                  >
                    <option value="">Select location</option>
                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </Field>
                <Field id="date" label="Date Found">
                  <input
                    id="date" name="date" type="date"
                    max={today}
                    value={form.date} onChange={handleChange}
                    className={`input-field ${errors.date ? 'input-error' : ''}`}
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
              <h2 className="font-semibold text-gray-900 mb-4">Additional Details <span className="text-gray-400 font-normal text-sm">(optional)</span></h2>
              <textarea
                name="additionalInfo"
                rows={3}
                placeholder="Any other helpful details about where it was found or its current condition..."
                value={form.additionalInfo}
                onChange={handleChange}
                className="input-field resize-none"
                maxLength={500}
              />
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1" disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1" style={{ background: '#16a34a' }} disabled={loading}>
                {loading ? <><Loader className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit Found Report'}
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-1">
          <div className="card p-5 sticky top-20">
            <h3 className="font-semibold text-gray-900 mb-3">🤝 Good Samaritan Guide</h3>
            <ul className="space-y-2.5 text-sm text-gray-600">
              {[
                'Only include details that help identify the owner — avoid revealing too much so that only the real owner can claim it.',
                'Keep the item in a safe place until the owner is identified.',
                "If it's urgent (ID card, medicines), contact campus admin directly.",
                'Your identity is protected — claimants contact you through our system.',
                'You can update the status once the item is returned.',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-500 font-bold flex-shrink-0">{i + 1}.</span>
                  {tip}
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
