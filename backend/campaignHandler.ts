// Campaign Manager - Handles campaign-related operations
// Interfaces with dbHandler.js for database operations

import {
  getCampaignById,
  getAllCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  addImageToCampaign,
  getCampaignImages,
  isCampaignOwner,
} from './dbHandler.js';
import type { CampaignImageEntry, CampaignOwner } from './dbHandler.js';

interface Campaign {
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

interface Donation {
  id: number;
  from_user: number;
  to_campaign: number;
  amount: number;
  created_at?: string;
  user_name?: string;
  user_email?: string;
}

export class CampaignManager {
  /**
   * Get a campaign by its ID with all donations
   * @param campaignId - The ID of the campaign to retrieve
   * @returns Promise<Campaign | null> - Campaign object with donations or null if not found
   */
  static async getCampaignById(campaignId: number): Promise<Campaign | null> {
    try {
      return await getCampaignById(campaignId);
    } catch (error) {
      console.error(`Error getting campaign by ID ${campaignId}:`, error);
      throw error;
    }
  }

  /**
   * Get all campaigns with their donations
   * @returns Promise<Campaign[]> - Array of all campaigns with donations
   */
  static async getAllCampaigns(): Promise<Campaign[]> {
    try {
      return await getAllCampaigns();
    } catch (error) {
      console.error('Error getting all campaigns:', error);
      throw error;
    }
  }

  /**
   * Add an image to a campaign, enforcing ownership
   * @param campaignId - The ID of the campaign
   * @param imageId - The ID of the image to add
   * @param requestingUserId - The ID of the user making the request
   */
  static async createCampaign(data: {
    title: string;
    description?: string;
    tags?: string[];
    goal?: number;
    milestones?: string[];
    city_name?: string;
    created_by: number;
  }): Promise<Campaign> {
    try {
      return await createCampaign(data);
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }

  static async updateCampaign(
    campaignId: number,
    fields: Partial<Pick<Campaign, 'title' | 'description' | 'tags' | 'goal' | 'milestones' | 'city_name' | 'is_complete' | 'owner_ids'>>,
    requestingUserId: number
  ): Promise<Campaign> {
    const campaign = await getCampaignById(campaignId);

    if (!campaign) {
      throw Object.assign(new Error('Campaign not found'), { status: 404 });
    }

    const isOwner = await isCampaignOwner(campaignId, requestingUserId);
    if (!isOwner) {
      throw Object.assign(new Error('You can only update your own campaigns'), { status: 403 });
    }

    try {
      return await updateCampaign(campaignId, fields) as Campaign;
    } catch (error) {
      console.error(`Error updating campaign ${campaignId}:`, error);
      throw error;
    }
  }

  static async deleteCampaign(campaignId: number, requestingUserId: number): Promise<void> {
    const campaign = await getCampaignById(campaignId);

    if (!campaign) {
      throw Object.assign(new Error('Campaign not found'), { status: 404 });
    }

    const isOwner = await isCampaignOwner(campaignId, requestingUserId);
    if (!isOwner) {
      throw Object.assign(new Error('You can only delete your own campaigns'), { status: 403 });
    }

    try {
      await deleteCampaign(campaignId);
    } catch (error) {
      console.error(`Error deleting campaign ${campaignId}:`, error);
      throw error;
    }
  }

  static async addImage(campaignId: number, imageId: number, requestingUserId: number): Promise<void> {
    const campaign = await getCampaignById(campaignId);

    if (!campaign) {
      throw Object.assign(new Error('Campaign not found'), { status: 404 });
    }

    const isOwner = await isCampaignOwner(campaignId, requestingUserId);
    if (!isOwner) {
      throw Object.assign(new Error('You can only add images to your own campaigns'), { status: 403 });
    }

    try {
      await addImageToCampaign(campaignId, imageId);
    } catch (error) {
      console.error(`Error adding image ${imageId} to campaign ${campaignId}:`, error);
      throw error;
    }
  }

  /**
   * Get all images for a campaign
   * @param campaignId - The ID of the campaign
   * @returns Promise<CampaignImageEntry[]>
   */
  static async getImages(campaignId: number): Promise<CampaignImageEntry[]> {
    try {
      return await getCampaignImages(campaignId);
    } catch (error) {
      console.error(`Error getting images for campaign ${campaignId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate total donations for a campaign
   * @param campaign - Campaign object with donations
   * @returns number - Total donation amount
   */
  static calculateTotalDonations(campaign: Campaign): number {
    if (!campaign.donations || campaign.donations.length === 0) {
      return 0;
    }
    
    return campaign.donations.reduce((total, donation) => total + donation.amount, 0);
  }

  /**
   * Calculate progress percentage for a campaign
   * @param campaign - Campaign object with donations
   * @returns number - Progress percentage (0-100)
   */
  static calculateProgressPercentage(campaign: Campaign): number {
    const totalDonations = this.calculateTotalDonations(campaign);
    
    if (campaign.goal === 0) {
      return 100; // Avoid division by zero
    }
    
    const progress = (totalDonations / campaign.goal) * 100;
    return Math.min(100, Math.max(0, progress)); // Clamp between 0-100
  }

  /**
   * Get campaign statistics
   * @param campaign - Campaign object
   * @returns Object - Campaign statistics
   */
  static getCampaignStats(campaign: Campaign): {
    totalDonations: number;
    progressPercentage: number;
    donorsCount: number;
    goal: number;
    remaining: number;
  } {
    const totalDonations = this.calculateTotalDonations(campaign);
    const progressPercentage = this.calculateProgressPercentage(campaign);
    const donorsCount = campaign.donations ? new Set(campaign.donations.map(d => d.from_user)).size : 0;
    const remaining = campaign.goal - totalDonations;
    
    return {
      totalDonations,
      progressPercentage,
      donorsCount,
      goal: campaign.goal,
      remaining: Math.max(0, remaining)
    };
  }
}

export default CampaignManager;