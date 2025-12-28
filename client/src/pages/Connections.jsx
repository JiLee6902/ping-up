import React, { useEffect, useState } from 'react'
import { Users, UserCheck, UserRoundPen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { fetchConnections } from '../features/connections/connectionsSlice'
import api from '../api/axios'
import toast from 'react-hot-toast'

const Connections = () => {
  const [currentTab, setCurrentTab] = useState('Followers')

  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { accessToken } = useSelector((state) => state.auth)

  const { pendingReceived, followers, following } = useSelector((state) => state.connections)

  const dataArray = [
    { label: 'Followers', value: followers || [], icon: Users },
    { label: 'Following', value: following || [], icon: UserCheck },
    { label: 'Pending', value: pendingReceived || [], icon: UserRoundPen },
  ]

  const handleUnfollow = async (userId) => {
    const { data } = await api.post('/api/user/unfollow', { userId })
    if (data.success) {
      dispatch(fetchConnections(accessToken))
    } else {
      throw new Error(data.message)
    }
  }

  const acceptFollowRequest = async (connectionId) => {
    const { data } = await api.post('/api/user/accept-follow', { connectionId })
    if (data.success) {
      dispatch(fetchConnections(accessToken))
    } else {
      throw new Error(data.message)
    }
  }

  const rejectFollowRequest = async (connectionId) => {
    const { data } = await api.post('/api/user/reject-follow', { connectionId })
    if (data.success) {
      dispatch(fetchConnections(accessToken))
    } else {
      throw new Error(data.message)
    }
  }

  const removeFollower = async (userId) => {
    const { data } = await api.post('/api/user/remove-follower', { userId })
    if (data.success) {
      dispatch(fetchConnections(accessToken))
    } else {
      throw new Error(data.message)
    }
  }

  useEffect(() => {
    if (accessToken) {
      dispatch(fetchConnections(accessToken))
    }
  }, [accessToken, dispatch])

  return (
    <div className='min-h-screen bg-slate-50 dark:bg-gray-900'>
      <div className='max-w-6xl mx-auto p-6'>

        {/* Title */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white mb-2'>Connections</h1>
          <p className='text-slate-600 dark:text-gray-300'>Manage your network and discover new connections</p>
        </div>

        {/* Counts */}
        <div className='mb-8 flex flex-wrap gap-6'>
          {dataArray.map((item, index) => (
            <div key={index} className='flex flex-col items-center justify-center gap-1 border h-20 w-40 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow rounded-md'>
              <b className='text-gray-900 dark:text-white'>{item.value.length}</b>
              <p className='text-slate-600 dark:text-gray-300'>{item.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className='inline-flex flex-wrap items-center border border-gray-200 dark:border-gray-700 rounded-md p-1 bg-white dark:bg-gray-800 shadow-sm'>
          {dataArray.map((tab) => (
            <button onClick={() => setCurrentTab(tab.label)} key={tab.label} className={`cursor-pointer flex items-center px-3 py-1 text-sm rounded-md transition-colors ${currentTab === tab.label ? 'bg-white dark:bg-gray-700 font-medium text-black dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'}`}>
              <tab.icon className='w-4 h-4' />
              <span className='ml-1'>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* List */}
        <div className='flex flex-wrap gap-6 mt-6'>
          {dataArray.find((item) => item.label === currentTab).value.map((item) => {
            // Handle different data structures:
            // - followers/following: direct user objects
            // - pending: {id, user: {...}}
            const user = item.user || item
            const connectionId = item.id && item.user ? item.id : null
            const userId = user.id || user._id

            return (
              <div key={connectionId || userId} className='w-full max-w-88 flex gap-5 p-6 bg-white dark:bg-gray-800 shadow rounded-md'>
                <img src={user.profilePicture || user.profile_picture} alt="" className="rounded-full w-12 h-12 shadow-md mx-auto object-cover" />
                <div className='flex-1'>
                  <p className="font-medium text-slate-700 dark:text-white">{user.fullName || user.full_name}</p>
                  <p className="text-slate-500 dark:text-gray-400">@{user.username}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{user.bio?.slice(0, 30) || '...'}</p>
                  <div className='flex max-sm:flex-col gap-2 mt-4'>
                    <button onClick={() => navigate(`/profile/${userId}`)} className='w-full p-2 text-sm rounded bg-gray-900 hover:bg-gray-800 active:scale-95 transition text-white cursor-pointer'>
                      View Profile
                    </button>
                    {currentTab === 'Followers' && (
                      <button onClick={() => toast.promise(removeFollower(userId), {
                        loading: 'Removing...',
                        success: 'Follower removed!',
                        error: (err) => err.message || 'Failed to remove'
                      })} className='w-full p-2 text-sm rounded bg-slate-100 hover:bg-red-100 hover:text-red-600 text-black active:scale-95 transition cursor-pointer'>
                        Remove
                      </button>
                    )}
                    {currentTab === 'Following' && (
                      <button onClick={() => toast.promise(handleUnfollow(userId), {
                        loading: 'Unfollowing...',
                        success: 'Unfollowed!',
                        error: (err) => err.message || 'Failed to unfollow'
                      })} className='w-full p-2 text-sm rounded bg-slate-100 hover:bg-slate-200 text-black active:scale-95 transition cursor-pointer'>
                        Unfollow
                      </button>
                    )}
                    {currentTab === 'Pending' && connectionId && (
                      <>
                        <button onClick={() => toast.promise(acceptFollowRequest(connectionId), {
                          loading: 'Accepting...',
                          success: 'Follow request accepted!',
                          error: (err) => err.message || 'Failed to accept'
                        })} className='w-full p-2 text-sm rounded bg-gray-900 hover:bg-gray-800 text-white active:scale-95 transition cursor-pointer'>
                          Accept
                        </button>
                        <button onClick={() => toast.promise(rejectFollowRequest(connectionId), {
                          loading: 'Rejecting...',
                          success: 'Follow request rejected',
                          error: (err) => err.message || 'Failed to reject'
                        })} className='w-full p-2 text-sm rounded bg-slate-100 hover:bg-red-100 hover:text-red-600 text-black active:scale-95 transition cursor-pointer'>
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}

export default Connections
