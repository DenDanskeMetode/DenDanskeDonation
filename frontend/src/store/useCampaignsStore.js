import { create } from 'zustand';
import initialCampaigns from '../data/campaigns';

const useCampaignsStore = create((set) => ({
  campaigns: initialCampaigns,

  addCampaign: (campaign) =>
    set((state) => ({ campaigns: [...state.campaigns, campaign] })),

  updateCampaign: (id, updates) =>
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),
}));

export default useCampaignsStore;
