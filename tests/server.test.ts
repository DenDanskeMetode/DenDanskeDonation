import request from 'supertest';

// Mock pg to prevent real DB connections
jest.mock('pg', () => {
  const mPool = { query: jest.fn(), end: jest.fn() };
  return { Pool: jest.fn(() => mPool) };
});

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

// Mock JWTHandler
jest.mock('../backend/JWTHandler', () => ({
  issueToken: jest.fn().mockReturnValue('mock-jwt-token'),
  validateToken: jest.fn().mockReturnValue({ userId: 1, email: 'john@example.com', username: 'johndoe' }),
}));

// Mock UserManager
jest.mock('../backend/userHandler', () => ({
  UserManager: {
    authenticateUser: jest.fn(),
    createUser: jest.fn(),
    getUserInfo: jest.fn(),
    userExists: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    setProfilePicture: jest.fn(),
  },
}));

// Mock CampaignManager
jest.mock('../backend/campaignHandler', () => ({
  __esModule: true,
  default: {
    getAllCampaigns: jest.fn(),
    getCampaignById: jest.fn(),
    createCampaign: jest.fn(),
    updateCampaign: jest.fn(),
    deleteCampaign: jest.fn(),
    addImage: jest.fn(),
    getImages: jest.fn(),
  },
}));

// Mock DonationManager
jest.mock('../backend/donationHandler', () => ({
  __esModule: true,
  default: {
    donate: jest.fn(),
  },
}));

// Mock ImageHandler
jest.mock('../backend/imageHandler', () => ({
  __esModule: true,
  default: {
    getImage: jest.fn(),
    uploadImage: jest.fn(),
  },
}));

import { app } from '../backend/server.js';
import { UserManager } from '../backend/userHandler.js';
import CampaignManager from '../backend/campaignHandler.js';
import DonationManager from '../backend/donationHandler.js';
import ImageHandler from '../backend/imageHandler.js';
import { validateToken } from '../backend/JWTHandler.js';

const mockUserManager = UserManager as jest.Mocked<typeof UserManager>;
const mockCampaignManager = CampaignManager as jest.Mocked<typeof CampaignManager>;
const mockDonationManager = DonationManager as jest.Mocked<typeof DonationManager>;
const mockImageHandler = ImageHandler as jest.Mocked<typeof ImageHandler>;
const mockValidateToken = validateToken as jest.Mock;

const AUTH_HEADER = { Authorization: 'Bearer mock-jwt-token' };

const mockUser = {
  id: 1,
  username: 'johndoe',
  email: 'john@example.com',
  firstname: 'John',
  surname: 'Doe',
  password_hash: 'hashed',
  donations: [],
};

const mockCampaign = {
  id: 1,
  title: 'Clean Water Initiative',
  description: 'desc',
  tags: ['water'],
  goal: 1000,
  is_complete: false,
  milestones: [],
  city_name: 'Copenhagen',
  created_by: 1,
  donations: [],
};

