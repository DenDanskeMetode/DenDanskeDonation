import { useState, useEffect, useRef } from 'react';
import './css/ImageCarouselModal.css';

const SWIPE_THRESHOLD = 60;

function ImageCarouselModal({ images, initialIndex = 0, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const [phase, setPhase] = useState('idle');
  // 'idle' | 'dragging' | 'go-next' | 'go-prev' | 'snap-back'
  const [dragX, setDragX] = useState(0);
  const touchStartX = useRef(null);
  const pendingIndex = useRef(null);

  const prevIdx = (index - 1 + images.length) % images.length;
  const nextIdx = (index + 1) % images.length;

  function getTrackStyle() {
    switch (phase) {
      case 'dragging':
        return { transform: `translateX(calc(-33.333% + ${dragX}px))`, transition: 'none' };
      case 'go-next':
        return { transform: 'translateX(-66.666%)', transition: 'transform 0.3s ease' };
      case 'go-prev':
        return { transform: 'translateX(0%)', transition: 'transform 0.3s ease' };
      case 'snap-back':
        return { transform: 'translateX(-33.333%)', transition: 'transform 0.3s ease' };
      default:
        return { transform: 'translateX(-33.333%)', transition: 'none' };
    }
  }

  function handleTransitionEnd() {
    if (phase === 'go-next') {
      setIndex(pendingIndex.current !== null ? pendingIndex.current : nextIdx);
    } else if (phase === 'go-prev') {
      setIndex(pendingIndex.current !== null ? pendingIndex.current : prevIdx);
    }
    pendingIndex.current = null;
    setPhase('idle');
  }

  function goNext(target = null) {
    if (phase !== 'idle') return;
    pendingIndex.current = target;
    setPhase('go-next');
  }

  function goPrev(target = null) {
    if (phase !== 'idle') return;
    pendingIndex.current = target;
    setPhase('go-prev');
  }

  function handleTouchStart(e) {
    if (phase !== 'idle') return;
    touchStartX.current = e.touches[0].clientX;
    setPhase('dragging');
  }

  function handleTouchMove(e) {
    if (phase !== 'dragging') return;
    setDragX(e.touches[0].clientX - touchStartX.current);
  }

  function handleTouchEnd(e) {
    if (phase !== 'dragging') return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    setDragX(0);
    if (images.length === 1 || Math.abs(dx) < SWIPE_THRESHOLD) {
      setPhase('snap-back');
    } else if (dx < 0) {
      setPhase('go-next');
    } else {
      setPhase('go-prev');
    }
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, onClose]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="icm-overlay" onClick={onClose}>
      <div className="icm-modal" onClick={e => e.stopPropagation()}>

        <button className="icm-close" onClick={onClose} aria-label="Luk">✕</button>

        <div
          className="icm-image-wrap"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="icm-close-bg" onClick={onClose} />

          {images.length > 1 && (
            <button
              className="icm-arrow icm-arrow--left"
              onMouseDown={e => e.preventDefault()}
              onTouchStart={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); goPrev(); }}
              aria-label="Forrige"
            >‹</button>
          )}

          {images.length > 1 ? (
            <div
              className="icm-track"
              style={getTrackStyle()}
              onTransitionEnd={handleTransitionEnd}
              onClick={e => e.stopPropagation()}
            >
              <div className="icm-slide"><img className="icm-image" src={images[prevIdx]} alt="" /></div>
              <div className="icm-slide"><img className="icm-image" src={images[index]} alt={`Billede ${index + 1}`} /></div>
              <div className="icm-slide"><img className="icm-image" src={images[nextIdx]} alt="" /></div>
            </div>
          ) : (
            <div className="icm-slide icm-slide--single" onClick={e => e.stopPropagation()}>
              <img className="icm-image" src={images[0]} alt="Billede 1" />
            </div>
          )}

          {images.length > 1 && (
            <button
              className="icm-arrow icm-arrow--right"
              onMouseDown={e => e.preventDefault()}
              onTouchStart={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); goNext(); }}
              aria-label="Næste"
            >›</button>
          )}
        </div>

        {images.length > 1 && (
          <div className="icm-dots" onClick={e => e.stopPropagation()}>
            {images.map((_, i) => (
              <button
                key={i}
                className={`icm-dot${i === index ? ' icm-dot--active' : ''}`}
                onClick={() => {
                  if (i === index || phase !== 'idle') return;
                  i > index ? goNext(i) : goPrev(i);
                }}
                aria-label={`Billede ${i + 1}`}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default ImageCarouselModal;
