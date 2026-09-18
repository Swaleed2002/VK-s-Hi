import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface VoiceMessagePlayerProps {
  audioUrl: string;
  durationSec?: number;
  isSender: boolean;
}

export function VoiceMessagePlayer({ audioUrl, durationSec = 0, isSender }: VoiceMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSec);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
        setDuration(Math.round(audio.duration));
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.playbackRate = playbackRate;
      audio.play().then(() => setIsPlaying(true)).catch(err => console.warn('Play error:', err));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const toggleSpeed = () => {
    const rates = [1, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center space-x-3 py-1 px-1 min-w-[220px] max-w-[280px]">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Play/Pause Button */}
      <button 
        type="button"
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90 shadow-sm ${
          isSender 
            ? 'bg-white text-emerald-700' 
            : 'bg-emerald-600 text-white'
        }`}
      >
        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
      </button>

      {/* Waveform & Scrubber */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="relative flex items-center w-full h-4">
          <input 
            type="range"
            min="0"
            max={duration || 1}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-black/20 dark:bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        <div className="flex justify-between items-center text-[11px] font-mono opacity-80 mt-0.5">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration || durationSec)}</span>
        </div>
      </div>

      {/* Speed Rate Button */}
      <button 
        type="button"
        onClick={toggleSpeed}
        className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider shrink-0 transition-colors ${
          isSender
            ? 'bg-emerald-800/30 text-emerald-900 dark:text-emerald-100 hover:bg-emerald-800/40'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300'
        }`}
      >
        {playbackRate}x
      </button>
    </div>
  );
}
