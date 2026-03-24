import { create } from 'zustand';
import { campaignApi } from '../services/api';

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60) return `for ${seconds} sekund${seconds !== 1 ? 'er' : ''} siden`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `for ${minutes} minut${minutes !== 1 ? 'ter' : ''} siden`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `for ${hours} time${hours !== 1 ? 'r' : ''} siden`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `for ${days} dag${days !== 1 ? 'e' : ''} siden`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `for ${weeks} uge${weeks !== 1 ? 'r' : ''} siden`;
  const months = Math.floor(days / 30);
  if (months < 12) return `for ${months} måned${months !== 1 ? 'er' : ''} siden`;
  const years = Math.floor(days / 365);
  return `for ${years} år siden`;
}

function parsePgArray(val) {
  if (Array.isArray(val)) return val;
  if (!val || val === '{}') return [];
  // PostgreSQL array literal: {val1,val2} or {"val1","val2"}
  return val.slice(1, -1).split(',').map(s => s.replace(/^"|"$/g, '').trim()).filter(Boolean);
}

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
    created_at: c.created_at || null,
    time: c.created_at ? timeAgo(c.created_at) : '',
    creator: c.created_by,
    tags: parsePgArray(c.tags),
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
      const sorted = data.map(normalizeCampaign).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      set({ campaigns: sorted, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
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
