import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, Square, Send, X, Pause, Play } from 'lucide-react'

const VoiceRecorder = ({ onSend, onCancel }) => {
  const [state, setState] = useState('idle') // idle | recording | preview
  const [duration, setDuration] = useState(0)
  const [previewDuration, setPreviewDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const timerRef = useRef(null)
  const audioBlobRef = useRef(null)
  const audioRef = useRef(null)

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        audioBlobRef.current = blob
        setState('preview')
        setPreviewDuration(duration)
      }

      mediaRecorder.start()
      setState('recording')
      setDuration(0)

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1)
      }, 1000)
    } catch (err) {
      console.error('Microphone access denied:', err)
    }
  }, [duration])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const handleSend = useCallback(() => {
    if (audioBlobRef.current) {
      onSend(audioBlobRef.current)
    }
    cleanup()
  }, [onSend])

  const handleCancel = useCallback(() => {
    stopRecording()
    cleanup()
    onCancel?.()
  }, [stopRecording, onCancel])

  const cleanup = () => {
    audioBlobRef.current = null
    chunksRef.current = []
    setState('idle')
    setDuration(0)
    setPreviewDuration(0)
    setIsPlaying(false)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
  }

  const togglePreviewPlay = useCallback(() => {
    if (!audioBlobRef.current) return

    if (isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
    } else {
      if (!audioRef.current) {
        const url = URL.createObjectURL(audioBlobRef.current)
        audioRef.current = new Audio(url)
        audioRef.current.onended = () => setIsPlaying(false)
      }
      audioRef.current.play()
      setIsPlaying(true)
    }
  }, [isPlaying])

  useEffect(() => {
    return () => {
      stopRecording()
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [stopRecording])

  // idle state - show mic button
  if (state === 'idle') {
    return (
      <button
        onClick={startRecording}
        className='p-2 text-gray-500 hover:text-indigo-500 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors'
        title='Record voice message'
      >
        <Mic className='w-5 h-5' />
      </button>
    )
  }

  // recording state
  if (state === 'recording') {
    return (
      <div className='flex items-center gap-3 flex-1 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-2'>
        <div className='w-3 h-3 rounded-full bg-red-500 animate-pulse' />
        <span className='text-sm font-medium text-red-600 dark:text-red-400 min-w-[40px]'>
          {formatTime(duration)}
        </span>
        <div className='flex-1 flex items-center'>
          <div className='flex gap-[2px] items-center h-6'>
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className='w-[3px] bg-red-400 dark:bg-red-500 rounded-full animate-pulse'
                style={{
                  height: `${Math.random() * 100}%`,
                  animationDelay: `${i * 50}ms`,
                  minHeight: '4px',
                }}
              />
            ))}
          </div>
        </div>
        <button
          onClick={handleCancel}
          className='p-1.5 text-gray-500 hover:text-red-500 transition-colors'
        >
          <X className='w-5 h-5' />
        </button>
        <button
          onClick={stopRecording}
          className='p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors'
        >
          <Square className='w-4 h-4' fill='currentColor' />
        </button>
      </div>
    )
  }

  // preview state
  if (state === 'preview') {
    return (
      <div className='flex items-center gap-3 flex-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl px-4 py-2'>
        <button
          onClick={togglePreviewPlay}
          className='p-1.5 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition-colors'
        >
          {isPlaying ? (
            <Pause className='w-4 h-4' fill='currentColor' />
          ) : (
            <Play className='w-4 h-4' fill='currentColor' />
          )}
        </button>
        <span className='text-sm font-medium text-indigo-600 dark:text-indigo-400 min-w-[40px]'>
          {formatTime(previewDuration)}
        </span>
        <div className='flex-1 h-1 bg-indigo-200 dark:bg-indigo-700 rounded-full' />
        <button
          onClick={handleCancel}
          className='p-1.5 text-gray-500 hover:text-red-500 transition-colors'
        >
          <X className='w-5 h-5' />
        </button>
        <button
          onClick={handleSend}
          className='p-1.5 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition-colors'
        >
          <Send className='w-4 h-4' />
        </button>
      </div>
    )
  }

  return null
}

export default VoiceRecorder
