import React, { useState } from 'react';
import { Smile, Sparkles, X, Search } from 'lucide-react';
import { STICKERS, Sticker } from './stickers';

interface EmojiStickerPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onSelectSticker: (sticker: Sticker) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
      '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😋',
      '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐',
      '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌',
      '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧',
      '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'
    ]
  },
  {
    name: 'Gestures',
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
      '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
      '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝',
      '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂'
    ]
  },
  {
    name: 'Hearts & Vibes',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝',
      '🔥', '✨', '⭐', '🌟', '💫', '💥', '💯', '💢', '💬', '👁️‍🗨️'
    ]
  },
  {
    name: 'Animals & Food',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
      '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅',
      '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐',
      '🍕', '🍔', '🍟', '🌭', '🍿', '🥓', '🥞', '☕', '🧋', '🍺'
    ]
  },
  {
    name: 'Activities & Travel',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸',
      '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '✈️',
      '🚀', '🛸', '🚁', '⛵', '🚤', '⚓', '🏖️', '🏝️', '🏕️', '⛺'
    ]
  }
];

export function EmojiStickerPicker({ onSelectEmoji, onSelectSticker, onClose }: EmojiStickerPickerProps) {
  const [activeTab, setActiveTab] = useState<'emoji' | 'stickers'>('emoji');
  const [search, setSearch] = useState('');

  return (
    <div className="flex flex-col h-72 w-full bg-white dark:bg-[#1f2c34] border-t border-gray-200 dark:border-gray-800 shadow-2xl animate-in slide-in-from-bottom-2 duration-200">
      
      {/* Top navigation tabs */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="flex space-x-2">
          <button 
            type="button"
            onClick={() => setActiveTab('emoji')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeTab === 'emoji' 
                ? 'bg-emerald-600 text-white' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <Smile size={16} />
            <span>Emoji</span>
          </button>
          
          <button 
            type="button"
            onClick={() => setActiveTab('stickers')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeTab === 'stickers' 
                ? 'bg-emerald-600 text-white' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <Sparkles size={16} />
            <span>Stickers</span>
          </button>
        </div>

        <button 
          type="button"
          onClick={onClose} 
          className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X size={18} />
        </button>
      </div>

      {/* Emoji View */}
      {activeTab === 'emoji' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {EMOJI_CATEGORIES.map(category => (
            <div key={category.name}>
              <h4 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                {category.name}
              </h4>
              <div className="grid grid-cols-8 sm:grid-cols-10 gap-1">
                {category.emojis.map((emoji, idx) => (
                  <button 
                    key={idx}
                    type="button"
                    onClick={() => onSelectEmoji(emoji)}
                    className="h-10 w-10 flex items-center justify-center text-2xl hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-transform active:scale-125"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stickers View */}
      {activeTab === 'stickers' && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {STICKERS.map(sticker => (
              <button 
                key={sticker.id}
                type="button"
                onClick={() => onSelectSticker(sticker)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 group"
              >
                <img 
                  src={sticker.svg} 
                  alt={sticker.name} 
                  className="w-16 h-16 object-contain drop-shadow-md group-hover:drop-shadow-lg" 
                />
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-1.5 truncate max-w-full">
                  {sticker.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
