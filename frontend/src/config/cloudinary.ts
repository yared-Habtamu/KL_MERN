// Cloudinary Configuration
export const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your-cloud-name',
  uploadPreset: 'kiya_lottery', // Set this up in your Cloudinary dashboard
  folder: 'lottery-images',
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  maxImages: 3,
};
