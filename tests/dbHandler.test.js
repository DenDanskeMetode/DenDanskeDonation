// Test suite for dbHandler.js
// Using Jest testing framework

const {
  getUserById,
  getCampaignById,
  getAllUsers,
  getAllCampaigns,
  createUser,
  createCampaign,
  createDonation
} = require('../backend/dbHandler');
const { Pool } = require('pg');

// Mock the pg Pool
jest.mock('pg', () => {
  const mockPool = {
    query: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mockPool) };
});

describe('Database Handler Tests', () => {
  let pool;

  beforeAll(() => {
    pool = new Pool();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should return user with donations when user exists', async () => {
      const mockUser = { id: 1, username: 'johndoe', firstname: 'John', surname: 'Doe', email: 'test@example.com' };
      const mockDonations = [
        { id: 1, from_user: 1, to_campaign: 1, amount: 100, campaign_title: 'Test Campaign' }
      ];

      pool.query
        .mockImplementationOnce(() => Promise.resolve({ rows: [mockUser] }))
        .mockImplementationOnce(() => Promise.resolve({ rows: mockDonations }));

      const result = await getUserById(1);

      expect(result).toEqual({ ...mockUser, donations: mockDonations });
      expect(pool.query).toHaveBeenCalledTimes(2);
    });

    it('should return null when user does not exist', async () => {
      pool.query.mockImplementationOnce(() => Promise.resolve({ rows: [] }));

      const result = await getUserById(999);

      expect(result).toBeNull();
      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    it('should throw error when database query fails', async () => {
      pool.query.mockImplementationOnce(() => Promise.reject(new Error('DB error')));

      await expect(getUserById(1)).rejects.toThrow('DB error');
    });
  });

  describe('getCampaignById', () => {
    it('should return campaign with donations when campaign exists', async () => {
      const mockCampaign = { id: 1, title: 'Test Campaign', description: 'desc', goal: 1000 };
      const mockDonations = [
        { id: 1, from_user: 1, to_campaign: 1, amount: 100, user_name: 'johndoe', user_email: 'test@example.com' }
      ];

      pool.query
        .mockImplementationOnce(() => Promise.resolve({ rows: [mockCampaign] }))
        .mockImplementationOnce(() => Promise.resolve({ rows: mockDonations }));

      const result = await getCampaignById(1);

      expect(result).toEqual({ ...mockCampaign, donations: mockDonations });
      expect(pool.query).toHaveBeenCalledTimes(2);
    });

    it('should return null when campaign does not exist', async () => {
      pool.query.mockImplementationOnce(() => Promise.resolve({ rows: [] }));

      const result = await getCampaignById(999);

      expect(result).toBeNull();
      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAllUsers', () => {
    it('should return all users with their donations', async () => {
      const mockUsers = [
        { id: 1, username: 'user1', firstname: 'User', surname: 'One', email: 'user1@example.com' },
        { id: 2, username: 'user2', firstname: 'User', surname: 'Two', email: 'user2@example.com' }
      ];

      const mockDonations = [
        { id: 1, from_user: 1, to_campaign: 1, amount: 100, campaign_title: 'Campaign 1' }
      ];

      pool.query
        .mockImplementationOnce(() => Promise.resolve({ rows: mockUsers }))
        .mockImplementationOnce(() => Promise.resolve({ rows: mockDonations }))
        .mockImplementationOnce(() => Promise.resolve({ rows: [] }));

      const result = await getAllUsers();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('donations');
      expect(result[1]).toHaveProperty('donations');
      expect(pool.query).toHaveBeenCalledTimes(3);
    });
  });

  describe('getAllCampaigns', () => {
    it('should return all campaigns with their donations', async () => {
      const mockCampaigns = [
        { id: 1, title: 'Campaign 1', goal: 1000 },
        { id: 2, title: 'Campaign 2', goal: 2000 }
      ];

      const mockDonations = [
        { id: 1, from_user: 1, to_campaign: 1, amount: 100, user_name: 'user1', user_email: 'user1@example.com' }
      ];

      pool.query
        .mockImplementationOnce(() => Promise.resolve({ rows: mockCampaigns }))
        .mockImplementationOnce(() => Promise.resolve({ rows: mockDonations }))
        .mockImplementationOnce(() => Promise.resolve({ rows: [] }));

      const result = await getAllCampaigns();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('donations');
      expect(result[1]).toHaveProperty('donations');
      expect(pool.query).toHaveBeenCalledTimes(3);
    });
  });

  describe('createUser', () => {
    it('should create a new user and return the created user', async () => {
      const mockUserData = { username: 'johndoe', firstname: 'John', surname: 'Doe', email: 'new@example.com', password_hash: 'hashedpassword', age: 30, gender: 'male' };
      const mockCreatedUser = { id: 1, ...mockUserData };

      pool.query.mockImplementationOnce(() => Promise.resolve({ rows: [mockCreatedUser] }));

      const result = await createUser(mockUserData);

      expect(result).toEqual(mockCreatedUser);
      expect(pool.query).toHaveBeenCalledWith(
        "INSERT INTO users (username, email, firstname, surname, password_hash, age, gender, role) VALUES ($1, $2, $3, $4, $5, $6, $7, 'user') RETURNING *",
        [mockUserData.username, mockUserData.email, mockUserData.firstname, mockUserData.surname, mockUserData.password_hash, mockUserData.age, mockUserData.gender]
      );
    });

    it('should throw error when user creation fails', async () => {
      pool.query.mockImplementationOnce(() => Promise.reject(new Error('DB error')));

      const userData = { username: 'johndoe', firstname: 'John', surname: 'Doe', email: 'new@example.com', password_hash: 'hashedpassword' };

      await expect(createUser(userData)).rejects.toThrow('DB error');
    });
  });

  describe('createCampaign', () => {
    it('should create a new campaign and return the created campaign', async () => {
      const mockCampaignData = { title: 'New Campaign', description: 'desc', tags: [], goal: 5000, milestones: [], city_name: 'Copenhagen', created_by: 1 };
      const mockCreatedCampaign = { id: 1, ...mockCampaignData };

      pool.query.mockImplementationOnce(() => Promise.resolve({ rows: [mockCreatedCampaign] }));

      const result = await createCampaign(mockCampaignData);

      expect(result).toEqual(mockCreatedCampaign);
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO campaigns (title, description, tags, goal, milestones, city_name, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [mockCampaignData.title, mockCampaignData.description, mockCampaignData.tags, mockCampaignData.goal, mockCampaignData.milestones, mockCampaignData.city_name, mockCampaignData.created_by]
      );
    });

    it('should throw error when campaign creation fails', async () => {
      pool.query.mockImplementationOnce(() => Promise.reject(new Error('DB error')));

      await expect(createCampaign({ title: 'New Campaign' })).rejects.toThrow('DB error');
    });
  });

  describe('createDonation', () => {
    it('should create a new donation and return the created donation', async () => {
      const mockDonationData = { from_user: 1, to_campaign: 1, amount: 100 };
      const mockCreatedDonation = { id: 1, ...mockDonationData };

      pool.query.mockImplementationOnce(() => Promise.resolve({ rows: [mockCreatedDonation] }));

      const result = await createDonation(mockDonationData);

      expect(result).toEqual(mockCreatedDonation);
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO donations (from_user, to_campaign, amount) VALUES ($1, $2, $3) RETURNING *',
        [mockDonationData.from_user, mockDonationData.to_campaign, mockDonationData.amount]
      );
    });

    it('should throw error when donation creation fails', async () => {
      pool.query.mockImplementationOnce(() => Promise.reject(new Error('DB error')));

      await expect(createDonation({ from_user: 1, to_campaign: 1, amount: 100 })).rejects.toThrow('DB error');
    });
  });
});
