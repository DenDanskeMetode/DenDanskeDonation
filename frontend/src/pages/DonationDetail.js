import { useLocation, useNavigate } from 'react-router-dom';
import './DonationDetail.css';

function DetailRow({ label, value }) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  );
}

function DonationDetail() {
  const { state: donation } = useLocation();
  const navigate = useNavigate();

  if (!donation) {
    return (
      <div className="donation-detail-page">
        <p style={{ padding: 24 }}>Donation ikke fundet.</p>
      </div>
    );
  }

  return (
    <div className="donation-detail-page">
      {/* Header */}
      <div className="donation-detail-header">
        <button className="donation-detail-back" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h2 className="donation-detail-title">Betalingsdetaljer</h2>
      </div>

      {/* Campaign image + name */}
      <div className="donation-detail-hero">
        <img src={donation.image} alt="" className="donation-detail-img" />
        <div className="donation-detail-campaign-name">{donation.campaign}</div>
      </div>

      {/* Amount highlight */}
      <div className="donation-amount-block">
        <span className="donation-amount-label">Doneret beløb</span>
        <span className="donation-amount-value">{donation.amount}</span>
      </div>

      {/* Status badge */}
      <div className="donation-status-block">
        <span className={`donation-status-badge ${donation.status === 'Gennemført' ? 'success' : ''}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {donation.status}
        </span>
      </div>

      {/* Details */}
      <div className="detail-card">
        <DetailRow label="Dato" value={donation.fullDate} />
        <div className="detail-divider" />
        <DetailRow label="Betalingsmetode" value={donation.paymentMethod} />
        <div className="detail-divider" />
        <DetailRow label="Transaktions-ID" value={donation.transactionId} />
      </div>

      {/* Receipt button */}
      <button className="receipt-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 16V4" />
          <path d="M8 12l4 4 4-4" />
          <path d="M4 20h16" />
        </svg>
        Download kvittering
      </button>
    </div>
  );
}

export default DonationDetail;
