import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_MB, MAX_DESCRIPTION_LENGTH } from './constants';

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  if (password.length < 6) return 'Password must be at least 6 characters.';
  return null;
};

export const validateRegisterForm = ({ name, email, password, confirmPassword }) => {
  const errors = {};
  if (!name || name.trim().length < 2) errors.name = 'Full name must be at least 2 characters.';
  if (!email || !validateEmail(email)) errors.email = 'Please enter a valid email address.';
  const pwError = validatePassword(password);
  if (pwError) errors.password = pwError;
  if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';
  return errors;
};

export const validateItemForm = (data) => {
  const errors = {};
  if (!data.title || data.title.trim().length < 2) errors.title = 'Item name must be at least 2 characters.';
  if (!data.category) errors.category = 'Please select a category.';
  if (!data.description || data.description.trim().length < 10) errors.description = 'Description must be at least 10 characters.';
  if (data.description && data.description.length > MAX_DESCRIPTION_LENGTH) errors.description = `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`;
  if (!data.location) errors.location = 'Please select a location.';
  if (!data.date) errors.date = 'Please provide the date.';
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (data.date && new Date(data.date) > today) errors.date = 'Date cannot be in the future.';
  return errors;
};

export const validateImageFile = (file) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Only JPG, PNG, WebP, or GIF images are allowed.';
  }
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    return `Image size must be under ${MAX_IMAGE_SIZE_MB}MB.`;
  }
  return null;
};

export const validateClaimForm = (message) => {
  if (!message || message.trim().length < 10) return 'Please provide a description of at least 10 characters.';
  if (message.length > 500) return 'Message cannot exceed 500 characters.';
  return null;
};
