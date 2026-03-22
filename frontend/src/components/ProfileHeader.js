import { useRef, useState, useEffect } from 'react';
import './css/ProfileHeader.css';

function ProfileHeader({ user }) {
  const [avatarSrc, setAvatarSrc] = useState(user.avatar);
  const [statsVisible, setStatsVisible] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    function onScroll() {
      setStatsVisible(window.scrollY < 10);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  async function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarSrc(URL.createObjectURL(file));

    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    if (!storedUser.id || !token) return;

    const formData = new FormData();
    formData.append('image', file);
    try {
      await fetch(`/api/user/${storedUser.id}/profile-picture`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
    } catch (err) {
      console.error('Error uploading profile picture:', err);
    }
  }

  return (
    <div className={`profile-header${statsVisible ? '' : ' stats-hidden'}`}>
      <div className={`profile-header-bg${statsVisible ? '' : ' stats-hidden'}`} />

      <div className="profile-avatar-wrapper" onClick={() => fileInputRef.current.click()}>
        <img src={avatarSrc} alt="" className="profile-avatar" />
        <div className="profile-avatar-overlay">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleAvatarChange}
      />

      <h2 className="profile-name">{user.name}</h2>
      <div className={`profile-stats${statsVisible ? '' : ' stats-hidden'}`}>
        <div className="profile-stat">
          <span className="stat-value">{user.totalDonated}</span>
          <span className="stat-label">Total Doneret</span>
        </div>
        <div className="profile-stat-divider" />
        <div className="profile-stat">
          <span className="stat-value">{user.totalRaised}</span>
          <span className="stat-label">Total Modtaget</span>
        </div>
        <div className="profile-stat-divider" />
        <div className="profile-stat">
          <span className="stat-value">{user.donors}</span>
          <span className="stat-label">Individuelle donorer</span>
        </div>
      </div>
    </div>
  );
}

export default ProfileHeader;
