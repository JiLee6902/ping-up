import { Calendar, MapPin, PenBox, Verified, UserPlus, UserMinus, Clock, Lock, MoreHorizontal, Ban, UserX, Flag, MessageCircle } from 'lucide-react'
import moment from 'moment'
import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchUser } from '../features/user/userSlice'
import api from '../api/axios'
import toast from 'react-hot-toast'
import ReportModal from './ReportModal'
import FollowersModal from './FollowersModal'

const UserProfileInfo = ({ user, posts, profileId, setShowEdit, hasPendingRequest = false, onFollowChange }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const currentUser = useSelector((state) => state.user.value)
  const { accessToken } = useSelector((state) => state.auth)
  const [loading, setLoading] = useState(false)
  const [isPending, setIsPending] = useState(hasPendingRequest)
  const [showMenu, setShowMenu] = useState(false)
  const [blocking, setBlocking] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [followersModalTab, setFollowersModalTab] = useState('followers')

  const isFollowing = currentUser?.following?.includes(user.id || user._id) || false
  const isOwnProfile = !profileId || profileId === currentUser?.id || profileId === currentUser?._id

  const handleFollow = async () => {
    if (loading) return
    setLoading(true)
    try {
      // If already following, unfollow
      if (isFollowing) {
        const { data } = await api.post('/api/user/unfollow', { userId: user.id || user._id })
        if (data.success) {
          toast.success(data.message)
          dispatch(fetchUser(accessToken))
          onFollowChange?.()
        }
      }
      // If pending, cancel the request
      else if (isPending) {
        const { data } = await api.post('/api/user/cancel-follow', { userId: user.id || user._id })
        if (data.success) {
          toast.success(data.message)
          setIsPending(false)
          onFollowChange?.()
        }
      }
      // Otherwise, follow
      else {
        const { data } = await api.post('/api/user/follow', { userId: user.id || user._id })
        if (data.success) {
          toast.success(data.message)
          if (data.isPending) {
            setIsPending(true)
          } else {
            dispatch(fetchUser(accessToken))
          }
          onFollowChange?.()
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setLoading(false)
    }
  }

  // Support both camelCase and snake_case
  const profilePicture = user.profilePicture || user.profile_picture
  const fullName = user.fullName || user.full_name || 'User'
  const followersCount = user.followersCount ?? user.followers?.length ?? 0
  const followingCount = user.followingCount ?? user.following?.length ?? 0

  // Determine button state and style
  const getButtonConfig = () => {
    if (isFollowing) {
      return {
        text: 'Following',
        icon: <UserMinus className='w-4 h-4' />,
        className: 'bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-600',
      }
    }
    if (isPending) {
      return {
        text: 'Requested',
        icon: <Clock className='w-4 h-4' />,
        className: 'bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-600',
      }
    }
    return {
      text: 'Follow',
      icon: <UserPlus className='w-4 h-4' />,
      className: 'bg-gray-900 text-white hover:bg-gray-800',
    }
  }

  const buttonConfig = getButtonConfig()

  const handleBlock = async () => {
    if (blocking) return
    if (!window.confirm(`Are you sure you want to block @${user.username}? They will not be able to see your profile or posts.`)) {
      return
    }
    setBlocking(true)
    try {
      const { data } = await api.post('/api/user/block', { userId: user.id || user._id })
      if (data.success) {
        toast.success(data.message)
        navigate('/')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setBlocking(false)
      setShowMenu(false)
    }
  }

  return (
    <div className='relative py-4 px-6 md:px-8 bg-white'>
      <div className='flex flex-col md:flex-row items-start gap-6'>

        <div className='w-32 h-32 border-4 border-white shadow-lg absolute -top-16 rounded-full overflow-hidden'>
          {profilePicture && <img src={profilePicture} alt="" className='w-full h-full object-cover' />}
        </div>

        <div className='w-full pt-16 md:pt-0 md:pl-36'>
          <div className='flex flex-col md:flex-row items-start justify-between'>
            <div>
              <div className='flex items-center gap-3'>
                <h1 className='text-2xl font-bold text-gray-900'>{fullName}</h1>
                <Verified className='w-6 h-6 text-blue-500' />
                {user.isPrivate && <Lock className='w-4 h-4 text-gray-500' title='Private Account' />}
              </div>
              <p className='text-gray-600'>{user.username ? `@${user.username}` : 'Add a username'}</p>
            </div>

            {isOwnProfile ? (
              <button onClick={() => setShowEdit(true)} className='flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 px-4 py-2 rounded-lg font-medium transition-colors mt-4 md:mt-0 cursor-pointer'>
                <PenBox className='w-4 h-4' />
                Edit Profile
              </button>
            ) : (
              <div className='flex items-center gap-2 mt-4 md:mt-0'>
                <button
                  onClick={handleFollow}
                  disabled={loading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${buttonConfig.className} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {buttonConfig.icon}
                  {buttonConfig.text}
                </button>
                {/* Message Button */}
                <button
                  onClick={() => navigate(`/messages/${user.id || user._id}`)}
                  className='flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer bg-blue-500 text-white hover:bg-blue-600'
                >
                  <MessageCircle className='w-4 h-4' />
                  Message
                </button>
                {/* More Options Menu */}
                <div className='relative'>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                  >
                    <MoreHorizontal className='w-5 h-5 text-gray-600' />
                  </button>
                  {showMenu && (
                    <>
                      <div className='fixed inset-0 z-10' onClick={() => setShowMenu(false)} />
                      <div className='absolute right-0 top-10 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[160px]'>
                        <button
                          onClick={() => { setShowReportModal(true); setShowMenu(false); }}
                          className='w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2'
                        >
                          <Flag className='w-4 h-4' />
                          Report User
                        </button>
                        <button
                          onClick={handleBlock}
                          disabled={blocking}
                          className='w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2'
                        >
                          <Ban className='w-4 h-4' />
                          {blocking ? 'Blocking...' : 'Block User'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          <p className='text-gray-700 text-sm max-w-md mt-4'>{user.bio}</p>

          <div className='flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 mt-4'>
            {(user.location || isOwnProfile) && (
              <span className='flex items-center gap-1.5'>
                <MapPin className='w-4 h-4' />
                {user.location ? user.location : 'Add location'}
              </span>
            )}
            {/* <span className='flex items-center gap-1.5'>
              <Calendar className='w-4 h-4' />
              Joined {moment(user.createdAt).fromNow()}
            </span> */}
          </div>

          <div className='flex items-center gap-6 mt-6 border-t border-gray-200 pt-4'>
            <div>
              <span className='sm:text-xl font-bold text-gray-900'>{posts.length}</span>
              <span className='text-xs sm:text-sm text-gray-500 ml-1.5'>Posts</span>
            </div>
            {/* Only allow clicking followers/following if it's own profile, or if account is public, or if following a private account */}
            {(isOwnProfile || !user.isPrivate || isFollowing) ? (
              <>
                <div
                  onClick={() => { setFollowersModalTab('followers'); setShowFollowersModal(true); }}
                  className='cursor-pointer hover:opacity-70 transition-opacity'
                >
                  <span className='sm:text-xl font-bold text-gray-900'>{followersCount}</span>
                  <span className='text-xs sm:text-sm text-gray-500 ml-1.5'>Followers</span>
                </div>
                <div
                  onClick={() => { setFollowersModalTab('following'); setShowFollowersModal(true); }}
                  className='cursor-pointer hover:opacity-70 transition-opacity'
                >
                  <span className='sm:text-xl font-bold text-gray-900'>{followingCount}</span>
                  <span className='text-xs sm:text-sm text-gray-500 ml-1.5'>Following</span>
                </div>
              </>
            ) : (
              <>
                <div className='cursor-default'>
                  <span className='sm:text-xl font-bold text-gray-900'>{followersCount}</span>
                  <span className='text-xs sm:text-sm text-gray-500 ml-1.5'>Followers</span>
                </div>
                <div className='cursor-default'>
                  <span className='sm:text-xl font-bold text-gray-900'>{followingCount}</span>
                  <span className='text-xs sm:text-sm text-gray-500 ml-1.5'>Following</span>
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          type='user'
          targetId={user.id || user._id}
          targetName={`@${user.username}`}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* Followers/Following Modal */}
      {showFollowersModal && (
        <FollowersModal
          userId={user.id || user._id}
          username={user.username}
          initialTab={followersModalTab}
          onClose={() => setShowFollowersModal(false)}
        />
      )}
    </div>
  )
}

export default UserProfileInfo
