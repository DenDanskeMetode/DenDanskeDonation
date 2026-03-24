import { create } from 'zustand';

const useUserStore = create((set) => ({
  user: null,

  setUser: (fields) => set((state) => ({ user: { ...state.user, ...fields } })),

  setAvatar: (avatar) =>
    set((state) => ({ user: { ...state.user, avatar } })),

  logout: () => set({ user: null }),
}));

export default useUserStore;
