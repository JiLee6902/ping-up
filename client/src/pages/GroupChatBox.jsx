import React, { useEffect, useRef, useState } from 'react'
import { ImageIcon, SendHorizonal, Settings, Users, Smile, ArrowLeft } from 'lucide-react'
import { useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { useSocket } from '../context/SocketContext'
import EmojiPicker from '../components/EmojiPicker'
import GroupSettingsModal from '../components/GroupSettingsModal'

const GroupChatBox = () => {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const currentUser = useSelector((state) => state.user.value)

  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [image, setImage] = useState(null)
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const messagesEndRef = useRef(null)

  const { socket } = useSocket()

  // Listen for socket events for this group
  useEffect(() => {
    if (!socket || !groupId) return

    const handleGroupMessage = (data) => {
      if (data.groupId === groupId) {
        setMessages(prev => [...prev, data.message])
        // Mark as read
        api.post('/api/group-chat/mark-read', { groupId }).catch(() => {})
      }
    }

    const handleGroupUpdated = (data) => {
      if (data.group?.id === groupId) {
        setGroup(prev => ({ ...prev, ...data.group }))
      }
    }

    const handleMemberAdded = (data) => {
      if (data.groupId === groupId && data.group) {
        setGroup(prev => ({ ...prev, ...data.group }))
      }
    }

    const handleMemberRemoved = (data) => {
      if (data.groupId === groupId) {
        if (data.wasRemoved && data.removedUserId === currentUser?.id) {
          toast.error('You have been removed from this group')
          navigate('/groups')
        } else if (data.group) {
          setGroup(prev => ({ ...prev, ...data.group }))
        }
      }
    }

    const handleGroupDeleted = (data) => {
      if (data.groupId === groupId) {
        toast.error('This group has been deleted')
        navigate('/groups')
      }
    }

    socket.on('groupMessage', handleGroupMessage)
    socket.on('groupUpdated', handleGroupUpdated)
    socket.on('groupMemberAdded', handleMemberAdded)
    socket.on('groupMemberRemoved', handleMemberRemoved)
    socket.on('groupDeleted', handleGroupDeleted)

    return () => {
      socket.off('groupMessage', handleGroupMessage)
      socket.off('groupUpdated', handleGroupUpdated)
      socket.off('groupMemberAdded', handleMemberAdded)
      socket.off('groupMemberRemoved', handleMemberRemoved)
      socket.off('groupDeleted', handleGroupDeleted)
    }
  }, [socket, groupId, currentUser?.id, navigate])

  const fetchGroup = async () => {
    try {
      const { data } = await api.get(`/api/group-chat/${groupId}`)
      if (data.success) {
        setGroup(data.data)
      }
    } catch (error) {
      toast.error('Failed to load group')
      navigate('/groups')
    }
  }

  const fetchMessages = async () => {
    try {
      const { data } = await api.post('/api/group-chat/messages', { groupId })
      if (data.success) {
        setMessages(data.data.reverse())
      }
    } catch (error) {
      console.error('Failed to fetch messages')
    }
    setLoading(false)
  }

  useEffect(() => {
    if (groupId) {
      fetchGroup()
      fetchMessages()
    }
  }, [groupId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if ((!text.trim() && !image) || isSending) return

    setIsSending(true)
    try {
      const formData = new FormData()
      formData.append('groupId', groupId)
      if (text.trim()) formData.append('content', text.trim())
      if (image) formData.append('image', image)

      const { data } = await api.post('/api/group-chat/send-message', formData)
      if (data.success) {
        setText('')
        setImage(null)
        setMessages(prev => [...prev, data.data])
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message')
    }
    setIsSending(false)
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups = []
    let currentDate = null

    messages.forEach((message) => {
      const messageDate = new Date(message.createdAt).toDateString()
      if (messageDate !== currentDate) {
        currentDate = messageDate
        groups.push({ type: 'date', date: message.createdAt })
      }
      groups.push({ type: 'message', data: message })
    })

    return groups
  }

  const groupedMessages = groupMessagesByDate()

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen bg-white dark:bg-gray-900'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
      </div>
    )
  }

  return group && (
    <div className='flex flex-col h-screen bg-gray-50 dark:bg-gray-900'>
      {/* Header */}
      <div className='flex items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm'>
        <div className='flex items-center gap-3'>
          <button onClick={() => navigate('/groups')} className='p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full md:hidden'>
            <ArrowLeft className='w-5 h-5 text-gray-600 dark:text-gray-300' />
          </button>
          <div className='relative'>
            {group.avatarUrl ? (
              <img src={group.avatarUrl} alt="" className='size-10 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700' />
            ) : (
              <div className='size-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-gray-100 dark:ring-gray-700'>
                <Users className='w-5 h-5 text-white' />
              </div>
            )}
          </div>
          <div>
            <p className='font-semibold text-gray-900 dark:text-white text-[15px]'>{group.name}</p>
            <p className='text-xs text-gray-500 dark:text-gray-400'>
              {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full cursor-pointer transition'
        >
          <Settings className='w-5 h-5 text-blue-500' />
        </button>
      </div>

      {/* Messages */}
      <div className='flex-1 overflow-y-auto'>
        <div className='max-w-2xl mx-auto px-3 py-2 space-y-1'>
          {groupedMessages.map((item, index) => {
            if (item.type === 'date') {
              return (
                <div key={`date-${index}`} className='text-center py-3'>
                  <span className='text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full'>
                    {formatDate(item.date)}
                  </span>
                </div>
              )
            }

            const message = item.data
            const isSent = message.sender?.id === currentUser?.id
            const isSystem = message.messageType === 'system'

            // System messages
            if (isSystem) {
              return (
                <div key={message.id} className='text-center py-2'>
                  <span className='text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full'>
                    {message.sender?.fullName?.split(' ')[0] || 'Someone'} {message.content}
                  </span>
                </div>
              )
            }

            // Check if previous message is from same sender
            const prevItem = groupedMessages[index - 1]
            const prevMessage = prevItem?.type === 'message' ? prevItem.data : null
            const isSameSender = prevMessage?.sender?.id === message.sender?.id && prevMessage?.messageType !== 'system'
            const showAvatar = !isSent && !isSameSender

            return (
              <div key={message.id} className={`flex items-end gap-1.5 ${isSent ? 'justify-end' : 'justify-start'}`}>
                {!isSent && (
                  <div className='w-7 shrink-0'>
                    {showAvatar && message.sender?.profilePicture && (
                      <img src={message.sender.profilePicture} alt="" className='size-7 rounded-full object-cover' />
                    )}
                  </div>
                )}
                <div className={`max-w-[75%] ${isSent ? 'text-right' : ''}`}>
                  {showAvatar && !isSent && (
                    <p className='text-xs text-gray-500 dark:text-gray-400 ml-1 mb-0.5'>
                      {message.sender?.fullName?.split(' ')[0]}
                    </p>
                  )}
                  {message.messageType === 'image' && message.mediaUrl && (
                    <img src={message.mediaUrl} className='max-w-[200px] rounded-xl' alt="" />
                  )}
                  {message.content && (
                    <div
                      className={`inline-block px-3 py-1.5 text-[14px] rounded-2xl ${
                        isSent
                          ? 'bg-blue-500 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700'
                      } ${message.messageType === 'image' ? 'mt-0.5' : ''}`}
                    >
                      <p className='whitespace-pre-wrap text-left leading-snug'>{message.content}</p>
                    </div>
                  )}
                  <p className={`text-[10px] text-gray-400 mt-0.5 ${isSent ? 'text-right' : 'text-left ml-1'}`}>
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className='px-3 py-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700'>
        <div className='max-w-2xl mx-auto flex items-center gap-2'>
          <label className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full cursor-pointer transition shrink-0'>
            {image ? (
              <img src={URL.createObjectURL(image)} alt="" className='h-5 w-5 rounded object-cover' />
            ) : (
              <ImageIcon className='w-5 h-5 text-blue-500' />
            )}
            <input type="file" accept="image/*" hidden onChange={(e) => setImage(e.target.files[0])} />
          </label>

          <div className='relative'>
            <button
              type='button'
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full cursor-pointer transition shrink-0'
            >
              <Smile className='w-5 h-5 text-blue-500' />
            </button>
            {showEmojiPicker && (
              <EmojiPicker
                onEmojiSelect={(emoji) => setText((prev) => prev + emoji)}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}
          </div>

          <div className='flex-1 flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2'>
            <input
              type="text"
              className='flex-1 bg-transparent outline-none text-[14px] text-gray-900 dark:text-white placeholder-gray-500'
              placeholder='Type a message...'
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              onChange={(e) => setText(e.target.value)}
              value={text}
            />
          </div>

          <button
            onClick={sendMessage}
            disabled={isSending || (!text.trim() && !image)}
            className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0'
          >
            <SendHorizonal className='w-5 h-5 text-blue-500' />
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <GroupSettingsModal
          group={group}
          currentUser={currentUser}
          onClose={() => setShowSettings(false)}
          onUpdate={(updatedGroup) => setGroup(prev => ({ ...prev, ...updatedGroup }))}
          onLeave={() => navigate('/groups')}
        />
      )}
    </div>
  )
}

export default GroupChatBox
