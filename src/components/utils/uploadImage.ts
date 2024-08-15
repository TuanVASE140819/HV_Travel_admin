import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const uploadImage = async (file: File): Promise<string> => {
  if (!file) {
    throw new Error('No file provided');
  }

  const storage = getStorage();
  const storageRef = ref(storage, `images/${file.name}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return url;
};
