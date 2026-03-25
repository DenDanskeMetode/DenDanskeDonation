import { getImageById, createImage } from '../dbHandler.js';
import type { Image, ImageCreationData } from '../dbHandler.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export class ImageHandler {
  static async getImage(imageId: number): Promise<Image | null> {
    try {
      return await getImageById(imageId);
    } catch (error) {
      console.error(`Error getting image ${imageId}:`, error);
      throw error;
    }
  }

  static async uploadImage(data: Buffer, mime_type: string, uploaded_by?: number): Promise<Omit<Image, 'data'>> {
    if (!ALLOWED_MIME_TYPES.includes(mime_type)) {
      throw new Error(`Unsupported MIME type: ${mime_type}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`);
    }

    if (!data || data.length === 0) {
      throw new Error('Image data cannot be empty');
    }

    try {
      const imageData: ImageCreationData = { data, mime_type, uploaded_by };
      return await createImage(imageData);
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }
}

export default ImageHandler;
