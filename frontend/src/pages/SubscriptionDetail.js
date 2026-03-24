import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import './css/DonationDetail.css';

function DetailRow({ label, value }) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  );
}

function formatDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('da-DK', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function SubscriptionDetail() {
  const { id } = useParams();
  const { state: preview } = useLocation();
  const navigate = useNavigate();
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`/api/subscriptions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject('Ikke fundet'))
      .then(data => { setSub(data); setLoading(false); })
      .catch(err => { setError(String(err)); setLoading(false); });
  }, [id]);

  const image = sub?.image_ids?.[0]
    ? `/api/images/${sub.image_ids[0]}`
    : preview?.image;

  if (loading) {
    return (
      <div className="donation-detail-page">
        <div className="donation-detail-header">
          <button className="donation-detail-back" onClick={() => navigate(-1)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h2 className="donation-detail-title">Abonnement</h2>
        </div>
        <p style={{ padding: 24, color: '#aaa', textAlign: 'center' }}>Henter detaljer...</p>
      </div>
    );
  }

  if (error || !sub) {
    return (
      <div className="donation-detail-page">
        <p style={{ padding: 24 }}>Abonnement ikke fundet.</p>
      </div>
    );
  }

  return (
    <div className="donation-detail-page">
      <div className="donation-detail-header">
        <button className="donation-detail-back" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h2 className="donation-detail-title">Abonnement</h2>
      </div>

      <div className="donation-detail-hero">
        {image && <img src={image} alt="" className="donation-detail-img" />}
        <div className="donation-detail-campaign-name">{sub.campaign_title}</div>
      </div>

      <div className="donation-amount-block">
        <span className="donation-amount-label">Månedligt beløb</span>
        <span className="donation-amount-value">{Number(sub.amount).toLocaleString('da-DK')} kr.</span>
      </div>

      <div className="donation-status-block">
        <span className="donation-status-badge success">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Aktiv
        </span>
      </div>

      <div className="detail-card">
        <DetailRow label="Betalinger foretaget" value={`${sub.payment_count} gang${sub.payment_count !== 1 ? 'e' : ''}`} />
        <div className="detail-divider" />
        <DetailRow label="Total doneret" value={`${Number(sub.total_paid).toLocaleString('da-DK')} kr.`} />
        <div className="detail-divider" />
        <DetailRow label="Næste betaling" value={formatDate(sub.next_payment_date)} />
        <div className="detail-divider" />
        <DetailRow label="Abonnement oprettet" value={formatDate(sub.created_at)} />
      </div>
    </div>
  );
}

export default SubscriptionDetail;
