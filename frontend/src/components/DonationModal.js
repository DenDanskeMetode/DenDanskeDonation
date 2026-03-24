import { useState, useEffect } from 'react';
import PaymentForm from './PaymentForm';
import './css/DonationModal.css';

function DonationModal({ campaign, userId, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState(false);
  const [closing, setClosing] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  function handleClose() {
    setClosing(true);
    setTimeout(onClose, 260);
  }

  function handleQuickAmount(value) {
    setAmount(value.toString());
    setCustomAmount(false);
  }

  function handleSuccess() {
    setPaymentSuccess({ amount: parseInt(amount), isRecurring });
    onSuccess?.();
  }

  if (paymentSuccess) {
    return (
      <div className={`modal-overlay${closing ? ' closing' : ''}`}>
        <div className="modal-header">
          <button className="modal-back-btn" onClick={handleClose}>‹</button>
          <h2>Donér til {campaign.title}</h2>
        </div>
        <div className="modal-body donation-body">
          <div className="donation-success">
            <div className="success-icon">✓</div>
            <h3>{paymentSuccess.isRecurring ? 'Månedlig donation oprettet!' : 'Donation gennemført!'}</h3>
            <p>
              {paymentSuccess.isRecurring
                ? `Du donerer ${paymentSuccess.amount} kr. hver måned. Tak for din støtte!`
                : `Du har doneret ${paymentSuccess.amount} kr. Tak for din støtte!`}
            </p>
            <p className="success-profile-hint">
              {paymentSuccess.isRecurring
                ? 'Du kan se og administrere dine abonnementer på din profil.'
                : 'Du kan se dine tidligere donationer på din profil.'}
            </p>
            <button className="close-success-btn" onClick={handleClose}>Luk</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`modal-overlay${closing ? ' closing' : ''}`}>
      <div className="modal-header">
        <button className="modal-back-btn" onClick={handleClose}>‹</button>
        <h2>Donér til {campaign.title}</h2>
      </div>

      <div className="modal-body donation-body">
        <div className="donation-type-toggle">
          <button
            className={`type-btn ${!isRecurring ? 'active' : ''}`}
            onClick={() => setIsRecurring(false)}
          >
            Engangsbetaling
          </button>
          <button
            className={`type-btn ${isRecurring ? 'active' : ''}`}
            onClick={() => setIsRecurring(true)}
          >
            Månedlig donation
          </button>
        </div>
        <div className="donation-section">
          <p className="donation-label">Vælg beløb:</p>
          <div className="quick-amounts">
            <button
              className={`amount-btn ${amount === '50' && !customAmount ? 'active' : ''}`}
              onClick={() => handleQuickAmount(50)}
            >
              50 kr.
            </button>
            <button
              className={`amount-btn ${amount === '100' && !customAmount ? 'active' : ''}`}
              onClick={() => handleQuickAmount(100)}
            >
              100 kr.
            </button>
            <button
              className={`amount-btn ${amount === '500' && !customAmount ? 'active' : ''}`}
              onClick={() => handleQuickAmount(500)}
            >
              500 kr.
            </button>
          </div>

          <div className="custom-amount-section">
            <input
              type="number"
              placeholder="Eller indtast beløb..."
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setCustomAmount(true);
              }}
              min="1"
              className="custom-amount-input"
            />
            <span className="currency">kr.</span>
          </div>
        </div>

        <label className="anonymous-toggle">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
          />
          <span>Donér anonymt</span>
        </label>

        {amount && parseInt(amount) > 0 && (
          <div className="payment-section">
            <PaymentForm
              amount={parseInt(amount)}
              from_user={userId}
              to_campaign={campaign.id}
              isRecurring={isRecurring}
              isAnonymous={isAnonymous}
              onSuccess={handleSuccess}
              onError={() => {}}
            />
          </div>
        )}
      </div>

      <div className="modal-actions">
        <button className="cancel-btn" onClick={handleClose}>Annullér</button>
      </div>
    </div>
  );
}

export default DonationModal;
