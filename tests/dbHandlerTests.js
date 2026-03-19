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
      const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' };
      const mockDonations = [
        { id: 1, from_user: 1, to_campain: 1, amount: 100, campain_name: 'Test Campaign' }
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
      const mockCampaign = { id: 1, name: 'Test Campaign' };
      const mockDonations = [
        { id: 1, from_user: 1, to_campain: 1, amount: 100, user_name: 'Test User', user_email: 'test@example.com' }
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
        { id: 1, name: 'User 1', email: 'user1@example.com' },
        { id: 2, name: 'User 2', email: 'user2@example.com' }
      ];
      
      const mockDonations = [
        { id: 1, from_user: 1, to_campain: 1, amount: 100, campain_name: 'Campaign 1' }
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
        { id: 1, name: 'Campaign 1' },
        { id: 2, name: 'Campaign 2' }
      ];
      
      const mockDonations = [
        { id: 1, from_user: 1, to_campain: 1, amount: 100, user_name: 'User 1', user_email: 'user1@example.com' }
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
      const mockUserData = { name: 'New User', email: 'new@example.com', password_hash: 'hashedpassword' };
      const mockCreatedUser = { id: 1, ...mockUserData };
      
      pool.query.mockImplementationOnce(() => Promise.resolve({ rows: [mockCreatedUser] }));
      
      const result = await createUser(mockUserData);
      
      expect(result).toEqual(mockCreatedUser);
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
        [mockUserData.name, mockUserData.email, mockUserData.password_hash]
      );
    });
    
    it('should throw error when user creation fails', async () => {
      pool.query.mockImplementationOnce(() => Promise.reject(new Error('DB error')));
      
      const userData = { name: 'New User', email: 'new@example.com', password_hash: 'hashedpassword' };
      
      await expect(createUser(userData)).rejects.toThrow('DB error');
    });
  });

  describe('createCampaign', () => {
    it('should create a new campaign and return the created campaign', async () => {
      const mockCampaignData = { name: 'New Campaign' };
      const mockCreatedCampaign = { id: 1, ...mockCampaignData };
      
      pool.query.mockImplementationOnce(() => Promise.resolve({ rows: [mockCreatedCampaign] }));
      
      const result = await createCampaign(mockCampaignData);
      
      expect(result).toEqual(mockCreatedCampaign);
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO campains (name) VALUES ($1) RETURNING *',
        [mockCampaignData.name]
      );
    });
    
    it('should throw error when campaign creation fails', async () => {
      pool.query.mockImplementationOnce(() => Promise.reject(new Error('DB error')));
      
      const campaignData = { name: 'New Campaign' };
      
      await expect(createCampaign(campaignData)).rejects.toThrow('DB error');
    });
  });

  describe('createDonation', () => {
    it('should create a new donation and return the created donation', async () => {
      const mockDonationData = { from_user: 1, to_campain: 1, amount: 100 };
      const mockCreatedDonation = { id: 1, ...mockDonationData };
      
      pool.query.mockImplementationOnce(() => Promise.resolve({ rows: [mockCreatedDonation] }));
      
      const result = await createDonation(mockDonationData);
      
      expect(result).toEqual(mockCreatedDonation);
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO donations (from_user, to_campain, amount) VALUES ($1, $2, $3) RETURNING *',
        [mockDonationData.from_user, mockDonationData.to_campain, mockDonationData.amount]
      );
    });
    
    it('should throw error when donation creation fails', async () => {
      pool.query.mockImplementationOnce(() => Promise.reject(new Error('DB error')));
      
      const donationData = { from_user: 1, to_campain: 1, amount: 100 };
      
      await expect(createDonation(donationData)).rejects.toThrow('DB error');
    });
  });
});