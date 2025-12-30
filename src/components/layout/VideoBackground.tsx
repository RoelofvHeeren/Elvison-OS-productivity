'use client';

export default function VideoBackground() {
  return (
    <video
      autoPlay
      muted
      loop
      playsInline
      className="bg-video"
      aria-hidden="true"
    >
      <source src="/background.mp4" type="video/mp4" />
    </video>
  );
}
