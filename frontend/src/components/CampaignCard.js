import { useNavigate } from 'react-router-dom';
import './CampaignCard.css';

function CampaignCard({ campaign, onClick }) {
  const navigate = useNavigate();
  const pct = Math.min((campaign.raised / campaign.goal) * 100, 100);
  const handleClick = onClick ?? (() => navigate(`/campaigns/${campaign.id}`, { state: campaign }));
  return (
    <div className="campaign-card" onClick={handleClick}>
      <img src={campaign.image} alt={campaign.title} className="campaign-image-placeholder" />
      <div className="campaign-body">
        <div className="campaign-progress-row">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="campaign-raised">{campaign.goal}kr</span>
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
