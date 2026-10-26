"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The demo video. It starts playing (muted, as browsers require for autoplay)
 * once it is mostly on screen and pauses when it scrolls away. A button turns
 * the narration on; after that the visitor is in charge through the controls.
 */
export function DemoPlayer({
  src,
  poster,
  captions,
  className,
}: {
  src: string;
  poster: string;
  captions: string;
  className: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [takenOver, setTakenOver] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video || takenOver) return;
    // Hidden copies (the other aspect ratio) never start.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && video.offsetParent !== null) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [takenOver]);

  function unmute() {
    const video = ref.current;
    if (!video) return;
    video.muted = false;
    setMuted(false);
    setTakenOver(true);
    if (video.currentTime > 1) video.currentTime = 0; // hear the narration from the start
    video.play().catch(() => {});
  }

  return (
    <div className={`relative ${className}`}>
      <video
        ref={ref}
        muted={muted}
        loop={!takenOver}
        controls
        playsInline
        preload="metadata"
        poster={poster || undefined}
        onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
        className="h-full w-full bg-grey-900"
      >
        <source src={src} type="video/mp4" />
        {captions && <track kind="captions" src={captions} srcLang="en-GB" label="English" default />}
      </video>
      {muted && (
        <button
          type="button"
          onClick={unmute}
          className="absolute top-4 right-4 inline-flex items-center gap-2 bg-ink/80 px-4 py-2.5 text-sm font-medium text-paper backdrop-blur transition-colors hover:bg-ink"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 5 6 9H3v6h3l5 4V5Z" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
          </svg>
          Tap for sound
        </button>
      )}
    </div>
  );
}
