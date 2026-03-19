// Campaign Manager - Handles campaign-related operations
// Interfaces with dbHandler.js for database operations
import { getCampaignById, getAllCampaigns } from './dbHandler.js';
export class CampaignManager {
    /**
     * Get a campaign by its ID with all donations
     * @param campaignId - The ID of the campaign to retrieve
     * @returns Promise<Campaign | null> - Campaign object with donations or null if not found
     */
    static async getCampaignById(campaignId) {
        try {
            return await getCampaignById(campaignId);
        }
        catch (error) {
            console.error(`Error getting campaign by ID ${campaignId}:`, error);
            throw error;
        }
    }
    /**
     * Get all campaigns with their donations
     * @returns Promise<Campaign[]> - Array of all campaigns with donations
     */
    static async getAllCampaigns() {
        try {
            return await getAllCampaigns();
        }
        catch (error) {
            console.error('Error getting all campaigns:', error);
            throw error;
        }
    }
    /**
     * Calculate total donations for a campaign
     * @param campaign - Campaign object with donations
     * @returns number - Total donation amount
     */
    static calculateTotalDonations(campaign) {
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
    static calculateProgressPercentage(campaign) {
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
    static getCampaignStats(campaign) {
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
//# sourceMappingURL=campaignHandler.js.map