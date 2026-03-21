import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../components/css/CreateCampaignModal.css';
import './css/CampaignSettings.css';
import ImageUploader from '../components/ImageUploader';

function CampaignSettings() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteBtnRef = useRef(null);

  useEffect(() => {
    if (!confirmDelete) return;
    function handleOutsideClick(e) {
      if (deleteBtnRef.current && !deleteBtnRef.current.contains(e.target)) {
        setConfirmDelete(false);
      }
    }
    document.addEventListener('pointerdown', handleOutsideClick);
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, [confirmDelete]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [tags, setTags] = useState([]);
  const [partners, setPartners] = useState([]);
  const [images, setImages] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`/api/campaigns/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then(data => {
        if (!data) return;
        setTitle(data.title || '');
        setDescription(data.description || '');
        setGoal(data.goal || '');
        setTags(data.tags || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

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

  async function handleDelete() {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) navigate(-1);
    } catch (err) {
      console.error('Error deleting campaign:', err);
    }
  }

  async function handleSave() {
    setIsSubmitting(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description, goal: Number(goal), tags }),
      });
      if (res.ok) navigate(-1);
    } catch (err) {
      console.error('Error saving campaign:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) return <div className="campaign-settings-page"><p style={{ padding: 24 }}>Indlæser...</p></div>;
  if (notFound) return <div className="campaign-settings-page"><p style={{ padding: 24 }}>Kampagne ikke fundet.</p></div>;

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
        <button
          ref={deleteBtnRef}
          className={`settings-delete-btn${confirmDelete ? ' confirming' : ''}`}
          onClick={() => confirmDelete ? handleDelete() : setConfirmDelete(true)}
        >
          <span className="delete-btn-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </span>
          <span className="delete-btn-label">Slet?</span>
        </button>
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
        <button className="draft-btn" onClick={() => navigate(-1)}>Annuller</button>
        <button className="publish-btn" onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? 'Gemmer...' : 'Gem'}
        </button>
      </div>
    </div>
  );
}

export default CampaignSettings;
