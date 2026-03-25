import pool from './db.js';

// ---- Interfaces ----

export interface User {
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
  provider?: string | null;
  provider_id?: string | null;
  created_at?: string;
  updated_at?: string;
  donations?: Donation[];
}

export interface Donation {
  id: number;
  from_user: number;
  to_campaign: number;
  amount: number;
  created_at?: string;
  is_anonymous?: boolean;
  type?: 'donation' | 'subscription';
  campaign_title?: string;
  user_name?: string;
  user_email?: string;
  stripe_subscription_id?: string;
}

export interface CampaignDonation {
  id: number;
  amount: number;
  created_at: string;
  is_anonymous: boolean;
  sender_username: string | null;
  sender_firstname: string | null;
}

export interface CampaignOwner {
  id: number;
  username: string;
  email: string;
}

export interface Campaign {
  id: number;
  title: string;
  description: string;
  tags: string[];
  goal: number;
  is_complete: boolean;
  milestones: string[];
  city_name: string;
  owner_ids: number[];
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  donations?: Donation[];
  subscriptions?: Donation[];
  owners?: CampaignOwner[];
  total_donated?: number;
  image_ids?: number[];
}

export interface CampaignImageEntry {
  id: number;
  mime_type: string;
  uploaded_by?: number;
  created_at?: string;
  added_at?: string;
}

export interface UserCreationData {
  username: string;
  email: string;
  firstname: string;
  surname: string;
  password_hash: string;
  age?: number | null;
  gender?: string | null;
}

export interface CampaignCreationData {
  title: string;
  description?: string;
  tags?: string[];
  goal?: number;
  milestones?: string[];
  city_name?: string;
  created_by?: number;
}

export interface DonationCreationData {
  from_user: number;
  to_campaign: number;
  amount: number;
  is_anonymous?: boolean;
}

export interface UserCpr {
  id: number;
  user_id: number;
  cpr_number: string;
  created_at?: string;
}

export interface Image {
  id: number;
  data: Buffer;
  mime_type: string;
  uploaded_by?: number;
  created_at?: string;
}

export interface ImageCreationData {
  data: Buffer;
  mime_type: string;
  uploaded_by?: number;
}

export interface OAuthUserData {
  provider: string;
  providerId: string;
  email?: string;
  firstname: string;
  surname: string;
  username: string;
  photoUrl?: string;
}

// ---- Helper ----

