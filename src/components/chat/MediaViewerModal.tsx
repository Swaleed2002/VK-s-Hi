import React from 'react';
import { X, Download } from 'lucide-react';

interface MediaViewerModalProps {
  mediaUrl: string | null;
  mediaType: 'image' | 'video';
  fileName?: string;
  onClose: () => void;
}

export function MediaViewerModal({
  mediaUrl,
  mediaType,
  fileName,
  onClose
}: MediaViewerModalProps) {
  if (!mediaUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = mediaUrl;
    a.download = fileName || (mediaType === 'image' ? 'photo.jpg' : 'video.mp4');
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-lg animate-in fade-in duration-200">
      
      {/* Top action bar */}
      <div className="flex items-center justify-between px-4 py-3 text-white shrink-0 z-10">
        <button 
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X size={24} />
        </button>

        <span className="text-sm font-semibold truncate max-w-[200px] text-gray-300">
          {fileName || (mediaType === 'image' ? 'Photo' : 'Video')}
        </span>

        <button 
          onClick={handleDownload}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Download"
        >
          <Download size={22} />
        </button>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-hidden" onClick={onClose}>
        {mediaType === 'image' ? (
          <img 
            src={mediaUrl} 
            alt="View" 
            className="max-h-full max-w-full object-contain rounded-lg shadow-2xl transition-transform" 
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <video 
            src={mediaUrl} 
            controls 
            autoPlay 
            playsInline
            className="max-h-full max-w-full rounded-lg shadow-2xl" 
            onClick={e => e.stopPropagation()}
          />
        )}
      </div>

    </div>
  );
}
