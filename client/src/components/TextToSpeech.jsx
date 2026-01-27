import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Volume2, Square } from 'lucide-react'

const TextToSpeech = ({ text, isMine = false }) => {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const utteranceRef = useRef(null)

  const speak = useCallback(() => {
    if (!text) return

    // Neu dang noi -> dung lai
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    // Tao SpeechSynthesisUtterance
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'vi-VN'
    utterance.rate = 1
    utterance.pitch = 1

    // Chon giong Viet neu co
    const voices = window.speechSynthesis.getVoices()
    const viVoice = voices.find(v => v.lang.startsWith('vi'))
    if (viVoice) {
      utterance.voice = viVoice
    }

    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
    setIsSpeaking(true)
  }, [text, isSpeaking])

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel()
    }
  }, [])

  if (!text) return null

  return (
    <button
      onClick={speak}
      className={`p-0.5 rounded-full transition-colors ${
        isSpeaking
          ? isMine
            ? 'text-white bg-white/20'
            : 'text-indigo-600 bg-indigo-100'
          : isMine
            ? 'text-white/50 hover:text-white/80'
            : 'text-gray-400 hover:text-gray-600'
      }`}
      title={isSpeaking ? 'Stop' : 'Listen'}
    >
      {isSpeaking ? (
        <Square className='w-3 h-3' fill='currentColor' />
      ) : (
        <Volume2 className='w-3 h-3' />
      )}
    </button>
  )
}

export default TextToSpeech
