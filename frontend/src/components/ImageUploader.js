import { useRef, useEffect } from 'react';

function ImageUploader({ images, onUpload, onRemove, maxImages = 6 }) {
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: scrollRef.current.scrollWidth, behavior: 'smooth' });
    }
  }, [images.length]);

  const onMouseDown = (e) => {
    if (window.innerWidth >= 768) return;
    const el = scrollRef.current;
    const startX = e.pageX;
    const startScroll = el.scrollLeft;
    el.style.cursor = 'grabbing';

    const onMove = (e) => {
      el.scrollLeft = startScroll - (e.pageX - startX);
    };

    const onUp = () => {
      el.style.cursor = 'grab';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div className="image-row">
      {/* Scrollable strip — images first, upload button appended on the right */}
      <div
        className="img-scroll"
        ref={scrollRef}
        onMouseDown={onMouseDown}
      >
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

        {/* Upload button — hidden when max images reached */}
        {images.length < maxImages && (
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
            />
          </label>
        )}
      </div>
    </div>
  );
}

export default ImageUploader;
