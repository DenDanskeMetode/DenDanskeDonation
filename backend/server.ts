import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { Pool } from "pg";
import dotenv from "dotenv";

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

// Import handlers
import { UserManager } from './userHandler.js';
import CampaignManager from './campaignHandler.js';
import { issueToken, validateToken } from './JWTHandler.js';
import bcrypt from 'bcrypt';

app.get("/", (req: Request, res: Response) => {
  res.send("API is running...");
});

app.get("/api/message", (req: Request, res: Response) => {
  res.json({ message: "Hello from backend 🚀" });
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
    const { username, email, firstname, surname, password } = req.body;
    
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
      password_hash
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

// Public endpoint to get all campaigns
app.get("/api/campaigns", async (req: Request, res: Response) => {
  try {
    const campaigns = await CampaignManager.getAllCampaigns();
    res.json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Public endpoint to get a specific campaign by ID
app.get("/api/campaigns/:campaignId", async (req: Request, res: Response) => {
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});