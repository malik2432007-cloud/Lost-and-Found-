import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config.js';

// Cache whether Firebase Cloud Storage bucket is active for the current session
let isStorageAvailable = null;

/**
 * Helper to race a promise against a strict timeout.
 * Prevents Firebase SDK from hanging in an internal exponential backoff retry loop
 * when a storage bucket is unprovisioned, returning HTTP 404, or experiencing network issues.
 */
const withTimeout = (promise, ms = 1500) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Storage operation timed out after ${ms}ms`));
    }, ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

/**
 * Determine safe content type from file object and extension.
 */
const getContentType = (file) => {
  if (file?.type && file.type.startsWith('image/')) {
    return file.type;
  }
  const ext = (file?.name?.split('.').pop() || 'jpg').toLowerCase();
  switch (ext) {
    case 'png': return 'image/png';
    case 'webp': return 'image/webp';
    case 'gif': return 'image/gif';
    default: return 'image/jpeg';
  }
};

/**
 * Compress and convert a File or Blob to an optimized, high-quality Base64 Data URL.
 * Automatically resizes image dimensions (max 800px) and compresses to ~40-60KB.
 * Includes a 1500ms safety timeout so it NEVER hangs.
 */
export const compressImageToDataUrl = (file, maxWidth = 800, maxHeight = 800, quality = 0.75) => {
  return new Promise((resolve) => {
    if (!file) {
      resolve('');
      return;
    }

    // Node / server test environment fallback
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      if (file && typeof file.arrayBuffer === 'function') {
        file.arrayBuffer().then(buf => {
          const base64 = Buffer.from(buf).toString('base64');
          const type = file.type || 'image/jpeg';
          resolve(`data:${type};base64,${base64}`);
        }).catch(() => resolve(''));
      } else {
        resolve('');
      }
      return;
    }

    // Safety timeout: never hang more than 1.5 seconds
    const timeout = setTimeout(() => {
      console.warn('compressImageToDataUrl timed out, reading raw file');
      try {
        const fallbackReader = new FileReader();
        fallbackReader.onload = () => resolve(fallbackReader.result || '');
        fallbackReader.onerror = () => resolve('');
        fallbackReader.readAsDataURL(file);
      } catch {
        resolve('');
      }
    }, 1500);

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const dataUrl = readerEvent.target?.result;
      if (!dataUrl || typeof dataUrl !== 'string') {
        clearTimeout(timeout);
        resolve('');
        return;
      }

      const img = new Image();
      img.onload = () => {
        clearTimeout(timeout);
        try {
          let width = img.width || 800;
          let height = img.height || 600;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Try WebP first for smallest footprint
          try {
            const webpData = canvas.toDataURL('image/webp', quality);
            if (webpData && webpData.startsWith('data:image/webp')) {
              resolve(webpData);
              return;
            }
          } catch {
            // WebP not supported, fallback to JPEG
          }

          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch (e) {
          console.warn('Canvas compression error, using raw dataUrl', e);
          resolve(dataUrl);
        }
      };

      img.onerror = () => {
        clearTimeout(timeout);
        resolve(dataUrl);
      };

      img.src = dataUrl;
    };

    reader.onerror = () => {
      clearTimeout(timeout);
      resolve('');
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Upload an item image with instant fallback.
 * 1. Generates an optimized, compressed Base64 data URL locally in ~15ms.
 * 2. Attempts Firebase Storage upload with a strict 1.5-second timeout.
 * 3. If Firebase Storage succeeds within 1.5s, returns the HTTPS download URL.
 * 4. If Firebase Storage fails or times out (e.g. bucket 404 in GCP), immediately
 *    returns the compressed image so submission completes without freezing or hanging!
 */
export const uploadItemImage = async (file, itemId) => {
  if (!file || !itemId) return '';

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image size must be under 5 MB');
  }

  // 1. Fast local image optimization (~15ms)
  let localDataUrl = '';
  try {
    localDataUrl = await compressImageToDataUrl(file, 800, 800, 0.75);
  } catch (err) {
    console.warn('Could not compress image locally:', err);
  }

  // 2. Try Firebase Storage with 1.5s strict timeout (only if not already marked unavailable)
  if (isStorageAvailable !== false) {
    try {
      const contentType = getContentType(file);
      const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase();
      const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
      const path = `items/${itemId}/${Date.now()}.${safeExt}`;
      const storageRef = ref(storage, path);

      const storageUploadPromise = uploadBytes(storageRef, file, { contentType })
        .then(snapshot => getDownloadURL(snapshot.ref));

      const downloadUrl = await withTimeout(storageUploadPromise, 1500);
      if (downloadUrl) {
        isStorageAvailable = true;
        console.log('✅ Image uploaded successfully to Firebase Storage:', downloadUrl);
        return downloadUrl;
      }
    } catch (storageError) {
      isStorageAvailable = false;
      console.warn(
        'Firebase Storage unavailable or timed out; falling back to optimized inline image:',
        storageError?.message || storageError?.code
      );
    }
  }

  // 3. Return the compressed image data URL
  return localDataUrl;
};

/**
 * Upload a user avatar image to Firebase Storage with strict timeout and fallback.
 */
export const uploadAvatarImage = async (file, userId) => {
  if (!file || !userId) return '';

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image size must be under 5 MB');
  }

  let localDataUrl = '';
  try {
    localDataUrl = await compressImageToDataUrl(file, 256, 256, 0.85);
  } catch (err) {
    console.warn('Could not compress avatar locally:', err);
  }

  if (isStorageAvailable !== false) {
    try {
      const contentType = getContentType(file);
      const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase();
      const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
      const path = `avatars/${userId}/${Date.now()}.${safeExt}`;
      const storageRef = ref(storage, path);

      const storageUploadPromise = uploadBytes(storageRef, file, { contentType })
        .then(snapshot => getDownloadURL(snapshot.ref));

      const downloadUrl = await withTimeout(storageUploadPromise, 1500);
      if (downloadUrl) {
        isStorageAvailable = true;
        return downloadUrl;
      }
    } catch (storageError) {
      isStorageAvailable = false;
      console.warn('Firebase Storage avatar upload fallback:', storageError?.message);
    }
  }

  return localDataUrl;
};

/**
 * Delete an item image from Firebase Storage if it is a storage reference.
 */
export const deleteItemImage = async (imageUrl) => {
  if (!imageUrl || !imageUrl.startsWith('http')) return;
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (e) {
    console.warn('deleteItemImage: could not delete image (may not exist or external)', e?.code);
  }
};
