"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

export default function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play attempt on mount
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.6; // Increased volume
      // Autoplay might be blocked by browsers until user interaction
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.log("Autoplay prevented by browser. User must click play.", e);
      });
    }
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* We use a placeholder URL for the lofi audio track. 
          In a real app, you would place 'lofi.mp3' in the public folder. */}
      <audio
        ref={audioRef}
        src="/nostalgia.mp3"
        loop
      />
      <button
        onClick={togglePlay}
        className="flex items-center justify-center w-12 h-12 rounded-full bg-black/40 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-parchment/20 text-gold/80 hover:bg-black/60 hover:text-parchment transition-all group"
        aria-label="Toggle Sound"
      >
        {isPlaying ? (
          <Volume2 className="w-5 h-5 opacity-70 group-hover:opacity-100" />
        ) : (
          <VolumeX className="w-5 h-5 opacity-70 group-hover:opacity-100" />
        )}
      </button>
    </div>
  );
}
