import React from 'react'
import { X, MapPin, Users, UserPlus, UserMinus, Clock, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const UserPreviewModal = ({ user, onClose, onFollow, isFollowing, hasPendingRequest }) => {
  const navigate = useNavigate()

  const handleSeeProfile = () => {
    onClose()
    navigate(`/profile/${user.id}`)
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      {/* Backdrop */}
      <div className='absolute inset-0 bg-black/50 backdrop-blur-sm' onClick={onClose} />

      {/* Modal */}
      <div className='relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in duration-200'>
        {/* Cover */}
        <div className='h-24 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-500'>
          {user.coverPhoto && (
            <img src={user.coverPhoto} alt="" className='w-full h-full object-cover' />
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className='absolute top-3 right-3 p-1.5 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-sm transition-colors'
        >
          <X className='w-5 h-5 text-white' />
        </button>

        {/* Content */}
        <div className='px-6 pb-6'>
          {/* Avatar */}
          <div className='-mt-12 mb-4'>
            <img
              src={user.profilePicture || '/default-avatar.png'}
              alt={user.fullName}
              className='w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover'
            />
          </div>

          {/* User Info */}
          <div className='space-y-2'>
            <h2 className='text-xl font-bold text-gray-900'>{user.fullName}</h2>
            <p className='text-gray-500'>@{user.username}</p>

            {user.bio && (
              <p className='text-gray-600 text-sm'>{user.bio}</p>
            )}

            {/* Stats */}
            <div className='flex items-center gap-4 py-3 text-sm'>
              <div className='flex items-center gap-1.5 text-gray-600'>
                <MapPin className='w-4 h-4' />
                <span>{user.location || 'Unknown'}</span>
              </div>
              <div className='flex items-center gap-1.5 text-gray-600'>
                <Users className='w-4 h-4' />
                <span>{user.followersCount || 0} followers</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className='mt-4'>
            {/* Follow Button */}
            <button
              onClick={onFollow}
              className={`w-full py-2.5 rounded-lg flex justify-center items-center gap-2 font-medium transition-all active:scale-95 cursor-pointer ${
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

          {/* See Full Profile */}
          <button
            onClick={handleSeeProfile}
            className='w-full mt-3 py-2.5 text-blue-600 hover:bg-blue-50 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer'
          >
            <ExternalLink className='w-4 h-4' />
            See Full Profile
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserPreviewModal
