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
    const ownersQuery = 'SELECT u.id, u.username, u.email FROM campaign_owners co JOIN users u ON co.user_id = u.id WHERE co.campaign_id = $1';

    const campaignResult = await pool.query(campaignQuery, [campaignId]);
    if (campaignResult.rows.length === 0) return null;

    const donationsResult = await pool.query(donationsQuery, [campaignId]);
    const ownersResult = await pool.query(ownersQuery, [campaignId]);

    const campaign = campaignResult.rows[0];
    campaign.donations = donationsResult.rows;
    campaign.owners = ownersResult.rows;

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
    const ownersQuery = 'SELECT u.id, u.username, u.email FROM campaign_owners co JOIN users u ON co.user_id = u.id WHERE co.campaign_id = $1';

    const campaignsResult = await pool.query(campaignsQuery);

    const campaignsWithData = await Promise.all(
      campaignsResult.rows.map(async (campaign) => {
        const donationsResult = await pool.query(donationsQuery, [campaign.id]);
        const ownersResult = await pool.query(ownersQuery, [campaign.id]);
        campaign.donations = donationsResult.rows;
        campaign.owners = ownersResult.rows;
        return campaign;
      })
    );

    return campaignsWithData;
  } catch (error) {
    console.error('Error getting all campaigns:', error);
    throw error;
  }
}

async function createUser(userData) {
  try {
    const { username, email, firstname, surname, password_hash, age, gender } = userData;
    const query = 'INSERT INTO users (username, email, firstname, surname, password_hash, age, gender) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *';
    const result = await executeQuery(query, [username, email, firstname, surname, password_hash, age ?? null, gender ?? null]);
    return result[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

async function createCampaign(campaignData) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { title, description, tags, goal, milestones, city_name, created_by } = campaignData;
    const campaignResult = await client.query(
      'INSERT INTO campaigns (title, description, tags, goal, milestones, city_name, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [title, description, tags, goal, milestones, city_name, created_by]
    );
    const campaign = campaignResult.rows[0];
    if (created_by) {
      await client.query('INSERT INTO campaign_owners (campaign_id, user_id) VALUES ($1, $2)', [campaign.id, created_by]);
    }
    await client.query('COMMIT');
    campaign.owners = created_by ? [{ id: created_by }] : [];
    return campaign;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating campaign:', error);
    throw error;
  } finally {
    client.release();
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

async function getDonationsByCampaign(campaignId) {
  try {
    const query = `
      SELECT d.id, d.amount, d.created_at, u.username as sender_username, u.firstname as sender_firstname
      FROM donations d
      JOIN users u ON d.from_user = u.id
      WHERE d.to_campaign = $1
      ORDER BY d.created_at DESC
    `;
    return await executeQuery(query, [campaignId]);
  } catch (error) {
    console.error('Error getting donations by campaign:', error);
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

async function getCampaignOwners(campaignId) {
  try {
    const query = 'SELECT u.id, u.username, u.email FROM campaign_owners co JOIN users u ON co.user_id = u.id WHERE co.campaign_id = $1 ORDER BY co.added_at ASC';
    return await executeQuery(query, [campaignId]);
  } catch (error) {
    console.error('Error getting campaign owners:', error);
    throw error;
  }
}

async function addCampaignOwner(campaignId, userId) {
  try {
    const query = 'INSERT INTO campaign_owners (campaign_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *';
    const result = await executeQuery(query, [campaignId, userId]);
    return result[0] || null;
  } catch (error) {
    console.error('Error adding campaign owner:', error);
    throw error;
  }
}

async function removeCampaignOwner(campaignId, userId) {
  try {
    const result = await executeQuery('DELETE FROM campaign_owners WHERE campaign_id = $1 AND user_id = $2 RETURNING *', [campaignId, userId]);
    return result.length > 0;
  } catch (error) {
    console.error('Error removing campaign owner:', error);
    throw error;
  }
}

async function isCampaignOwner(campaignId, userId) {
  try {
    const result = await executeQuery('SELECT 1 FROM campaign_owners WHERE campaign_id = $1 AND user_id = $2', [campaignId, userId]);
    return result.length > 0;
  } catch (error) {
    console.error('Error checking campaign ownership:', error);
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
  getDonationsByCampaign,
  addImageToCampaign,
  getCampaignImages,
  updateUser,
  setProfilePicture,
  getImageById,
  createImage,
  getCampaignOwners,
  addCampaignOwner,
  removeCampaignOwner,
  isCampaignOwner,
};