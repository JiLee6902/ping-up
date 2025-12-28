import React, { useState } from 'react'
import { MapPin, UserPlus, UserMinus, Clock } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { fetchUser } from '../features/user/userSlice'
import { fetchConnections } from '../features/connections/connectionsSlice'
import UserPreviewModal from './UserPreviewModal'

const UserCard = ({ user }) => {
  const currentUser = useSelector((state) => state.user.value)
  const { pendingSent } = useSelector((state) => state.connections)
  const { accessToken } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const [showPreview, setShowPreview] = useState(false)

  // Defensive: ensure user object exists
  if (!user || !user.id) return null

  const isFollowing = currentUser?.following?.includes(user.id) || false

  // Check if we have a pending follow request
  const hasPendingRequest = pendingSent?.some(p => p.user?.id === user.id) || false

  const handleFollow = async () => {
    // If pending, cancel the request
    if (hasPendingRequest) {
      try {
        const { data } = await api.post('/api/user/cancel-follow', { userId: user.id })
        if (data.success) {
          toast.success(data.message)
          dispatch(fetchConnections(accessToken))
        } else {
          toast.error(data.message)
        }
      } catch (error) {
        toast.error(error.response?.data?.message || error.message)
      }
      return
    }

    try {
      const endpoint = isFollowing ? '/api/user/unfollow' : '/api/user/follow'
      const { data } = await api.post(endpoint, { userId: user.id })
      if (data.success) {
        toast.success(data.message)
        dispatch(fetchUser(accessToken))
        dispatch(fetchConnections(accessToken))
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }
  }

  return (
    <>
      <div key={user.id} className='p-4 pt-6 flex flex-col justify-between w-72 shadow border border-gray-200 rounded-md hover:shadow-lg transition-shadow'>
        <div className='text-center cursor-pointer' onClick={() => setShowPreview(true)}>
          <img src={user.profilePicture} alt="" className='rounded-full w-16 h-16 object-cover shadow-md mx-auto' />
          <p className='mt-4 font-semibold hover:text-blue-600 transition-colors'>{user.fullName}</p>
          {user.username && <p className='text-gray-500 font-light'>@{user.username}</p>}
          {user.bio && <p className='text-gray-600 mt-2 text-center text-sm px-4'>{user.bio}</p>}
        </div>

        <div className='flex items-center justify-center gap-2 mt-4 text-xs text-gray-600'>
          <div className='flex items-center gap-1 border border-gray-300 rounded-full px-3 py-1'>
            <MapPin className='w-4 h-4' /> {user.location || 'Unknown'}
          </div>
          <div className='flex items-center gap-1 border border-gray-300 rounded-full px-3 py-1'>
            <span>{user.followersCount || 0}</span> Followers
          </div>
        </div>

        <div className='flex mt-4'>
          {/* Follow/Unfollow/Requested Button */}
          <button
            onClick={handleFollow}
            className={`w-full py-2 rounded-md flex justify-center items-center gap-2 active:scale-95 transition cursor-pointer ${
              isFollowing
                ? 'bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-600'
                : hasPendingRequest
                  ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  : 'bg-gray-900 hover:bg-gray-800 text-white'
            }`}
          >
            {isFollowing ? (
              <>
                <UserMinus className='w-4 h-4' /> Following
              </>
            ) : hasPendingRequest ? (
              <>
                <Clock className='w-4 h-4' /> Requested
              </>
            ) : (
              <>
                <UserPlus className='w-4 h-4' /> Follow
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <UserPreviewModal
          user={user}
          onClose={() => setShowPreview(false)}
          onFollow={handleFollow}
          isFollowing={isFollowing}
          hasPendingRequest={hasPendingRequest}
        />
      )}
    </>
  )
}

export default UserCard
