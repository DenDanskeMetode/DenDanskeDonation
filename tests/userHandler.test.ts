import { UserManager } from '../backend/services/userHandler.js';

jest.mock('../backend/dbHandler', () => ({
  getUserById: jest.fn(),
  getUserByEmail: jest.fn(),
  createUser: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import * as dbHandler from '../backend/dbHandler.js';
import bcrypt from 'bcrypt';

const mockGetUserById = dbHandler.getUserById as jest.Mock;
const mockGetUserByEmail = dbHandler.getUserByEmail as jest.Mock;
const mockCreateUser = dbHandler.createUser as jest.Mock;
const mockBcryptCompare = bcrypt.compare as jest.Mock;
const mockBcryptHash = bcrypt.hash as jest.Mock;

const mockUser = {
  id: 1,
  username: 'johndoe',
  email: 'john@example.com',
  firstname: 'John',
  surname: 'Doe',
  password_hash: '$2b$10$hashedpassword',
  donations: [],
};

describe('UserManager', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('authenticateUser', () => {
    it('returns user on valid credentials', async () => {
      mockGetUserByEmail.mockResolvedValue(mockUser);
      mockBcryptCompare.mockResolvedValue(true);
      const result = await UserManager.authenticateUser('john@example.com', 'password123');
      expect(result).toEqual(mockUser);
    });

    it('returns null when email not found', async () => {
      mockGetUserByEmail.mockResolvedValue(null);
      const result = await UserManager.authenticateUser('nobody@example.com', 'password123');
      expect(result).toBeNull();
      expect(mockBcryptCompare).not.toHaveBeenCalled();
    });

    it('returns null on wrong password', async () => {
      mockGetUserByEmail.mockResolvedValue(mockUser);
      mockBcryptCompare.mockResolvedValue(false);
      const result = await UserManager.authenticateUser('john@example.com', 'wrongpass');
      expect(result).toBeNull();
    });

    it('propagates db errors', async () => {
      mockGetUserByEmail.mockRejectedValue(new Error('DB error'));
      await expect(UserManager.authenticateUser('john@example.com', 'pass')).rejects.toThrow('DB error');
    });
  });

  describe('getUserInfo', () => {
    it('returns user without password_hash', async () => {
      mockGetUserById.mockResolvedValue(mockUser);
      const result = await UserManager.getUserInfo(1);
      expect(result).not.toHaveProperty('password_hash');
      expect(result.username).toBe('johndoe');
      expect(result.email).toBe('john@example.com');
    });

    it('includes donations in the result', async () => {
      const userWithDonations = { ...mockUser, donations: [{ id: 1, from_user: 1, to_campaign: 2, amount: 100 }] };
      mockGetUserById.mockResolvedValue(userWithDonations);
      const result = await UserManager.getUserInfo(1);
      expect(result.donations).toHaveLength(1);
    });

    it('returns empty donations array when user has none', async () => {
      mockGetUserById.mockResolvedValue({ ...mockUser, donations: undefined });
      const result = await UserManager.getUserInfo(1);
      expect(result.donations).toEqual([]);
    });

    it('returns null when user not found', async () => {
      mockGetUserById.mockResolvedValue(null);
      const result = await UserManager.getUserInfo(99);
      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    const newUserData = {
      username: 'janedoe',
      email: 'jane@example.com',
      firstname: 'Jane',
      surname: 'Doe',
      password: 'plainpassword',
    };

    it('creates and returns the new user', async () => {
      const created = { id: 2, ...newUserData, password_hash: 'hashed', donations: [] };
      mockBcryptHash.mockResolvedValue('hashed');
      mockCreateUser.mockResolvedValue(created);
      const result = await UserManager.createUser(newUserData);
      expect(result).toEqual(created);
      expect(mockBcryptHash).toHaveBeenCalledWith('plainpassword', 10);
      expect(mockCreateUser).toHaveBeenCalledWith(expect.objectContaining({ password_hash: 'hashed' }));
    });

    it('throws on invalid email format', async () => {
      await expect(UserManager.createUser({ ...newUserData, email: 'not-an-email' }))
        .rejects.toThrow('Invalid email format');
    });

    it('throws when required fields are missing', async () => {
      await expect(UserManager.createUser({ ...newUserData, username: '' }))
        .rejects.toThrow('Missing required user data');
    });
  });

  describe('userExists', () => {
    it('returns true when user with that email exists', async () => {
      mockGetUserByEmail.mockResolvedValue(mockUser);
      expect(await UserManager.userExists('john@example.com')).toBe(true);
    });

    it('returns false when no user with that email', async () => {
      mockGetUserByEmail.mockResolvedValue(null);
      expect(await UserManager.userExists('nobody@example.com')).toBe(false);
    });

    it('returns false for empty user list', async () => {
      mockGetUserByEmail.mockResolvedValue(null);
      expect(await UserManager.userExists('john@example.com')).toBe(false);
    });
  });
});
