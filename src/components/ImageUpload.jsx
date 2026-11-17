import { useState, useRef } from 'react';
import { Upload, X, Image } from 'lucide-react';
import { validateImageFile } from '../utils/validators';

const ImageUpload = ({ onFileSelect, onClear, currentUrl, error }) => {
  const [preview, setPreview] = useState(currentUrl || null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState('');
  const inputRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    const err = validateImageFile(file);
    if (err) {
      setLocalError(err);
      return;
    }
    setLocalError('');
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
    onFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleClear = () => {
    setPreview(null);
    setLocalError('');
    if (inputRef.current) inputRef.current.value = '';
    if (onClear) onClear();
  };

  const displayError = localError || error;

  return (
    <div>
      {preview ? (
        <div className="relative rounded-lg overflow-hidden border border-gray-200">
          <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
            aria-label="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
        >
          <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP up to 5MB</p>
          <Upload className="w-5 h-5 text-gray-400 mx-auto mt-2" />
        </div>
      )}
      {displayError && <p className="text-xs text-red-500 mt-1">{displayError}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={(e) => handleFile(e.target.files[0])}
        className="hidden"
        aria-label="Upload image"
      />
    </div>
  );
};

export default ImageUpload;
