// Type declarations for dbHandler.js module

// Export the types that are used by the importing modules
export interface User {
  id: number;
  username: string;
  email: string;
  firstname: string;
  surname: string;
  password_hash: string;
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
  campain_name?: string;
  user_name?: string;
  user_email?: string;
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
  created_at?: string;
  updated_at?: string;
  donations?: Donation[];
}

export interface UserCreationData {
  username: string;
  email: string;
  firstname: string;
  surname: string;
  password_hash: string;
}

export interface CampaignCreationData {
  name: string;
}

export interface DonationCreationData {
  from_user: number;
  to_campain: number;
  amount: number;
}

// Declare the actual functions from the JavaScript module
declare function getUserById(userId: number): Promise<User | null>;
declare function getCampaignById(campaignId: number): Promise<Campaign | null>;
declare function getAllUsers(): Promise<User[]>;
declare function getAllCampaigns(): Promise<Campaign[]>;
declare function createUser(userData: UserCreationData): Promise<User>;
declare function createCampaign(campaignData: CampaignCreationData): Promise<Campaign>;
declare function createDonation(donationData: DonationCreationData): Promise<Donation>;

export {
  getUserById,
  getCampaignById,
  getAllUsers,
  getAllCampaigns,
  createUser,
  createCampaign,
  createDonation
};