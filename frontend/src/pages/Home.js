import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Home.css';
import CreateCampaignModal from '../components/CreateCampaignModal';
import FilterModal from '../components/FilterModal';
import useCampaignsStore from '../store/useCampaignsStore';
import CampaignCard from '../components/CampaignCard';

const filters = ['Udforsk', 'Tæt på mig', 'Sponsoreret', 'Nye brugere'];

function Home() {
  const campaigns = useCampaignsStore((state) => state.campaigns);
  const fetchCampaigns = useCampaignsStore((state) => state.fetchCampaigns);
  const navigate = useNavigate();

  const [activeFilter, setActiveFilter] = useState(filters[0]);
  const [showModal, setShowModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

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

  const visibleCampaigns = useMemo(() => {
    let result = campaigns;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.title?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q) ||
        c.tags?.some(t => t.toLowerCase().includes(q))
      );
    }

    const kategorier = activeFilters.kategorier;
    if (kategorier?.size > 0) {
      result = result.filter(c => c.tags?.some(t => kategorier.has(t)));
    }

    const milepæle = activeFilters.milepæle;
    if (milepæle?.size > 0) {
      result = result.filter(c => {
        const pct = c.goal > 0 ? (c.raised / c.goal) * 100 : 0;
        return [...milepæle].some(opt => {
          if (opt === 'Under 50%')  return pct < 50;
          if (opt === '50–80%')     return pct >= 50 && pct <= 80;
          if (opt === 'Over 80%')   return pct > 80 && pct < 100;
          if (opt === 'Nået mål')   return pct >= 100;
          return false;
        });
      });
    }

    const dato = activeFilters.dato;
    if (dato?.size > 0) {
      const now = Date.now();
      result = result.filter(c => {
        if (!c.created_at) return false;
        const ms = now - new Date(c.created_at).getTime();
        return [...dato].some(opt => {
          if (opt === 'Seneste 24 timer') return ms <= 24 * 3600 * 1000;
          if (opt === 'Seneste uge')      return ms <= 7 * 24 * 3600 * 1000;
          if (opt === 'Seneste måned')    return ms <= 30 * 24 * 3600 * 1000;
          return false;
        });
      });
    }

    const lokation = activeFilters.lokation;
    if (lokation?.size > 0) {
      result = result.filter(c => lokation.has(c.location));
    }

    return result;
  }, [campaigns, searchQuery, activeFilters]);

  return (
    <div className="home">
      {/* Sticky search + filters */}
      <div className="sticky-header">
        <div className="search-row">
          <div className="search-bar">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" placeholder="Find kampagner" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
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
        {visibleCampaigns.map(c => (
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
