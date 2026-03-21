import { useState, useEffect } from 'react';
import './css/CreateCampaignModal.css';
import ImageUploader from './ImageUploader';

function CreateCampaignModal({ onClose }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [cityName, setCityName] = useState('');
  const [tags, setTags] = useState([]);
  const [partners, setPartners] = useState([]);
  const [images, setImages] = useState([]);
  const [closing, setClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canPublish = Boolean(title.trim() && description.trim() && Number(goal) > 0 && cityName.trim() && tags.length >= 1 && images.length >= 1);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  function handleClose() {
    setClosing(true);
    setTimeout(onClose, 260);
  }

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

  async function handlePublish() {
    if (!canPublish) return;
    setIsSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description, goal: Number(goal), tags, city_name: cityName.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Noget gik galt. Prøv igen.');
      } else {
        handleClose();
      }
    } catch (err) {
      console.error('Error creating campaign:', err);
      setError('Noget gik galt. Prøv igen.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={`modal-overlay${closing ? ' closing' : ''}`}>
      {/* Header */}
      <div className="modal-header">
        <button className="modal-back-btn" onClick={handleClose}>‹</button>
        <h2>Opret kampagne</h2>
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

        {/* City */}
        <div className="form-section">
          <span className="form-label">By</span>
          <input
            className="form-input"
            placeholder="Tilføj by"
            value={cityName}
            onChange={e => setCityName(e.target.value)}
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
          <span className="form-label">Samarbeidspartnere</span>
          <div className="tags-row">
            {partners.map((p, i) => (
              <span key={i} className="tag-pill">{p}</span>
            ))}
            <button className="add-tag-btn" onClick={addPartner}>+ Tilføj samarbejdspartner</button>
          </div>
        </div>

      </div>{/* end modal-body */}

      {/* Actions */}
      <div className="modal-actions">
        {error && <p className="modal-error">{error}</p>}
        <button className="draft-btn" onClick={handleClose}>Gem udkast</button>
        <button
          className="publish-btn"
          onClick={handlePublish}
          disabled={!canPublish || isSubmitting}
        >
          {isSubmitting ? 'Publicerer...' : 'Publicér'}
        </button>
      </div>
    </div>
  );
}

export default CreateCampaignModal;
