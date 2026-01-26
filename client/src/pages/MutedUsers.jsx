import React, { useState, useEffect } from 'react'
import { VolumeX } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'

const MutedUsers = () => {
  const navigate = useNavigate()
  const [mutedUsers, setMutedUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [unmuting, setUnmuting] = useState(null)

  const fetchMutedUsers = async () => {
    try {
      const { data } = await api.get('/api/user/muted')
      if (data.success) {
        setMutedUsers(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch muted users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMutedUsers()
  }, [])

  const handleUnmute = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to unmute @${username}?`)) {
      return
    }
    setUnmuting(userId)
    try {
      const { data } = await api.post('/api/user/unmute', { userId })
      if (data.success) {
        toast.success(data.message)
        setMutedUsers(prev => prev.filter(u => (u.id || u._id) !== userId))
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setUnmuting(null)
    }
  }

  return (
    <div className='h-full overflow-y-auto bg-slate-50 dark:bg-gray-900'>
      <div className='max-w-2xl mx-auto p-4'>
        {/* Header */}
        <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-6'>Muted Users</h1>

        {/* Content */}
        {loading ? (
          <div className='flex justify-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white'></div>
          </div>
        ) : mutedUsers.length === 0 ? (
          <div className='text-center py-12'>
            <VolumeX className='w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4' />
            <p className='text-gray-500 dark:text-gray-400'>No muted users</p>
            <p className='text-gray-400 dark:text-gray-500 text-sm mt-1'>Users you mute will appear here. Their posts won't show in your feed.</p>
          </div>
        ) : (
          <div className='space-y-2'>
            {mutedUsers.map((user) => {
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
                    onClick={() => handleUnmute(userId, user.username)}
                    disabled={unmuting === userId}
                    className='px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 rounded-lg transition-colors disabled:opacity-50'
                  >
                    {unmuting === userId ? 'Unmuting...' : 'Unmute'}
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

export default MutedUsers
