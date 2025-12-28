import React, { useEffect, useState } from 'react'
import { Eye, MessageSquare, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { useSocket } from '../context/SocketContext'

const Messages = () => {
  const { connections } = useSelector((state) => state.connections)
  const navigate = useNavigate()
  const [recentChats, setRecentChats] = useState([])
  const [loading, setLoading] = useState(true)
  const { isUserOnline, fetchOnlineStatus } = useSocket()

  useEffect(() => {
    fetchRecentChats()
    // Fetch online status for all connections
    if (connections.length > 0) {
      const userIds = connections.map(c => (c.user || c).id || (c.user || c)._id)
      fetchOnlineStatus(userIds)
    }
  }, [connections])

  const fetchRecentChats = async () => {
    try {
      const { data } = await api.get('/api/message/chats')
      if (data.success) {
        setRecentChats(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch recent chats')
    }
    setLoading(false)
  }

  // Merge connections with recent chats data
  const getConnectionWithChat = (userId) => {
    return recentChats.find(chat => chat.user?.id === userId)
  }

  const formatTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const handleDeleteChat = async (userId) => {
    if (!window.confirm('Xóa đoạn chat này? Tin nhắn sẽ bị xóa khỏi màn hình của bạn nhưng vẫn còn ở phía người kia.')) {
      return
    }
    try {
      const { data } = await api.post('/api/message/delete-chat', { chatWithUserId: userId })
      if (data.success) {
        toast.success('Đã xóa đoạn chat')
        fetchRecentChats()
      }
    } catch (error) {
      toast.error('Không thể xóa đoạn chat')
    }
  }

  return (
    <div className='min-h-screen relative bg-slate-50 dark:bg-gray-900'>
      <div className='max-w-6xl mx-auto p-6'>
        {/* Title */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white mb-2'>Messages</h1>
          <p className='text-slate-600 dark:text-gray-300'>Talk to your friends and family</p>
        </div>

        {/* Connected Users */}
        <div className='flex flex-col gap-3'>
          {connections.map((item) => {
            const user = item.user || item
            const userId = user.id || user._id
            const profilePicture = user.profilePicture || user.profile_picture
            const fullName = user.fullName || user.full_name

            const chatData = getConnectionWithChat(userId)
            const lastMessage = chatData?.lastMessage
            const unseenCount = chatData?.unseenCount || 0

            const isOnline = isUserOnline(userId)

            return (
              <div key={userId} className='max-w-xl flex items-center gap-5 p-6 bg-white dark:bg-gray-800 shadow rounded-md'>
                <div className='relative w-12 h-12 shrink-0'>
                  <img src={profilePicture} alt="" className='w-12 h-12 rounded-full object-cover' />
                  {unseenCount > 0 ? (
                    <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center'>
                      {unseenCount > 9 ? '9+' : unseenCount}
                    </span>
                  ) : (
                    <span className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                  )}
                </div>
                <div className='flex-1'>
                  <p className='font-medium text-slate-700 dark:text-white'>{fullName}</p>
                  <p className='text-slate-500 dark:text-gray-400'>@{user.username}</p>
                  <p className='text-xs text-gray-400 mt-0.5'>
                    {isOnline
                      ? <span className='text-green-500'>Online</span>
                      : user.lastActivityAt
                        ? `Last seen ${formatTime(user.lastActivityAt)}`
                        : 'Offline'
                    }
                  </p>
                  {lastMessage && (
                    <div className='mt-1'>
                      <p className='text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs'>
                        {lastMessage.fromUser?.id === userId ? '' : 'You: '}
                        {lastMessage.text || (lastMessage.messageType === 'image' ? '📷 Photo' : '')}
                      </p>
                    </div>
                  )}
                </div>

                <div className='flex flex-col gap-2'>
                  <button onClick={() => navigate(`/messages/${userId}`)} className='size-10 flex items-center justify-center text-sm rounded bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-800 dark:text-white active:scale-95 transition cursor-pointer gap-1'>
                    <MessageSquare className="w-4 h-4" />
                  </button>

                  <button onClick={() => navigate(`/profile/${userId}`)} className='size-10 flex items-center justify-center text-sm rounded bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-800 dark:text-white active:scale-95 transition cursor-pointer'>
                    <Eye className="w-4 h-4" />
                  </button>

                  <button onClick={() => handleDeleteChat(userId)} className='size-10 flex items-center justify-center text-sm rounded bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 active:scale-95 transition cursor-pointer'>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Messages
