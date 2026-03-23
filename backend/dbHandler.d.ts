// Type declarations for dbHandler.js module

// Export the types that are used by the importing modules
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
  campaign_title?: string;
  user_name?: string;
  user_email?: string;
}

export interface CampaignDonation {
  id: number;
  amount: number;
  created_at: string;
  sender_username: string;
  sender_firstname: string;
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
  owners?: CampaignOwner[];
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
}

export interface UserCpr {
  id: number;
  user_id: number;
  cpr_number: string;
  created_at?: string;
}

// Declare the actual functions from the JavaScript module
declare function getUserById(userId: number): Promise<User | null>;
declare function getCampaignById(campaignId: number): Promise<Campaign | null>;
declare function getAllUsers(): Promise<User[]>;
declare function getAllCampaigns(): Promise<Campaign[]>;
declare function createUser(userData: UserCreationData): Promise<User>;
declare function createCampaign(campaignData: CampaignCreationData): Promise<Campaign>;
declare function createDonation(donationData: DonationCreationData): Promise<Donation>;
declare function getDonationsByCampaign(campaignId: number): Promise<CampaignDonation[]>;

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

declare function updateCampaign(campaignId: number, fields: Partial<Pick<Campaign, 'title' | 'description' | 'tags' | 'goal' | 'milestones' | 'city_name' | 'is_complete' | 'owner_ids'>>): Promise<Campaign | null>;
declare function deleteCampaign(campaignId: number): Promise<boolean>;
declare function deleteUser(userId: number): Promise<boolean>;
declare function addImageToCampaign(campaignId: number, imageId: number): Promise<{ campaign_id: number; image_id: number; added_at: string }>;
declare function removeImageFromCampaign(campaignId: number, imageId: number): Promise<void>;
declare function getCampaignImages(campaignId: number): Promise<CampaignImageEntry[]>;
declare function updateUser(userId: number, fields: Partial<Pick<User, 'username' | 'email' | 'firstname' | 'surname' | 'age' | 'gender'>>): Promise<User | null>;
declare function setProfilePicture(userId: number, imageId: number): Promise<User | null>;
declare function getImageById(imageId: number): Promise<Image | null>;
declare function createImage(imageData: ImageCreationData): Promise<Omit<Image, 'data'>>;
declare function isCampaignOwner(campaignId: number, userId: number): Promise<boolean>;
declare function upsertUserCpr(userId: number, cprNumber: string): Promise<UserCpr>;
declare function getUserWithCpr(userId: number): Promise<(User & { cpr_number: string | null }) | null>;
declare function getAllUsersWithCpr(): Promise<(User & { cpr_number: string | null })[]>;

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
  removeImageFromCampaign,
  getCampaignImages,
  updateUser,
  setProfilePicture,
  getImageById,
  createImage,
  isCampaignOwner,
  upsertUserCpr,
  getUserWithCpr,
  getAllUsersWithCpr,
};