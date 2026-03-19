import { useState } from 'react';
import './FilterModal.css';

const SECTIONS = [
  {
    key: 'kategorier',
    label: 'Kategorier',
    options: ['Dyr', 'Uddannelse', 'Sport', 'Kultur', 'Miljø', 'Social'],
  },
  {
    key: 'milepæle',
    label: 'Milepæle og mål',
    options: ['Under 50%', '50–80%', 'Over 80%', 'Nået mål'],
  },
  {
    key: 'dato',
    label: 'Dato og tid',
    options: ['Seneste 24 timer', 'Seneste uge', 'Seneste måned'],
  },
  {
    key: 'lokation',
    label: 'Lokation',
    options: ['København', 'Aarhus', 'Odense', 'Roskilde', 'Tæt på mig'],
  },
  {
    key: 'type',
    label: 'Indsamlingstype',
    options: ['Personlig', 'Nonprofit', 'Skole', 'Sport'],
  },
];

function FilterModal({ selected, onApply, onReset, onClose }) {
  const [local, setLocal] = useState(selected);
  const [openSection, setOpenSection] = useState(null);
  const [closing, setClosing] = useState(false);

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

  return (
    <div className={`filter-overlay${closing ? ' closing' : ''}`} onClick={close}>
      <div className="filter-sheet" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="filter-header">
          <button className="filter-close-btn" onClick={close}>✕</button>
          <span className="filter-title">Filtrer og sortér</span>
          <button className="filter-reset-btn" onClick={reset}>Nulstil</button>
        </div>

        {/* Sections */}
        <div className="filter-sections">
          {SECTIONS.map(section => {
            const isOpen = openSection === section.key;
            const activeCount = (local[section.key]?.size) || 0;
            return (
              <div key={section.key} className="filter-section">
                <button
                  className="filter-section-header"
                  onClick={() => setOpenSection(isOpen ? null : section.key)}
                >
                  <span className="filter-section-label">
                    {section.label}
                    {activeCount > 0 && (
                      <span className="section-count">{activeCount}</span>
                    )}
                  </span>
                  <svg
                    className={`filter-chevron${isOpen ? ' open' : ''}`}
                    width="20" height="20" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="filter-options">
                    {section.options.map(opt => {
                      const checked = local[section.key]?.has(opt);
                      return (
                        <label key={opt} className="filter-option">
                          <span>{opt}</span>
                          <input
                            type="checkbox"
                            checked={!!checked}
                            onChange={() => toggle(section.key, opt)}
                          />
                          <span className="checkmark" />
                        </label>
                      );
                    })}
                  </div>
                )}

                <div className="filter-divider" />
              </div>
            );
          })}
        </div>

        {/* Apply button */}
        <div className="filter-footer">
          <button className="filter-apply-btn" onClick={apply}>Anvend</button>
        </div>
      </div>
    </div>
  );
}

export default FilterModal;
