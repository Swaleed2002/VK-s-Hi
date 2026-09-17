import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send, Play, Pause } from 'lucide-react';
import { Button } from './Button';

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob, durationMs: number) => void;
  onCancel: () => void;
}

export function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    startRecording();
    return () => cleanup();
  }, []);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied", err);
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob, duration * 1000);
    }
  };

  const togglePlayback = () => {
    if (!audioBlob) return;
    
    if (!audioRef.current) {
      const url = URL.createObjectURL(audioBlob);
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex-1 flex items-center bg-gray-100 dark:bg-gray-900 rounded-2xl px-2 py-1 relative animate-in fade-in zoom-in-95 duration-200">
      
      {!audioBlob ? (
        <>
          <div className="flex items-center space-x-3 text-red-500 px-3 flex-1">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono tabular-nums">{formatTime(duration)}</span>
          </div>
          <Button variant="ghost" size="icon" className="text-gray-500 shrink-0 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full" onClick={onCancel}>
            <Trash2 size={20} />
          </Button>
          <Button size="icon" className="shrink-0 rounded-full h-10 w-10 bg-red-500 hover:bg-red-600 text-white ml-2" onClick={stopRecording}>
            <Square size={16} className="fill-current" />
          </Button>
        </>
      ) : (
        <>
          <Button variant="ghost" size="icon" className="text-gray-500 shrink-0 ml-1 rounded-full" onClick={togglePlayback}>
            {isPlaying ? <Pause size={20} /> : <Play size={20} className="fill-current" />}
          </Button>
          <div className="flex-1 px-3">
            <div className="h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full w-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: '100%' }} />
            </div>
          </div>
          <span className="text-xs text-gray-500 font-mono tabular-nums mr-2">{formatTime(duration)}</span>
          <Button variant="ghost" size="icon" className="text-gray-500 shrink-0 mr-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full" onClick={onCancel}>
            <Trash2 size={20} />
          </Button>
          <Button size="icon" className="shrink-0 rounded-full h-10 w-10 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSend}>
            <Send size={18} className="ml-1 -mt-0.5" />
          </Button>
        </>
      )}
    </div>
  );
}
