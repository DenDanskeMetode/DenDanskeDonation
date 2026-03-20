import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './css/CampaignDetail.css';
import useCampaignsStore from '../store/useCampaignsStore';
import CircularProgress from '../components/CircularProgress';
import { campaignApi } from '../services/api';

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
    creator: c.created_by,
    tags: c.tags || [],
    image: null,
  };
}

function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const campaigns = useCampaignsStore((state) => state.campaigns);

  const fromStore = campaigns.find(c => c.id === Number(id));
  const [campaign, setCampaign] = useState(fromStore || null);
  const [loading, setLoading] = useState(!fromStore);

  useEffect(() => {
    if (fromStore) return;
    campaignApi.getById(id)
      .then(data => setCampaign(normalizeCampaign(data)))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, fromStore, navigate]);

  if (loading) return null;

  if (!campaign) {
    navigate('/');
    return null;
  }

  return (
    <div className="cd-page">
      <div className="cd-scroll">
        {/* Header */}
        <div className="cd-header">
          <button className="cd-back-btn" onClick={() => navigate('/')}>‹</button>
          <h2 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Tilbage</h2>
        </div>

        {/* Hero */}
        <div className="cd-hero">
          <CircularProgress
            raised={campaign.raised}
            goal={campaign.goal}
            image={campaign.image}
            title={campaign.title}
          />
          <p className="cd-raised-text">
            <strong>{campaign.raised}kr</strong> ud af {campaign.goal}kr doneret
          </p>
        </div>

        {/* Content */}
        <div className="cd-content">
          {/* Creator */}
          <div className="cd-creator">
            <div className="cd-avatar" />
            <span className="cd-creator-name">{campaign.creator ?? 'Ukendt'}</span>
          </div>

          <h1 className="cd-title">{campaign.title}</h1>

          <div className="cd-desc-box">
            <p className="cd-desc">{campaign.description ?? 'Ingen beskrivelse tilgængelig.'}</p>
          </div>
        </div>
      </div>

      {/* Donate button — fixed at bottom */}
      <div className="cd-footer">
        <button className="cd-donate-btn">Donér Nu</button>
      </div>
    </div>
  );
}

export default CampaignDetail;
