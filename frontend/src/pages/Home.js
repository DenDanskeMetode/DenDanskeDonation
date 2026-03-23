import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Home.css';
import CreateCampaignModal from '../components/CreateCampaignModal';
import FilterModal from '../components/FilterModal';
import useCampaignsStore from '../store/useCampaignsStore';
import CampaignCard from '../components/CampaignCard';

const filters = ['Tæt på mig', 'Overraskelse', 'Kategori', 'Ny'];

function Home() {
  const campaigns = useCampaignsStore((state) => state.campaigns);
  const fetchCampaigns = useCampaignsStore((state) => state.fetchCampaigns);
  const navigate = useNavigate();

  const [activeFilter, setActiveFilter] = useState(filters[0]);
  const [showModal, setShowModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});

  useEffect(() => {
    fetchCampaigns().catch((err) => {
      if (err.status === 401 || err.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    });
  }, [fetchCampaigns, navigate]);

  const filterCount = Object.values(activeFilters).reduce(
    (sum, set) => sum + (set?.size || 0), 0
  );

  return (
    <div className="home">
      {/* Sticky search + filters */}
      <div className="sticky-header">
        <div className="search-row">
          <div className="search-bar">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" placeholder="Find kampagner" />
            <button className="filter-icon-btn" onClick={() => setShowFilterModal(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="8" y1="12" x2="16" y2="12" />
                <line x1="10" y1="18" x2="14" y2="18" />
              </svg>
              {filterCount > 0 && <span className="filter-badge">{filterCount}</span>}
            </button>
          </div>
          <button className="profile-btn" onClick={() => navigate('/profile')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </button>
        </div>

        <div className="filter-pills">
          {filters.map((f) => (
            <div key={f} className={`pill${f === activeFilter ? ' active' : ''}`} onClick={() => setActiveFilter(f)}>
              <div className="pill-dot" />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Campaign cards */}
      <div className="campaign-list">
        {campaigns.map(c => (
          <CampaignCard key={c.id} campaign={c} />
        ))}
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => setShowModal(true)}>+</button>

      {/* Create campaign modal */}
      {showModal && <CreateCampaignModal onClose={() => setShowModal(false)} />}

      {/* Filter modal */}
      {showFilterModal && (
        <FilterModal
          selected={activeFilters}
          onApply={filters => { setActiveFilters(filters); setShowFilterModal(false); }}
          onReset={() => setActiveFilters({})}
          onClose={() => setShowFilterModal(false)}
        />
      )}
    </div>
  );
}

export default Home;
