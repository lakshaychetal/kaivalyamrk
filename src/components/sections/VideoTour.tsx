"use client";

/**
 * `VideoTour` — immersive video walk-through of the Kaivalyam property.
 *
 * Audio strategy:
 *   Browsers block unmuted autoplay. Videos start muted + autoplay.
 *   On the first user interaction (clicking play/pause or the sound button),
 *   we unmute so audio plays from the video itself. After that, audio
 *   persists across clip changes.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { Play, Pause, ChevronLeft, ChevronRight, Film, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { focusRing } from "@/components/ui/buttonStyles";

interface TourVideo {
  id: string;
  label: string;
  description: string;
  src: string;
}

const TOUR_VIDEOS: TourVideo[] = [
  {
    id: "approach",
    label: "Arriving at Kaivalyam",
    description: "The road approach through Wayanad greenery leading to the homestay.",
    src: "/videos/approach.mp4",
  },
  {
    id: "luxury_cottage",
    label: "Luxury Cottage",
    description: "A quick walk-through of the duplex Luxury Cottage — balcony, living area, and garden.",
    src: "/videos/luxury_cottage.mp4",
  },
  {
    id: "walk_library",
    label: "Cottage to Library",
    description: "A gentle walk from the cottage through the property to the reading library.",
    src: "/videos/walk_library.mp4",
  },
  {
    id: "walk_play_area",
    label: "Play Area & Gardens",
    description: "The children's play area and surrounding garden pathways.",
    src: "/videos/walk_play_area.mp4",
  },
];

export function VideoTour({ headingLevel = 2 }: { headingLevel?: 2 | 3 }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true); // start muted for autoplay; unmuted on first interaction
  const videoRef = useRef<HTMLVideoElement>(null);

  /** Unlock audio on the first deliberate user action and keep it consistent. */
  const unlockAudio = useCallback(() => {
    if (muted && videoRef.current) {
      videoRef.current.muted = false;
      setMuted(false);
    }
  }, [muted]);

  /** Sync muted state to the video element when clip or muted flag changes. */
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = muted;
    if (playing) {
      vid.play().catch(() => setPlaying(false));
    } else {
      vid.pause();
    }
  }, [activeIndex, muted, playing]);

  const togglePlayPause = useCallback(() => {
    unlockAudio();
    setPlaying((p) => {
      const next = !p;
      const vid = videoRef.current;
      if (!vid) return next;
      if (next) vid.play().catch(() => {});
      else vid.pause();
      return next;
    });
  }, [unlockAudio]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      if (videoRef.current) videoRef.current.muted = next;
      return next;
    });
  }, []);

  const goNext = useCallback(() => {
    unlockAudio();
    setActiveIndex((i) => (i + 1) % TOUR_VIDEOS.length);
    setPlaying(true);
  }, [unlockAudio]);

  const goPrev = useCallback(() => {
    unlockAudio();
    setActiveIndex((i) => (i - 1 + TOUR_VIDEOS.length) % TOUR_VIDEOS.length);
    setPlaying(true);
  }, [unlockAudio]);

  const selectClip = useCallback((i: number) => {
    unlockAudio();
    setActiveIndex(i);
    setPlaying(true);
  }, [unlockAudio]);

  const active = TOUR_VIDEOS[activeIndex]!;
  const Heading = `h${headingLevel}` as "h2" | "h3";
  const headingId = "video-tour-heading";

  return (
    <section aria-labelledby={headingId} className="bg-secondary text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6 md:py-16">

        {/* Section header */}
        <div className="flex items-center gap-3 mb-8">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white"
            aria-hidden="true"
          >
            <Film size={20} />
          </span>
          <Heading
            id={headingId}
            className="font-serif text-2xl font-semibold text-white md:text-3xl"
          >
            Virtual Tour
          </Heading>
        </div>

        {/* ── Featured video ── */}
        <div className="relative overflow-hidden rounded-2xl bg-black shadow-2xl">
          <div className="relative w-full aspect-video">

            <video
              ref={videoRef}
              key={active.id}
              src={active.src}
              autoPlay
              muted={muted}
              loop
              playsInline
              preload="auto"
              aria-label={active.label}
              className="absolute inset-0 h-full w-full object-cover"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />

            {/* Gradient overlay */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none"
            />

            {/* Caption */}
            <div className="absolute bottom-14 left-0 right-0 px-5 sm:px-6 pointer-events-none">
              <p className="font-serif text-xl font-semibold text-white sm:text-2xl drop-shadow">
                {active.label}
              </p>
              <p className="mt-1 text-sm text-white/80 max-w-prose drop-shadow">
                {active.description}
              </p>
            </div>

            {/* ── Bottom controls bar ── */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-t from-black/80 to-transparent">
              {/* Play / Pause */}
              <button
                type="button"
                aria-label={playing ? "Pause video" : "Play video"}
                onClick={togglePlayPause}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  "bg-white/20 backdrop-blur-sm border border-white/30 text-white",
                  "hover:bg-white/30 hover:scale-110",
                  "motion-safe:transition motion-safe:duration-150",
                  focusRing,
                )}
              >
                {playing
                  ? <Pause size={18} aria-hidden strokeWidth={2} />
                  : <Play size={18} aria-hidden strokeWidth={2} />
                }
              </button>

              {/* Clip counter */}
              <span className="text-xs text-white/60 tabular-nums">
                {activeIndex + 1} / {TOUR_VIDEOS.length}
              </span>

              {/* Mute / Unmute */}
              <button
                type="button"
                aria-label={muted ? "Unmute" : "Mute"}
                onClick={toggleMute}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  "bg-white/20 backdrop-blur-sm border border-white/30 text-white",
                  "hover:bg-white/30 hover:scale-110",
                  !muted && "border-primary/60 bg-primary/30",
                  "motion-safe:transition motion-safe:duration-150",
                  focusRing,
                )}
              >
                {muted
                  ? <VolumeX size={18} aria-hidden strokeWidth={2} />
                  : <Volume2 size={18} aria-hidden strokeWidth={2} />
                }
              </button>
            </div>

            {/* Prev arrow */}
            <button
              type="button"
              aria-label="Previous video"
              onClick={goPrev}
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2",
                "flex h-10 w-10 items-center justify-center rounded-full",
                "bg-black/50 backdrop-blur-sm border border-white/20 text-white",
                "hover:bg-black/75 hover:scale-110",
                "motion-safe:transition motion-safe:duration-150",
                focusRing,
              )}
            >
              <ChevronLeft size={20} aria-hidden />
            </button>

            {/* Next arrow */}
            <button
              type="button"
              aria-label="Next video"
              onClick={goNext}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2",
                "flex h-10 w-10 items-center justify-center rounded-full",
                "bg-black/50 backdrop-blur-sm border border-white/20 text-white",
                "hover:bg-black/75 hover:scale-110",
                "motion-safe:transition motion-safe:duration-150",
                focusRing,
              )}
            >
              <ChevronRight size={20} aria-hidden />
            </button>
          </div>
        </div>

        {/* ── Thumbnail strip ── */}
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Video tour clips">
          {TOUR_VIDEOS.map((video, i) => {
            const isActive = i === activeIndex;
            return (
              <li key={video.id}>
                <button
                  type="button"
                  onClick={() => selectClip(i)}
                  aria-label={`Play: ${video.label}`}
                  aria-pressed={isActive}
                  className={cn(
                    "group relative w-full overflow-hidden rounded-xl",
                    "border-2 motion-safe:transition motion-safe:duration-150",
                    isActive
                      ? "border-primary shadow-lg shadow-primary/30"
                      : "border-white/20 hover:border-white/50",
                    focusRing,
                  )}
                >
                  <div className="aspect-video relative bg-black">
                    <video
                      src={`${video.src}#t=2`}
                      muted
                      playsInline
                      preload="metadata"
                      aria-hidden
                      className="h-full w-full object-cover opacity-80 group-hover:opacity-100 motion-safe:transition"
                    />
                    {!isActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play size={20} className="text-white/80" aria-hidden />
                      </div>
                    )}
                    {isActive && playing && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="h-2 w-2 rounded-full bg-primary motion-safe:animate-pulse" aria-hidden />
                      </div>
                    )}
                  </div>
                  <p className="px-2 py-1.5 text-left text-xs font-medium text-white/90 leading-tight">
                    {video.label}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default VideoTour;
