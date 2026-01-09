'use client';

import { useEffect, useRef, useState } from 'react';

export default function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [canPlay, setCanPlay] = useState(true);
  const hasAttemptedPlay = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasAttemptedPlay.current) return;
    hasAttemptedPlay.current = true;

    // Ensure muted is set for autoplay policies
    video.muted = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

    const attemptPlay = async () => {
      try {
        await video.play();
        setCanPlay(true);
      } catch (err) {
        console.log('Autoplay blocked, setting up interaction listener:', err);

        // Set up one-time interaction listener
        const handleInteraction = async () => {
          try {
            video.muted = true;
            await video.play();
            setCanPlay(true);
            cleanup();
          } catch (playErr) {
            console.error('Play after interaction failed:', playErr);
            // If we still can't play, hide the video to avoid broken UI
            setCanPlay(false);
          }
        };

        const cleanup = () => {
          document.removeEventListener('touchstart', handleInteraction);
          document.removeEventListener('touchend', handleInteraction);
          document.removeEventListener('click', handleInteraction);
        };

        document.addEventListener('touchstart', handleInteraction, { once: true, passive: true });
        document.addEventListener('touchend', handleInteraction, { once: true, passive: true });
        document.addEventListener('click', handleInteraction, { once: true });

        // Return cleanup for useEffect
        return cleanup;
      }
    };

    const cleanupPromise = attemptPlay();

    return () => {
      cleanupPromise?.then(cleanup => cleanup?.());
    };
  }, []);

  // Hide the video entirely if we can't play it (avoids broken play button)
  if (!canPlay) {
    return null;
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      loop
      playsInline
      controls={false}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        zIndex: 0,
        opacity: 0.6,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      <source src="/background.mp4" type="video/mp4" />
    </video>
  );
}
