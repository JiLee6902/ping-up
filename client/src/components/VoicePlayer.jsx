import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause } from 'lucide-react'

const VoicePlayer = ({ src, isMine = false }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef(null)
  const progressInterval = useRef(null)

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  useEffect(() => {
    const audio = new Audio(src)
    audioRef.current = audio

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration)
    })

    audio.addEventListener('ended', () => {
      setIsPlaying(false)
      setCurrentTime(0)
      clearInterval(progressInterval.current)
    })

    // Some browsers don't fire loadedmetadata for certain audio formats
    // Use durationchange as fallback
    audio.addEventListener('durationchange', () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration)
      }
    })

    return () => {
      audio.pause()
      audio.removeEventListener('loadedmetadata', () => {})
      audio.removeEventListener('ended', () => {})
      audio.removeEventListener('durationchange', () => {})
      clearInterval(progressInterval.current)
    }
  }, [src])

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      clearInterval(progressInterval.current)
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
      progressInterval.current = setInterval(() => {
        setCurrentTime(audioRef.current?.currentTime || 0)
      }, 100)
    }
  }, [isPlaying])

  const handleProgressClick = (e) => {
    if (!audioRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = x / rect.width
    const newTime = percent * duration
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className={`flex items-center gap-2.5 min-w-[180px] max-w-[240px] px-1 py-0.5`}>
      <button
        onClick={togglePlay}
        className={`p-1.5 rounded-full shrink-0 transition-colors ${
          isMine
            ? 'bg-white/20 text-white hover:bg-white/30'
            : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/70'
        }`}
      >
        {isPlaying ? (
          <Pause className='w-4 h-4' fill='currentColor' />
        ) : (
          <Play className='w-4 h-4' fill='currentColor' />
        )}
      </button>

      <div className='flex-1 flex flex-col gap-1'>
        {/* Progress bar */}
        <div
          className={`h-1.5 rounded-full cursor-pointer ${
            isMine ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'
          }`}
          onClick={handleProgressClick}
        >
          <div
            className={`h-full rounded-full transition-all duration-100 ${
              isMine ? 'bg-white/70' : 'bg-indigo-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Duration */}
        <span className={`text-[10px] ${
          isMine ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
        }`}>
          {isPlaying ? formatTime(currentTime) : formatTime(duration)}
        </span>
      </div>
    </div>
  )
}

export default VoicePlayer
