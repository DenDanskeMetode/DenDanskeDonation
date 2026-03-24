function ImageUploader({ images, onUpload, onRemove, maxImages = 6 }) {
  return (
    <div className="image-row">
      {/* Upload button — always pinned on the left */}
      <label className="img-box-placeholder">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
          <line x1="18" y1="5" x2="18" y2="9" />
          <line x1="16" y1="7" x2="20" y2="7" />
        </svg>
        Tilføj billede
        <input
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={onUpload}
          disabled={images.length >= maxImages}
        />
      </label>

      {/* Scrollable image strip */}
      {images.length > 0 && (
        <div className="img-scroll">
          {images.map((src, i) => (
            <div key={i} className="img-box">
              <img src={src} alt="" className="img-preview" />
              <button className="img-delete-btn" onClick={() => onRemove(i)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageUploader;
