import { create } from 'zustand';

const useUserStore = create((set) => ({
  user: {
    name: 'Emily Wang',
    avatar: '/images/default-avatar.jpg',
    totalDonated: '2.413 kr.',
    totalRaised: '23.512 kr.',
    donors: 357,
  },

  donations: [
    {
      id: 1,
      campaign: 'Hjælp os med at holde en fest for vores hund',
      amount: '100 kr.',
      date: 'for 2 dage siden',
      fullDate: '18. marts 2026',
      image: '/images/party-dog.jpg',
      transactionId: 'TXN-00184732',
      paymentMethod: 'Visa •••• 4212',
      status: 'Gennemført',
      campaignId: 2,
    },
    {
      id: 2,
      campaign: 'Støt vores skoleklasse på tur til Berlin',
      amount: '250 kr.',
      date: 'for 1 uge siden',
      fullDate: '13. marts 2026',
      image: '/images/dendanskemetode.png',
      transactionId: 'TXN-00181105',
      paymentMethod: 'Mastercard •••• 8871',
      status: 'Gennemført',
      campaignId: 3,
    },
  ],

  setUser: (fields) => set((state) => ({ user: { ...state.user, ...fields } })),

  setAvatar: (avatar) =>
    set((state) => ({ user: { ...state.user, avatar } })),

  logout: () => set({ user: null }),
}));

export default useUserStore;
