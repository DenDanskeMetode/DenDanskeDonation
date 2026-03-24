import { createDonation, getDonationsByCampaign } from './dbHandler.js';

interface DonationInput {
  from_user: number;
  to_campaign: number;
  amount: number;
  is_anonymous?: boolean;
}

interface DonationResult {
  id: number;
  from_user: number;
  to_campaign: number;
  amount: number;
  created_at?: string;
}

export class DonationManager {
  /**
   * Process a donation.
   * Steps run in order — add payment processing or other side-effects between validation and persistence.
   */
  static async getDonationsByCampaign(campaignId: number) {
    return await getDonationsByCampaign(campaignId);
  }

  static async donate(input: DonationInput): Promise<DonationResult> {
    DonationManager.validateInput(input);

    // Placeholder: await DonationManager.processPayment(input);

    return await DonationManager.persistDonation(input);
  }

  private static validateInput(input: DonationInput): void {
    if (!input.to_campaign || !input.from_user) {
      throw new Error('from_user and to_campaign are required');
    }

    if (!input.amount || input.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
  }

  // Placeholder for future payment processing integration
  // private static async processPayment(input: DonationInput): Promise<void> { ... }

  private static async persistDonation(input: DonationInput): Promise<DonationResult> {
    try {
      return await createDonation(input);
    } catch (error) {
      console.error('Error persisting donation:', error);
      throw error;
    }
  }
}

export default DonationManager;
