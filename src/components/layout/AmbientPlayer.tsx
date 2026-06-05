"use client";

/**
 * `AmbientPlayer` — a minimal floating ambient music toggle for the site.
 * -----------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * Plays soft instrumental background music across all pages to reinforce the
 * calm, tranquil Kaivalyam brand experience.
 *
 * UX contract:
 *   • NEVER auto-plays on load — browsers block unmuted autoplay. Instead, the
 *     player starts MUTED and shows a clear ♪ icon inviting the visitor to
 *     unmute. This respects browser policy and user preference.
 *   • A small, unobtrusive floating button sits in the bottom-right corner
 *     (above the WhatsApp FAB in z-order).
 *   • Clicking toggles muted/unmuted — the audio element keeps playing so
 *     there is no buffering delay on unmute.
 *   • The track loops indefinitely.
 *   • All motion is `motion-safe` only (Req 22.7).
 *   • Button has a visible focus ring and a descriptive aria-label (Req 22.3,
 *     22.5).
 *   • Reduced-motion users see no animation on the icon.
 *
 * Audio credit: "The Healing Lake" — Calm Pills / Alaeddin Hallak
 * Source: https://archive.org/details/CalmPills (Free relaxing ambient music)
 */

import { useEffect, useRef, useState } from "react";
import { Music, VolumeX } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { focusRing } from "@/components/ui/buttonStyles";

export function AmbientPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(true);
  const [ready, setReady] = useState(false);

  // Create the audio element once on mount
  useEffect(() => {
    const audio = new Audio("/audio/ambient.mp3");
    audio.loop = true;
    audio.muted = true; // start muted — unmuted when user clicks
    audio.preload = "none"; // don't load until user interacts
    audioRef.current = audio;

    const handleCanPlay = () => setReady(true);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("canplay", handleCanPlay);
      audio.pause();
      audio.src = "";
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (muted) {
      // First unmute: start loading + playing
      audio.preload = "auto";
      audio.muted = false;
      audio.play().catch(() => {
        // If play() fails (e.g. browser policy), stay muted
        audio.muted = true;
        return;
      });
      setMuted(false);
    } else {
      audio.muted = true;
      setMuted(true);
    }
  };

  return (
    <div
      className="fixed bottom-24 right-4 z-40 sm:bottom-8 sm:right-6"
      aria-label="Ambient music control"
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={muted ? "Play ambient music" : "Mute ambient music"}
        aria-pressed={!muted}
        className={cn(
          // Size & shape
          "flex h-11 w-11 items-center justify-center rounded-full",
          // Surface
          "bg-secondary/90 text-white shadow-lg backdrop-blur-sm",
          "border border-white/20",
          // Hover
          "hover:bg-secondary hover:scale-110",
          // Motion
          "motion-safe:transition motion-safe:duration-200",
          // Focus
          focusRing,
        )}
      >
        {muted ? (
          <VolumeX size={18} aria-hidden strokeWidth={2} />
        ) : (
          <Music
            size={18}
            aria-hidden
            strokeWidth={2}
            className="motion-safe:animate-pulse"
          />
        )}
      </button>

      {/* Tooltip on hover — keyboard + pointer */}
      <span className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-md bg-secondary/90 px-2 py-1 text-xs text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
        {muted ? "Play music" : "Mute music"}
      </span>
    </div>
  );
}

export default AmbientPlayer;
