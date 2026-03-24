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
  const [allowedTags, setAllowedTags] = useState([]);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [partners, setPartners] = useState([]);
  const [images, setImages] = useState([]);
  const [imageRefs, setImageRefs] = useState([]);
  const [removedImageIds, setRemovedImageIds] = useState([]);

  useEffect(() => {
    fetch('/api/tags')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAllowedTags(data); })
      .catch(err => console.error('Failed to fetch tags:', err));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`/api/campaigns/${id}`, { headers }).then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      }),
      fetch(`/api/campaigns/${id}/images`, { headers }).then(r => r.json()),
    ])
      .then(([data, imgs]) => {
        if (!data) return;
        setTitle(data.title || '');
        setDescription(data.description || '');
        setGoal(data.goal || '');
        setTags(data.tags || []);
        if (Array.isArray(imgs) && imgs.length > 0) {
          setImages(imgs.map(img => `/api/images/${img.id}`));
          setImageRefs(imgs.map(img => ({ type: 'existing', id: img.id })));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    const remaining = 6 - images.length;
    const newFiles = files.slice(0, remaining);
    const urls = newFiles.map(f => URL.createObjectURL(f));
    setImages(prev => [...prev, ...urls]);
    setImageRefs(prev => [...prev, ...newFiles.map(f => ({ type: 'new', file: f }))]);
  }

  function removeImage(index) {
    const ref = imageRefs[index];
    if (ref && ref.type === 'existing') {
      setRemovedImageIds(prev => [...prev, ref.id]);
    }
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageRefs(prev => prev.filter((_, i) => i !== index));
  }

  function toggleTag(tag) {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
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
      if (!res.ok) return;

      for (const imageId of removedImageIds) {
        await fetch(`/api/campaigns/${id}/images/${imageId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      for (const ref of imageRefs) {
        if (ref.type === 'new') {
          const formData = new FormData();
          formData.append('image', ref.file);
          const imgRes = await fetch('/api/images', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
          const imgData = await imgRes.json();
          await fetch(`/api/campaigns/${id}/images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ imageId: imgData.id }),
          });
        }
      }

      navigate(-1);
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
            {tags.map(t => (
              <span key={t} className="tag-pill" onClick={() => toggleTag(t)}>{t} ×</span>
            ))}
            <button className="add-tag-btn" type="button" onClick={() => setShowTagPicker(true)}>+ Tilføj tag</button>
          </div>
        </div>

        {/* Tag picker popup */}
        {showTagPicker && (
          <div className="tag-picker-overlay" onClick={() => setShowTagPicker(false)}>
            <div className="tag-picker" onClick={e => e.stopPropagation()}>
              <p className="tag-picker-title">Vælg tags</p>
              <div className="tags-row">
                {allowedTags.map(t => (
                  <span
                    key={t}
                    className={`tag-pill${tags.includes(t) ? ' tag-pill--selected' : ''}`}
                    onClick={() => toggleTag(t)}
                  >{t}</span>
                ))}
              </div>
              <button className="add-tag-btn" type="button" onClick={() => setShowTagPicker(false)}>Færdig</button>
            </div>
          </div>
        )}

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
