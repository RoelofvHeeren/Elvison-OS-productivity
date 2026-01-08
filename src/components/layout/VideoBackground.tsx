import { useEffect } from 'react';

export default function VideoBackground() {
  useEffect(() => {
    const video = document.querySelector('video');
    if (video) {
      video.play().catch(e => console.error("Auto-play failed:", e));
    }
  }, []);

  return (
    <video
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
