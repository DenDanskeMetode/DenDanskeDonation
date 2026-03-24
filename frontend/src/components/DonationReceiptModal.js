import { useState, useEffect } from 'react';
import './css/DonationReceiptModal.css';

const DANISH_MONTHS = [
  'januar', 'februar', 'marts', 'april', 'maj', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'december',
];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getDate()}. ${DANISH_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
}

function DonationReceiptModal({ donation, donorName, onClose }) {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  function handleClose() {
    setClosing(true);
    setTimeout(onClose, 260);
  }

  return (
    <div className={`receipt-overlay${closing ? ' closing' : ''}`} onClick={handleClose}>
      <div className="receipt-sheet" onClick={(e) => e.stopPropagation()}>
        <button className="receipt-close-btn" onClick={handleClose} aria-label="Luk">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="receipt-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h2 className="receipt-title">Donation gennemført</h2>
        <p className="receipt-amount">
          {Number(donation.amount).toLocaleString('da-DK')} kr.
        </p>

        {donation.image && (
          <img src={donation.image} alt="" className="receipt-campaign-img" />
        )}

        <div className="receipt-rows">
          <div className="receipt-row">
            <span className="receipt-label">Kampagne</span>
            <span className="receipt-value">{donation.campaign_title}</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-label">Donor</span>
            <span className="receipt-value">{donorName}</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-label">Dato</span>
            <span className="receipt-value">{formatDate(donation.created_at)}</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-label">Tidspunkt</span>
            <span className="receipt-value">{formatTime(donation.created_at)}</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-label">Kvitterings-nr.</span>
            <span className="receipt-value receipt-id">#{donation.id}</span>
          </div>
        </div>

        <button className="receipt-done-btn" onClick={handleClose}>Luk</button>
      </div>
    </div>
  );
}

export default DonationReceiptModal;
