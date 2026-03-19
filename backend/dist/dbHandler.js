// Database Handler for DenDanskeDonation
// Manages all database operations and connections

import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database configuration
const dbConfig = {
  user: process.env.POSTGRES_USER,
  host: process.env.DB_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.DB_PORT,
};

// Create connection pool
const pool = new Pool(dbConfig);

// Helper function for database queries
async function executeQuery(query, params = []) {
  try {
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

async function getUserById(userId) {
  try {
    const userQuery = 'SELECT * FROM users WHERE id = $1';
    const donationsQuery = 'SELECT d.*, c.title as campaign_title FROM donations d JOIN campaigns c ON d.to_campaign = c.id WHERE d.from_user = $1';

    const userResult = await pool.query(userQuery, [userId]);
    if (userResult.rows.length === 0) return null;

    const donationsResult = await pool.query(donationsQuery, [userId]);

    const user = userResult.rows[0];
    user.donations = donationsResult.rows;

    return user;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}

async function getCampaignById(campaignId) {
  try {
    const campaignQuery = 'SELECT * FROM campaigns WHERE id = $1';
    const donationsQuery = 'SELECT d.*, u.username as user_name, u.email as user_email FROM donations d JOIN users u ON d.from_user = u.id WHERE d.to_campaign = $1';
    
    const campaignResult = await pool.query(campaignQuery, [campaignId]);
    if (campaignResult.rows.length === 0) return null;
    
    const donationsResult = await pool.query(donationsQuery, [campaignId]);
    
    const campaign = campaignResult.rows[0];
    campaign.donations = donationsResult.rows;
    
    return campaign;
  } catch (error) {
    console.error('Error getting campaign by ID:', error);
    throw error;
  }
}

async function getAllUsers() {
  try {
    const usersQuery = 'SELECT * FROM users';
    const donationsQuery = 'SELECT d.*, c.title as campaign_title FROM donations d JOIN campaigns c ON d.to_campaign = c.id WHERE d.from_user = $1';
    
    const usersResult = await pool.query(usersQuery);
    
    const usersWithDonations = await Promise.all(
      usersResult.rows.map(async (user) => {
        const donationsResult = await pool.query(donationsQuery, [user.id]);
        user.donations = donationsResult.rows;
        return user;
      })
    );
    
    return usersWithDonations;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}

async function getAllCampaigns() {
  try {
    const campaignsQuery = 'SELECT * FROM campaigns';
    const donationsQuery = 'SELECT d.*, u.username as user_name, u.email as user_email FROM donations d JOIN users u ON d.from_user = u.id WHERE d.to_campaign = $1';
    
    const campaignsResult = await pool.query(campaignsQuery);
    
    const campaignsWithDonations = await Promise.all(
      campaignsResult.rows.map(async (campaign) => {
        const donationsResult = await pool.query(donationsQuery, [campaign.id]);
        campaign.donations = donationsResult.rows;
        return campaign;
      })
    );
    
    return campaignsWithDonations;
  } catch (error) {
    console.error('Error getting all campaigns:', error);
    throw error;
  }
}

async function createUser(userData) {
  try {
    const { username, email, firstname, surname, password_hash } = userData;
    const query = 'INSERT INTO users (username, email, firstname, surname, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING *';
    const result = await executeQuery(query, [username, email, firstname, surname, password_hash]);
    return result[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

async function createCampaign(campaignData) {
  try {
    const { title, description, tags, goal, milestones, city_name } = campaignData;
    const query = 'INSERT INTO campaigns (title, description, tags, goal, milestones, city_name) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
    const result = await executeQuery(query, [title, description, tags, goal, milestones, city_name]);
    return result[0];
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
}

async function createDonation(donationData) {
  try {
    const { from_user, to_campaign, amount } = donationData;
    const query = 'INSERT INTO donations (from_user, to_campaign, amount) VALUES ($1, $2, $3) RETURNING *';
    const result = await executeQuery(query, [from_user, to_campaign, amount]);
    return result[0];
  } catch (error) {
    console.error('Error creating donation:', error);
    throw error;
  }
}

export {
  getUserById,
  getCampaignById,
  getAllUsers,
  getAllCampaigns,
  createUser,
  createCampaign,
  createDonation,
};