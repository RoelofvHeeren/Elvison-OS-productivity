'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/providers/ThemeProvider';

export default function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [canPlay, setCanPlay] = useState(true);
  const hasAttemptedPlay = useRef(false);
  const { theme } = useTheme();

  // Reset play attempt when theme changes
  useEffect(() => {
    hasAttemptedPlay.current = false;
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [theme]);

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
  }, [theme]); // Re-run when theme changes

  // Hide the video entirely if we can't play it (avoids broken play button)
  if (!canPlay) {
    return null;
  }

  const videoSrc = theme === 'light' ? '/light-mode-desktop.mp4' : '/background.mp4';
  // Adjust opacity for light mode to ensure text contrast if needed, 
  // but usually light mode video should be handled by the video itself.
  // However, forcing valid opacity for light mode might be good.
  const opacity = theme === 'light' ? 0.4 : 0.6;

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
        opacity: opacity,
        pointerEvents: 'none',
        transition: 'opacity 1s ease-in-out',
      }}
      aria-hidden="true"
    >
      <source src={videoSrc} type="video/mp4" />
    </video>
  );
}
