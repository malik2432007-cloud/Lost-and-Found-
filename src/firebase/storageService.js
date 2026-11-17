import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';

export const uploadItemImage = async (file, itemId) => {
  const ext = file.name.split('.').pop();
  const storageRef = ref(storage, `items/${itemId}/image.${ext}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

export const deleteItemImage = async (imageUrl) => {
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (e) {
    // Image may not exist, ignore error
  }
};
