import { useLocation, useNavigate, useParams } from 'react-router-dom';
import './CampaignDetail.css';
import campaigns from '../data/campaigns';

function CircularProgress({ raised, goal, image, title }) {
  const pct = Math.min((raised / goal) * 100, 100);
  const size = 220;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);

  return (
    <div className="cd-progress-wrap">
      <svg width={size} height={size} className="cd-ring">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#e0e0e0" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#4caf50" strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <img src={image} alt={title} className="cd-ring-img" />
    </div>
  );
}

function CampaignDetail() {
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  const campaign = state ?? campaigns.find(c => c.id === Number(id));

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
