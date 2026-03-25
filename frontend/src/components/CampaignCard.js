import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/CampaignCard.css';

function CampaignCard({ campaign, onClick, index = 0 }) {
  const navigate = useNavigate();
  const pct = Math.min((campaign.raised / campaign.goal) * 100, 100);
  const [displayPct, setDisplayPct] = useState(0);
  const handleClick = onClick ?? (() => navigate(`/campaigns/${campaign.id}`, { state: campaign }));

  useEffect(() => {
    const id = requestAnimationFrame(() => setDisplayPct(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);

  return (
    <div className="campaign-card" onClick={handleClick} style={{ '--card-index': index }}>
      <img src={campaign.image} alt={campaign.title} className="campaign-image-placeholder" />
      <div className="campaign-body">
        <div className="campaign-progress-row">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${displayPct}%` }} />
          </div>
          <span className="campaign-raised">{Number(campaign.goal).toLocaleString('da-DK')} kr</span>
        </div>
        <p className="campaign-title">{campaign.title}</p>
        <p className="campaign-meta">
          {campaign.location} &bull; {campaign.time}
        </p>
      </div>
    </div>
  );
}

export default CampaignCard;