async function executeQuery<T = Record<string, unknown>>(query: string, params: unknown[] = []): Promise<T[]> {
  try {
    const result = await pool.query(query, params);
    return result.rows as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// ---- Functions ----

export async function getUserById(userId: number): Promise<User | null> {
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) return null;

    const donationsResult = await pool.query(
      'SELECT d.*, c.title as campaign_title FROM donations d JOIN campaigns c ON d.to_campaign = c.id WHERE d.from_user = $1',
      [userId]
    );

    const user: User = userResult.rows[0];
    user.donations = donationsResult.rows;
    return user;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}

export async function getCampaignById(campaignId: number): Promise<Campaign | null> {
  try {
    const campaignResult = await pool.query(
      'SELECT id, title, description, tags::text[] as tags, goal::integer as goal, is_complete, milestones, city_name, owner_ids, created_by, created_at, updated_at FROM campaigns WHERE id = $1',
      [campaignId]
    );
    if (campaignResult.rows.length === 0) return null;

    const [donationsResult, subscriptionsResult, ownersResult] = await Promise.all([
      pool.query(
        `SELECT d.id, d.from_user, d.to_campaign, d.amount::integer as amount, d.created_at, d.is_anonymous, CASE WHEN d.is_anonymous THEN NULL ELSE u.username END as sender_username, CASE WHEN d.is_anonymous THEN NULL ELSE CONCAT(u.firstname, ' ', u.surname) END as sender_firstname FROM donations d JOIN users u ON d.from_user = u.id WHERE d.to_campaign = $1`,
        [campaignId]
      ),
      pool.query(
        'SELECT s.id, s.from_user, s.to_campaign, s.amount::numeric as amount, s.created_at, s.stripe_subscription_id FROM subscriptions s WHERE s.to_campaign = $1',
        [campaignId]
      ),
      pool.query(
        'SELECT u.id, u.username, u.email FROM users u WHERE u.id = ANY($1::integer[])',
        [campaignResult.rows[0].owner_ids || []]
      ),
    ]);

    const mappedDonations: Donation[] = donationsResult.rows.map(d => ({
      id: d.id, type: 'donation' as const, from_user: d.from_user,
      to_campaign: campaignId, amount: Number(d.amount),
      created_at: d.created_at, is_anonymous: d.is_anonymous,
      sender_username: d.sender_username, sender_firstname: d.sender_firstname,
    }));

    const mappedSubscriptions: Donation[] = subscriptionsResult.rows.map(s => ({
      id: s.id, type: 'subscription' as const, from_user: s.from_user,
      to_campaign: campaignId, amount: Number(s.amount),
      created_at: s.created_at, stripe_subscription_id: s.stripe_subscription_id,
    }));

    const history = [...mappedDonations, ...mappedSubscriptions].sort(
      (a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
    );

    const campaign: Campaign = campaignResult.rows[0];
    campaign.donations = history;
    campaign.subscriptions = subscriptionsResult.rows;
    campaign.owners = ownersResult.rows;
    campaign.total_donated =
      mappedDonations.reduce((s, d) => s + (d.amount || 0), 0) +
      mappedSubscriptions.reduce((s, d) => s + (d.amount || 0), 0);

    return campaign;
  } catch (error) {
    console.error('Error getting campaign by ID:', error);
    throw error;
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const usersResult = await pool.query('SELECT * FROM users');
    return Promise.all(
      usersResult.rows.map(async (user: User) => {
        const donationsResult = await pool.query(
          'SELECT d.*, c.title as campaign_title FROM donations d JOIN campaigns c ON d.to_campaign = c.id WHERE d.from_user = $1',
          [user.id]
        );
        user.donations = donationsResult.rows;
        return user;
      })
    );
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}

export async function getAllCampaigns(): Promise<Campaign[]> {
  try {
    const campaignsResult = await pool.query(
      'SELECT id, title, description, tags::text[] as tags, goal::integer as goal, is_complete, milestones, city_name, owner_ids, created_by, created_at, updated_at FROM campaigns'
    );

    return Promise.all(
      campaignsResult.rows.map(async (campaign: Campaign) => {
        const [donationsResult, subscriptionsResult, ownersResult, imagesResult] = await Promise.all([
          pool.query(
            `SELECT d.id, d.from_user, d.to_campaign, d.amount::integer as amount, d.created_at, d.is_anonymous, CASE WHEN d.is_anonymous THEN NULL ELSE u.username END as sender_username, CASE WHEN d.is_anonymous THEN NULL ELSE CONCAT(u.firstname, ' ', u.surname) END as sender_firstname FROM donations d JOIN users u ON d.from_user = u.id WHERE d.to_campaign = $1`,
            [campaign.id]
          ),
          pool.query(
            'SELECT s.id, s.from_user, s.to_campaign, s.amount::numeric as amount, s.created_at, s.stripe_subscription_id FROM subscriptions s WHERE s.to_campaign = $1',
            [campaign.id]
          ),
          pool.query(
            'SELECT u.id, u.username, u.email FROM users u WHERE u.id = ANY($1::integer[])',
            [campaign.owner_ids || []]
          ),
          pool.query(
            'SELECT image_id FROM campaign_images WHERE campaign_id = $1 ORDER BY added_at ASC',
            [campaign.id]
          ),
        ]);

        const mappedDonations: Donation[] = donationsResult.rows.map(d => ({
          id: d.id, type: 'donation' as const, from_user: d.from_user,
          to_campaign: campaign.id, amount: Number(d.amount),
          created_at: d.created_at, is_anonymous: d.is_anonymous,
          sender_username: d.sender_username, sender_firstname: d.sender_firstname,
        }));

        const mappedSubscriptions: Donation[] = subscriptionsResult.rows.map(s => ({
          id: s.id, type: 'subscription' as const, from_user: s.from_user,
          to_campaign: campaign.id, amount: Number(s.amount),
          created_at: s.created_at, stripe_subscription_id: s.stripe_subscription_id,
        }));

        const history = [...mappedDonations, ...mappedSubscriptions].sort(
          (a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
        );

        campaign.donations = history;
        campaign.subscriptions = subscriptionsResult.rows;
        campaign.total_donated =
          mappedDonations.reduce((s, d) => s + (d.amount || 0), 0) +
          mappedSubscriptions.reduce((s, d) => s + (d.amount || 0), 0);
        campaign.owners = ownersResult.rows;
        campaign.image_ids = imagesResult.rows.map((r: { image_id: number }) => r.image_id);
        return campaign;
      })
    );
  } catch (error) {
    console.error('Error getting all campaigns:', error);
    throw error;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await executeQuery<User>('SELECT * FROM users WHERE email = $1', [email]);
    return result[0] ?? null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
}

export async function createUser(userData: UserCreationData): Promise<User> {
  try {
    const { username, email, firstname, surname, password_hash, age, gender } = userData;
    const result = await executeQuery<User>(
      'INSERT INTO users (username, email, firstname, surname, password_hash, age, gender, role) VALUES ($1, $2, $3, $4, $5, $6, $7, \'user\') RETURNING *',
      [username, email, firstname, surname, password_hash, age ?? null, gender ?? null]
    );
    return result[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

type PhotoData = { buffer: Buffer; mimeType: string };

async function fetchOAuthPhoto(photoUrl: string, userId: number): Promise<number | null> {
  try {
    const { default: https } = await import('https');
    const { default: http } = await import('http');

    const data = await new Promise<PhotoData>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Profile photo fetch timed out')), 5000);
      const client = photoUrl.startsWith('https') ? https : http;

      client.get(photoUrl, (res) => {
        if (res.statusCode !== 200) {
          clearTimeout(timeout);
          reject(new Error(`Unexpected status code: ${res.statusCode}`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          clearTimeout(timeout);
          resolve({ buffer: Buffer.concat(chunks), mimeType: res.headers['content-type'] ?? 'image/jpeg' });
        });
        res.on('error', (err: Error) => { clearTimeout(timeout); reject(err); });
      }).on('error', (err: Error) => { clearTimeout(timeout); reject(err); });
    });

    const image = await executeQuery<{ id: number }>(
      'INSERT INTO images (data, mime_type, uploaded_by) VALUES ($1, $2, $3) RETURNING id',
      [data.buffer, data.mimeType, userId]
    );
    return image[0].id;
  } catch (err) {
    console.error('Failed to fetch OAuth profile photo:', (err as Error).message);
    return null;
  }
}

export async function findOrCreateOAuthUser({ provider, providerId, email, firstname, surname, username, photoUrl }: OAuthUserData): Promise<User> {
  try {
    // 1. Find by provider + provider_id
    let result = await executeQuery<User>('SELECT * FROM users WHERE provider = $1 AND provider_id = $2', [provider, providerId]);
    if (result.length > 0) {
      const user = result[0];
      if (!user.profile_picture && photoUrl) {
        const imageId = await fetchOAuthPhoto(photoUrl, user.id);
        if (imageId) {
          const updated = await executeQuery<User>('UPDATE users SET profile_picture = $1 WHERE id = $2 RETURNING *', [imageId, user.id]);
          return updated[0];
        }
      }
      return user;
    }

    // 2. Find local account with same email — link it
    result = await executeQuery<User>('SELECT * FROM users WHERE email = $1', [email]);
    if (result.length > 0) {
      const linked = await executeQuery<User>(
        'UPDATE users SET provider = $1, provider_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
        [provider, providerId, result[0].id]
      );
      return linked[0];
    }

    // 3. Create new OAuth user (no password_hash)
    const created = await executeQuery<User>(
      'INSERT INTO users (username, email, firstname, surname, provider, provider_id, role) VALUES ($1, $2, $3, $4, $5, $6, \'user\') RETURNING *',
      [username, email, firstname, surname, provider, providerId]
    );
    const user = created[0];

    // 4. Fetch and store profile picture if available
    if (photoUrl) {
      const imageId = await fetchOAuthPhoto(photoUrl, user.id);
      if (imageId) {
        const updated = await executeQuery<User>('UPDATE users SET profile_picture = $1 WHERE id = $2 RETURNING *', [imageId, user.id]);
        return updated[0];
      }
    }

    return user;
  } catch (error) {
    console.error('Error in findOrCreateOAuthUser:', error);
    throw error;
  }
}

export async function createCampaign(campaignData: CampaignCreationData): Promise<Campaign> {
  try {
    const { title, description, tags, goal, milestones, city_name, created_by } = campaignData;
    const ownerIds = created_by ? [created_by] : [];
    const result = await executeQuery<Campaign>(
      'INSERT INTO campaigns (title, description, tags, goal, milestones, city_name, created_by, owner_ids) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, title, description, tags::text[] as tags, goal::integer as goal, is_complete, milestones, city_name, owner_ids, created_by, created_at, updated_at',
      [title, description, tags, goal, milestones, city_name, created_by, ownerIds]
    );
    const campaign = result[0];
    campaign.owners = created_by ? [{ id: created_by } as CampaignOwner] : [];
    return campaign;
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
}

export async function updateCampaign(
  campaignId: number,
  fields: Partial<Pick<Campaign, 'title' | 'description' | 'tags' | 'goal' | 'milestones' | 'city_name' | 'is_complete' | 'owner_ids'>>
): Promise<Campaign | null> {
  const allowed = ['title', 'description', 'tags', 'goal', 'milestones', 'city_name', 'is_complete', 'owner_ids'];
  const updates = Object.keys(fields).filter(k => allowed.includes(k));

  if (updates.length === 0) throw new Error('No valid fields to update');

  const setClauses = updates.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values: unknown[] = updates.map(k => fields[k as keyof typeof fields]);
  values.push(campaignId);

  const result = await executeQuery<Campaign>(
    `UPDATE campaigns SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING *`,
    values
  );
  return result[0] ?? null;
}

export async function getDonationsByCampaign(campaignId: number): Promise<CampaignDonation[]> {
  try {
    return await executeQuery<CampaignDonation>(
      `SELECT d.id, d.amount::integer as amount, d.created_at, d.is_anonymous,
        CASE WHEN d.is_anonymous THEN NULL ELSE u.username END as sender_username,
        CASE WHEN d.is_anonymous THEN NULL ELSE u.firstname END as sender_firstname
       FROM donations d
       JOIN users u ON d.from_user = u.id
       WHERE d.to_campaign = $1
       ORDER BY d.created_at DESC`,
      [campaignId]
    );
  } catch (error) {
    console.error('Error getting donations by campaign:', error);
    throw error;
  }
}

export async function createDonation(donationData: DonationCreationData): Promise<Donation> {
  try {
    const { from_user, to_campaign, amount, is_anonymous = false } = donationData;
    const result = await executeQuery<Donation>(
      'INSERT INTO donations (from_user, to_campaign, amount, is_anonymous) VALUES ($1, $2, $3, $4) RETURNING *',
      [from_user, to_campaign, amount, is_anonymous]
    );
    return result[0];
  } catch (error) {
    console.error('Error creating donation:', error);
    throw error;
  }
}

export async function deleteUser(userId: number): Promise<boolean> {
  try {
    const result = await executeQuery<{ id: number }>('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
    return result.length > 0;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

export async function deleteCampaign(campaignId: number): Promise<boolean> {
  try {
    const result = await executeQuery<{ id: number }>('DELETE FROM campaigns WHERE id = $1 RETURNING id', [campaignId]);
    return result.length > 0;
  } catch (error) {
    console.error('Error deleting campaign:', error);
    throw error;
  }
}

export async function addImageToCampaign(campaignId: number, imageId: number): Promise<{ campaign_id: number; image_id: number; added_at: string }> {
  try {
    const result = await executeQuery<{ campaign_id: number; image_id: number; added_at: string }>(
      'INSERT INTO campaign_images (campaign_id, image_id) VALUES ($1, $2) RETURNING *',
      [campaignId, imageId]
    );
    return result[0];
  } catch (error) {
    console.error('Error adding image to campaign:', error);
    throw error;
  }
}

export async function removeImageFromCampaign(campaignId: number, imageId: number): Promise<void> {
  try {
    await executeQuery('DELETE FROM campaign_images WHERE campaign_id = $1 AND image_id = $2', [campaignId, imageId]);
  } catch (error) {
    console.error('Error removing image from campaign:', error);
    throw error;
  }
}

export async function getCampaignImages(campaignId: number): Promise<CampaignImageEntry[]> {
  try {
    return await executeQuery<CampaignImageEntry>(
      `SELECT i.id, i.mime_type, i.uploaded_by, i.created_at, ci.added_at
       FROM images i
       JOIN campaign_images ci ON i.id = ci.image_id
       WHERE ci.campaign_id = $1
       ORDER BY ci.added_at ASC`,
      [campaignId]
    );
  } catch (error) {
    console.error('Error getting campaign images:', error);
    throw error;
  }
}

export async function updateUser(
  userId: number,
  fields: Partial<Pick<User, 'username' | 'email' | 'firstname' | 'surname' | 'age' | 'gender'>>
): Promise<User | null> {
  const allowed = ['username', 'email', 'firstname', 'surname', 'age', 'gender'];
  const updates = Object.keys(fields).filter(k => allowed.includes(k));

  if (updates.length === 0) throw new Error('No valid fields to update');

  const setClauses = updates.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values: unknown[] = updates.map(k => fields[k as keyof typeof fields]);
  values.push(userId);

  const result = await executeQuery<User>(
    `UPDATE users SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING *`,
    values
  );
  return result[0] ?? null;
}

export async function setProfilePicture(userId: number, imageId: number): Promise<User | null> {
  try {
    const result = await executeQuery<User>(
      'UPDATE users SET profile_picture = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [imageId, userId]
    );
    return result[0] ?? null;
  } catch (error) {
    console.error('Error setting profile picture:', error);
    throw error;
  }
}

export async function getImageById(imageId: number): Promise<Image | null> {
  try {
    const result = await executeQuery<Image>('SELECT * FROM images WHERE id = $1', [imageId]);
    return result[0] ?? null;
  } catch (error) {
    console.error('Error getting image by ID:', error);
    throw error;
  }
}

export async function getUserWithCpr(userId: number): Promise<(User & { cpr_number: string | null }) | null> {
  try {
    const result = await executeQuery<User & { cpr_number: string | null }>(
      `SELECT u.*, uc.cpr_number FROM users u LEFT JOIN user_cpr uc ON uc.user_id = u.id WHERE u.id = $1`,
      [userId]
    );
    return result[0] ?? null;
  } catch (error) {
    console.error('Error getting user with CPR:', error);
    throw error;
  }
}

export async function getAllUsersWithCpr(): Promise<(User & { cpr_number: string | null })[]> {
  try {
    return await executeQuery<User & { cpr_number: string | null }>(
      `SELECT u.*, uc.cpr_number FROM users u LEFT JOIN user_cpr uc ON uc.user_id = u.id ORDER BY u.id ASC`
    );
  } catch (error) {
    console.error('Error getting all users with CPR:', error);
    throw error;
  }
}

export async function upsertUserCpr(userId: number, cprNumber: string): Promise<UserCpr> {
  try {
    const result = await executeQuery<UserCpr>(
      `INSERT INTO user_cpr (user_id, cpr_number)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE
         SET cpr_number = EXCLUDED.cpr_number, created_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, cprNumber]
    );
    return result[0];
  } catch (error) {
    console.error('Error upserting user CPR:', error);
    throw error;
  }
}

export async function createImage(imageData: ImageCreationData): Promise<Omit<Image, 'data'>> {
  try {
    const { data, mime_type, uploaded_by } = imageData;
    const result = await executeQuery<Omit<Image, 'data'>>(
      'INSERT INTO images (data, mime_type, uploaded_by) VALUES ($1, $2, $3) RETURNING id, mime_type, uploaded_by, created_at',
      [data, mime_type, uploaded_by]
    );
    return result[0];
  } catch (error) {
    console.error('Error creating image:', error);
    throw error;
  }
}

export async function isCampaignOwner(campaignId: number, userId: number): Promise<boolean> {
  try {
    const result = await executeQuery('SELECT 1 FROM campaigns WHERE id = $1 AND $2 = ANY(owner_ids)', [campaignId, userId]);
    return result.length > 0;
  } catch (error) {
    console.error('Error checking campaign ownership:', error);
    throw error;
  }
}

export async function getUserForEmail(userId: number): Promise<{ email: string; firstname: string; surname: string } | null> {
  try {
    const result = await executeQuery<{ email: string; firstname: string; surname: string }>(
      'SELECT email, firstname, surname FROM users WHERE id = $1',
      [userId]
    );
    return result[0] ?? null;
  } catch (error) {
    console.error('Error getting user for email:', error);
    throw error;
  }
}

export async function getCampaignTitle(campaignId: number): Promise<string | null> {
  try {
    const result = await executeQuery<{ title: string }>('SELECT title FROM campaigns WHERE id = $1', [campaignId]);
    return result[0]?.title ?? null;
  } catch (error) {
    console.error('Error getting campaign title:', error);
    throw error;
  }
}
