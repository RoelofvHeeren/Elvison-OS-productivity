'use client';

import { useEffect, useRef } from 'react';

export default function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // Explicitly set muted property to ensure mobile autoplay works
      video.muted = true;
      video.play().catch(e => console.error("Auto-play failed:", e));
    }
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      loop
      playsInline
      controls={false}
      className="bg-video"
      aria-hidden="true"
    >
      <source src="/background.mp4" type="video/mp4" />
    </video>
  );
}
