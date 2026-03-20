import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useCampaignsStore from '../store/useCampaignsStore';
import '../components/css/CreateCampaignModal.css';
import './css/CampaignSettings.css';
import ImageUploader from '../components/ImageUploader';

function CampaignSettings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const campaigns = useCampaignsStore((state) => state.campaigns);
  const updateCampaign = useCampaignsStore((state) => state.updateCampaign);
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

        <ImageUploader images={images} onUpload={handleImageUpload} onRemove={removeImage} />

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
        <button
          className="publish-btn"
          onClick={() => {
            updateCampaign(campaign.id, { title, description, goal, tags, partners, images });
            navigate(-1);
          }}
        >
          Publicér
        </button>
      </div>
    </div>
  );
}

export default CampaignSettings;
