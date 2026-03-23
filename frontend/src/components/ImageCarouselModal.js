import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import './css/ImageCarouselModal.css';

const SWIPE_THRESHOLD = 60;

function ImageCarouselModal({ images, initialIndex = 0, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const [phase, setPhase] = useState('idle');
  // 'idle' | 'dragging' | 'go-next' | 'go-prev' | 'snap-back'
  const [dragX, setDragX] = useState(0);
  const [wrapHeight, setWrapHeight] = useState(null);
  const touchStartX = useRef(null);
  const pendingIndex = useRef(null);
  const centerImgRef = useRef(null);
  const wrapRef = useRef(null);
  const prevHeightRef = useRef(null);

  const prevIdx = (index - 1 + images.length) % images.length;
  const nextIdx = (index + 1) % images.length;

  function measureCenter() {
    const img = centerImgRef.current;
    const wrap = wrapRef.current;
    if (!img || !wrap) return;
    const h = img.clientHeight;
    if (h <= 0) return;
    // Capture current rendered height BEFORE the state update (FLIP "First" step)
    prevHeightRef.current = wrap.clientHeight;
    setWrapHeight(h);
  }

  // FLIP "Invert + Play": runs synchronously after DOM update but before browser paint
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const prevH = prevHeightRef.current;
    if (!wrap || prevH === null || prevH === wrapHeight || prevH === 0) return;

    const delta = prevH - wrapHeight;

    // Invert: instantly place wrap so the visual center hasn't moved
    wrap.style.transition = 'none';
    wrap.style.transform = `translateY(${delta / 2}px)`;
    // Force reflow so browser registers the offset before we start the transition
    wrap.getBoundingClientRect();
    // Play: animate back to natural position
    wrap.style.transition = 'transform 0.1s ease';
    wrap.style.transform = 'translateY(0)';

    const cleanup = () => { wrap.style.transition = ''; wrap.style.transform = ''; };
    wrap.addEventListener('transitionend', cleanup, { once: true });
    return () => wrap.removeEventListener('transitionend', cleanup);
  }, [wrapHeight]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-measure whenever the center image changes
  useEffect(() => {
    const img = centerImgRef.current;
    if (!img) return;
    if (img.complete) {
      measureCenter();
    } else {
      img.addEventListener('load', measureCenter, { once: true });
    }
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

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
          ref={wrapRef}
          className="icm-image-wrap"
          style={wrapHeight ? { height: wrapHeight } : undefined}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {images.length > 1 && (
            <button
              className="icm-arrow icm-arrow--left"
              onMouseDown={e => e.preventDefault()}
              onTouchStart={e => e.stopPropagation()}
              onClick={() => goPrev()}
              aria-label="Forrige"
            >‹</button>
          )}

          {images.length > 1 ? (
            <div
              className="icm-track"
              style={getTrackStyle()}
              onTransitionEnd={handleTransitionEnd}
            >
              <div className="icm-slide"><img className="icm-image" src={images[prevIdx]} alt="" /></div>
              <div className="icm-slide"><img className="icm-image" ref={centerImgRef} src={images[index]} alt={`Billede ${index + 1}`} onLoad={measureCenter} /></div>
              <div className="icm-slide"><img className="icm-image" src={images[nextIdx]} alt="" /></div>
            </div>
          ) : (
            <img className="icm-image" ref={centerImgRef} src={images[0]} alt="Billede 1" onLoad={measureCenter} />
          )}

          {images.length > 1 && (
            <button
              className="icm-arrow icm-arrow--right"
              onMouseDown={e => e.preventDefault()}
              onTouchStart={e => e.stopPropagation()}
              onClick={() => goNext()}
              aria-label="Næste"
            >›</button>
          )}
        </div>

        {images.length > 1 && (
          <div className="icm-dots">
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
