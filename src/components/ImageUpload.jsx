import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 5;

/**
 * ImageUpload component — drag-and-drop or click to upload.
 * ✅ FIX: Validates file type and size before preview.
 * ✅ FIX: Shows meaningful error messages.
 * Props:
 *   onFileSelect(file) — called when a valid file is selected
 *   onClear() — called when the image is cleared
 *   currentUrl — optional existing image URL to show
 *   error — optional external error message
 */
const ImageUpload = ({ onFileSelect, onClear, currentUrl, error }) => {
  const [preview, setPreview] = useState(currentUrl || null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState('');
  const inputRef = useRef(null);

  const validateAndProcess = useCallback((file) => {
    if (!file) return;

    // Type check
    if (!ALLOWED_TYPES.includes(file.type)) {
      setLocalError('Unsupported file type. Please upload a JPG, PNG, or WebP image.');
      return;
    }

    // Size check
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setLocalError(`File is too large. Maximum size is ${MAX_SIZE_MB} MB.`);
      return;
    }

    setLocalError('');

    // Generate preview using FileReader
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.onerror = () => setLocalError('Failed to read file. Please try again.');
    reader.readAsDataURL(file);

    onFileSelect(file);
  }, [onFileSelect]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    validateAndProcess(file);
  }, [validateAndProcess]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const handleInputChange = useCallback((e) => {
    validateAndProcess(e.target.files[0]);
  }, [validateAndProcess]);

  const handleClear = useCallback(() => {
    setPreview(null);
    setLocalError('');
    if (inputRef.current) inputRef.current.value = '';
    if (onClear) onClear();
  }, [onClear]);

  const displayError = localError || error;

  return (
    <div>
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-52 object-cover"
            onError={() => setLocalError('Could not display the image preview.')}
          />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700 transition-colors shadow-md"
            aria-label="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
            ✓ Image selected
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-blue-400 bg-blue-50 scale-[1.01]'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
        >
          <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-400">JPG, PNG, WebP — up to {MAX_SIZE_MB} MB</p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-500">
            <Upload className="w-3.5 h-3.5" /> Choose File
          </div>
        </div>
      )}

      {displayError && (
        <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
          <span>⚠</span> {displayError}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
        aria-label="Upload image file"
      />
    </div>
  );
};

export default ImageUpload;
