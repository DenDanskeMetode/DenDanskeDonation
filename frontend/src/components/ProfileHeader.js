import { useRef, useState } from 'react';
import './ProfileHeader.css';

function ProfileHeader({ user }) {
  const [avatarSrc, setAvatarSrc] = useState(user.avatar);
  const fileInputRef = useRef(null);

  function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarSrc(url);
  }

  return (
    <div className="profile-header">
      <div className="profile-header-bg" />

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
      <div className="profile-stats">
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
