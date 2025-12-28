import React, { useState, useEffect, useRef, useCallback } from 'react'
import api from '../api/axios'

// Simple debounce utility
const debounce = (func, wait) => {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

const MentionInput = ({
  value,
  onChange,
  onSubmit,
  placeholder = "What's on your mind?",
  className = '',
  multiline = false,
  maxLength,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionStart, setMentionStart] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)

  // Debounced search for users
  const searchUsers = useCallback(
    debounce(async (query) => {
      if (!query || query.length < 1) {
        setSuggestions([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const { data } = await api.post('/api/user/discover', { search: query })
        if (data.success) {
          setSuggestions(data.data?.slice(0, 5) || [])
        }
      } catch (error) {
        console.error('Failed to search users:', error)
      } finally {
        setLoading(false)
      }
    }, 300),
    []
  )

  const handleChange = (e) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart

    onChange(newValue)

    // Check for @ mention
    const textBeforeCursor = newValue.substring(0, cursorPos)
    const atIndex = textBeforeCursor.lastIndexOf('@')

    if (atIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(atIndex + 1)
      // Check if there's no space after @ (still typing username)
      if (!/\s/.test(textAfterAt)) {
        setMentionStart(atIndex)
        setMentionQuery(textAfterAt)
        setShowSuggestions(true)
        setSelectedIndex(0)
        searchUsers(textAfterAt)
        return
      }
    }

    setShowSuggestions(false)
    setMentionStart(-1)
    setMentionQuery('')
  }

  const handleSelectUser = (user) => {
    if (mentionStart === -1) return

    const username = user.username
    const beforeMention = value.substring(0, mentionStart)
    const afterMention = value.substring(mentionStart + mentionQuery.length + 1)
    const newValue = `${beforeMention}@${username} ${afterMention}`

    onChange(newValue)
    setShowSuggestions(false)
    setMentionStart(-1)
    setMentionQuery('')
    setSuggestions([])

    // Focus back to input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        const newCursorPos = beforeMention.length + username.length + 2
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)
  }

  const handleKeyDown = (e) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % suggestions.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSelectUser(suggestions[selectedIndex])
        return
      } else if (e.key === 'Escape') {
        setShowSuggestions(false)
      }
    } else if (e.key === 'Enter' && !e.shiftKey && onSubmit) {
      e.preventDefault()
      onSubmit()
    }
  }

  const InputComponent = multiline ? 'textarea' : 'input'

  return (
    <div className='relative flex-1'>
      <InputComponent
        ref={inputRef}
        type={multiline ? undefined : 'text'}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        maxLength={maxLength}
      />

      {/* Mention Suggestions */}
      {showSuggestions && (
        <div className='absolute bottom-full left-0 mb-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50'>
          {loading ? (
            <div className='px-4 py-3 text-sm text-gray-500 dark:text-gray-400'>
              Searching...
            </div>
          ) : suggestions.length === 0 ? (
            <div className='px-4 py-3 text-sm text-gray-500 dark:text-gray-400'>
              No users found
            </div>
          ) : (
            suggestions.map((user, index) => (
              <button
                key={user.id || user._id}
                type='button'
                onClick={() => handleSelectUser(user)}
                className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition ${
                  index === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
                }`}
              >
                <img
                  src={user.profilePicture || user.profile_picture || '/default-avatar.png'}
                  alt=""
                  className='w-8 h-8 rounded-full object-cover'
                />
                <div className='text-left'>
                  <p className='text-sm font-medium dark:text-white'>
                    {user.fullName || user.full_name}
                  </p>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                    @{user.username}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// Helper function to render text with clickable mentions
export const renderTextWithMentions = (text, onMentionClick) => {
  if (!text) return null

  const mentionRegex = /@(\w+)/g
  const parts = []
  let lastIndex = 0
  let match

  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }

    // Add the mention as a link
    const username = match[1]
    parts.push(
      <button
        key={match.index}
        onClick={() => onMentionClick && onMentionClick(username)}
        className='text-blue-500 hover:underline font-medium'
      >
        @{username}
      </button>
    )

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return parts
}

export default MentionInput
