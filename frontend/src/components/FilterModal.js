import { useState, useEffect, useMemo } from 'react';
import './css/FilterModal.css';
import useCampaignsStore from '../store/useCampaignsStore';

const MILEPÆLE_OPTIONS = ['Under 50%', '50–80%', 'Over 80%', 'Nået mål'];
const DATO_OPTIONS = ['Seneste 24 timer', 'Seneste uge', 'Seneste måned'];
const TYPE_OPTIONS = ['Personlig', 'Nonprofit', 'Skole', 'Sport'];

function FilterModal({ selected, onApply, onReset, onClose }) {
  const [local, setLocal] = useState(selected);
  const [openSection, setOpenSection] = useState(null);
  const [closing, setClosing] = useState(false);
  const [allowedTags, setAllowedTags] = useState([]);
  const campaigns = useCampaignsStore((state) => state.campaigns);

  useEffect(() => {
    fetch('/api/tags')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAllowedTags(data); })
      .catch(err => console.error('Failed to fetch tags:', err));
  }, []);

  const cities = useMemo(() => {
    const counts = {};
    campaigns.forEach(c => {
      if (c.location) counts[c.location] = (counts[c.location] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [campaigns]);

  function close() {
    setClosing(true);
    setTimeout(onClose, 240);
  }

  function toggle(sectionKey, option) {
    setLocal(prev => {
      const current = new Set(prev[sectionKey] || []);
      current.has(option) ? current.delete(option) : current.add(option);
      return { ...prev, [sectionKey]: current };
    });
  }

  function reset() {
    setLocal({});
    onReset();
  }

  function apply() {
    setClosing(true);
    setTimeout(() => onApply(local), 240);
  }

  function renderSectionHeader(sectionKey, label) {
    const isOpen = openSection === sectionKey;
    const activeCount = local[sectionKey]?.size || 0;
    return (
      <button
        className="filter-section-header"
        onClick={() => setOpenSection(isOpen ? null : sectionKey)}
      >
        <span className="filter-section-label">
          {label}
          {activeCount > 0 && <span className="section-count">{activeCount}</span>}
        </span>
        <svg className={`filter-chevron${isOpen ? ' open' : ''}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    );
  }

  function renderOptions(sectionKey, options) {
    return (
      <div className="filter-options">
        {options.map(opt => {
          const checked = !!local[sectionKey]?.has(opt);
          return (
            <label key={opt} className="filter-option">
              <span>{opt}</span>
              <input type="checkbox" checked={checked} onChange={() => toggle(sectionKey, opt)} />
              <span className="checkmark" />
            </label>
          );
        })}
      </div>
    );
  }

  const staticSections = [
    { key: 'kategorier', label: 'Kategorier',      options: allowedTags },
    { key: 'milepæle',   label: 'Milepæle og mål', options: MILEPÆLE_OPTIONS },
    { key: 'dato',       label: 'Dato og tid',      options: DATO_OPTIONS },
  ];

  return (
    <div className={`filter-overlay${closing ? ' closing' : ''}`} onClick={close}>
      <div className="filter-sheet" onClick={e => e.stopPropagation()}>

        <div className="filter-header">
          <button className="filter-close-btn" onClick={close}>✕</button>
          <span className="filter-title">Filtrer og sortér</span>
          <button className="filter-reset-btn" onClick={reset}>Nulstil</button>
        </div>

        <div className="filter-sections">

          {staticSections.map(section => (
            <div key={section.key} className="filter-section">
              {renderSectionHeader(section.key, section.label)}
              {openSection === section.key && renderOptions(section.key, section.options)}
              <div className="filter-divider" />
            </div>
          ))}

          {/* Lokation — scrollable list with campaign counts */}
          <div className="filter-section">
            {renderSectionHeader('lokation', 'Lokation')}
            {openSection === 'lokation' && (
              <div className="filter-options filter-options--scroll">
                {cities.map(([city, count]) => {
                  const checked = !!local.lokation?.has(city);
                  return (
                    <label key={city} className="filter-option">
                      <span>{city} <span className="city-count">({count})</span></span>
                      <input type="checkbox" checked={checked} onChange={() => toggle('lokation', city)} />
                      <span className="checkmark" />
                    </label>
                  );
                })}
              </div>
            )}
            <div className="filter-divider" />
          </div>

          {/* Indsamlingstype — nederst */}
          <div className="filter-section">
            {renderSectionHeader('type', 'Indsamlingstype')}
            {openSection === 'type' && renderOptions('type', TYPE_OPTIONS)}
            <div className="filter-divider" />
          </div>

        </div>

        <div className="filter-footer">
          <button className="filter-apply-btn" onClick={apply}>Anvend</button>
        </div>
      </div>
    </div>
  );
}

export default FilterModal;
