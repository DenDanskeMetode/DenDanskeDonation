import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import campaigns from '../data/campaigns';
import '../pages/CreateCampaignModal.css';
import './CampaignSettings.css';

function CampaignSettings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const campaign = campaigns.find(c => c.id === Number(id));

  const [title, setTitle] = useState(campaign?.title || '');
  const [description, setDescription] = useState(campaign?.description || '');
  const [goal, setGoal] = useState(campaign?.goal || '');
  const [tags, setTags] = useState(campaign?.tags || []);
  const [partners, setPartners] = useState(campaign?.partners || []);
  const [images, setImages] = useState(campaign?.image ? [campaign.image] : []);

  function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    const urls = files.map(f => URL.createObjectURL(f));
    setImages(prev => [...prev, ...urls].slice(0, 6));
  }

  function removeImage(index) {
    setImages(prev => prev.filter((_, i) => i !== index));
  }

  function addTag() {
    const tag = prompt('Tilføj tag:');
    if (tag && tag.trim()) setTags(prev => [...prev, tag.trim()]);
  }

  function addPartner() {
    const partner = prompt('Tilføj samarbejdspartner:');
    if (partner && partner.trim()) setPartners(prev => [...prev, partner.trim()]);
  }

  if (!campaign) {
    return (
      <div className="campaign-settings-page">
        <p style={{ padding: 24 }}>Kampagne ikke fundet.</p>
      </div>
    );
  }

  return (
    <div className="campaign-settings-page">
      {/* Header */}
      <div className="settings-header">
        <button className="settings-back-btn" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h2 className="settings-title">Rediger kampagne</h2>
      </div>

      {/* Scrollable body */}
      <div className="modal-body">

        {/* Images */}
        <div className="image-row">
          {images.map((src, i) => (
            <div key={i} className="img-box">
              <img src={src} alt="" className="img-preview" />
              <button className="img-delete-btn" onClick={() => removeImage(i)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
              </button>
            </div>
          ))}
          {images.length < 6 && (
            <label className="img-box-placeholder">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
                <line x1="18" y1="5" x2="18" y2="9" />
                <line x1="16" y1="7" x2="20" y2="7" />
              </svg>
              Tilføj billede
              <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleImageUpload} />
            </label>
          )}
        </div>

        {/* Title */}
        <input
          className="campaign-title-input"
          placeholder="Tilføj overskrift"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        {/* Description */}
        <textarea
          className="campaign-desc-input"
          placeholder="Fortæl hvad din indsamlingskampagne går ud på. Hvad er motivationen bag kampagnen, og hvorfor skal folk donere?"
          value={description}
          onChange={e => setDescription(e.target.value)}
          onInput={e => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 180) + 'px';
          }}
        />

        {/* Goal */}
        <div className="form-section">
          <span className="form-label">Indsamlingsmål</span>
          <input
            className="form-input"
            placeholder="DKK 0"
            type="number"
            value={goal}
            onChange={e => setGoal(e.target.value)}
          />
        </div>

        {/* Tags */}
        <div className="form-section">
          <span className="form-label">Tags</span>
          <div className="tags-row">
            {tags.map((t, i) => (
              <span key={i} className="tag-pill">{t}</span>
            ))}
            <button className="add-tag-btn" onClick={addTag}>+ Tilføj tag</button>
          </div>
        </div>

        {/* Partners */}
        <div className="form-section">
          <span className="form-label">Samarbejdspartnere</span>
          <div className="tags-row">
            {partners.map((p, i) => (
              <span key={i} className="tag-pill">{p}</span>
            ))}
            <button className="add-tag-btn" onClick={addPartner}>+ Tilføj partner</button>
          </div>
        </div>

      </div>

      {/* Actions */}
      <div className="modal-actions">
        <button className="draft-btn">Gem udkast</button>
        <button className="publish-btn">Publicér</button>
      </div>
    </div>
  );
}

export default CampaignSettings;
