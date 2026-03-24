import { create } from 'zustand';

const useUserStore = create((set) => ({
  user: {
    name: '',
    avatar: '/images/default-avatar.jpg',
    totalDonated: '0 kr.',
    totalRaised: '0 kr.',
    donors: 0,
  },

  donations: [],

  setUser: (fields) => set((state) => ({ user: { ...state.user, ...fields } })),

  setAvatar: (avatar) =>
    set((state) => ({ user: { ...state.user, avatar } })),

  logout: () => set({ user: null }),
}));

export default useUserStore;
