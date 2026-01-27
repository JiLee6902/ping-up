import React, { useEffect, useState, useCallback, useRef } from 'react'
import { MessageSquare, Search, X, Check, Inbox, MessageCircle, Lock, Loader2, Bot } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { useSocket } from '../context/SocketContext'
import { ChatItemSkeleton } from '../components/Skeleton'

const AI_BOT_ID = '00000000-0000-4000-a000-000000000001'

const Messages = () => {
  const { connections } = useSelector((state) => state.connections)
  const navigate = useNavigate()
  const [recentChats, setRecentChats] = useState([])
  const [messageRequests, setMessageRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('chats') // 'chats' or 'requests'
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const { isUserOnline, fetchOnlineStatus, isUserTyping } = useSocket()

  useEffect(() => {
    fetchRecentChats()
    fetchMessageRequests()
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

  const fetchMessageRequests = async () => {
    try {
      const { data } = await api.get('/api/message/requests')
      if (data.success) {
        setMessageRequests(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch message requests')
    }
  }

  // Search users globally
  const searchTimeoutRef = useRef(null)

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    setSearchLoading(true)
    try {
      const { data } = await api.post('/api/user/discover', { query })
      if (data.success) {
        setSearchResults(data.data || [])
      }
    } catch (error) {
      console.error('Search failed')
    }
    setSearchLoading(false)
  }

  const handleSearchChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)

    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(query)
    }, 300)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
  }

  const handleAcceptRequest = async (fromUserId) => {
    try {
      const { data } = await api.post('/api/message/requests/accept', { fromUserId })
      if (data.success) {
        toast.success('Message request accepted')
        fetchMessageRequests()
        fetchRecentChats()
      }
    } catch (error) {
      toast.error('Failed to accept request')
    }
  }

  const handleDeclineRequest = async (fromUserId) => {
    try {
      const { data } = await api.post('/api/message/requests/decline', { fromUserId })
      if (data.success) {
        toast.success('Message request declined')
        fetchMessageRequests()
      }
    } catch (error) {
      toast.error('Failed to decline request')
    }
  }

  // Merge connections with recent chats data
  const getConnectionWithChat = (userId) => {
    return recentChats.find(chat => chat.user?.id === userId)
  }

  const formatTime = (dateString) => {
    if (!dateString) return ''
    // Parse date - PostgreSQL timestamptz returns UTC, ensure proper parsing
    const date = new Date(dateString)
    // If date is invalid or seems off, try forcing UTC interpretation
    if (isNaN(date.getTime())) return ''

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 0) return 'just now' // Handle slight time sync issues
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
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-slate-900 dark:text-white mb-2'>Messages</h1>
            <p className='text-slate-600 dark:text-gray-300'>Talk to your friends and family</p>
          </div>
          <button
            onClick={() => navigate(`/messages/${AI_BOT_ID}`)}
            className='flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:opacity-90 transition shadow-lg shadow-purple-500/25 active:scale-95'
          >
            <Bot className='w-5 h-5' />
            <span className='font-medium'>PingUp AI</span>
          </button>
        </div>

        {/* Search Box */}
        <div className='mb-6 max-w-xl'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
            <input
              type='text'
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder='Search users to start a conversation...'
              className='w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
            {searchQuery && (
              <button onClick={clearSearch} className='absolute right-3 top-1/2 -translate-y-1/2'>
                <X className='w-5 h-5 text-gray-400 hover:text-gray-600' />
              </button>
            )}
          </div>

          {/* Search Results */}
          {searchQuery && (
            <div className='mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto'>
              {searchLoading ? (
                <div className='p-4 text-center text-gray-500'>Searching...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => { navigate(`/messages/${user.id}`); clearSearch(); }}
                    className='flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'
                  >
                    <img src={user.profilePicture} alt='' className='w-10 h-10 rounded-full object-cover' />
                    <div className='flex-1'>
                      <div className='flex items-center gap-2'>
                        <p className='font-medium text-slate-700 dark:text-white'>{user.fullName}</p>
                        {user.isPrivate && <Lock className='w-3 h-3 text-gray-500' />}
                      </div>
                      <p className='text-sm text-slate-500 dark:text-gray-400'>@{user.username}</p>
                    </div>
                    <MessageCircle className='w-5 h-5 text-blue-500' />
                  </div>
                ))
              ) : (
                <div className='p-4 text-center text-gray-500'>No users found</div>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className='flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700'>
          <button
            onClick={() => setActiveTab('chats')}
            className={`pb-3 px-1 font-medium transition-colors ${activeTab === 'chats' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <div className='flex items-center gap-2'>
              <MessageSquare className='w-4 h-4' />
              Chats
            </div>
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-3 px-1 font-medium transition-colors relative ${activeTab === 'requests' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <div className='flex items-center gap-2'>
              <Inbox className='w-4 h-4' />
              Message Requests
              {messageRequests.length > 0 && (
                <span className='bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center'>
                  {messageRequests.length}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Chat List or Message Requests */}
        {activeTab === 'chats' ? (
          <>
            {loading ? (
              // Skeleton loading
              <div className='space-y-1 max-w-md'>
                {[1, 2, 3, 4, 5].map((i) => (
                  <ChatItemSkeleton key={i} />
                ))}
              </div>
            ) : recentChats.length === 0 && connections.length === 0 ? (
              <div className='flex items-center justify-center min-h-[50vh]'>
                <div className='text-center py-16 px-4'>
                  <div className='w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center'>
                    <MessageSquare className='w-10 h-10 text-blue-500' />
                  </div>
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                    No conversations yet
                  </h3>
                  <p className='text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto'>
                    Search for users above to start chatting with friends!
                  </p>
                </div>
              </div>
            ) : (
              // Show recent chats first, then connections without chats
              <div className='max-w-md'>
              {[...recentChats, ...connections.filter(c => {
                const oduserId = (c.user || c).id || (c.user || c)._id
                return !recentChats.some(chat => chat.user?.id === oduserId)
              }).map(c => ({ user: c.user || c, lastMessage: null, unseenCount: 0 }))].map((chatItem) => {
                const user = chatItem.user
                const oduserId = user.id || user._id
                const profilePicture = user.profilePicture || user.profile_picture
                const fullName = user.fullName || user.full_name
                const lastMessage = chatItem.lastMessage
                const unseenCount = chatItem.unseenCount || 0
                const isOnline = isUserOnline(oduserId)
                const isTyping = isUserTyping(oduserId)

                return (
                  <div
                    key={oduserId}
                    onClick={() => navigate(`/messages/${oduserId}`)}
                    className='flex items-center gap-3 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors'
                  >
                    <div className='relative w-12 h-12 shrink-0'>
                      <img src={profilePicture} alt="" className='w-12 h-12 rounded-full object-cover' />
                      <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-900 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className={`font-semibold text-slate-800 dark:text-white truncate ${unseenCount > 0 ? 'text-slate-900' : ''}`}>
                        {fullName}
                      </p>
                      <p className={`text-sm truncate ${unseenCount > 0 ? 'text-slate-800 dark:text-gray-200 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                        {isTyping ? (
                          <span className='text-blue-500 font-medium flex items-center gap-1'>
                            <span className="flex gap-0.5">
                              <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </span>
                            typing...
                          </span>
                        ) : lastMessage ? (
                          <>
                            {lastMessage.fromUser?.id !== oduserId && 'Bạn: '}
                            {lastMessage.text || (lastMessage.messageType === 'image' ? '📷 Ảnh' : '')}
                            {' · '}
                            {formatTime(lastMessage.createdAt)}
                          </>
                        ) : (
                          <span className='text-gray-400'>Bắt đầu cuộc trò chuyện</span>
                        )}
                      </p>
                    </div>
                    {unseenCount > 0 && (
                      <span className='bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0'>
                        {unseenCount > 9 ? '9+' : unseenCount}
                      </span>
                    )}
                  </div>
                )
              })}
              </div>
            )}
          </>
        ) : (
          /* Message Requests Tab */
          <>
            {messageRequests.length === 0 ? (
              <div className='flex items-center justify-center min-h-[50vh]'>
                <div className='text-center py-16 px-4'>
                  <div className='w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full flex items-center justify-center'>
                    <Inbox className='w-10 h-10 text-green-500' />
                  </div>
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                    All caught up!
                  </h3>
                  <p className='text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto'>
                    When someone new messages you, their request will appear here
                  </p>
                </div>
              </div>
            ) : (
              <div className='max-w-md'>
                {messageRequests.map((request) => {
                  const user = request.user
                  const oduserId = user.id || user._id
                  const profilePicture = user.profilePicture || user.profile_picture
                  const fullName = user.fullName || user.full_name
                  const lastMessage = request.lastMessage

                  return (
                    <div
                      key={oduserId}
                      className='flex items-center gap-3 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors'
                    >
                      <div
                        onClick={() => navigate(`/profile/${oduserId}`)}
                        className='relative w-12 h-12 shrink-0 cursor-pointer'
                      >
                        <img src={profilePicture} alt="" className='w-12 h-12 rounded-full object-cover' />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='font-semibold text-slate-800 dark:text-white truncate'>{fullName}</p>
                        <p className='text-sm text-gray-500 dark:text-gray-400 truncate'>
                          {lastMessage?.text || (lastMessage?.messageType === 'image' ? '📷 Ảnh' : '')}
                          {request.messageCount > 1 && ` · ${request.messageCount} tin nhắn`}
                        </p>
                      </div>
                      <div className='flex gap-1.5 shrink-0'>
                        <button
                          onClick={() => handleAcceptRequest(oduserId)}
                          className='w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 text-white active:scale-95 transition'
                          title='Accept'
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(oduserId)}
                          className='w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 active:scale-95 transition'
                          title='Decline'
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Messages
