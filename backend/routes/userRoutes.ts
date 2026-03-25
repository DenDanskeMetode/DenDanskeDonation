import { Router, Request, Response } from 'express';
import { UserManager } from '../services/userHandler.js';
import { issueToken } from '../services/JWTHandler.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';
import ImageHandler from '../services/imageHandler.js';
import upload from '../middleware/upload.js';

const router = Router();

router.get('/users/:userId/public', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId as string);
    const userInfo = await UserManager.getUserInfo(userId);
    if (!userInfo) return res.status(404).json({ error: 'User not found' });
    res.json({
      id: userInfo.id,
      username: userInfo.username,
      name: `${userInfo.firstname} ${userInfo.surname}`,
      avatar: userInfo.profile_picture ? `/api/images/${userInfo.profile_picture}` : null,
    });
  } catch (error) {
    console.error('Error fetching public user info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/user-exists', async (req: Request, res: Response) => {
  const { email } = req.query;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'email query parameter is required' });
  }
  try {
    const exists = await UserManager.userExists(email);
    res.json(exists);
  } catch (error) {
    console.error('Error checking user existence:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await UserManager.authenticateUser(email, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = issueToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      firstname: user.firstname,
      role: user.role,
    });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, firstname, surname, password, age, gender } = req.body;
    if (!username || !email || !firstname || !surname || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const userExists = await UserManager.userExists(email);
    if (userExists) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    const newUser = await UserManager.createUser({ username, email, firstname, surname, password, age: age ?? null, gender: gender ?? null });
    const token = issueToken({
      userId: newUser.id,
      email: newUser.email,
      username: newUser.username,
      firstname: newUser.firstname,
      role: newUser.role,
    });
    res.status(201).json({
      token,
      user: { id: newUser.id, username: newUser.username, email: newUser.email, firstname: newUser.firstname, surname: newUser.surname, role: newUser.role },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/user/:userId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId as string);
    if (!req.user || req.user.userId !== userId) {
      return res.status(403).json({ error: 'You can only access your own user data' });
    }
    const userInfo = await UserManager.getUserInfo(userId);
    if (!userInfo) return res.status(404).json({ error: 'User not found' });
    res.json(userInfo);
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/user/:userId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId as string);
    if (!req.user || req.user.userId !== userId) {
      return res.status(403).json({ error: 'You can only update your own details' });
    }
    const { username, email, firstname, surname, age, gender } = req.body;
    const fields = { username, email, firstname, surname, age, gender };
    const updates = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided' });
    }
    const updated = await UserManager.updateUser(userId, updates);
    if (!updated) return res.status(404).json({ error: 'User not found' });
    const { password_hash, ...safe } = updated;
    res.json(safe);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/user/:userId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId as string);
    if (!req.user || req.user.userId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own account' });
    }
    const deleted = await UserManager.deleteUser(userId);
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/user/:userId/profile-picture', authenticateJWT, upload.any(), async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId as string);
    if (!req.user || req.user.userId !== userId) {
      return res.status(403).json({ error: 'You can only update your own profile picture' });
    }
    const file = (req.files as Express.Multer.File[])?.[0];
    if (!file) return res.status(400).json({ error: 'An image file is required' });
    const uploaded = await ImageHandler.uploadImage(file.buffer, file.mimetype, userId);
    const updated = await UserManager.setProfilePicture(userId, uploaded.id);
    if (!updated) return res.status(404).json({ error: 'User not found' });
    const { password_hash, ...safe } = updated;
    res.json(safe);
  } catch (error) {
    console.error('Error setting profile picture:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
