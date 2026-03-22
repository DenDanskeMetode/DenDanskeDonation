import { create } from 'zustand';
import { campaignApi } from '../services/api';

// Map backend campaign shape to what the frontend components expect
function normalizeCampaign(c) {
  const raised = c.donations
    ? c.donations.reduce((sum, d) => sum + Number(d.amount), 0)
    : 0;
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    goal: c.goal,
    raised,
    location: c.city_name || '',
    time: c.created_at ? new Date(c.created_at).toLocaleDateString('da-DK') : '',
    creator: c.created_by,
    tags: c.tags || [],
    image: c.image_ids && c.image_ids.length > 0 ? `/api/images/${c.image_ids[0]}` : null,
  };
}

const useCampaignsStore = create((set) => ({
  campaigns: [],
  loading: false,
  error: null,

  fetchCampaigns: async () => {
    set({ loading: true, error: null });
    try {
      const data = await campaignApi.getAll();
      set({ campaigns: data.map(normalizeCampaign), loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  addCampaign: async (campaignData) => {
    const created = await campaignApi.create(campaignData);
    const normalized = normalizeCampaign(created);
    set((state) => ({ campaigns: [normalized, ...state.campaigns] }));
    return normalized;
  },

  updateCampaign: (id, updates) =>
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),
}));

export default useCampaignsStore;
