'use client';

import { useEffect, useRef, useState } from 'react';

export default function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const video = videoRef.current;
    if (!video) return;

    // Ensure muted is set for autoplay policies
    video.muted = true;

    // Attempt to play immediately
    const playVideo = async () => {
      try {
        await video.play();
      } catch (err) {
        console.log("Autoplay blocked, waiting for interaction:", err);

        // If autoplay fails, add a one-time listener to user interaction
        const enableVideoOnInteraction = async () => {
          try {
            video.muted = true; // Re-enforce mute
            await video.play();
            // Remove listeners once successful
            document.removeEventListener('touchstart', enableVideoOnInteraction);
            document.removeEventListener('click', enableVideoOnInteraction);
            document.removeEventListener('scroll', enableVideoOnInteraction);
          } catch (accessErr) {
            console.error("Interaction play failed:", accessErr);
          }
        };

        // Add listeners for common interactions
        document.addEventListener('touchstart', enableVideoOnInteraction, { passive: true });
        document.addEventListener('click', enableVideoOnInteraction, { passive: true });
        document.addEventListener('scroll', enableVideoOnInteraction, { passive: true }); // Sometimes scroll counts as interaction

        // Cleanup function for this specific effect run
        return () => {
          document.removeEventListener('touchstart', enableVideoOnInteraction);
          document.removeEventListener('click', enableVideoOnInteraction);
          document.removeEventListener('scroll', enableVideoOnInteraction);
        };
      }
    };

    playVideo();
  }, []);

  // Don't render until client-side to avoid hydration mismatches with video usage
  if (!isMounted) return null;

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      loop
      playsInline
      // @ts-ignore - explicitly needed for some older iOS versions
      webkit-playsinline="true"
      disablePictureInPicture
      controls={false}
      className="bg-video"
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        zIndex: 0,
        opacity: 0.4,
        pointerEvents: 'none'
      }}
    >
      <source src="/background.mp4" type="video/mp4" />
    </video>
  );
}
