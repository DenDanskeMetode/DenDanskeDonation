import { CampaignManager } from '../backend/campaignHandler.js';

jest.mock('../backend/dbHandler', () => ({
  getCampaignById: jest.fn(),
  getAllCampaigns: jest.fn(),
}));

import * as dbHandler from '../backend/dbHandler.js';

const mockGetCampaignById = dbHandler.getCampaignById as jest.Mock;
const mockGetAllCampaigns = dbHandler.getAllCampaigns as jest.Mock;

const mockCampaign = {
  id: 1,
  title: 'Clean Water Initiative',
  description: 'Providing clean water to rural communities',
  tags: ['water', 'health'],
  goal: 1000,
  is_complete: false,
  milestones: ['Phase 1', 'Phase 2'],
  city_name: 'Copenhagen',
  owner_ids: [1],
  donations: [
    { id: 1, from_user: 1, to_campaign: 1, amount: 200 },
    { id: 2, from_user: 2, to_campaign: 1, amount: 300 },
  ],
};

describe('CampaignManager', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getAllCampaigns', () => {
    it('returns all campaigns from db', async () => {
      mockGetAllCampaigns.mockResolvedValue([mockCampaign]);
      const result = await CampaignManager.getAllCampaigns();
      expect(result).toEqual([mockCampaign]);
      expect(mockGetAllCampaigns).toHaveBeenCalledTimes(1);
    });

    it('returns empty array when no campaigns', async () => {
      mockGetAllCampaigns.mockResolvedValue([]);
      const result = await CampaignManager.getAllCampaigns();
      expect(result).toEqual([]);
    });

    it('propagates db errors', async () => {
      mockGetAllCampaigns.mockRejectedValue(new Error('DB error'));
      await expect(CampaignManager.getAllCampaigns()).rejects.toThrow('DB error');
    });
  });

  describe('getCampaignById', () => {
    it('returns campaign when found', async () => {
      mockGetCampaignById.mockResolvedValue(mockCampaign);
      const result = await CampaignManager.getCampaignById(1);
      expect(result).toEqual(mockCampaign);
      expect(mockGetCampaignById).toHaveBeenCalledWith(1);
    });

    it('returns null when campaign not found', async () => {
      mockGetCampaignById.mockResolvedValue(null);
      const result = await CampaignManager.getCampaignById(99);
      expect(result).toBeNull();
    });

    it('propagates db errors', async () => {
      mockGetCampaignById.mockRejectedValue(new Error('DB error'));
      await expect(CampaignManager.getCampaignById(1)).rejects.toThrow('DB error');
    });
  });

  describe('calculateTotalDonations', () => {
    it('sums all donation amounts', () => {
      expect(CampaignManager.calculateTotalDonations(mockCampaign)).toBe(500);
    });

    it('returns 0 when donations array is empty', () => {
      expect(CampaignManager.calculateTotalDonations({ ...mockCampaign, donations: [] })).toBe(0);
    });

    it('returns 0 when donations is undefined', () => {
      const { donations, ...withoutDonations } = mockCampaign;
      expect(CampaignManager.calculateTotalDonations(withoutDonations as any)).toBe(0);
    });
  });

  describe('calculateProgressPercentage', () => {
    it('calculates percentage correctly', () => {
      expect(CampaignManager.calculateProgressPercentage(mockCampaign)).toBe(50);
    });

    it('returns 100 when goal is 0', () => {
      expect(CampaignManager.calculateProgressPercentage({ ...mockCampaign, goal: 0 })).toBe(100);
    });

    it('clamps at 100 when overfunded', () => {
      const overfunded = { ...mockCampaign, goal: 100 };
      expect(CampaignManager.calculateProgressPercentage(overfunded)).toBe(100);
    });

    it('returns 0 when there are no donations', () => {
      expect(CampaignManager.calculateProgressPercentage({ ...mockCampaign, donations: [] })).toBe(0);
    });
  });

  describe('getCampaignStats', () => {
    it('returns correct stats', () => {
      const stats = CampaignManager.getCampaignStats(mockCampaign);
      expect(stats.totalDonations).toBe(500);
      expect(stats.goal).toBe(1000);
      expect(stats.remaining).toBe(500);
      expect(stats.donorsCount).toBe(2);
      expect(stats.progressPercentage).toBe(50);
    });

    it('remaining is never negative', () => {
      const overfunded = { ...mockCampaign, goal: 100 };
      const stats = CampaignManager.getCampaignStats(overfunded);
      expect(stats.remaining).toBe(0);
    });

    it('counts unique donors', () => {
      const sameDonor = {
        ...mockCampaign,
        donations: [
          { id: 1, from_user: 1, to_campaign: 1, amount: 100 },
          { id: 2, from_user: 1, to_campaign: 1, amount: 200 },
        ],
      };
      const stats = CampaignManager.getCampaignStats(sameDonor);
      expect(stats.donorsCount).toBe(1);
    });
  });
});
