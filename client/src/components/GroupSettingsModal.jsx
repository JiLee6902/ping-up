import React, { useState, useEffect, useMemo } from 'react'
import {
  X, Camera, Users, UserPlus, Crown, LogOut, Trash2,
  Edit2, Check, Bell, BellOff, Shield, Search, Loader2
} from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { fetchConnections } from '../features/connections/connectionsSlice'
import api from '../api/axios'
import toast from 'react-hot-toast'

const GroupSettingsModal = ({ group, currentUser, onClose, onUpdate, onLeave }) => {
  const dispatch = useDispatch()
  const { accessToken } = useSelector((state) => state.auth)
  const { connections, followers, following } = useSelector((state) => state.connections)

  const [activeTab, setActiveTab] = useState('info')
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(group?.name || '')
  const [description, setDescription] = useState(group?.description || '')
  const [avatar, setAvatar] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [showAddMembers, setShowAddMembers] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingConnections, setLoadingConnections] = useState(false)

  const isAdmin = group?.members?.find(m => m.id === currentUser?.id)?.role === 'admin'
  const isCreator = group?.creatorId === currentUser?.id

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatar(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSaveChanges = async () => {
    if (!name.trim()) {
      toast.error('Group name is required')
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('groupId', group.id)
      formData.append('name', name.trim())
      if (description !== group.description) {
        formData.append('description', description.trim())
      }
      if (avatar) {
        formData.append('avatar', avatar)
      }

      const { data } = await api.post('/api/group-chat/update', formData)
      if (data.success) {
        onUpdate(data.data)
        setIsEditing(false)
        toast.success('Group updated')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update group')
    }
    setIsLoading(false)
  }

  const handleToggleMute = async () => {
    const currentMember = group?.members?.find(m => m.id === currentUser?.id)
    const newMuted = !currentMember?.isMuted

    try {
      const { data } = await api.post('/api/group-chat/settings', {
        groupId: group.id,
        isMuted: newMuted,
      })
      if (data.success) {
        onUpdate({ ...group, members: group.members.map(m =>
          m.id === currentUser.id ? { ...m, isMuted: newMuted } : m
        )})
        toast.success(newMuted ? 'Notifications muted' : 'Notifications unmuted')
      }
    } catch (error) {
      toast.error('Failed to update settings')
    }
  }

  const handleAddMembers = async () => {
    if (selectedMembers.length === 0) return

    setIsLoading(true)
    try {
      const { data } = await api.post('/api/group-chat/add-members', {
        groupId: group.id,
        userIds: selectedMembers,
      })
      if (data.success) {
        onUpdate(data.data)
        setSelectedMembers([])
        setShowAddMembers(false)
        toast.success('Members added')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add members')
    }
    setIsLoading(false)
  }

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member from the group?')) return

    try {
      const { data } = await api.post('/api/group-chat/remove-member', {
        groupId: group.id,
        userId,
      })
      if (data.success) {
        onUpdate({ ...group, members: group.members.filter(m => m.id !== userId) })
        toast.success('Member removed')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove member')
    }
  }

  const handleToggleAdmin = async (userId, makeAdmin) => {
    try {
      const { data } = await api.post('/api/group-chat/update-role', {
        groupId: group.id,
        userId,
        role: makeAdmin ? 'admin' : 'member',
      })
      if (data.success) {
        onUpdate({ ...group, members: group.members.map(m =>
          m.id === userId ? { ...m, role: makeAdmin ? 'admin' : 'member' } : m
        )})
        toast.success(makeAdmin ? 'Made admin' : 'Removed as admin')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update role')
    }
  }

  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return

    try {
      const { data } = await api.post('/api/group-chat/leave', { groupId: group.id })
      if (data.success) {
        toast.success('Left group')
        onLeave()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to leave group')
    }
  }

  const handleDeleteGroup = async () => {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) return

    try {
      const { data } = await api.delete(`/api/group-chat/${group.id}`)
      if (data.success) {
        toast.success('Group deleted')
        onLeave()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete group')
    }
  }

  // Fetch connections when Add Members is opened
  useEffect(() => {
    if (showAddMembers) {
      setLoadingConnections(true)
      dispatch(fetchConnections(accessToken)).finally(() => setLoadingConnections(false))
    }
  }, [showAddMembers, dispatch, accessToken])

  // Compute mutual follows: users who are in BOTH followers AND following
  const mutualFollows = useMemo(() => {
    const followerIds = new Set(followers.map(u => u.id || u._id))
    return following.filter(u => followerIds.has(u.id || u._id))
  }, [followers, following])

  // Get mutual follows not in group for adding (filtered by search)
  const availableConnections = useMemo(() => {
    const available = mutualFollows.filter(user => {
      const userId = user.id || user._id
      return !group?.members?.find(m => m.id === userId)
    })
    if (!searchQuery.trim()) return available
    const query = searchQuery.toLowerCase()
    return available.filter(user => {
      const fullName = user.fullName || user.full_name || ''
      const username = user.username || ''
      return fullName.toLowerCase().includes(query) || username.toLowerCase().includes(query)
    })
  }, [mutualFollows, group?.members, searchQuery])

  const currentMember = group?.members?.find(m => m.id === currentUser?.id)
  const isMuted = currentMember?.isMuted

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white dark:bg-gray-800 rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700'>
          <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Group Settings</h2>
          <button onClick={onClose} className='p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full'>
            <X className='w-5 h-5 text-gray-500' />
          </button>
        </div>

        {/* Tabs */}
        <div className='flex border-b border-gray-200 dark:border-gray-700'>
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-2.5 text-sm font-medium ${
              activeTab === 'info'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Info
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 py-2.5 text-sm font-medium ${
              activeTab === 'members'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Members ({group?.memberCount || 0})
          </button>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto'>
          {activeTab === 'info' && (
            <div className='p-4 space-y-4'>
              {/* Group Info */}
              <div className='flex items-center gap-4'>
                <div className='relative'>
                  {isEditing ? (
                    <label className='cursor-pointer'>
                      {avatarPreview || group?.avatarUrl ? (
                        <img src={avatarPreview || group.avatarUrl} alt="" className='w-16 h-16 rounded-full object-cover' />
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
                  ) : (
                    group?.avatarUrl ? (
                      <img src={group.avatarUrl} alt="" className='w-16 h-16 rounded-full object-cover' />
                    ) : (
                      <div className='w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center'>
                        <Users className='w-8 h-8 text-white' />
                      </div>
                    )
                  )}
                </div>
                <div className='flex-1'>
                  {isEditing ? (
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className='w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  ) : (
                    <>
                      <p className='font-semibold text-gray-900 dark:text-white'>{group?.name}</p>
                      <p className='text-sm text-gray-500 dark:text-gray-400'>
                        Created by {group?.creator?.fullName || 'Unknown'}
                      </p>
                    </>
                  )}
                </div>
                {isAdmin && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full'
                  >
                    <Edit2 className='w-4 h-4 text-gray-500' />
                  </button>
                )}
              </div>

              {/* Description */}
              {isEditing ? (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description (optional)"
                  rows={3}
                  className='w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
                />
              ) : group?.description && (
                <p className='text-sm text-gray-600 dark:text-gray-300'>{group.description}</p>
              )}

              {isEditing && (
                <div className='flex gap-2'>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setName(group?.name || '')
                      setDescription(group?.description || '')
                      setAvatar(null)
                      setAvatarPreview(null)
                    }}
                    className='flex-1 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300'
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    disabled={isLoading}
                    className='flex-1 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white disabled:opacity-50'
                  >
                    {isLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className='space-y-1'>
                <button
                  onClick={handleToggleMute}
                  className='w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition'
                >
                  {isMuted ? (
                    <BellOff className='w-5 h-5 text-gray-500' />
                  ) : (
                    <Bell className='w-5 h-5 text-gray-500' />
                  )}
                  <span className='text-gray-700 dark:text-gray-300'>
                    {isMuted ? 'Unmute notifications' : 'Mute notifications'}
                  </span>
                </button>

                <button
                  onClick={handleLeaveGroup}
                  className='w-full flex items-center gap-3 p-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition text-red-500'
                >
                  <LogOut className='w-5 h-5' />
                  <span>Leave group</span>
                </button>

                {isCreator && (
                  <button
                    onClick={handleDeleteGroup}
                    className='w-full flex items-center gap-3 p-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition text-red-500'
                  >
                    <Trash2 className='w-5 h-5' />
                    <span>Delete group</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className='p-4'>
              {/* Add Members Button */}
              {isAdmin && (
                <button
                  onClick={() => setShowAddMembers(true)}
                  className='w-full flex items-center gap-3 p-3 mb-3 border border-dashed border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition'
                >
                  <UserPlus className='w-5 h-5 text-blue-500' />
                  <span className='text-blue-500 font-medium'>Add members</span>
                </button>
              )}

              {/* Members List */}
              <div className='space-y-1'>
                {group?.members?.map(member => {
                  const isCurrentUser = member.id === currentUser?.id
                  const isMemberCreator = member.id === group?.creatorId
                  const isMemberAdmin = member.role === 'admin'

                  return (
                    <div key={member.id} className='flex items-center gap-3 p-2 rounded-lg'>
                      <img
                        src={member.profilePicture}
                        alt=""
                        className='w-10 h-10 rounded-full object-cover'
                      />
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2'>
                          <p className='font-medium text-gray-900 dark:text-white truncate'>
                            {member.fullName}
                            {isCurrentUser && <span className='text-gray-400 ml-1'>(You)</span>}
                          </p>
                          {isMemberCreator && (
                            <Crown className='w-4 h-4 text-yellow-500 shrink-0' />
                          )}
                          {isMemberAdmin && !isMemberCreator && (
                            <Shield className='w-4 h-4 text-blue-500 shrink-0' />
                          )}
                        </div>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>@{member.username}</p>
                      </div>

                      {/* Admin actions */}
                      {isAdmin && !isCurrentUser && !isMemberCreator && (
                        <div className='flex items-center gap-1'>
                          <button
                            onClick={() => handleToggleAdmin(member.id, !isMemberAdmin)}
                            className='p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full'
                            title={isMemberAdmin ? 'Remove as admin' : 'Make admin'}
                          >
                            <Shield className={`w-4 h-4 ${isMemberAdmin ? 'text-blue-500' : 'text-gray-400'}`} />
                          </button>
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className='p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full'
                            title='Remove member'
                          >
                            <X className='w-4 h-4 text-red-500' />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Add Members Modal */}
        {showAddMembers && (
          <div className='absolute inset-0 bg-white dark:bg-gray-800 flex flex-col'>
            <div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700'>
              <h3 className='font-semibold text-gray-900 dark:text-white'>Add Members</h3>
              <span className='text-sm text-gray-500'>{selectedMembers.length} selected</span>
              <button onClick={() => { setShowAddMembers(false); setSelectedMembers([]); setSearchQuery('') }} className='p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full'>
                <X className='w-5 h-5 text-gray-500' />
              </button>
            </div>
            {/* Search */}
            <div className='px-4 pt-3'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                <input
                  type="text"
                  placeholder="Search connections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
            </div>
            <div className='flex-1 overflow-y-auto p-4 space-y-2'>
              {loadingConnections ? (
                <div className='flex items-center justify-center py-4'>
                  <Loader2 className='w-6 h-6 text-blue-500 animate-spin' />
                </div>
              ) : availableConnections.length === 0 ? (
                <p className='text-center text-gray-500 dark:text-gray-400 py-4'>
                  {mutualFollows.length === 0
                    ? 'No mutual follows yet. Follow people who follow you back!'
                    : searchQuery
                      ? 'No results found'
                      : 'All your mutual follows are already in this group'}
                </p>
              ) : (
                availableConnections.map(user => {
                  const userId = user.id || user._id
                  const isSelected = selectedMembers.includes(userId)

                  return (
                    <div
                      key={userId}
                      onClick={() => setSelectedMembers(prev =>
                        isSelected ? prev.filter(id => id !== userId) : [...prev, userId]
                      )}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
                      }`}
                    >
                      <img src={user.profilePicture || user.profile_picture} alt="" className='w-10 h-10 rounded-full object-cover' />
                      <div className='flex-1'>
                        <p className='font-medium text-gray-900 dark:text-white'>{user.fullName || user.full_name}</p>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>@{user.username}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-500'
                      }`}>
                        {isSelected && <Check className='w-3 h-3 text-white' />}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            <div className='p-4 border-t border-gray-200 dark:border-gray-700'>
              <button
                onClick={handleAddMembers}
                disabled={isLoading || selectedMembers.length === 0}
                className='w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium'
              >
                {isLoading ? 'Adding...' : `Add ${selectedMembers.length} member${selectedMembers.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GroupSettingsModal
