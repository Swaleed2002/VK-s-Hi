import React, { useState, useEffect } from 'react';
import { X, Send, FileText, AlertCircle, RefreshCw } from 'lucide-react';

interface MediaPreviewModalProps {
  file: File | null;
  isOpen: boolean;
  uploadProgress: number | null; // 0-100 or null if not uploading
  uploadError: string | null;
  onSend: (caption: string) => void;
  onCancel: () => void;
  onRetry: () => void;
}

export function MediaPreviewModal({
  file,
  isOpen,
  uploadProgress,
  uploadError,
  onSend,
  onCancel,
  onRetry
}: MediaPreviewModalProps) {
  const [caption, setCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setCaption('');
      return;
    }

    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  if (!isOpen || !file) return null;

  const isUploading = uploadProgress !== null && uploadProgress >= 0;
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 text-white shrink-0">
        <button 
          onClick={onCancel} 
          disabled={isUploading}
          className="p-2 rounded-full hover:bg-white/10 disabled:opacity-40 transition-colors"
        >
          <X size={22} />
        </button>
        <span className="text-sm font-semibold truncate max-w-[200px]">{file.name}</span>
        <span className="text-xs text-white/60 font-mono">{formatFileSize(file.size)}</span>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
        {isImage && previewUrl && (
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="max-h-full max-w-full object-contain rounded-xl shadow-2xl" 
          />
        )}

        {isVideo && previewUrl && (
          <video 
            src={previewUrl} 
            controls 
            playsInline
            className="max-h-full max-w-full rounded-xl shadow-2xl" 
          />
        )}

        {!isImage && !isVideo && (
          <div className="flex flex-col items-center justify-center p-8 bg-white/10 rounded-2xl text-white max-w-xs text-center border border-white/15">
            <div className="w-20 h-20 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
              <FileText size={40} />
            </div>
            <p className="font-semibold text-sm break-all mb-1">{file.name}</p>
            <p className="text-xs text-white/60">{file.type || 'Unknown file'} • {formatFileSize(file.size)}</p>
          </div>
        )}

        {/* Upload overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-white z-20">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin mb-4" />
            <p className="font-bold text-lg mb-2">Sending media...</p>
            <div className="w-64 bg-white/20 h-2.5 rounded-full overflow-hidden mb-2">
              <div 
                className="bg-emerald-500 h-full transition-all duration-200" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold">{Math.round(uploadProgress)}%</span>
          </div>
        )}

        {/* Error overlay */}
        {uploadError && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-white z-30 text-center">
            <AlertCircle size={44} className="text-red-500 mb-3" />
            <h4 className="font-bold text-lg mb-1">Upload Failed</h4>
            <p className="text-sm text-gray-300 max-w-xs mb-6">{uploadError}</p>
            <div className="flex space-x-3">
              <button 
                onClick={onCancel}
                className="px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={onRetry}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold flex items-center space-x-2 transition-colors shadow-lg shadow-emerald-600/30"
              >
                <RefreshCw size={16} />
                <span>Retry</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Caption and Send Bar */}
      <div className="p-4 bg-black/60 border-t border-white/10 shrink-0">
        <div className="flex items-center space-x-2 max-w-2xl mx-auto">
          <input 
            type="text"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Add a caption..."
            disabled={isUploading}
            className="flex-1 bg-white/15 border border-white/20 text-white placeholder-white/50 text-sm rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
            onKeyDown={e => {
              if (e.key === 'Enter' && !isUploading) {
                onSend(caption);
              }
            }}
          />
          <button 
            type="button"
            disabled={isUploading}
            onClick={() => onSend(caption)}
            className="h-12 w-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 transition-transform active:scale-95 shrink-0"
          >
            <Send size={20} />
          </button>
        </div>
      </div>

    </div>
  );
}
