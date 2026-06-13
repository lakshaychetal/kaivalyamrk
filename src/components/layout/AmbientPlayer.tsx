"use client";

/**
 * `AmbientPlayer` — floating bottom-right controls: ambient music toggle
 * plus a WhatsApp chat button stacked beneath it.
 * ----------------------------------------------------------------------
 * Feature: kaivalyam-homestay-website
 *
 * • Ambient music: starts muted (browser autoplay policy); click to play/mute.
 *   The track loops. Audio already trimmed to start from the good part.
 * • WhatsApp: a green floating button below the audio toggle, deep-linking to
 *   the Kaivalyam WhatsApp business number via the pure URL builder.
 * • Accessible: aria-labels, visible focus rings, motion-safe animation only.
 */

import { useEffect, useRef, useState } from "react";
import { Music, VolumeX } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { focusRing } from "@/components/ui/buttonStyles";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { buildWhatsAppUrl } from "@/domain/integration-urls/whatsapp-url";
import { siteInfo } from "@/content/site";

const WHATSAPP_HREF = buildWhatsAppUrl({
  phone: siteInfo.whatsappNumber,
  message: "Hi Kaivalyam, I'd like to know more about staying with you.",
});

export function AmbientPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const audio = new Audio("/audio/ambient.mp3");
    audio.loop = true;
    audio.muted = true;
    audio.preload = "none";
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (muted) {
      audio.preload = "auto";
      audio.muted = false;
      audio.play().catch(() => {
        audio.muted = true;
      });
      setMuted(false);
    } else {
      audio.muted = true;
      setMuted(true);
    }
  };

  return (
    <div className="fixed bottom-6 right-4 z-40 flex flex-col items-center gap-3 sm:right-6">
      {/* Ambient music toggle */}
      <button
        type="button"
        onClick={toggle}
        aria-label={muted ? "Play ambient music" : "Mute ambient music"}
        aria-pressed={!muted}
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full",
          "bg-secondary/90 text-white shadow-lg backdrop-blur-sm",
          "border border-white/20",
          "hover:bg-secondary hover:scale-110",
          "motion-safe:transition motion-safe:duration-200",
          focusRing,
        )}
      >
        {muted ? (
          <VolumeX size={20} aria-hidden strokeWidth={2} />
        ) : (
          <Music size={20} aria-hidden strokeWidth={2} className="motion-safe:animate-pulse" />
        )}
      </button>

      {/* WhatsApp chat — below the audio button */}
      <a
        href={WHATSAPP_HREF}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Kaivalyam Homestay on WhatsApp"
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full",
          "bg-success text-white shadow-lg",
          "border border-white/20",
          "hover:scale-110 hover:opacity-90",
          "motion-safe:transition motion-safe:duration-200",
          focusRing,
        )}
      >
        <WhatsAppIcon size={24} className="text-white" />
      </a>
    </div>
  );
}

export default AmbientPlayer;
