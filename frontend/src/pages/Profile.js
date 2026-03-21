import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileHeader from '../components/ProfileHeader';
import CampaignCard from '../components/CampaignCard';
import useUserStore from '../store/useUserStore';
import useCampaignsStore from '../store/useCampaignsStore';
import './css/Profile.css';

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
  const user = useUserStore((state) => state.user);
  const donations = useUserStore((state) => state.donations);
  const campaigns = useCampaignsStore((state) => state.campaigns);

  return (
    <div className="profile-page">
      <button className="profile-page-back" onClick={() => navigate('/')}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <button
        className="profile-logout-btn"
        onClick={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }}
      >
        Log ud
      </button>

      <div className="profile-sticky">
      <ProfileHeader user={user} />

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
            {donations.map(d => (
              <DonationItem key={d.id} donation={d} onClick={() => navigate(`/donations/${d.id}`, { state: d })} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
