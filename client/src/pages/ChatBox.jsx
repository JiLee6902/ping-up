import React, { useEffect, useRef, useState } from 'react'
import { ImageIcon, SendHorizonal, Settings, Phone, Video, Smile } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import api from '../api/axios'
import { addMessage, fetchMessages, resetMessages, markMessagesSeen } from '../features/messages/messagesSlice'
import toast from 'react-hot-toast'
import ChatSettingsModal from '../components/ChatSettingsModal'
import VideoCall from '../components/VideoCall'
import VoiceRecorder from '../components/VoiceRecorder'
import VoicePlayer from '../components/VoicePlayer'
import TextToSpeech from '../components/TextToSpeech'
import { useSocket } from '../context/SocketContext'
import EmojiPicker from '../components/EmojiPicker'
import Loading from '../components/Loading'

const ChatBox = () => {
  const { messages } = useSelector((state) => state.messages)
  const { userId } = useParams()
  const dispatch = useDispatch()
  const { accessToken } = useSelector((state) => state.auth)
  const currentUser = useSelector((state) => state.user.value)

  const [text, setText] = useState('')
  const [image, setImage] = useState(null)
  const [user, setUser] = useState(null)
  const [chatSettings, setChatSettings] = useState(null)
  const [chatEvents, setChatEvents] = useState([])
  const [showSettings, setShowSettings] = useState(false)
  const [activeCall, setActiveCall] = useState(null)
  const [isSending, setIsSending] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [loadingUser, setLoadingUser] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const messagesEndRef = useRef(null)

  const { socket, isUserOnline, fetchOnlineStatus, isUserTyping, emitTyping, emitStopTyping } = useSocket()
  const typingTimeoutRef = useRef(null)
  const connections = useSelector((state) => state.connections.connections)

  // Listen for socket events specific to this chat
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = async (data) => {
      const message = data.message
      if (message.fromUser?.id === userId) {
        dispatch(addMessage(message))
        // Mark message as seen immediately since we're in the chat
        try {
          await api.post('/api/message/mark-seen', { fromUserId: userId })
        } catch (err) {
          console.error('Failed to mark message as seen:', err)
        }
      }
    }

    const handleMessageSeen = (data) => {
      if (data.seenByUserId === userId) {
        dispatch(markMessagesSeen(data))
      }
    }

    const handleChatSettingsUpdated = (data) => {
      if (data.chatWithUserId === userId) {
        setChatSettings(prev => ({
          ...prev,
          ...data.settings,
        }))
      }
    }

    const handleChatEventCreated = (data) => {
      if (data.chatWithUserId === userId) {
        setChatEvents(prev => [...prev, data.event])
      }
    }

    const handleCallOffer = (data) => {
      setActiveCall({
        callType: data.callType,
        isIncoming: true,
        remoteUser: data.fromUser,
        offer: data.offer,
      })
    }

    socket.on('newMessage', handleNewMessage)
    socket.on('messageSeen', handleMessageSeen)
    socket.on('chatSettingsUpdated', handleChatSettingsUpdated)
    socket.on('chatEventCreated', handleChatEventCreated)
    socket.on('callOffer', handleCallOffer)

    return () => {
      socket.off('newMessage', handleNewMessage)
      socket.off('messageSeen', handleMessageSeen)
      socket.off('chatSettingsUpdated', handleChatSettingsUpdated)
      socket.off('chatEventCreated', handleChatEventCreated)
      socket.off('callOffer', handleCallOffer)
    }
  }, [socket, userId, dispatch])

  const fetchUserMessages = async () => {
    try {
      dispatch(fetchMessages({ token: accessToken, userId }))
    } catch (error) {
      toast.error(error.message)
    }
  }

  const fetchChatSettings = async () => {
    try {
      const { data } = await api.post('/api/message/settings/get', { chatWithUserId: userId })
      if (data.success) {
        setChatSettings(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch chat settings')
    }
  }

  const fetchChatEvents = async () => {
    try {
      const { data } = await api.post('/api/message/events', { chatWithUserId: userId })
      if (data.success) {
        setChatEvents(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch chat events')
    }
  }

  const handleCall = (type) => {
    if (!socket) {
      toast.error('Connection not ready')
      return
    }
    setActiveCall({
      callType: type,
      isIncoming: false,
      remoteUser: user,
    })
    setShowSettings(false)
  }

  const sendMessage = async () => {
    try {
      if (!text && !image) return
      if (isSending) return

      setIsSending(true)

      // Stop typing indicator when sending
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      emitStopTyping(userId)

      const formData = new FormData()
      formData.append('toUserId', userId)
      formData.append('text', text)
      if (image) formData.append('image', image)

      const { data } = await api.post('/api/message/send', formData)
      if (data.success) {
        setText('')
        setImage(null)
        dispatch(addMessage(data.data))
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsSending(false)
    }
  }

  const sendVoiceMessage = async (audioBlob) => {
    try {
      if (isSending) return
      setIsSending(true)
      setIsRecording(false)

      const formData = new FormData()
      formData.append('toUserId', userId)
      formData.append('audio', audioBlob, 'voice.webm')

      const { data } = await api.post('/api/message/send', formData)
      if (data.success) {
        dispatch(addMessage(data.data))
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsSending(false)
    }
  }

  useEffect(() => {
    fetchUserMessages()
    fetchChatSettings()
    fetchChatEvents()
    // Fetch initial online status for this user
    if (userId) {
      fetchOnlineStatus([userId])
    }

    return () => {
      dispatch(resetMessages())
    }
  }, [userId])

  // Fetch user data - from connections or API
  useEffect(() => {
    const fetchUser = async () => {
      setLoadingUser(true)
      // First, check if user is in connections
      if (connections.length > 0) {
        const connection = connections.find(c => {
          const u = c.user || c
          return (u.id || u._id) === userId
        })
        if (connection) {
          setUser(connection.user || connection)
          setLoadingUser(false)
          return
        }
      }
      // If not found in connections, fetch from API
      try {
        const { data } = await api.post('/api/user/profiles', { userId })
        if (data.success) {
          const responseData = data.data || data
          setUser(responseData.user || responseData.profile)
        }
      } catch (error) {
        console.error('Failed to fetch user:', error)
      }
      setLoadingUser(false)
    }

    if (userId) {
      fetchUser()
    }
  }, [connections, userId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const profilePicture = user?.profilePicture || user?.profile_picture
  const fullName = user?.fullName || user?.full_name
  const chatUserId = user?.id || user?._id
  const displayName = chatSettings?.nickname || fullName
  const isOnline = isUserOnline(userId)
  const isTyping = isUserTyping(userId)

  // Handle text input with typing indicator
  const handleTextChange = (e) => {
    setText(e.target.value)

    // Emit typing event
    emitTyping(userId)

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set timeout to emit stopTyping after 1.5 seconds of no typing
    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping(userId)
    }, 1500)
  }

  // Clean up typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      // Emit stop typing when leaving chat
      emitStopTyping(userId)
    }
  }, [userId, emitStopTyping])

  // Helper to normalize date string with timezone
  const normalizeDate = (dateString) => {
    if (!dateString) return new Date()
    if (!dateString.endsWith('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
      return new Date(dateString + 'Z')
    }
    return new Date(dateString)
  }

  const formatSeenTime = (dateString) => {
    if (!dateString) return ''
    const date = normalizeDate(dateString)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  // Sort messages and check if last message is sent by current user and seen
  const sortedMessages = messages.toSorted((a, b) => normalizeDate(a.createdAt) - normalizeDate(b.createdAt))
  const lastMessage = sortedMessages[sortedMessages.length - 1]
  const lastMessageToUserId = lastMessage?.toUser?.id || lastMessage?.toUserId || lastMessage?.to_user_id
  const isLastMessageSentByMe = lastMessageToUserId === chatUserId
  const showSeenOnLastMessage = isLastMessageSentByMe && lastMessage?.seen

  // Combine messages and events, sort by time
  const allItems = [
    ...sortedMessages.map(m => ({ ...m, type: 'message' })),
    ...chatEvents.map(e => ({ ...e, type: 'event' })),
  ].sort((a, b) => normalizeDate(a.createdAt) - normalizeDate(b.createdAt))

  // Get message color or default blue
  const msgColor = chatSettings?.messageColor || '#3b82f6'

  // Helper function to get event text
  const getEventText = (event) => {
    const isMe = event.userId === currentUser?.id
    const userName = isMe ? 'You' : (chatSettings?.nickname || event.user?.fullName)
    switch (event.eventType) {
      case 'nickname_changed':
        return `${userName} set nickname ${event.eventData ? `to ${event.eventData}` : ''}`
      case 'background_changed':
        return `${userName} changed the chat background`
      case 'message_color_changed':
        return `${userName} changed the message color`
      default:
        return ''
    }
  }

  if (loadingUser) {
    return <Loading />
  }

  if (!user) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <p className='text-gray-500'>User not found</p>
      </div>
    )
  }

  return (
    <div
      className='flex flex-col h-screen'
      style={{
        backgroundColor: chatSettings?.backgroundImage ? '#f5f5f5' : (chatSettings?.backgroundColor || '#ffffff'),
        backgroundImage: chatSettings?.backgroundImage ? `url(${chatSettings.backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Header */}
      <div className='flex items-center justify-between px-4 py-2.5 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm'>
        <div className='flex items-center gap-3'>
          <div className='relative'>
            <img src={profilePicture} alt="" className="size-10 rounded-full object-cover ring-2 ring-gray-100" />
            <span className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-[15px]">{displayName}</p>
            {isTyping ? (
              <p className="text-xs text-blue-500 font-medium flex items-center gap-1">
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                typing...
              </p>
            ) : (
              <p className="text-xs text-gray-500">{isOnline ? 'Active now' : 'Offline'}</p>
            )}
          </div>
        </div>
        <div className='flex items-center gap-0.5'>
          <button onClick={() => handleCall('audio')} className='p-2 hover:bg-gray-100 rounded-full cursor-pointer transition'>
            <Phone className='w-5 h-5' style={{ color: msgColor }} />
          </button>
          <button onClick={() => handleCall('video')} className='p-2 hover:bg-gray-100 rounded-full cursor-pointer transition'>
            <Video className='w-5 h-5' style={{ color: msgColor }} />
          </button>
          <button onClick={() => setShowSettings(true)} className='p-2 hover:bg-gray-100 rounded-full cursor-pointer transition'>
            <Settings className='w-5 h-5' style={{ color: msgColor }} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className='flex-1 overflow-y-auto'>
        <div className='max-w-2xl mx-auto px-3 py-2 space-y-px'>
          {
            allItems.map((item, index) => {
              // Render event
              if (item.type === 'event') {
                return (
                  <div key={`event-${item.id}`} className='text-center py-2'>
                    <span className='text-[11px] text-gray-500 bg-white/80 px-2.5 py-1 rounded-full'>
                      {getEventText(item)}
                    </span>
                  </div>
                )
              }

              // Render message
              const message = item
              const toUserId = message.toUser?.id || message.toUserId || message.to_user_id
              const messageType = message.messageType || message.message_type
              const mediaUrl = message.mediaUrl || message.media_url
              const isSent = toUserId === chatUserId
              const isLastMessage = index === allItems.length - 1 && item.type === 'message'

              // Check if next item is a message from same sender
              const nextItem = allItems[index + 1]
              const nextIsMessage = nextItem?.type === 'message'
              const nextToUserId = nextItem?.toUser?.id || nextItem?.toUserId || nextItem?.to_user_id
              const nextIsSent = nextToUserId === chatUserId
              const isLastInGroup = !nextItem || !nextIsMessage || nextIsSent !== isSent

              return (
                <div key={message.id || index} className={`flex items-end gap-1 ${isSent ? 'justify-end' : 'justify-start'}`}>
                  {!isSent && (
                    <div className='w-5 shrink-0'>
                      {isLastInGroup && <img src={profilePicture} alt="" className='size-5 rounded-full object-cover' />}
                    </div>
                  )}
                  <div className={`max-w-[75%] ${isSent ? 'text-right' : ''}`}>
                    {messageType === 'image' && (
                      <img src={mediaUrl} className='max-w-[200px] rounded-xl' alt="" />
                    )}
                    {messageType === 'audio' && (
                      <div
                        className={`inline-block rounded-2xl px-2 py-1.5 ${isSent ? 'text-white' : 'bg-gray-100 text-gray-900'}`}
                        style={isSent ? { backgroundColor: msgColor } : undefined}
                      >
                        <VoicePlayer src={mediaUrl} isMine={isSent} />
                        {message.transcription && (
                          <div className={`flex items-center gap-1 mt-1 px-1 pb-0.5`}>
                            <p className={`text-[12px] leading-snug ${isSent ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'}`}>
                              {message.transcription}
                            </p>
                            <TextToSpeech text={message.transcription} isMine={isSent} />
                          </div>
                        )}
                      </div>
                    )}
                    {message.text && (
                      <div className={`flex items-end gap-1 ${isSent ? 'flex-row-reverse' : ''}`}>
                        <div
                          className={`inline-block px-3 py-1 text-[14px] rounded-2xl ${isSent ? 'text-white' : 'bg-gray-100 text-gray-900'} ${messageType === 'image' || messageType === 'audio' ? 'mt-0.5' : ''}`}
                          style={isSent ? { backgroundColor: msgColor } : undefined}
                        >
                          <p className='whitespace-pre-wrap text-left leading-snug'>{message.text}</p>
                        </div>
                        <TextToSpeech text={message.text} isMine={isSent} />
                      </div>
                    )}
                    {isLastMessage && showSeenOnLastMessage && (
                      <div className='flex items-center justify-end gap-1 mt-0.5'>
                        <span className='text-[10px] text-gray-400'>Seen {formatSeenTime(lastMessage.seenAt)}</span>
                        <img src={profilePicture} alt="" className='size-3 rounded-full' />
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          }
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className='px-3 py-2 bg-white/95 backdrop-blur-sm border-t border-gray-200'>
        <div className='max-w-2xl mx-auto flex items-center gap-2'>
          {isRecording ? (
            <VoiceRecorder
              onSend={sendVoiceMessage}
              onCancel={() => setIsRecording(false)}
            />
          ) : (
            <>
              <label htmlFor="image" className='p-2 hover:bg-gray-100 rounded-full cursor-pointer transition shrink-0'>
                {image
                  ? <img src={URL.createObjectURL(image)} alt="" className='h-5 w-5 rounded object-cover' />
                  : <ImageIcon className='w-5 h-5' style={{ color: msgColor }} />
                }
                <input type="file" id='image' accept="image/*" hidden onChange={(e) => setImage(e.target.files[0])} />
              </label>
              {/* Emoji Button */}
              <div className='relative'>
                <button
                  type='button'
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className='p-2 hover:bg-gray-100 rounded-full cursor-pointer transition shrink-0'
                  style={{ color: msgColor }}
                >
                  <Smile className='w-5 h-5' />
                </button>
                {showEmojiPicker && (
                  <EmojiPicker
                    onEmojiSelect={(emoji) => setText((prev) => prev + emoji)}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                )}
              </div>
              <div className='flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2'>
                <input
                  type="text"
                  className='flex-1 bg-transparent outline-none text-[14px] text-gray-900 placeholder-gray-500'
                  placeholder='Aa'
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  onChange={handleTextChange}
                  value={text}
                />
              </div>
              {/* Show mic button when no text/image, send button otherwise */}
              {!text && !image ? (
                <button
                  onClick={() => setIsRecording(true)}
                  className='p-2 hover:bg-gray-100 rounded-full cursor-pointer transition shrink-0'
                  style={{ color: msgColor }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                </button>
              ) : (
                <button
                  onClick={sendMessage}
                  disabled={isSending || (!text && !image)}
                  className='p-2 hover:bg-gray-100 rounded-full cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0'
                  style={{ color: msgColor }}
                >
                  <SendHorizonal className='w-5 h-5' />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <ChatSettingsModal
          user={user}
          currentUser={currentUser}
          chatSettings={chatSettings}
          onClose={() => setShowSettings(false)}
          onUpdate={(settings) => setChatSettings(settings)}
          onCall={handleCall}
        />
      )}

      {/* Video Call */}
      {activeCall && socket && (
        <VideoCall
          socket={socket}
          currentUser={currentUser}
          remoteUser={activeCall.remoteUser}
          callType={activeCall.callType}
          isIncoming={activeCall.isIncoming}
          offer={activeCall.offer}
          onClose={() => setActiveCall(null)}
        />
      )}
    </div>
  )
}

export default ChatBox
