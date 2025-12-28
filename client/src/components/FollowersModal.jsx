import React, { useState, useEffect } from 'react'
import { X, Search, MessageCircle, MoreHorizontal, Loader2, UserPlus, UserMinus, Check, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { fetchUser } from '../features/user/userSlice'
import api from '../api/axios'
import toast from 'react-hot-toast'

const FollowersModal = ({ userId, username, initialTab = 'followers', onClose }) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const currentUser = useSelector((state) => state.user.value)
  const { accessToken } = useSelector((state) => state.auth)

  const [activeTab, setActiveTab] = useState(initialTab)
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [followingLoading, setFollowingLoading] = useState({})

  const fetchFollowers = async () => {
    try {
      const url = searchQuery
        ? `/api/user/${userId}/followers?search=${encodeURIComponent(searchQuery)}`
        : `/api/user/${userId}/followers`
      const { data } = await api.get(url)
      if (data.success) {
        setFollowers(data.data || [])
      }
    } catch (error) {
      toast.error('Failed to load followers')
    }
  }

  const fetchFollowing = async () => {
    try {
      const url = searchQuery
        ? `/api/user/${userId}/following?search=${encodeURIComponent(searchQuery)}`
        : `/api/user/${userId}/following`
      const { data } = await api.get(url)
      if (data.success) {
        setFollowing(data.data || [])
      }
    } catch (error) {
      toast.error('Failed to load following')
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchFollowers(), fetchFollowing()])
      setLoading(false)
    }
    loadData()
  }, [userId])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'followers') {
        fetchFollowers()
      } else {
        fetchFollowing()
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, activeTab])

  const handleFollow = async (targetUserId) => {
    if (followingLoading[targetUserId]) return
    setFollowingLoading({ ...followingLoading, [targetUserId]: true })

    try {
      const user = activeTab === 'followers'
        ? followers.find(u => u.id === targetUserId)
        : following.find(u => u.id === targetUserId)

      const isCurrentlyFollowing = user?.isFollowing
      const isCurrentlyPending = user?.isPending

      if (isCurrentlyFollowing) {
        const { data } = await api.post('/api/user/unfollow', { userId: targetUserId })
        if (data.success) {
          toast.success('Unfollowed')
          // Update local state
          const updateList = (list) => list.map(u =>
            u.id === targetUserId ? { ...u, isFollowing: false, isPending: false } : u
          )
          if (activeTab === 'followers') {
            setFollowers(updateList(followers))
          } else {
            setFollowing(updateList(following))
          }
          dispatch(fetchUser(accessToken))
        }
      } else if (isCurrentlyPending) {
        // Cancel follow request
        const { data } = await api.post('/api/user/cancel-follow', { userId: targetUserId })
        if (data.success) {
          toast.success('Request cancelled')
          // Update local state
          const updateList = (list) => list.map(u =>
            u.id === targetUserId ? { ...u, isFollowing: false, isPending: false } : u
          )
          if (activeTab === 'followers') {
            setFollowers(updateList(followers))
          } else {
            setFollowing(updateList(following))
          }
        }
      } else {
        const { data } = await api.post('/api/user/follow', { userId: targetUserId })
        if (data.success) {
          toast.success(data.isPending ? 'Follow request sent' : 'Following')
          // Update local state
          const updateList = (list) => list.map(u =>
            u.id === targetUserId ? { ...u, isFollowing: !data.isPending, isPending: data.isPending } : u
          )
          if (activeTab === 'followers') {
            setFollowers(updateList(followers))
          } else {
            setFollowing(updateList(following))
          }
          dispatch(fetchUser(accessToken))
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed')
    } finally {
      setFollowingLoading({ ...followingLoading, [targetUserId]: false })
    }
  }

  const handleMessage = (targetUserId) => {
    onClose()
    navigate(`/messages/${targetUserId}`)
  }

  const handleProfileClick = (user) => {
    onClose()
    navigate(`/profile/${user.id}`)
  }

  const displayList = activeTab === 'followers' ? followers : following

  return (
    <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4'>
      <div className='bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700'>
          <button onClick={onClose} className='p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full'>
            <X className='w-5 h-5 text-gray-600 dark:text-gray-400' />
          </button>
          <h2 className='font-semibold text-gray-900 dark:text-white'>
            {username ? `@${username}` : 'Users'}
          </h2>
          <div className='w-7' />
        </div>

        {/* Tabs */}
        <div className='flex border-b border-gray-200 dark:border-gray-700'>
          <button
            onClick={() => setActiveTab('followers')}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'followers'
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {followers.length} followers
            {activeTab === 'followers' && (
              <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white' />
            )}
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'following'
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {following.length} following
            {activeTab === 'following' && (
              <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white' />
            )}
          </button>
        </div>

        {/* Search */}
        <div className='p-3 border-b border-gray-200 dark:border-gray-700'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
            <input
              type='text'
              placeholder='Search'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
        </div>

        {/* List */}
        <div className='flex-1 overflow-y-auto'>
          {loading ? (
            <div className='flex items-center justify-center py-12'>
              <Loader2 className='w-6 h-6 animate-spin text-gray-400' />
            </div>
          ) : displayList.length === 0 ? (
            <div className='text-center py-12'>
              <p className='text-gray-500 dark:text-gray-400'>
                {searchQuery ? 'No users found' : `No ${activeTab} yet`}
              </p>
            </div>
          ) : (
            <div className='divide-y divide-gray-100 dark:divide-gray-800'>
              {displayList.map((user) => (
                <div key={user.id} className='flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50'>
                  <div
                    className='flex items-center gap-3 flex-1 cursor-pointer'
                    onClick={() => handleProfileClick(user)}
                  >
                    <img
                      src={user.profilePicture || '/default-avatar.png'}
                      alt={user.fullName}
                      className='w-12 h-12 rounded-full object-cover'
                    />
                    <div className='flex-1 min-w-0'>
                      <p className='font-medium text-gray-900 dark:text-white truncate'>
                        {user.username}
                      </p>
                      <p className='text-sm text-gray-500 dark:text-gray-400 truncate'>
                        {user.fullName}
                      </p>
                    </div>
                  </div>

                  {!user.isOwnProfile && (
                    <div className='flex items-center gap-2'>
                      <button
                        onClick={() => handleMessage(user.id)}
                        className='px-4 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'
                      >
                        Message
                      </button>
                      <button
                        onClick={() => handleFollow(user.id)}
                        disabled={followingLoading[user.id]}
                        className={`p-1.5 rounded-lg transition-colors ${
                          user.isFollowing
                            ? 'text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                            : user.isPending
                            ? 'text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                            : 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                        }`}
                      >
                        {followingLoading[user.id] ? (
                          <Loader2 className='w-5 h-5 animate-spin' />
                        ) : user.isFollowing ? (
                          <Check className='w-5 h-5' />
                        ) : user.isPending ? (
                          <Clock className='w-5 h-5' />
                        ) : (
                          <UserPlus className='w-5 h-5' />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FollowersModal
