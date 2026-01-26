import React, { useState, useRef, useEffect } from 'react'

const REACTIONS = [
  { type: 'heart', emoji: '❤️', label: 'Love' },
  { type: 'laugh', emoji: '😂', label: 'Haha' },
  { type: 'wow', emoji: '😮', label: 'Wow' },
  { type: 'sad', emoji: '😢', label: 'Sad' },
  { type: 'angry', emoji: '😡', label: 'Angry' },
]

const ReactionPicker = ({ currentReaction, onReact, disabled = false }) => {
  const [showPicker, setShowPicker] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const timeoutRef = useRef(null)
  const containerRef = useRef(null)

  // Handle hover to show picker
  const handleMouseEnter = () => {
    if (disabled) return
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setIsHovering(true)
      setShowPicker(true)
    }, 500) // Show after 500ms hover
  }

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setIsHovering(false)
      setShowPicker(false)
    }, 300) // Hide after 300ms
  }

  const handlePickerMouseEnter = () => {
    clearTimeout(timeoutRef.current)
    setIsHovering(true)
  }

  const handlePickerMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsHovering(false)
      setShowPicker(false)
    }, 300)
  }

  // Quick click toggles heart reaction
  const handleQuickClick = () => {
    if (disabled) return
    // If already has a reaction, clicking removes it
    // If no reaction, add heart
    if (currentReaction) {
      onReact(currentReaction) // Toggle off current reaction
    } else {
      onReact('heart')
    }
    setShowPicker(false)
  }

  const handleReactionSelect = (reactionType) => {
    if (disabled) return
    onReact(reactionType)
    setShowPicker(false)
  }

  // Clean up timeout on unmount
  useEffect(() => {
    return () => clearTimeout(timeoutRef.current)
  }, [])

  // Get current reaction display
  const currentReactionData = REACTIONS.find(r => r.type === currentReaction)

  return (
    <div
      ref={containerRef}
      className='relative'
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main button */}
      <button
        onClick={handleQuickClick}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
          currentReaction
            ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {currentReactionData ? (
          <span className='text-lg leading-none'>{currentReactionData.emoji}</span>
        ) : (
          <svg
            className={`w-[18px] h-[18px] transition-transform duration-200 ${
              currentReaction ? 'fill-red-500 scale-110' : ''
            } active:scale-125`}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
            />
          </svg>
        )}
      </button>

      {/* Reaction picker popup */}
      {showPicker && (
        <div
          className='absolute bottom-full left-0 mb-2 z-50'
          onMouseEnter={handlePickerMouseEnter}
          onMouseLeave={handlePickerMouseLeave}
        >
          <div className='bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 px-2 py-1.5 flex gap-0.5 animate-fade-in'>
            {REACTIONS.map((reaction) => (
              <button
                key={reaction.type}
                onClick={() => handleReactionSelect(reaction.type)}
                className={`p-1.5 text-xl rounded-full hover:scale-125 transition-transform duration-150 ${
                  currentReaction === reaction.type
                    ? 'bg-blue-100 dark:bg-blue-900/30 scale-110'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={reaction.label}
              >
                {reaction.emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ReactionPicker
