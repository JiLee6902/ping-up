import React, { useState, useEffect } from 'react'
import { Ban, UserX } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'

const BlockedUsers = () => {
  const navigate = useNavigate()
  const [blockedUsers, setBlockedUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [unblocking, setUnblocking] = useState(null)

  const fetchBlockedUsers = async () => {
    try {
      const { data } = await api.get('/api/user/blocked')
      if (data.success) {
        setBlockedUsers(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch blocked users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBlockedUsers()
  }, [])

  const handleUnblock = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to unblock @${username}?`)) {
      return
    }
    setUnblocking(userId)
    try {
      const { data } = await api.post('/api/user/unblock', { userId })
      if (data.success) {
        toast.success(data.message)
        setBlockedUsers(prev => prev.filter(u => (u.id || u._id) !== userId))
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setUnblocking(null)
    }
  }

  return (
    <div className='h-full overflow-y-auto bg-slate-50 dark:bg-gray-900'>
      <div className='max-w-2xl mx-auto p-4'>
        {/* Header */}
        <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-6'>Blocked Users</h1>

        {/* Content */}
        {loading ? (
          <div className='flex justify-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white'></div>
          </div>
        ) : blockedUsers.length === 0 ? (
          <div className='text-center py-12'>
            <Ban className='w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4' />
            <p className='text-gray-500 dark:text-gray-400'>No blocked users</p>
            <p className='text-gray-400 dark:text-gray-500 text-sm mt-1'>Users you block will appear here</p>
          </div>
        ) : (
          <div className='space-y-2'>
            {blockedUsers.map((user) => {
              const userId = user.id || user._id
              const profilePicture = user.profilePicture || user.profile_picture
              const fullName = user.fullName || user.full_name || 'User'

              return (
                <div
                  key={userId}
                  className='bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex items-center justify-between'
                >
                  <div
                    className='flex items-center gap-3 cursor-pointer hover:opacity-80'
                    onClick={() => navigate(`/profile/${userId}`)}
                  >
                    {profilePicture ? (
                      <img
                        src={profilePicture}
                        alt={fullName}
                        className='w-12 h-12 rounded-full object-cover'
                      />
                    ) : (
                      <div className='w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center'>
                        <span className='text-gray-500 dark:text-gray-400 text-lg font-medium'>
                          {fullName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className='font-medium text-gray-900 dark:text-white'>{fullName}</p>
                      <p className='text-sm text-gray-500 dark:text-gray-400'>@{user.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnblock(userId, user.username)}
                    disabled={unblocking === userId}
                    className='px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50'
                  >
                    {unblocking === userId ? 'Unblocking...' : 'Unblock'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default BlockedUsers
