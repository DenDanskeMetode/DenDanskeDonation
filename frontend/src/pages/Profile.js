import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileHeader from '../components/ProfileHeader';
import CampaignCard from '../components/CampaignCard';
import DonationReceiptModal from '../components/DonationReceiptModal';
import useUserStore from '../store/useUserStore';
import './css/Profile.css';

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

const DANISH_MONTHS = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

function nextPaymentDate(createdAtStr) {
  const day = new Date(createdAtStr).getDate();
  const now = new Date();
  let next = new Date(now.getFullYear(), now.getMonth(), day);
  if (next <= now) next = new Date(now.getFullYear(), now.getMonth() + 1, day);
  return `${next.getDate()}. ${DANISH_MONTHS[next.getMonth()]}`;
}

function SubscriptionItem({ subscription, onClick }) {
  return (
    <div className="donation-item" onClick={onClick} style={{ cursor: 'pointer' }}>
      <img src={subscription.image} alt="" className="donation-thumb" />
      <div className="donation-info">
        <p className="donation-campaign">{subscription.campaign}</p>
        <p className="donation-meta">{subscription.amount} kr. / måned &bull; næste betaling {nextPaymentDate(subscription.created_at)}</p>
        <span className="subscription-badge">Aktiv</span>
      </div>
    </div>
  );
}

function Profile() {
  const [activeTab, setActiveTab] = useState('campaigns');
  const [myCampaigns, setMyCampaigns] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [mySubscriptions, setMySubscriptions] = useState([]);
  const [receiptDonation, setReceiptDonation] = useState(null);
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    if (!storedUser.id || !token) return;
    const headers = { Authorization: `Bearer ${token}` };

    function checkAuth(r) {
      if (r.status === 401 || r.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        throw new Error('Unauthorized');
      }
      return r.json();
    }

    Promise.all([
      fetch('/api/campaigns', { headers }).then(checkAuth),
      fetch(`/api/user/${storedUser.id}`, { headers }).then(checkAuth),
      fetch('/api/subscriptions', { headers }).then(r => {
        if (r.status === 401 || r.status === 403) return checkAuth(r);
        return r.ok ? r.json() : [];
      }),
    ]).then(([campaigns, userInfo, subscriptions]) => {
      setMyCampaigns(
        campaigns
          .filter(c => c.created_by === storedUser.id)
          .map(c => ({
            ...c,
            raised: (c.donations || []).reduce((sum, d) => sum + Number(d.amount), 0),
            location: c.city_name || '',
            time: c.created_at ? timeAgo(c.created_at) : '',
            image: c.image_ids && c.image_ids.length > 0 ? `/api/images/${c.image_ids[0]}` : undefined,
          }))
      );
      const myCampaignList = campaigns.filter(c => c.created_by === storedUser.id);
      const totalDonated = (userInfo.donations || []).reduce((sum, d) => sum + Number(d.amount), 0);
      const totalSubscribed = (subscriptions || []).reduce((sum, s) => {
        const created = new Date(s.created_at);
        const now = new Date();
        const months = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth()) + 1;
        return sum + Number(s.amount) * months;
      }, 0);
      const allReceivedDonations = myCampaignList.flatMap(c => c.donations || []);
      const totalRaised = allReceivedDonations.reduce((sum, d) => sum + Number(d.amount), 0);
      const uniqueDonors = new Set(allReceivedDonations.map(d => d.from_user)).size;

      setUser({
        name: `${userInfo.firstname} ${userInfo.surname}`,
        avatar: userInfo.profile_picture ? `/api/images/${userInfo.profile_picture}` : '/images/default-avatar.jpg',
        totalDonated: `${(totalDonated + totalSubscribed).toLocaleString('da-DK')} kr.`,
        totalRaised: `${totalRaised.toLocaleString('da-DK')} kr.`,
        donors: uniqueDonors,
      });

      const campaignById = Object.fromEntries(campaigns.map(c => [c.id, c]));
      setMyDonations(
        (userInfo.donations || []).map(d => ({
          ...d,
          image: campaignById[d.to_campaign]?.image_ids?.[0]
            ? `/api/images/${campaignById[d.to_campaign].image_ids[0]}`
            : undefined,
          date: d.created_at ? timeAgo(d.created_at) : '',
        }))
      );

      setMySubscriptions(
        (subscriptions || []).map(s => ({
          ...s,
          campaign: s.campaign_title,
          image: s.image_ids?.[0] ? `/api/images/${s.image_ids[0]}` : undefined,
          date: s.created_at ? timeAgo(s.created_at) : '',
        }))
      );
    }).catch(console.error);
  }, [navigate, setUser]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="profile-page">
      <div className="profile-sticky">
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

      <ProfileHeader user={user} />

      <div className="profile-tabs">
        <button
          className={`profile-tab${activeTab === 'campaigns' ? ' active' : ''}`}
          onClick={() => setActiveTab('campaigns')}
        >
          Kampagner
        </button>
        <button
          className={`profile-tab${activeTab === 'donations' ? ' active' : ''}`}
          onClick={() => setActiveTab('donations')}
        >
          Donationer
        </button>
        <button
          className={`profile-tab${activeTab === 'subscriptions' ? ' active' : ''}`}
          onClick={() => setActiveTab('subscriptions')}
        >
          Abonnementer
        </button>
      </div>
      </div>

      <div className="profile-content">
        {activeTab === 'campaigns' && (
          <div className="campaign-list">
            {myCampaigns.length === 0 ? (
              <p className="profile-empty">Ingen kampagner oprettet endnu.</p>
            ) : (
              myCampaigns.map(c => (
                <CampaignCard key={c.id} campaign={c} onClick={() => navigate(`/campaigns/${c.id}/edit`)} />
              ))
            )}
          </div>
        )}
        {activeTab === 'donations' && (
          <div className="donation-list">
            {myDonations.length === 0 ? (
              <p className="profile-empty">Ingen donationer endnu.</p>
            ) : (
              myDonations.map(d => (
                <DonationItem key={d.id} donation={{ campaign: d.campaign_title, amount: `${Number(d.amount).toLocaleString('da-DK')} kr.`, image: d.image, date: d.date }} onClick={() => setReceiptDonation(d)} />
              ))
            )}
          </div>
        )}
        {activeTab === 'subscriptions' && (
          <div className="donation-list">
            {mySubscriptions.length === 0 ? (
              <p className="profile-empty">Ingen aktive abonnementer endnu.</p>
            ) : (
              mySubscriptions.map(s => (
                <SubscriptionItem key={s.id} subscription={s} onClick={() => navigate(`/subscriptions/${s.id}`, { state: { image: s.image } })} />
              ))
            )}
          </div>
        )}
      </div>

      {receiptDonation && (
        <DonationReceiptModal
          donation={receiptDonation}
          donorName={user?.name || ''}
          onClose={() => setReceiptDonation(null)}
        />
      )}
    </div>
  );
}

export default Profile;
