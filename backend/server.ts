import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { Pool } from "pg";
import dotenv from "dotenv";
import Stripe from 'stripe';
import { UserManager } from './userHandler.js';
import CampaignManager from './campaignHandler.js';
import ImageHandler from './imageHandler.js';
import DonationManager from './donationHandler.js';
import { issueToken, validateToken } from './JWTHandler.js';
import bcrypt from 'bcrypt';
import multer from 'multer';

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
        username: string;
      };
    }
  }
}

dotenv.config();

const app = express();
const PORT = 5000;
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY) 
  : null as any;

app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.DB_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

app.get("/", (req: Request, res: Response) => {
  res.send("API is running...");
});

app.get("/api/message", (req: Request, res: Response) => {
  res.json({ message: "Hello from backend 🚀" });
});

// Check if a user exists by email
app.get("/api/user-exists", async (req: Request, res: Response) => {
  const { email } = req.query;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: "email query parameter is required" });
  }
  try {
    const exists = await UserManager.userExists(email);
    res.json(exists);
  } catch (error) {
    console.error("Error checking user existence:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login endpoint
app.post("/api/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    
    // Authenticate user
    const user = await UserManager.authenticateUser(email, password);
    
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Issue JWT token
    const token = issueToken({ 
      userId: user.id, 
      email: user.email,
      username: user.username 
    });
    
    res.json({ 
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Middleware to validate JWT
function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Authorization token required" });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = validateToken(token);
    if (!decoded) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = decoded;
    next();
  } catch (error) {
    console.error("JWT validation error:", error);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

// Register endpoint
app.post("/api/register", async (req: Request, res: Response) => {
  try {
    const { username, email, firstname, surname, password, age, gender } = req.body;

    // Validate input
    if (!username || !email || !firstname || !surname || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if user already exists
    const userExists = await UserManager.userExists(email);
    if (userExists) {
      return res.status(409).json({ error: "User with this email already exists" });
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await UserManager.createUser({
      username,
      email,
      firstname,
      surname,
      password_hash,
      age: age ?? null,
      gender: gender ?? null,
    });
    
    // Issue JWT token
    const token = issueToken({ 
      userId: newUser.id, 
      email: newUser.email,
      username: newUser.username 
    });
    
    res.status(201).json({ 
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        firstname: newUser.firstname,
        surname: newUser.surname
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Protected endpoint to get user information
app.get("/api/user/:userId", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId as string);
    
    // Check if the authenticated user is requesting their own data
    if (!req.user || req.user.userId !== userId) {
      return res.status(403).json({ error: "You can only access your own user data" });
    }
    
    const userInfo = await UserManager.getUserInfo(userId);
    
    if (!userInfo) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(userInfo);
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Protected endpoint to create a campaign
app.post("/api/campaigns", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { title, description, tags, goal, milestones, city_name } = req.body;

    if (!title) {
      return res.status(400).json({ error: "title is required" });
    }

    const campaign = await CampaignManager.createCampaign({
      title, description, tags, goal, milestones, city_name,
      created_by: req.user!.userId,
    });

    res.status(201).json(campaign);
  } catch (error) {
    console.error("Error creating campaign:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Protected endpoint to update a campaign
app.patch("/api/campaigns/:campaignId", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.campaignId as string);
    const { title, description, tags, goal, milestones, city_name, is_complete, owner_ids } = req.body;
    const fields = { title, description, tags, goal, milestones, city_name, is_complete, owner_ids };
    const updates = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));

    if (updates.owner_ids !== undefined) {
      if (!Array.isArray(updates.owner_ids) || updates.owner_ids.length === 0) {
        return res.status(400).json({ error: "owner_ids must be a non-empty array of user IDs" });
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields provided" });
    }

    const campaign = await CampaignManager.updateCampaign(campaignId, updates, req.user!.userId);
    res.json(campaign);
  } catch (error: any) {
    if (error.status === 404) return res.status(404).json({ error: error.message });
    if (error.status === 403) return res.status(403).json({ error: error.message });
    console.error("Error updating campaign:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Protected endpoint to get all campaigns
app.get("/api/campaigns", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const campaigns = await CampaignManager.getAllCampaigns();
    res.json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Protected endpoint to get a specific campaign by ID
app.get("/api/campaigns/:campaignId", authenticateJWT, async (req: Request, res: Response) => {
  const campaignId = parseInt(req.params.campaignId as string);
  try {
    const campaign = await CampaignManager.getCampaignById(campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }
    
    res.json(campaign);
  } catch (error) {
    console.error(`Error fetching campaign ${campaignId}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Protected endpoint to get all donations for a campaign
app.get("/api/campaigns/:campaignId/donations", authenticateJWT, async (req: Request, res: Response) => {
  const campaignId = parseInt(req.params.campaignId as string);
  try {
    const donations = await DonationManager.getDonationsByCampaign(campaignId);
    res.json(donations);
  } catch (error) {
    console.error(`Error fetching donations for campaign ${campaignId}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Protected endpoint to make a donation
app.post("/api/donations", authenticateJWT, async (req: Request, res: Response) => {
  const { to_campaign, amount } = req.body;
  const from_user = req.user!.userId;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Amount must be greater than 0" });
  }

  if (!to_campaign) {
    return res.status(400).json({ error: "Campaign ID required" });
  }

  try {
    const donation = await DonationManager.donate({
      from_user,
      to_campaign,
      amount,
    });
    res.status(201).json(donation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/payments/create-payment-intent", authenticateJWT, async (req: Request, res: Response) => {
  const { to_campaign, amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Amount must be greater than 0" });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'dkk',
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Protected endpoint to delete a campaign (own campaigns only)
app.delete("/api/campaigns/:campaignId", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.campaignId as string);
    await CampaignManager.deleteCampaign(campaignId, req.user!.userId);
    res.status(204).send();
  } catch (error: any) {
    if (error.status === 404) return res.status(404).json({ error: error.message });
    if (error.status === 403) return res.status(403).json({ error: error.message });
    console.error("Error deleting campaign:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Protected endpoint to add an image to a campaign (own campaigns only)
app.post("/api/campaigns/:campaignId/images", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.campaignId as string);
    const { imageId } = req.body;

    if (!imageId || typeof imageId !== 'number') {
      return res.status(400).json({ error: "imageId is required and must be a number" });
    }

    await CampaignManager.addImage(campaignId, imageId, req.user!.userId);
    res.status(201).json({ message: "Image added to campaign" });
  } catch (error: any) {
    if (error.status === 404) return res.status(404).json({ error: error.message });
    if (error.status === 403) return res.status(403).json({ error: error.message });
    console.error("Error adding image to campaign:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Protected endpoint to get all images for a campaign
app.get("/api/campaigns/:campaignId/images", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.campaignId as string);
    const images = await CampaignManager.getImages(campaignId);
    res.json(images);
  } catch (error) {
    console.error("Error fetching campaign images:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Protected endpoint to delete own account
app.delete("/api/user/:userId", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId as string);

    if (!req.user || req.user.userId !== userId) {
      return res.status(403).json({ error: "You can only delete your own account" });
    }

    const deleted = await UserManager.deleteUser(userId);
    if (!deleted) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Protected endpoint to update user details
app.patch("/api/user/:userId", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId as string);

    if (!req.user || req.user.userId !== userId) {
      return res.status(403).json({ error: "You can only update your own details" });
    }

    const { username, email, firstname, surname, age, gender } = req.body;
    const fields = { username, email, firstname, surname, age, gender };
    const updates = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields provided" });
    }

    const updated = await UserManager.updateUser(userId, updates);
    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password_hash, ...safe } = updated;
    res.json(safe);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Protected endpoint to upload an image and set it as the user's profile picture
app.put("/api/user/:userId/profile-picture", authenticateJWT, upload.any(), async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId as string);

    if (!req.user || req.user.userId !== userId) {
      return res.status(403).json({ error: "You can only update your own profile picture" });
    }

    const file = (req.files as Express.Multer.File[])?.[0];
    if (!file) {
      return res.status(400).json({ error: "An image file is required" });
    }

    const uploaded = await ImageHandler.uploadImage(file.buffer, file.mimetype, userId);

    const updated = await UserManager.setProfilePicture(userId, uploaded.id);
    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password_hash, ...safe } = updated;
    res.json(safe);
  } catch (error) {
    console.error("Error setting profile picture:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Protected endpoint to upload an image
app.post("/api/images", authenticateJWT, upload.any(), async (req: Request, res: Response) => {
  try {
    const file = (req.files as Express.Multer.File[])?.[0];
    if (!file) {
      return res.status(400).json({ error: "An image file is required" });
    }

    const image = await ImageHandler.uploadImage(file.buffer, file.mimetype, req.user!.userId);
    res.status(201).json(image);
  } catch (error: any) {
    if (error.message?.startsWith('Unsupported MIME type')) {
      return res.status(400).json({ error: error.message });
    }
    console.error("Error uploading image:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Protected endpoint to get an image by ID
app.get("/api/images/:imageId", authenticateJWT, async (req: Request, res: Response) => {
  const imageId = parseInt(req.params.imageId as string);
  try {
    const image = await ImageHandler.getImage(imageId);

    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    res.setHeader('Content-Type', image.mime_type);
    res.send(image.data);
  } catch (error) {
    console.error(`Error fetching image ${imageId}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export { app };