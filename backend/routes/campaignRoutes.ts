import { Router, Request, Response } from 'express';
import CampaignManager from '../services/campaignHandler.js';
import DonationManager from '../services/donationHandler.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';
import { validateToken } from '../services/JWTHandler.js';
import { sseClients } from '../services/sse.js';

const router = Router();

router.get('/campaigns', authenticateJWT, async (_req: Request, res: Response) => {
  try {
    const campaigns = await CampaignManager.getAllCampaigns();
    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/campaigns', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { title, description, tags, goal, milestones, city_name } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });
    const campaign = await CampaignManager.createCampaign({
      title, description, tags, goal, milestones, city_name,
      created_by: req.user!.userId,
    });
    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/campaigns/:campaignId', authenticateJWT, async (req: Request, res: Response) => {
  const campaignId = parseInt(req.params.campaignId as string);
  try {
    const campaign = await CampaignManager.getCampaignById(campaignId);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json(campaign);
  } catch (error) {
    console.error(`Error fetching campaign ${campaignId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/campaigns/:campaignId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.campaignId as string);
    const { title, description, tags, goal, milestones, city_name, is_complete, owner_ids } = req.body;
    const fields = { title, description, tags, goal, milestones, city_name, is_complete, owner_ids };
    const updates = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
    if (updates.owner_ids !== undefined) {
      if (!Array.isArray(updates.owner_ids) || updates.owner_ids.length === 0) {
        return res.status(400).json({ error: 'owner_ids must be a non-empty array of user IDs' });
      }
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided' });
    }
    const campaign = await CampaignManager.updateCampaign(campaignId, updates, req.user!.userId);
    res.json(campaign);
  } catch (error: any) {
    if (error.status === 404) return res.status(404).json({ error: error.message });
    if (error.status === 403) return res.status(403).json({ error: error.message });
    console.error('Error updating campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/campaigns/:campaignId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.campaignId as string);
    await CampaignManager.deleteCampaign(campaignId, req.user!.userId);
    res.status(204).send();
  } catch (error: any) {
    if (error.status === 404) return res.status(404).json({ error: error.message });
    if (error.status === 403) return res.status(403).json({ error: error.message });
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/campaigns/:campaignId/donations', authenticateJWT, async (req: Request, res: Response) => {
  const campaignId = parseInt(req.params.campaignId as string);
  try {
    const donations = await DonationManager.getDonationsByCampaign(campaignId);
    res.json(donations);
  } catch (error) {
    console.error(`Error fetching donations for campaign ${campaignId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/campaigns/:campaignId/images', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.campaignId as string);
    const images = await CampaignManager.getImages(campaignId);
    res.json(images);
  } catch (error) {
    console.error('Error fetching campaign images:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/campaigns/:campaignId/images', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.campaignId as string);
    const { imageId } = req.body;
    if (!imageId || typeof imageId !== 'number') {
      return res.status(400).json({ error: 'imageId is required and must be a number' });
    }
    await CampaignManager.addImage(campaignId, imageId, req.user!.userId);
    res.status(201).json({ message: 'Image added to campaign' });
  } catch (error: any) {
    if (error.status === 404) return res.status(404).json({ error: error.message });
    if (error.status === 403) return res.status(403).json({ error: error.message });
    console.error('Error adding image to campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/campaigns/:campaignId/images/:imageId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.campaignId as string);
    const imageId = parseInt(req.params.imageId as string);
    await CampaignManager.removeImage(campaignId, imageId, req.user!.userId);
    res.status(204).send();
  } catch (error: any) {
    if (error.status === 404) return res.status(404).json({ error: error.message });
    if (error.status === 403) return res.status(403).json({ error: error.message });
    console.error('Error removing image from campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// SSE — auth via query param because EventSource doesn't support custom headers
router.get('/campaigns/:campaignId/stream', (req: Request, res: Response) => {
  const token = typeof req.query.token === 'string' ? req.query.token : null;
  if (!token) { res.status(401).end(); return; }
  const decoded = validateToken(token);
  if (!decoded) { res.status(403).end(); return; }

  const campaignId = parseInt(req.params.campaignId as string);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!sseClients.has(campaignId)) sseClients.set(campaignId, new Set());
  sseClients.get(campaignId)!.add(res);

  req.on('close', () => sseClients.get(campaignId)?.delete(res));
});

export default router;
