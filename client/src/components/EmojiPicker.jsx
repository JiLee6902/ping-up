import React, { useState } from 'react'
import { X } from 'lucide-react'

const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍', '🥰', '😘', '😋', '😛', '🤪', '😜', '🤗', '🤔', '🤐', '😏', '😒', '🙄', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'],
  'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '👏', '🙌', '👐', '🤲', '💪', '🦾', '🙏'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  'Activities': ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥅', '⛳', '🎯', '🎮', '🎲', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🎸', '🎺', '🎷', '🎻'],
  'Food': ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍑', '🍒', '🥝', '🍍', '🥭', '🌮', '🍕', '🍔', '🍟', '🌭', '🍿', '🍩', '🍪', '🎂', '🍰', '🧁', '☕', '🍵', '🧃', '🍺', '🍷'],
  'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅', '🦉', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐙', '🦀', '🐠', '🐬', '🐳'],
  'Nature': ['🌸', '💐', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🌍', '🌙', '⭐', '🌟', '✨', '⚡', '🔥', '💧', '🌊', '❄️', '☀️', '🌈'],
  'Objects': ['📱', '💻', '⌨️', '🖥️', '🖱️', '💾', '📷', '📹', '🎥', '📺', '📻', '🎙️', '⏰', '⌚', '💡', '🔦', '💰', '💵', '💳', '🎁', '🎀', '📦', '✉️', '📧', '📝', '📚', '📖']
}

const EmojiPicker = ({ onEmojiSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('Smileys')

  return (
    <div className='absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 w-72 z-50'>
      {/* Header */}
      <div className='flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700'>
        <span className='text-sm font-medium dark:text-white'>Emoji</span>
        <button onClick={onClose} className='p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded'>
          <X className='w-4 h-4 text-gray-500' />
        </button>
      </div>

      {/* Categories */}
      <div className='flex overflow-x-auto p-2 gap-1 border-b border-gray-200 dark:border-gray-700 no-scrollbar'>
        {Object.keys(EMOJI_CATEGORIES).map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-2 py-1 text-xs rounded whitespace-nowrap ${
              activeCategory === category
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Emoji Grid */}
      <div className='p-2 h-48 overflow-y-auto'>
        <div className='grid grid-cols-8 gap-1'>
          {EMOJI_CATEGORIES[activeCategory].map((emoji, index) => (
            <button
              key={index}
              onClick={() => { onEmojiSelect(emoji); onClose(); }}
              className='w-8 h-8 flex items-center justify-center text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition'
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default EmojiPicker
