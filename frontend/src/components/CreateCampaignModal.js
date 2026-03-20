import { useState, useEffect } from 'react';
import './css/CreateCampaignModal.css';
import ImageUploader from './ImageUploader';
import useCampaignsStore from '../store/useCampaignsStore';

function CreateCampaignModal({ onClose }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [tags, setTags] = useState([]);
  const [images, setImages] = useState([]);
  const [closing, setClosing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addCampaign = useCampaignsStore((state) => state.addCampaign);

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

  async function handlePublish() {
    if (!title.trim()) {
      setError('Overskrift er påkrævet.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await addCampaign({
        title: title.trim(),
        description: description.trim() || undefined,
        goal: goal ? Number(goal) : undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
      handleClose();
    } catch (err) {
      setError(err.message);
      setLoading(false);
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
          <input className="form-input" placeholder="Tilføj samarbeidspartner" />
        </div>

        {error && <p style={{ color: 'red', padding: '0 16px' }}>{error}</p>}

      </div>{/* end modal-body */}

      {/* Actions */}
      <div className="modal-actions">
        <button className="draft-btn" onClick={handleClose} disabled={loading}>Gem udkast</button>
        <button className="publish-btn" onClick={handlePublish} disabled={loading}>
          {loading ? 'Gemmer…' : 'Publicér'}
        </button>
      </div>
    </div>
  );
}

export default CreateCampaignModal;
