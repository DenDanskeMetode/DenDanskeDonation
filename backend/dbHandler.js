// Database Handler for DenDanskeDonation
// Manages all database operations and connections

const { Pool } = require('pg');
const dotenv = require('dotenv');

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
    const donationsQuery = 'SELECT d.*, c.name as campain_name FROM donations d JOIN campains c ON d.to_campain = c.id WHERE d.from_user = $1';
    
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
    const campaignQuery = 'SELECT * FROM campains WHERE id = $1';
    const donationsQuery = 'SELECT d.*, u.name as user_name, u.email as user_email FROM donations d JOIN users u ON d.from_user = u.id WHERE d.to_campain = $1';
    
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
    const donationsQuery = 'SELECT d.*, c.name as campain_name FROM donations d JOIN campains c ON d.to_campain = c.id WHERE d.from_user = $1';
    
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
    const campaignsQuery = 'SELECT * FROM campains';
    const donationsQuery = 'SELECT d.*, u.name as user_name, u.email as user_email FROM donations d JOIN users u ON d.from_user = u.id WHERE d.to_campain = $1';
    
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
    const { name, email, password_hash } = userData;
    const query = 'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *';
    const result = await executeQuery(query, [name, email, password_hash]);
    return result[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

async function createCampaign(campaignData) {
  try {
    const { name } = campaignData;
    const query = 'INSERT INTO campains (name) VALUES ($1) RETURNING *';
    const result = await executeQuery(query, [name]);
    return result[0];
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
}

async function createDonation(donationData) {
  try {
    const { from_user, to_campain, amount } = donationData;
    const query = 'INSERT INTO donations (from_user, to_campain, amount) VALUES ($1, $2, $3) RETURNING *';
    const result = await executeQuery(query, [from_user, to_campain, amount]);
    return result[0];
  } catch (error) {
    console.error('Error creating donation:', error);
    throw error;
  }
}

module.exports = {
  getUserById,
  getCampaignById,
  getAllUsers,
  getAllCampaigns,
  createUser,
  createCampaign,
  createDonation,
};