describe('Server endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateToken.mockReturnValue({ userId: 1, email: 'john@example.com', username: 'johndoe' });
  });

  describe('GET /', () => {
    it('returns 200', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/message', () => {
    it('returns a message object', async () => {
      const res = await request(app).get('/api/message');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('POST /api/login', () => {
    it('returns 400 when fields are missing', async () => {
      const res = await request(app).post('/api/login').send({ email: 'john@example.com' });
      expect(res.status).toBe(400);
    });

    it('returns 401 on invalid credentials', async () => {
      mockUserManager.authenticateUser.mockResolvedValue(null);
      const res = await request(app).post('/api/login').send({ email: 'john@example.com', password: 'wrong' });
      expect(res.status).toBe(401);
    });

    it('returns 200 with token on valid login', async () => {
      mockUserManager.authenticateUser.mockResolvedValue(mockUser);
      const res = await request(app).post('/api/login').send({ email: 'john@example.com', password: 'correct' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
    });
  });

  describe('POST /api/register', () => {
    const validBody = {
      username: 'johndoe',
      email: 'john@example.com',
      firstname: 'John',
      surname: 'Doe',
      password: 'password123',
    };

    it('returns 400 when fields are missing', async () => {
      const res = await request(app).post('/api/register').send({ email: 'john@example.com' });
      expect(res.status).toBe(400);
    });

    it('returns 409 when email already exists', async () => {
      mockUserManager.userExists.mockResolvedValue(true);
      const res = await request(app).post('/api/register').send(validBody);
      expect(res.status).toBe(409);
    });

    it('returns 201 with token on successful registration', async () => {
      mockUserManager.userExists.mockResolvedValue(false);
      mockUserManager.createUser.mockResolvedValue(mockUser);
      const res = await request(app).post('/api/register').send(validBody);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('id');
    });
  });

  describe('GET /api/user/:userId', () => {
    it('returns 401 without token', async () => {
      mockValidateToken.mockReturnValue(null);
      const res = await request(app).get('/api/user/1');
      expect(res.status).toBe(401);
    });

    it('returns 403 when accessing another user', async () => {
      mockValidateToken.mockReturnValue({ userId: 2, email: 'other@example.com', username: 'other' });
      const res = await request(app).get('/api/user/1').set(AUTH_HEADER);
      expect(res.status).toBe(403);
    });

    it('returns 404 when user not found', async () => {
      mockUserManager.getUserInfo.mockResolvedValue(null);
      const res = await request(app).get('/api/user/1').set(AUTH_HEADER);
      expect(res.status).toBe(404);
    });

    it('returns 200 with user data for own profile', async () => {
      mockUserManager.getUserInfo.mockResolvedValue(mockUser);
      const res = await request(app).get('/api/user/1').set(AUTH_HEADER);
      expect(res.status).toBe(200);
      expect(res.body.username).toBe('johndoe');
    });
  });

  describe('PATCH /api/user/:userId', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).patch('/api/user/1').send({ username: 'newname' });
      expect(res.status).toBe(401);
    });

    it('returns 403 when updating another user', async () => {
      mockValidateToken.mockReturnValue({ userId: 2, email: 'other@example.com', username: 'other' });
      const res = await request(app).patch('/api/user/1').set(AUTH_HEADER).send({ username: 'newname' });
      expect(res.status).toBe(403);
    });

    it('returns 400 when no valid fields provided', async () => {
      const res = await request(app).patch('/api/user/1').set(AUTH_HEADER).send({});
      expect(res.status).toBe(400);
    });

    it('returns 404 when user not found', async () => {
      mockUserManager.updateUser.mockResolvedValue(null);
      const res = await request(app).patch('/api/user/1').set(AUTH_HEADER).send({ username: 'newname' });
      expect(res.status).toBe(404);
    });

    it('returns 200 with updated user on success', async () => {
      mockUserManager.updateUser.mockResolvedValue({ ...mockUser, username: 'newname' });
      const res = await request(app).patch('/api/user/1').set(AUTH_HEADER).send({ username: 'newname' });
      expect(res.status).toBe(200);
      expect(res.body.username).toBe('newname');
      expect(res.body).not.toHaveProperty('password_hash');
    });
  });

  describe('DELETE /api/user/:userId', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).delete('/api/user/1');
      expect(res.status).toBe(401);
    });

    it('returns 403 when deleting another user', async () => {
      mockValidateToken.mockReturnValue({ userId: 2, email: 'other@example.com', username: 'other' });
      const res = await request(app).delete('/api/user/1').set(AUTH_HEADER);
      expect(res.status).toBe(403);
    });

    it('returns 404 when user not found', async () => {
      mockUserManager.deleteUser.mockResolvedValue(false);
      const res = await request(app).delete('/api/user/1').set(AUTH_HEADER);
      expect(res.status).toBe(404);
    });

    it('returns 204 on successful deletion', async () => {
      mockUserManager.deleteUser.mockResolvedValue(true);
      const res = await request(app).delete('/api/user/1').set(AUTH_HEADER);
      expect(res.status).toBe(204);
    });
  });

  describe('PUT /api/user/:userId/profile-picture', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).put('/api/user/1/profile-picture').attach('file', Buffer.from('img'), 'photo.jpg');
      expect(res.status).toBe(401);
    });

    it('returns 403 when updating another user', async () => {
      mockValidateToken.mockReturnValue({ userId: 2, email: 'other@example.com', username: 'other' });
      const res = await request(app)
        .put('/api/user/1/profile-picture')
        .set(AUTH_HEADER)
        .attach('file', Buffer.from('img'), { filename: 'photo.jpg', contentType: 'image/jpeg' });
      expect(res.status).toBe(403);
    });

    it('returns 400 when no file provided', async () => {
      const res = await request(app).put('/api/user/1/profile-picture').set(AUTH_HEADER);
      expect(res.status).toBe(400);
    });

    it('returns 200 with updated user on success', async () => {
      const uploadedImage = { id: 10, mime_type: 'image/jpeg', uploaded_by: 1 };
      mockImageHandler.uploadImage.mockResolvedValue(uploadedImage);
      mockUserManager.setProfilePicture.mockResolvedValue({ ...mockUser, profile_picture: 10 });
      const res = await request(app)
        .put('/api/user/1/profile-picture')
        .set(AUTH_HEADER)
        .attach('file', Buffer.from('img'), { filename: 'photo.jpg', contentType: 'image/jpeg' });
      expect(res.status).toBe(200);
      expect(res.body).not.toHaveProperty('password_hash');
    });
  });

  describe('POST /api/campaigns', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).post('/api/campaigns').send({ title: 'Test' });
      expect(res.status).toBe(401);
    });

    it('returns 400 when title is missing', async () => {
      const res = await request(app).post('/api/campaigns').set(AUTH_HEADER).send({ description: 'no title' });
      expect(res.status).toBe(400);
    });

    it('returns 201 with campaign on success', async () => {
      mockCampaignManager.createCampaign.mockResolvedValue(mockCampaign);
      const res = await request(app).post('/api/campaigns').set(AUTH_HEADER).send({ title: 'Clean Water Initiative' });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Clean Water Initiative');
    });

    it('passes created_by from JWT', async () => {
      mockCampaignManager.createCampaign.mockResolvedValue(mockCampaign);
      await request(app).post('/api/campaigns').set(AUTH_HEADER).send({ title: 'Test' });
      expect(mockCampaignManager.createCampaign).toHaveBeenCalledWith(
        expect.objectContaining({ created_by: 1 })
      );
    });
  });

  describe('GET /api/campaigns', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/campaigns');
      expect(res.status).toBe(401);
    });

    it('returns 200 with campaigns when authenticated', async () => {
      mockCampaignManager.getAllCampaigns.mockResolvedValue([mockCampaign]);
      const res = await request(app).get('/api/campaigns').set(AUTH_HEADER);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Clean Water Initiative');
    });
  });

  describe('GET /api/campaigns/:campaignId', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/campaigns/1');
      expect(res.status).toBe(401);
    });

    it('returns 404 when campaign not found', async () => {
      mockCampaignManager.getCampaignById.mockResolvedValue(null);
      const res = await request(app).get('/api/campaigns/99').set(AUTH_HEADER);
      expect(res.status).toBe(404);
    });

    it('returns 200 with campaign when found', async () => {
      mockCampaignManager.getCampaignById.mockResolvedValue(mockCampaign);
      const res = await request(app).get('/api/campaigns/1').set(AUTH_HEADER);
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Clean Water Initiative');
    });
  });

  describe('PATCH /api/campaigns/:campaignId', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).patch('/api/campaigns/1').send({ title: 'New' });
      expect(res.status).toBe(401);
    });

    it('returns 400 when no valid fields provided', async () => {
      const res = await request(app).patch('/api/campaigns/1').set(AUTH_HEADER).send({});
      expect(res.status).toBe(400);
    });

    it('returns 404 when campaign not found', async () => {
      mockCampaignManager.updateCampaign.mockRejectedValue(
        Object.assign(new Error('Campaign not found'), { status: 404 })
      );
      const res = await request(app).patch('/api/campaigns/99').set(AUTH_HEADER).send({ title: 'New' });
      expect(res.status).toBe(404);
    });

    it('returns 403 when updating another user\'s campaign', async () => {
      mockCampaignManager.updateCampaign.mockRejectedValue(
        Object.assign(new Error('You can only update your own campaigns'), { status: 403 })
      );
      const res = await request(app).patch('/api/campaigns/1').set(AUTH_HEADER).send({ title: 'New' });
      expect(res.status).toBe(403);
    });

    it('returns 200 with updated campaign on success', async () => {
      mockCampaignManager.updateCampaign.mockResolvedValue({ ...mockCampaign, title: 'New Title' });
      const res = await request(app).patch('/api/campaigns/1').set(AUTH_HEADER).send({ title: 'New Title' });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('New Title');
    });

    it('returns 400 when owner_ids is an empty array', async () => {
      const res = await request(app).patch('/api/campaigns/1').set(AUTH_HEADER).send({ owner_ids: [] });
      expect(res.status).toBe(400);
    });

    it('returns 200 when owner_ids is a valid non-empty array', async () => {
      mockCampaignManager.updateCampaign.mockResolvedValue({ ...mockCampaign, owner_ids: [1, 2] });
      const res = await request(app).patch('/api/campaigns/1').set(AUTH_HEADER).send({ owner_ids: [1, 2] });
      expect(res.status).toBe(200);
      expect(res.body.owner_ids).toEqual([1, 2]);
    });
  });

  describe('DELETE /api/campaigns/:campaignId', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).delete('/api/campaigns/1');
      expect(res.status).toBe(401);
    });

    it('returns 404 when campaign not found', async () => {
      mockCampaignManager.deleteCampaign.mockRejectedValue(
        Object.assign(new Error('Campaign not found'), { status: 404 })
      );
      const res = await request(app).delete('/api/campaigns/99').set(AUTH_HEADER);
      expect(res.status).toBe(404);
    });

    it('returns 403 when deleting another user\'s campaign', async () => {
      mockCampaignManager.deleteCampaign.mockRejectedValue(
        Object.assign(new Error('You can only delete your own campaigns'), { status: 403 })
      );
      const res = await request(app).delete('/api/campaigns/1').set(AUTH_HEADER);
      expect(res.status).toBe(403);
    });

    it('returns 204 on successful deletion', async () => {
      mockCampaignManager.deleteCampaign.mockResolvedValue(undefined);
      const res = await request(app).delete('/api/campaigns/1').set(AUTH_HEADER);
      expect(res.status).toBe(204);
    });
  });

  describe('POST /api/campaigns/:campaignId/images', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).post('/api/campaigns/1/images').send({ imageId: 5 });
      expect(res.status).toBe(401);
    });

    it('returns 400 when imageId is missing', async () => {
      const res = await request(app).post('/api/campaigns/1/images').set(AUTH_HEADER).send({});
      expect(res.status).toBe(400);
    });

    it('returns 403 when adding to another user\'s campaign', async () => {
      mockCampaignManager.addImage.mockRejectedValue(
        Object.assign(new Error('You can only add images to your own campaigns'), { status: 403 })
      );
      const res = await request(app).post('/api/campaigns/1/images').set(AUTH_HEADER).send({ imageId: 5 });
      expect(res.status).toBe(403);
    });

    it('returns 201 on successful image addition', async () => {
      mockCampaignManager.addImage.mockResolvedValue(undefined);
      const res = await request(app).post('/api/campaigns/1/images').set(AUTH_HEADER).send({ imageId: 5 });
      expect(res.status).toBe(201);
    });
  });

  describe('GET /api/campaigns/:campaignId/images', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/campaigns/1/images');
      expect(res.status).toBe(401);
    });

    it('returns 200 with image list', async () => {
      const images = [{ id: 5, mime_type: 'image/jpeg', uploaded_by: 1 }];
      mockCampaignManager.getImages.mockResolvedValue(images);
      const res = await request(app).get('/api/campaigns/1/images').set(AUTH_HEADER);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe(5);
    });
  });

  describe('POST /api/donations', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).post('/api/donations').send({ to_campaign: 1, amount: 100 });
      expect(res.status).toBe(401);
    });

    it('returns 400 when to_campaign is missing', async () => {
      const res = await request(app).post('/api/donations').set(AUTH_HEADER).send({ amount: 100 });
      expect(res.status).toBe(400);
    });

    it('returns 400 when amount is missing', async () => {
      const res = await request(app).post('/api/donations').set(AUTH_HEADER).send({ to_campaign: 1 });
      expect(res.status).toBe(400);
    });

    it('returns 400 when amount is 0 (handler validation)', async () => {
      mockDonationManager.donate.mockRejectedValue(new Error('Amount must be greater than 0'));
      const res = await request(app).post('/api/donations').set(AUTH_HEADER).send({ to_campaign: 1, amount: 0 });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch('Amount must be greater than 0');
    });

    it('returns 201 with donation on success', async () => {
      const donation = { id: 1, from_user: 1, to_campaign: 2, amount: 250, created_at: '2026-01-01' };
      mockDonationManager.donate.mockResolvedValue(donation);
      const res = await request(app).post('/api/donations').set(AUTH_HEADER).send({ to_campaign: 2, amount: 250 });
      expect(res.status).toBe(201);
      expect(res.body.amount).toBe(250);
    });

    it('passes from_user from JWT, not from request body', async () => {
      mockDonationManager.donate.mockResolvedValue({ id: 1, from_user: 1, to_campaign: 2, amount: 100 });
      await request(app).post('/api/donations').set(AUTH_HEADER).send({ to_campaign: 2, amount: 100 });
      expect(mockDonationManager.donate).toHaveBeenCalledWith(
        expect.objectContaining({ from_user: 1 })
      );
    });
  });

  describe('POST /api/images', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).post('/api/images').attach('file', Buffer.from('img'), 'photo.jpg');
      expect(res.status).toBe(401);
    });

    it('returns 400 when no file provided', async () => {
      const res = await request(app).post('/api/images').set(AUTH_HEADER);
      expect(res.status).toBe(400);
    });

    it('returns 201 with image metadata on success', async () => {
      const uploadedImage = { id: 10, mime_type: 'image/jpeg', uploaded_by: 1 };
      mockImageHandler.uploadImage.mockResolvedValue(uploadedImage);
      const res = await request(app)
        .post('/api/images')
        .set(AUTH_HEADER)
        .attach('file', Buffer.from('img'), { filename: 'photo.jpg', contentType: 'image/jpeg' });
      expect(res.status).toBe(201);
      expect(res.body.id).toBe(10);
    });
  });

  describe('GET /api/images/:imageId', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/images/1');
      expect(res.status).toBe(401);
    });

    it('returns 404 when image not found', async () => {
      mockImageHandler.getImage.mockResolvedValue(null);
      const res = await request(app).get('/api/images/99').set(AUTH_HEADER);
      expect(res.status).toBe(404);
    });

    it('returns raw image bytes with correct content-type', async () => {
      const imageData = { id: 1, data: Buffer.from('fake-image-data'), mime_type: 'image/jpeg', uploaded_by: 1 };
      mockImageHandler.getImage.mockResolvedValue(imageData);
      const res = await request(app).get('/api/images/1').set(AUTH_HEADER);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch('image/jpeg');
    });
  });
});
