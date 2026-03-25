import { Router, Request, Response } from 'express';
import ImageHandler from '../services/imageHandler.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';
import upload from '../middleware/upload.js';

const router = Router();

router.post('/images', authenticateJWT, upload.any(), async (req: Request, res: Response) => {
  try {
    const file = (req.files as Express.Multer.File[])?.[0];
    if (!file) return res.status(400).json({ error: 'An image file is required' });
    const image = await ImageHandler.uploadImage(file.buffer, file.mimetype, req.user!.userId);
    res.status(201).json(image);
  } catch (error: any) {
    if (error.message?.startsWith('Unsupported MIME type')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Public — no auth needed for <img src> tags
router.get('/images/:imageId', async (req: Request, res: Response) => {
  const imageId = parseInt(req.params.imageId as string);
  try {
    const image = await ImageHandler.getImage(imageId);
    if (!image) return res.status(404).json({ error: 'Image not found' });
    res.setHeader('Content-Type', image.mime_type);
    res.send(image.data);
  } catch (error) {
    console.error(`Error fetching image ${imageId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
