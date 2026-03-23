// User Manager - Handles user-related operations
// Interfaces with dbHandler.js for database operations

import bcrypt from 'bcrypt';
import {
  getUserById,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  setProfilePicture,
  upsertUserCpr
} from './dbHandler.js';

interface User {
  id: number;
  username: string;
  email: string;
  firstname: string;
  surname: string;
  password_hash: string;
  age?: number | null;
  gender?: string | null;
  profile_picture?: number | null;
  role: 'user' | 'admin';
  created_at?: string;
  updated_at?: string;
  donations?: any[];
}

interface UserCreationData {
  username: string;
  email: string;
  firstname: string;
  surname: string;
  password_hash: string;
  age?: number | null;
  gender?: string | null;
}

export class UserManager {
  /**
   * Authenticate a user by email and password
   * @param email - User's email
   * @param password - User's password (plain text)
   * @returns Promise<User | null> - Authenticated user or null if authentication fails
   */
  static async authenticateUser(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.findUserByEmail(email);
      if (!user) {
        return null;
      }

      // Compare hashed password
      const passwordMatch = await this.comparePasswords(password, user.password_hash);
      return passwordMatch ? user : null;
    } catch (error) {
      console.error(`Error authenticating user with email ${email}:`, error);
      throw error;
    }
  }

  /**
   * Compare plain text password with hashed password
   * @param plainPassword - Plain text password
   * @param hashedPassword - Hashed password from database
   * @returns Promise<boolean> - True if passwords match
   */
  private static async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Error comparing passwords:', error);
      throw error;
    }
  }

  /**
   * Get user information by ID (excluding password)
   * @param userId - The ID of the user to retrieve
   * @returns Promise<Object | null> - User object without password_hash or null if not found
   */
  static async getUserInfo(userId: number): Promise<any | null> {
    try {
      const user = await getUserById(userId);
      
      if (!user) {
        return null;
      }
      
      // Create a safe user object without password_hash
      const { password_hash, ...userWithoutPassword } = user;
      
      return {
        ...userWithoutPassword,
        donations: user.donations || []
      };
    } catch (error) {
      console.error(`Error getting user info for ID ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new user
   * @param userData - User data for creation
   * @returns Promise<User> - The newly created user
   */
  static async createUser(userData: UserCreationData): Promise<User> {
    try {
      // Basic validation
      if (!userData.username || !userData.email || !userData.password_hash) {
        throw new Error('Missing required user data');
      }

      if (!this.isValidEmail(userData.email)) {
        throw new Error('Invalid email format');
      }

      return await createUser({ ...userData, email: userData.email.toLowerCase() });
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Set the profile picture for a user
   * @param userId - The ID of the user
   * @param imageId - The ID of the image to set as profile picture
   * @returns Promise<User | null> - Updated user or null if not found
   */
  static async updateUser(userId: number, fields: Partial<Pick<User, 'username' | 'email' | 'firstname' | 'surname' | 'age' | 'gender'>>): Promise<User | null> {
    try {
      return await updateUser(userId, fields);
    } catch (error) {
      console.error(`Error updating user ${userId}:`, error);
      throw error;
    }
  }

  static async deleteUser(userId: number): Promise<boolean> {
    try {
      return await deleteUser(userId);
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error);
      throw error;
    }
  }

  static async setProfilePicture(userId: number, imageId: number): Promise<User | null> {
    try {
      return await setProfilePicture(userId, imageId);
    } catch (error) {
      console.error(`Error setting profile picture for user ${userId}:`, error);
      throw error;
    }
  }

  static async upsertCpr(userId: number, cprNumber: string): Promise<void> {
    try {
      await upsertUserCpr(userId, cprNumber);
    } catch (error) {
      console.error(`Error upserting CPR for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Validate email format
   * @param email - Email to validate
   * @returns boolean - True if email is valid
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Find user by email
   * @param email - Email to search for
   * @returns Promise<User | null> - User object or null if not found
   */
  private static async findUserByEmail(email: string): Promise<User | null> {
    try {
      const allUsers = await getAllUsers();
      return allUsers.find((user: User) => user.email.toLowerCase() === email.toLowerCase()) || null;
    } catch (error) {
      console.error(`Error finding user by email ${email}:`, error);
      throw error;
    }
  }

  /**
   * Check if a user exists by email (public method)
   * @param email - Email to check
   * @returns Promise<boolean> - True if user exists
   */
  static async userExists(email: string): Promise<boolean> {
    try {
      const user = await this.findUserByEmail(email);
      return !!user;
    } catch (error) {
      console.error(`Error checking if user exists with email ${email}:`, error);
      throw error;
    }
  }
}