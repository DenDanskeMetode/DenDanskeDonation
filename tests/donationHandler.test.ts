import { DonationManager } from '../backend/donationHandler.js';

jest.mock('../backend/dbHandler', () => ({
  createDonation: jest.fn(),
}));

import * as dbHandler from '../backend/dbHandler.js';

const mockCreateDonation = dbHandler.createDonation as jest.Mock;

const mockDonation = {
  id: 1,
  from_user: 1,
  to_campaign: 2,
  amount: 500,
  created_at: '2026-03-19T00:00:00.000Z',
};

describe('DonationManager', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('donate', () => {
    it('persists and returns a donation on valid input', async () => {
      mockCreateDonation.mockResolvedValue(mockDonation);
      const result = await DonationManager.donate({ from_user: 1, to_campaign: 2, amount: 500 });
      expect(result).toEqual(mockDonation);
      expect(mockCreateDonation).toHaveBeenCalledWith({ from_user: 1, to_campaign: 2, amount: 500 });
    });

    it('calls createDonation exactly once', async () => {
      mockCreateDonation.mockResolvedValue(mockDonation);
      await DonationManager.donate({ from_user: 1, to_campaign: 2, amount: 100 });
      expect(mockCreateDonation).toHaveBeenCalledTimes(1);
    });

    it('propagates db errors', async () => {
      mockCreateDonation.mockRejectedValue(new Error('DB error'));
      await expect(DonationManager.donate({ from_user: 1, to_campaign: 2, amount: 100 })).rejects.toThrow('DB error');
    });
  });

  describe('validation', () => {
    it('throws when amount is 0', async () => {
      await expect(DonationManager.donate({ from_user: 1, to_campaign: 2, amount: 0 }))
        .rejects.toThrow('Amount must be greater than 0');
    });

    it('throws when amount is negative', async () => {
      await expect(DonationManager.donate({ from_user: 1, to_campaign: 2, amount: -50 }))
        .rejects.toThrow('Amount must be greater than 0');
    });

    it('throws when to_campaign is missing', async () => {
      await expect(DonationManager.donate({ from_user: 1, to_campaign: 0, amount: 100 }))
        .rejects.toThrow('from_user and to_campaign are required');
    });

    it('throws when from_user is missing', async () => {
      await expect(DonationManager.donate({ from_user: 0, to_campaign: 2, amount: 100 }))
        .rejects.toThrow('from_user and to_campaign are required');
    });

    it('does not call createDonation when validation fails', async () => {
      await expect(DonationManager.donate({ from_user: 1, to_campaign: 2, amount: -1 })).rejects.toThrow();
      expect(mockCreateDonation).not.toHaveBeenCalled();
    });
  });
});
