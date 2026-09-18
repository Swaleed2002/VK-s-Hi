import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send, Play, Pause, AlertCircle } from 'lucide-react';

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob, durationSec: number) => Promise<void>;
  onCancel: () => void;
}

export function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const [state, setState] = useState<'idle' | 'recording' | 'preview'>('recording');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Helper to safely stop microphone stream
  const releaseStream = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
      audioStreamRef.current = null;
    }
  };

  const startRecording = async () => {
    setError(null);
    setDuration(0);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Audio recording is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      // Determine best supported MIME type
      let mimeType = '';
      const types = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg'
      ];
      for (const t of types) {
        if (MediaRecorder.isTypeSupported(t)) {
          mimeType = t;
          break;
        }
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const type = mimeType || recorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type });
        setRecordedBlob(blob);
        releaseStream();
        setState('preview');
      };

      recorder.start(100);
      setState('recording');

      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);

    } catch (err: any) {
      console.error('Microphone error:', err);
      releaseStream();
      let msg = 'Could not access microphone.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Microphone permission was denied. Please allow access in browser settings.';
      } else if (err.name === 'NotFoundError') {
        msg = 'No microphone device was detected.';
      }
      setError(msg);
      setState('idle');
    }
  };

  useEffect(() => {
    startRecording();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      releaseStream();
    };
  }, []);

  const handleStopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    releaseStream();
    onCancel();
  };

  const handleSend = async () => {
    if (!recordedBlob) return;
    setIsSending(true);
    try {
      await onSend(recordedBlob, Math.max(1, duration));
    } catch (e) {
      console.error('Send audio error:', e);
      setError('Failed to send voice message.');
      setIsSending(false);
    }
  };

  const togglePreview = () => {
    if (!previewAudioRef.current && recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      const audio = new Audio(url);
      previewAudioRef.current = audio;
      audio.onended = () => setPreviewPlaying(false);
    }

    if (previewAudioRef.current) {
      if (previewPlaying) {
        previewAudioRef.current.pause();
        setPreviewPlaying(false);
      } else {
        previewAudioRef.current.play();
        setPreviewPlaying(true);
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl w-full text-red-600 dark:text-red-400 text-xs">
        <div className="flex items-center space-x-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
        <button 
          onClick={handleCancel}
          className="ml-2 font-bold underline hover:opacity-80 shrink-0"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between w-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-full px-4 py-2 animate-in fade-in duration-200">
      
      {/* Delete / Cancel Button */}
      <button 
        type="button"
        onClick={handleCancel}
        disabled={isSending}
        aria-label="Discard recording"
        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100/50 rounded-full transition-colors"
      >
        <Trash2 size={18} />
      </button>

      {/* Recording State */}
      {state === 'recording' && (
        <div className="flex items-center space-x-3 flex-1 px-4">
          <div className="relative flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping absolute" />
            <span className="w-3 h-3 rounded-full bg-red-500 relative" />
          </div>
          <span className="font-mono text-sm font-semibold text-gray-800 dark:text-gray-200">
            {formatTime(duration)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 animate-pulse hidden sm:inline">
            Recording audio...
          </span>
        </div>
      )}

      {/* Preview State */}
      {state === 'preview' && (
        <div className="flex items-center space-x-3 flex-1 px-4">
          <button 
            type="button"
            onClick={togglePreview}
            className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs"
          >
            {previewPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
          </button>
          <span className="font-mono text-sm font-semibold text-emerald-800 dark:text-emerald-300">
            {formatTime(duration)} (Preview)
          </span>
        </div>
      )}

      {/* Action button */}
      {state === 'recording' ? (
        <button 
          type="button"
          onClick={handleStopRecording}
          aria-label="Stop recording"
          className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 rounded-full bg-gray-200 dark:bg-gray-800 transition-colors"
        >
          <Square size={16} fill="currentColor" />
        </button>
      ) : (
        <button 
          type="button"
          disabled={isSending}
          onClick={handleSend}
          aria-label="Send voice message"
          className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition-transform active:scale-90 shadow-md shadow-emerald-600/30 flex items-center justify-center"
        >
          <Send size={18} />
        </button>
      )}

    </div>
  );
}
