import { useState, useEffect } from 'react';
import { Package, ImageOff, Loader2 } from 'lucide-react';

/**
 * ItemImage - Resilient image component for Lost & Found items.
 * Features:
 * - Smooth skeleton loading indicator
 * - Auto-detects Base64 data URLs & Firebase Storage URLs
 * - Graceful fallback placeholder on error or missing image
 * - Strict object-fit (cover for thumbnails, contain for details)
 * - Zero layout shifts (CLS)
 */
const ItemImage = ({
  src,
  alt = 'Item image',
  className = '',
  imgClassName = '',
  fit = 'cover', // 'cover' | 'contain'
  aspectRatio, // optional aspect ratio class, e.g. 'aspect-[4/3]'
  showSpinner = true,
  onClick,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Reset state if src changes
  useEffect(() => {
    setLoaded(false);
    setHasError(false);
  }, [src]);

  const hasValidSrc = Boolean(src && typeof src === 'string' && src.trim().length > 0);

  return (
    <div
      className={`relative overflow-hidden bg-gray-100 flex items-center justify-center ${aspectRatio || ''} ${className}`}
      onClick={onClick}
    >
      {/* Loading state indicator */}
      {hasValidSrc && !loaded && !hasError && showSpinner && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10 animate-pulse">
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin opacity-70" />
        </div>
      )}

      {/* Main Image */}
      {hasValidSrc && !hasError ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-full transition-opacity duration-300 ${
            fit === 'contain' ? 'object-contain' : 'object-cover'
          } ${loaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
        />
      ) : (
        /* Professional Fallback Placeholder */
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-2 select-none bg-gradient-to-b from-gray-50 to-gray-100">
          <Package className="w-6 h-6 text-gray-300 mb-1" />
          <span className="text-[11px] font-medium text-gray-400">No Image</span>
        </div>
      )}
    </div>
  );
};

export default ItemImage;
