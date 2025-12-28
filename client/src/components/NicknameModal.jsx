import React, { useState, useEffect } from 'react'
import { X, Pencil, Check } from 'lucide-react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const NicknameModal = ({ currentUser, chatUser, chatSettings, onClose, onUpdate }) => {
  const [editingUser, setEditingUser] = useState(null)
  const [nicknameInput, setNicknameInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [otherUserSettings, setOtherUserSettings] = useState(null)

  const chatUserId = chatUser?.id || chatUser?._id
  const chatUserPicture = chatUser?.profilePicture || chatUser?.profile_picture
  const chatUserName = chatUser?.fullName || chatUser?.full_name

  const currentUserId = currentUser?.id || currentUser?._id
  const currentUserPicture = currentUser?.profilePicture || currentUser?.profile_picture
  const currentUserName = currentUser?.fullName || currentUser?.full_name

  // Nickname I set for chat partner
  const nicknameForPartner = chatSettings?.nickname
  // Nickname partner set for me (what I appear as to them)
  const nicknameForMe = otherUserSettings?.nickname

  useEffect(() => {
    const fetchOtherSettings = async () => {
      try {
        const { data } = await api.post('/api/message/settings/get-other', { chatWithUserId: chatUserId })
        if (data.success) {
          setOtherUserSettings(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch other user settings')
      }
    }
    fetchOtherSettings()
  }, [chatUserId])

  const handleEdit = (userId, currentNickname) => {
    setEditingUser(userId)
    setNicknameInput(currentNickname || '')
  }

  const handleSave = async (targetUserId) => {
    setLoading(true)
    try {
      if (targetUserId === chatUserId) {
        // Setting nickname for chat partner
        const { data } = await api.post('/api/message/settings/update', {
          chatWithUserId: chatUserId,
          nickname: nicknameInput || null,
        })
        if (data.success) {
          toast.success('Nickname updated')
          onUpdate(data.data)
        }
      } else {
        // Setting nickname for myself (what partner sees)
        const { data } = await api.post('/api/message/settings/set-partner-nickname', {
          chatWithUserId: chatUserId,
          nickname: nicknameInput || null,
        })
        if (data.success) {
          toast.success('Nickname updated')
          setOtherUserSettings(prev => ({ ...prev, nickname: nicknameInput || null }))
        }
      }
      setEditingUser(null)
    } catch (error) {
      toast.error('Failed to update nickname')
    }
    setLoading(false)
  }

  const handleCancel = () => {
    setEditingUser(null)
    setNicknameInput('')
  }

  return (
    <div className='fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4'>
      <div className='bg-white rounded-xl shadow-xl w-full max-w-md'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b'>
          <div className='w-8' />
          <h2 className='text-lg font-semibold'>Nicknames</h2>
          <button onClick={onClose} className='p-1 hover:bg-gray-100 rounded-full cursor-pointer'>
            <X className='w-6 h-6' />
          </button>
        </div>

        {/* Users List */}
        <div className='p-4 space-y-2'>
          {/* Chat Partner */}
          <div className='flex items-center gap-4 p-3 rounded-lg'>
            <img src={chatUserPicture} alt="" className='size-14 rounded-full object-cover' />
            <div className='flex-1 min-w-0'>
              {editingUser === chatUserId ? (
                <div className='flex items-center gap-2'>
                  <input
                    type="text"
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    placeholder={chatUserName}
                    className='flex-1 min-w-0 px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900'
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSave(chatUserId)}
                  />
                  <button
                    onClick={() => handleSave(chatUserId)}
                    disabled={loading}
                    className='p-2 text-white bg-gray-900 rounded-lg hover:bg-gray-800 cursor-pointer'
                  >
                    <Check className='w-5 h-5' />
                  </button>
                  <button
                    onClick={handleCancel}
                    className='p-2 text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer'
                  >
                    <X className='w-5 h-5' />
                  </button>
                </div>
              ) : (
                <>
                  <p className='font-semibold text-lg'>{nicknameForPartner || chatUserName}</p>
                  <p className='text-sm text-gray-500'>
                    {nicknameForPartner ? chatUserName : 'Set a nickname'}
                  </p>
                </>
              )}
            </div>
            {editingUser !== chatUserId && (
              <button
                onClick={() => handleEdit(chatUserId, nicknameForPartner)}
                className='p-2 hover:bg-gray-100 rounded-full cursor-pointer'
              >
                <Pencil className='w-6 h-6' />
              </button>
            )}
          </div>

          {/* Current User (myself) */}
          <div className='flex items-center gap-4 p-3 rounded-lg'>
            <img src={currentUserPicture} alt="" className='size-14 rounded-full object-cover' />
            <div className='flex-1 min-w-0'>
              {editingUser === currentUserId ? (
                <div className='flex items-center gap-2'>
                  <input
                    type="text"
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    placeholder={currentUserName}
                    className='flex-1 min-w-0 px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900'
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSave(currentUserId)}
                  />
                  <button
                    onClick={() => handleSave(currentUserId)}
                    disabled={loading}
                    className='p-2 text-white bg-gray-900 rounded-lg hover:bg-gray-800 cursor-pointer'
                  >
                    <Check className='w-5 h-5' />
                  </button>
                  <button
                    onClick={handleCancel}
                    className='p-2 text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer'
                  >
                    <X className='w-5 h-5' />
                  </button>
                </div>
              ) : (
                <>
                  <p className='font-semibold text-lg'>{nicknameForMe || currentUserName}</p>
                  <p className='text-sm text-gray-500'>
                    {nicknameForMe ? currentUserName : 'Set a nickname'}
                  </p>
                </>
              )}
            </div>
            {editingUser !== currentUserId && (
              <button
                onClick={() => handleEdit(currentUserId, nicknameForMe)}
                className='p-2 hover:bg-gray-100 rounded-full cursor-pointer'
              >
                <Pencil className='w-6 h-6' />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NicknameModal
