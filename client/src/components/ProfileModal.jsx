import React, { useState, useEffect } from 'react'
import { Pencil, Lock, Globe, Shield, ShieldCheck, ShieldOff } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { updateUser, fetchUser } from '../features/user/userSlice'
import api from '../api/axios'
import toast from 'react-hot-toast'
import TwoFactorSettings from './TwoFactorSettings'

const ProfileModal = ({ setShowEdit }) => {
  const dispatch = useDispatch()
  const { accessToken } = useSelector((state) => state.auth)

  const user = useSelector((state) => state.user.value)
  const [isPrivate, setIsPrivate] = useState(user?.isPrivate || false)
  const [show2FASettings, setShow2FASettings] = useState(false)
  const [twoFactorStatus, setTwoFactorStatus] = useState({ enabled: false, backupCodesRemaining: 0 })
  const [editForm, setEditForm] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    location: user?.location || '',
    profile_picture: null,
    cover_photo: null,
    fullName: user?.fullName || user?.full_name || '',
  })

  const fetchTwoFactorStatus = async () => {
    try {
      const { data } = await api.get('/api/auth/2fa/status')
      if (data.success) {
        setTwoFactorStatus(data.data)
      }
    } catch (error) {
      // Silently fail - 2FA status fetch is not critical
    }
  }

  useEffect(() => {
    fetchTwoFactorStatus()
  }, [])

  const handleTogglePrivacy = async () => {
    try {
      const { data } = await api.post('/api/user/toggle-privacy')
      if (data.success) {
        setIsPrivate(data.data.isPrivate)
        toast.success(data.message)
        dispatch(fetchUser(accessToken))
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to toggle privacy')
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    try {
      const userData = new FormData()
      const { fullName, username, bio, location, profile_picture, cover_photo } = editForm

      if (username) userData.append('username', username)
      if (bio !== undefined) userData.append('bio', bio || '')
      if (location !== undefined) userData.append('location', location || '')
      if (fullName) userData.append('fullName', fullName)
      if (profile_picture) userData.append('profile_picture', profile_picture)
      if (cover_photo) userData.append('cover_photo', cover_photo)

      await dispatch(updateUser({ userData, token: accessToken })).unwrap()

      setShowEdit(false)
    } catch (error) {
      toast.error(error?.message || 'Failed to update profile')
    }
  }

  return (
    <div className='fixed top-0 bottom-0 left-0 right-0 z-110 h-screen overflow-y-scroll bg-black/50'>
      <div className='max-w-2xl sm:py-6 mx-auto'>
        <div className='bg-white rounded-lg shadow p-6'>
          <h1 className='text-2xl font-bold text-gray-900 mb-6'>Edit Profile</h1>

          <form className='space-y-4' onSubmit={e => toast.promise(
            handleSaveProfile(e), { loading: 'Saving...' }
          )}>
            {/* Profile Picture */}
            <div className='flex flex-col items-start gap-3'>
              <label htmlFor="profile_picture" className='block text-sm font-medium text-gray-700 mb-1'>
                Profile Picture
                <input hidden type="file" accept="image/*" id="profile_picture" className="w-full p-3 border border-gray-200 rounded-lg" onChange={(e) => setEditForm({ ...editForm, profile_picture: e.target.files[0] })} />
                <div className='group/profile relative cursor-pointer'>
                  <img src={editForm.profile_picture ? URL.createObjectURL(editForm.profile_picture) : (user?.profilePicture || user?.profile_picture)} alt="" className='w-24 h-24 rounded-full object-cover mt-2' />

                  <div className='absolute hidden group-hover/profile:flex top-0 left-0 right-0 bottom-0 bg-black/20 rounded-full items-center justify-center mt-2'>
                    <Pencil className="w-5 h-5 text-white" />
                  </div>
                </div>
              </label>
            </div>

            {/* Cover Photo */}
            <div className='flex flex-col items-start gap-3'>
              <label htmlFor="cover_photo" className="block text-sm font-medium text-gray-700 mb-1">
                Cover Photo
                <input hidden type="file" accept="image/*" id="cover_photo" className="w-full p-3 border border-gray-200 rounded-lg" onChange={(e) => setEditForm({ ...editForm, cover_photo: e.target.files[0] })} />
                <div className='group/cover relative cursor-pointer'>
                  <img src={editForm.cover_photo ? URL.createObjectURL(editForm.cover_photo) : (user?.coverPhoto || user?.cover_photo)} alt="" className='w-80 h-40 rounded-lg bg-gradient-to-r from-gray-300 via-gray-200 to-gray-100 object-cover mt-2' />

                  <div className='absolute hidden group-hover/cover:flex top-0 left-0 right-0 bottom-0 bg-black/20 rounded-lg items-center justify-center mt-2'>
                    <Pencil className="w-5 h-5 text-white" />
                  </div>
                </div>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input type="text" className='w-full p-3 border border-gray-200 rounded-lg' placeholder='Please enter your full name' onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} value={editForm.fullName || ''} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input type="text" className='w-full p-3 border border-gray-200 rounded-lg' placeholder='Please enter a username' onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} value={editForm.username || ''} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea rows={3} className='w-full p-3 border border-gray-200 rounded-lg' placeholder='Please enter a short bio' onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} value={editForm.bio || ''} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input type="text" className='w-full p-3 border border-gray-200 rounded-lg' placeholder='Please enter your location' onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} value={editForm.location || ''} />
            </div>

            {/* Private Account Toggle */}
            <div className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'>
              <div className='flex items-center gap-3'>
                {isPrivate ? <Lock className='w-5 h-5 text-gray-700' /> : <Globe className='w-5 h-5 text-gray-700' />}
                <div>
                  <p className='font-medium text-gray-900'>Private Account</p>
                  <p className='text-sm text-gray-500'>
                    {isPrivate ? 'Only approved followers can see your posts' : 'Anyone can see your posts'}
                  </p>
                </div>
              </div>
              <button
                type='button'
                onClick={handleTogglePrivacy}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${isPrivate ? 'bg-gray-900' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPrivate ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Two-Factor Authentication */}
            <div className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'>
              <div className='flex items-center gap-3'>
                {twoFactorStatus.enabled ? (
                  <ShieldCheck className='w-5 h-5 text-green-600' />
                ) : (
                  <ShieldOff className='w-5 h-5 text-gray-400' />
                )}
                <div>
                  <p className='font-medium text-gray-900'>Two-Factor Authentication</p>
                  <p className='text-sm text-gray-500'>
                    {twoFactorStatus.enabled
                      ? `Enabled · ${twoFactorStatus.backupCodesRemaining} backup codes remaining`
                      : 'Add an extra layer of security'}
                  </p>
                </div>
              </div>
              <button
                type='button'
                onClick={() => setShow2FASettings(true)}
                className='px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer'
              >
                {twoFactorStatus.enabled ? 'Manage' : 'Enable'}
              </button>
            </div>

            <div className='flex justify-end space-x-3 pt-6'>

              <button onClick={() => setShowEdit(false)} type='button' className='px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer'>Cancel</button>

              <button type='submit' className='px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition cursor-pointer'>Save Changes</button>
            </div>

          </form>
        </div>
      </div>

      {/* Two-Factor Authentication Modal */}
      {show2FASettings && (
        <TwoFactorSettings
          onClose={() => {
            setShow2FASettings(false)
            fetchTwoFactorStatus()
          }}
        />
      )}
    </div>
  )
}

export default ProfileModal
