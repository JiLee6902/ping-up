import React, { useState, useEffect } from 'react'
import { X, Camera, Search, Check, Users } from 'lucide-react'
import { useSelector } from 'react-redux'
import api from '../api/axios'
import toast from 'react-hot-toast'

const CreateGroupModal = ({ onClose, onCreated }) => {
  const { connections } = useSelector((state) => state.connections)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [avatar, setAvatar] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [selectedMembers, setSelectedMembers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatar(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const toggleMember = (userId) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const filteredConnections = connections.filter(item => {
    const user = item.user || item
    const fullName = user.fullName || user.full_name || ''
    const username = user.username || ''
    const query = searchQuery.toLowerCase()
    return fullName.toLowerCase().includes(query) || username.toLowerCase().includes(query)
  })

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Please enter a group name')
      return
    }
    if (selectedMembers.length === 0) {
      toast.error('Please select at least one member')
      return
    }

    setIsCreating(true)
    try {
      const formData = new FormData()
      formData.append('name', name.trim())
      if (description.trim()) {
        formData.append('description', description.trim())
      }
      if (avatar) {
        formData.append('avatar', avatar)
      }
      selectedMembers.forEach((id, index) => {
        formData.append(`memberIds[${index}]`, id)
      })

      const { data } = await api.post('/api/group-chat/create', formData)
      if (data.success) {
        onCreated(data.data)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create group')
    }
    setIsCreating(false)
  }

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white dark:bg-gray-800 rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700'>
          <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Create Group</h2>
          <button onClick={onClose} className='p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full'>
            <X className='w-5 h-5 text-gray-500' />
          </button>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto p-4 space-y-4'>
          {/* Avatar & Name */}
          <div className='flex items-center gap-4'>
            <label className='relative cursor-pointer'>
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className='w-16 h-16 rounded-full object-cover' />
              ) : (
                <div className='w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center'>
                  <Users className='w-8 h-8 text-white' />
                </div>
              )}
              <div className='absolute bottom-0 right-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center'>
                <Camera className='w-3.5 h-3.5 text-white' />
              </div>
              <input type="file" accept="image/*" hidden onChange={handleAvatarChange} />
            </label>
            <div className='flex-1'>
              <input
                type="text"
                placeholder="Group name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className='w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className='w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
            />
          </div>

          {/* Members Selection */}
          <div>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                Add Members
              </span>
              <span className='text-sm text-gray-500'>
                {selectedMembers.length} selected
              </span>
            </div>

            {/* Search */}
            <div className='relative mb-3'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
              <input
                type="text"
                placeholder="Search connections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            {/* Connections List */}
            <div className='space-y-2 max-h-48 overflow-y-auto'>
              {filteredConnections.length === 0 ? (
                <p className='text-center text-gray-500 dark:text-gray-400 py-4'>
                  No connections found
                </p>
              ) : (
                filteredConnections.map(item => {
                  const user = item.user || item
                  const userId = user.id || user._id
                  const profilePicture = user.profilePicture || user.profile_picture
                  const fullName = user.fullName || user.full_name
                  const isSelected = selectedMembers.includes(userId)

                  return (
                    <div
                      key={userId}
                      onClick={() => toggleMember(userId)}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
                      }`}
                    >
                      <img src={profilePicture} alt="" className='w-10 h-10 rounded-full object-cover' />
                      <div className='flex-1 min-w-0'>
                        <p className='font-medium text-gray-900 dark:text-white truncate'>{fullName}</p>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>@{user.username}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                        isSelected
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-300 dark:border-gray-500'
                      }`}>
                        {isSelected && <Check className='w-3 h-3 text-white' />}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='p-4 border-t border-gray-200 dark:border-gray-700'>
          <button
            onClick={handleCreate}
            disabled={isCreating || !name.trim() || selectedMembers.length === 0}
            className='w-full py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition'
          >
            {isCreating ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateGroupModal
