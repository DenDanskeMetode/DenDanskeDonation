import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import './css/CampaignDetail.css';
import useCampaignsStore from '../store/useCampaignsStore';
import CircularProgress from '../components/CircularProgress';
import DonationModal from '../components/DonationModal';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Lige nu';
  if (mins < 60) return `${mins} min siden`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} t siden`;
  const days = Math.floor(hours / 24);
  return `${days} d siden`;
}

function CampaignDetail() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const campaigns = useCampaignsStore((state) => state.campaigns);
  const [showDonationModal, setShowDonationModal] = useState(false);

  const campaign = state ?? campaigns.find(c => c.id === Number(id));

  const [donations, setDonations] = useState([]);
  const [creator, setCreator] = useState(null);
  const [localRaised, setLocalRaised] = useState(campaign?.raised ?? 0);

  useEffect(() => {
    if (!campaign) return;
    const token = localStorage.getItem('token');
    fetch(`/api/campaigns/${campaign.id}/donations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setDonations(Array.isArray(data) ? data : []))
      .catch(() => setDonations([]));

    if (campaign.creator) {
      fetch(`/api/users/${campaign.creator}/public`)
        .then(r => r.ok ? r.json() : null)
        .then(setCreator)
        .catch(() => {});
    }
  }, [campaign]);

  useEffect(() => {
    if (!campaign?.id) return;
    const token = localStorage.getItem('token');
    const es = new EventSource(`/api/campaigns/${campaign.id}/stream?token=${token}`);
    es.onmessage = (e) => {
      const donation = JSON.parse(e.data);
      setDonations(prev => [donation, ...prev]);
      setLocalRaised(prev => prev + Number(donation.amount));
    };
    return () => es.close();
  }, [campaign?.id]);

  if (!campaign) {
    navigate('/');
    return null;
  }

  const userObj = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = userObj.id;

  return (
    <div className="cd-page">
      <div className="cd-scroll">
        {/* Header */}
        <div className="cd-header">
          <button className="cd-back-btn" onClick={() => navigate('/')}>‹</button>
          <h2 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Tilbage</h2>
        </div>

        {/* Hero row: image left, donations right */}
        <div className="cd-hero">
          <div className="cd-hero-left">
            <CircularProgress
              raised={localRaised}
              goal={campaign.goal}
              image={campaign.image}
              title={campaign.title}
              size={150}
            />
            <p className="cd-raised-text">
              <strong>{localRaised}kr</strong>
              <br />
              <span>af {campaign.goal}kr</span>
            </p>
          </div>

          <div className="cd-donations-panel">
            <p className="cd-donations-title">Donationer</p>
            {donations.length === 0 ? (
              <p className="cd-no-donations">Ingen donationer endnu</p>
            ) : (
              donations.map(d => (
                <div key={d.id} className="cd-donation-entry">
                  <div className="cd-donation-who">{d.sender_firstname ?? d.sender_username}</div>
                  <div className="cd-donation-amount">{d.amount} kr</div>
                  <div className="cd-donation-when">{timeAgo(d.created_at)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Content */}
        <div className="cd-content">
          {/* Creator */}
          <div className="cd-creator">
            {creator?.avatar
              ? <img className="cd-avatar" src={creator.avatar} alt="" />
              : <div className="cd-avatar" />}
            <span className="cd-creator-name">{creator?.name ?? 'Ukendt'}</span>
          </div>

          <h1 className="cd-title">{campaign.title}</h1>

          <div className="cd-desc-box">
            <p className="cd-desc">{campaign.description ?? 'Ingen beskrivelse tilgængelig.'}</p>
          </div>
        </div>
      </div>

      {/* Donate button — fixed at bottom */}
      <div className="cd-footer">
        <button className="cd-donate-btn" onClick={() => setShowDonationModal(true)}>Donér Nu</button>
      </div>

      {/* Donation Modal */}
      {showDonationModal && userId && (
        <DonationModal
          campaign={campaign}
          userId={parseInt(userId)}
          onClose={() => setShowDonationModal(false)}
        />
      )}
    </div>
  );
}

export default CampaignDetail;
