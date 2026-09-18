import React from 'react';
import { Camera, Image, FileText, X } from 'lucide-react';

interface AttachmentMenuProps {
  onPickGallery: () => void;
  onPickCamera: () => void;
  onPickDocument: () => void;
  onClose: () => void;
}

export function AttachmentMenu({ 
  onPickGallery, 
  onPickCamera, 
  onPickDocument, 
  onClose 
}: AttachmentMenuProps) {
  return (
    <div 
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 backdrop-blur-xs p-3 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm bg-white dark:bg-[#1f2c34] rounded-3xl p-5 shadow-2xl mb-16 border border-gray-100 dark:border-gray-800 animate-in slide-in-from-bottom-4 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Share Content</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Camera */}
          <button 
            type="button"
            onClick={() => { onClose(); onPickCamera(); }}
            className="flex flex-col items-center p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-transform active:scale-95 group"
          >
            <div className="w-14 h-14 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-lg shadow-pink-500/25 group-hover:scale-105 transition-transform mb-2">
              <Camera size={26} />
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Camera</span>
          </button>

          {/* Photos & Videos Gallery */}
          <button 
            type="button"
            onClick={() => { onClose(); onPickGallery(); }}
            className="flex flex-col items-center p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-transform active:scale-95 group"
          >
            <div className="w-14 h-14 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-transform mb-2">
              <Image size={26} />
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Gallery</span>
          </button>

          {/* Document / File */}
          <button 
            type="button"
            onClick={() => { onClose(); onPickDocument(); }}
            className="flex flex-col items-center p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-transform active:scale-95 group"
          >
            <div className="w-14 h-14 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform mb-2">
              <FileText size={26} />
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Document</span>
          </button>
        </div>
      </div>
    </div>
  );
}
