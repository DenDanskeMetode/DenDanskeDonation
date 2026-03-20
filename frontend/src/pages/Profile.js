import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileHeader from '../components/ProfileHeader';
import CampaignCard from '../components/CampaignCard';
import campaigns from '../data/campaigns';
import './Profile.css';

const mockUser = {
  name: 'Emily Wang',
  avatar: '/images/default-avatar.jpg',
  totalDonated: '2.413 kr.',
  totalRaised: '23.512 kr.',
  donors: 357,
};

const mockDonations = [
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
];

function DonationItem({ donation, onClick }) {
  return (
    <div className="donation-item" onClick={onClick}>
      <img src={donation.image} alt="" className="donation-thumb" />
      <div className="donation-info">
        <p className="donation-campaign">{donation.campaign}</p>
        <p className="donation-meta">{donation.amount} &bull; {donation.date}</p>
      </div>
    </div>
  );
}

function Profile() {
  const [activeTab, setActiveTab] = useState('campaigns');
  const navigate = useNavigate();

  return (
    <div className="profile-page">
      <button className="profile-page-back" onClick={() => navigate('/')}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <ProfileHeader user={mockUser} />

      <div className="profile-tabs">
        <button
          className={`profile-tab${activeTab === 'campaigns' ? ' active' : ''}`}
          onClick={() => setActiveTab('campaigns')}
        >
          Mine Kampagner
        </button>
        <button
          className={`profile-tab${activeTab === 'donations' ? ' active' : ''}`}
          onClick={() => setActiveTab('donations')}
        >
          Mine Donationer
        </button>
      </div>

      <div className="profile-content">
        {activeTab === 'campaigns' ? (
          <div className="campaign-list">
            {campaigns.map(c => (
              <CampaignCard key={c.id} campaign={c} onClick={() => navigate(`/campaigns/${c.id}/edit`)} />
            ))}
          </div>
        ) : (
          <div className="donation-list">
            {mockDonations.map(d => (
              <DonationItem key={d.id} donation={d} onClick={() => navigate(`/donations/${d.id}`, { state: d })} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
