import React, { useState } from 'react'
import { X, Phone, Video, ImagePlus, Trash2, Pencil, Bell, BellOff, Palette, MessageCircle } from 'lucide-react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import NicknameModal from './NicknameModal'

const BACKGROUND_COLORS = [
  { name: 'Default', value: null },
  { name: 'Rose', value: '#fdf2f8' },
  { name: 'Sky', value: '#f0f9ff' },
  { name: 'Mint', value: '#ecfdf5' },
  { name: 'Lavender', value: '#faf5ff' },
  { name: 'Peach', value: '#fff7ed' },
  { name: 'Cream', value: '#fffbeb' },
]

const MESSAGE_COLORS = [
  { name: 'Blue', value: null }, // Default
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Gray', value: '#6b7280' },
]

const ChatSettingsModal = ({ user, currentUser, chatSettings, onClose, onUpdate, onCall }) => {
  const [nickname, setNickname] = useState(chatSettings?.nickname || '')
  const [isMuted, setIsMuted] = useState(chatSettings?.isMuted || false)
  const [backgroundColor, setBackgroundColor] = useState(chatSettings?.backgroundColor || null)
  const [backgroundImage, setBackgroundImage] = useState(chatSettings?.backgroundImage || null)
  const [messageColor, setMessageColor] = useState(chatSettings?.messageColor || null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showNicknameModal, setShowNicknameModal] = useState(false)

  const userId = user?.id || user?._id
  const profilePicture = user?.profilePicture || user?.profile_picture
  const fullName = user?.fullName || user?.full_name

  const handleSave = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/api/message/settings/update', {
        chatWithUserId: userId,
        nickname: nickname || null,
        isMuted,
        backgroundColor: backgroundImage ? null : backgroundColor,
        backgroundImage,
        messageColor,
      })
      if (data.success) {
        toast.success('Settings saved')
        onUpdate(data.data)
        onClose()
      }
    } catch (error) {
      toast.error('Failed to save settings')
    }
    setLoading(false)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('chatWithUserId', userId)
      formData.append('image', file)

      const { data } = await api.post('/api/message/settings/background', formData)
      if (data.success) {
        setBackgroundImage(data.data.backgroundImage)
        setBackgroundColor(null)
        toast.success('Background uploaded')
        onUpdate(data.data)
      }
    } catch (error) {
      toast.error('Failed to upload image')
    }
    setUploading(false)
  }

  const handleRemoveImage = () => {
    setBackgroundImage(null)
  }

  const handleColorSelect = (color) => {
    setBackgroundColor(color)
    setBackgroundImage(null)
  }

  return (
    <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
      <div className='bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b sticky top-0 bg-white'>
          <h2 className='text-lg font-semibold'>Chat Settings</h2>
          <button onClick={onClose} className='p-1 hover:bg-gray-100 rounded-full cursor-pointer'>
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* User Info */}
        <div className='p-4 flex items-center gap-4 bg-gray-50'>
          <img src={profilePicture} alt="" className='size-16 rounded-full object-cover' />
          <div>
            <p className='font-semibold text-lg'>{fullName}</p>
            <p className='text-gray-500'>@{user?.username}</p>
          </div>
        </div>

        {/* Call Buttons */}
        <div className='p-4 flex gap-3 border-b'>
          <button
            onClick={() => onCall && onCall('audio')}
            className='flex-1 flex items-center justify-center gap-2 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer transition'
          >
            <Phone className='w-5 h-5' />
            <span>Voice Call</span>
          </button>
          <button
            onClick={() => onCall && onCall('video')}
            className='flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg cursor-pointer transition'
          >
            <Video className='w-5 h-5' />
            <span>Video Call</span>
          </button>
        </div>

        {/* Settings */}
        <div className='p-4 space-y-5'>
          {/* Nickname Section */}
          <button
            onClick={() => setShowNicknameModal(true)}
            className='w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition text-left'
          >
            <div className='w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center'>
              <Pencil className='w-5 h-5 text-blue-600' />
            </div>
            <div className='flex-1'>
              <p className='font-semibold text-gray-900'>Nicknames</p>
              <p className='text-sm text-gray-500'>Set nicknames for this chat</p>
            </div>
          </button>

          {/* Mute Notifications */}
          <div
            onClick={() => setIsMuted(!isMuted)}
            className='flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition'
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isMuted ? 'bg-red-100' : 'bg-green-100'}`}>
              {isMuted ? (
                <BellOff className='w-5 h-5 text-red-600' />
              ) : (
                <Bell className='w-5 h-5 text-green-600' />
              )}
            </div>
            <div className='flex-1'>
              <p className='font-semibold text-gray-900'>
                {isMuted ? 'Notifications muted' : 'Notifications on'}
              </p>
              <p className='text-sm text-gray-500'>
                {isMuted ? 'You won\'t receive notifications' : 'You will receive notifications'}
              </p>
            </div>
            <div className={`w-12 h-7 rounded-full transition-colors flex items-center px-0.5 ${isMuted ? 'bg-gray-800' : 'bg-gray-300'}`}>
              <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${isMuted ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </div>

          {/* Chat Background */}
          <div className='p-3 rounded-xl bg-gray-50'>
            <div className='flex items-center gap-3 mb-3'>
              <div className='w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center'>
                <Palette className='w-5 h-5 text-purple-600' />
              </div>
              <div>
                <p className='font-semibold text-gray-900'>Chat Background</p>
                <p className='text-sm text-gray-500'>Customize your chat appearance</p>
              </div>
            </div>

            {/* Background Image Preview */}
            {backgroundImage && (
              <div className='relative mb-3 rounded-lg overflow-hidden'>
                <img src={backgroundImage} alt="Background" className='w-full h-24 object-cover' />
                <button
                  onClick={handleRemoveImage}
                  className='absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 cursor-pointer'
                >
                  <Trash2 className='w-4 h-4' />
                </button>
              </div>
            )}

            {/* Color Options + Upload Button */}
            <div className='flex flex-wrap gap-2'>
              {BACKGROUND_COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => handleColorSelect(color.value)}
                  className={`w-9 h-9 rounded-lg border-2 transition-all ${
                    !backgroundImage && backgroundColor === color.value ? 'border-blue-500 scale-110 shadow-md' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{ backgroundColor: color.value || '#f3f4f6' }}
                  title={color.name}
                />
              ))}

              {/* Upload Button */}
              <label className='w-9 h-9 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition'>
                {uploading ? (
                  <div className='w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin' />
                ) : (
                  <ImagePlus className='w-4 h-4 text-gray-400' />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className='hidden'
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          {/* Message Color */}
          <div className='p-3 rounded-xl bg-gray-50'>
            <div className='flex items-center gap-3 mb-3'>
              <div className='w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center'>
                <MessageCircle className='w-5 h-5 text-pink-600' />
              </div>
              <div>
                <p className='font-semibold text-gray-900'>Message Color</p>
                <p className='text-sm text-gray-500'>Choose your message bubble color</p>
              </div>
            </div>
            <div className='flex flex-wrap gap-2'>
              {MESSAGE_COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setMessageColor(color.value)}
                  className={`w-9 h-9 rounded-full border-2 transition-all ${
                    messageColor === color.value ? 'border-gray-800 scale-110 shadow-md' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value || '#3b82f6' }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className='p-4 border-t flex gap-3 sticky bottom-0 bg-white'>
          <button onClick={onClose} className='flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition'>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className='flex-1 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 cursor-pointer transition disabled:opacity-50'
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Nickname Modal */}
      {showNicknameModal && (
        <NicknameModal
          currentUser={currentUser}
          chatUser={user}
          chatSettings={chatSettings}
          onClose={() => setShowNicknameModal(false)}
          onUpdate={onUpdate}
        />
      )}
    </div>
  )
}

export default ChatSettingsModal
