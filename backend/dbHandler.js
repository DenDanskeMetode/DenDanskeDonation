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
    const { username, email, firstname, surname, password_hash, age, gender } = userData;
    const query = 'INSERT INTO users (username, email, firstname, surname, password_hash, age, gender, role) VALUES ($1, $2, $3, $4, $5, $6, $7, \'user\') RETURNING *';
    const result = await executeQuery(query, [username, email, firstname, surname, password_hash, age ?? null, gender ?? null]);
    return result[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

async function createCampaign(campaignData) {
  try {
    const { title, description, tags, goal, milestones, city_name, created_by } = campaignData;
    const query = 'INSERT INTO campaigns (title, description, tags, goal, milestones, city_name, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *';
    const result = await executeQuery(query, [title, description, tags, goal, milestones, city_name, created_by]);
    return result[0];
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
}

async function updateCampaign(campaignId, fields) {
  const allowed = ['title', 'description', 'tags', 'goal', 'milestones', 'city_name', 'is_complete'];
  const updates = Object.keys(fields).filter(k => allowed.includes(k));

  if (updates.length === 0) throw new Error('No valid fields to update');

  const setClauses = updates.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = updates.map(k => fields[k]);
  values.push(campaignId);

  const query = `UPDATE campaigns SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING *`;
  const result = await executeQuery(query, values);
  return result[0] || null;
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

async function deleteUser(userId) {
  try {
    const result = await executeQuery('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
    return result.length > 0;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

async function deleteCampaign(campaignId) {
  try {
    const result = await executeQuery('DELETE FROM campaigns WHERE id = $1 RETURNING id', [campaignId]);
    return result.length > 0;
  } catch (error) {
    console.error('Error deleting campaign:', error);
    throw error;
  }
}

async function addImageToCampaign(campaignId, imageId) {
  try {
    const query = 'INSERT INTO campaign_images (campaign_id, image_id) VALUES ($1, $2) RETURNING *';
    const result = await executeQuery(query, [campaignId, imageId]);
    return result[0];
  } catch (error) {
    console.error('Error adding image to campaign:', error);
    throw error;
  }
}

async function getCampaignImages(campaignId) {
  try {
    const query = `
      SELECT i.id, i.mime_type, i.uploaded_by, i.created_at, ci.added_at
      FROM images i
      JOIN campaign_images ci ON i.id = ci.image_id
      WHERE ci.campaign_id = $1
      ORDER BY ci.added_at ASC
    `;
    return await executeQuery(query, [campaignId]);
  } catch (error) {
    console.error('Error getting campaign images:', error);
    throw error;
  }
}

async function updateUser(userId, fields) {
  const allowed = ['username', 'email', 'firstname', 'surname', 'age', 'gender'];
  const updates = Object.keys(fields).filter(k => allowed.includes(k));

  if (updates.length === 0) throw new Error('No valid fields to update');

  const setClauses = updates.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = updates.map(k => fields[k]);
  values.push(userId);

  const query = `UPDATE users SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING *`;
  const result = await executeQuery(query, values);
  return result[0] || null;
}

async function setProfilePicture(userId, imageId) {
  try {
    const query = 'UPDATE users SET profile_picture = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
    const result = await executeQuery(query, [imageId, userId]);
    return result[0] || null;
  } catch (error) {
    console.error('Error setting profile picture:', error);
    throw error;
  }
}

async function getImageById(imageId) {
  try {
    const result = await executeQuery('SELECT * FROM images WHERE id = $1', [imageId]);
    return result[0] || null;
  } catch (error) {
    console.error('Error getting image by ID:', error);
    throw error;
  }
}

async function getUserWithCpr(userId) {
  try {
    const query = `
      SELECT u.*, uc.cpr_number
      FROM users u
      LEFT JOIN user_cpr uc ON uc.user_id = u.id
      WHERE u.id = $1
    `;
    const result = await executeQuery(query, [userId]);
    return result[0] || null;
  } catch (error) {
    console.error('Error getting user with CPR:', error);
    throw error;
  }
}

async function getAllUsersWithCpr() {
  try {
    const query = `
      SELECT u.*, uc.cpr_number
      FROM users u
      LEFT JOIN user_cpr uc ON uc.user_id = u.id
      ORDER BY u.id ASC
    `;
    return await executeQuery(query, []);
  } catch (error) {
    console.error('Error getting all users with CPR:', error);
    throw error;
  }
}

async function upsertUserCpr(userId, cprNumber) {
  try {
    const query = `
      INSERT INTO user_cpr (user_id, cpr_number)
      VALUES ($1, $2)
      ON CONFLICT (user_id) DO UPDATE
        SET cpr_number = EXCLUDED.cpr_number, created_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await executeQuery(query, [userId, cprNumber]);
    return result[0];
  } catch (error) {
    console.error('Error upserting user CPR:', error);
    throw error;
  }
}

async function createImage(imageData) {
  try {
    const { data, mime_type, uploaded_by } = imageData;
    const query = 'INSERT INTO images (data, mime_type, uploaded_by) VALUES ($1, $2, $3) RETURNING id, mime_type, uploaded_by, created_at';
    const result = await executeQuery(query, [data, mime_type, uploaded_by]);
    return result[0];
  } catch (error) {
    console.error('Error creating image:', error);
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
  updateCampaign,
  deleteCampaign,
  deleteUser,
  createDonation,
  addImageToCampaign,
  getCampaignImages,
  updateUser,
  setProfilePicture,
  getImageById,
  createImage,
  upsertUserCpr,
  getUserWithCpr,
  getAllUsersWithCpr,
};