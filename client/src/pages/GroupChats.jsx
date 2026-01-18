import React, { useEffect, useState } from 'react'
import { Plus, MessageSquare, Users, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'
import CreateGroupModal from '../components/CreateGroupModal'

const GroupChats = () => {
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const { data } = await api.get('/api/group-chat/my-groups')
      if (data.success) {
        setGroups(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch groups')
    }
    setLoading(false)
  }

  const formatTime = (dateString) => {
    if (!dateString) return ''
    // Ensure timezone is handled correctly - append Z if no timezone info
    let normalizedDateString = dateString
    if (!dateString.endsWith('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
      normalizedDateString = dateString + 'Z'
    }
    const date = new Date(normalizedDateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const handleGroupCreated = (group) => {
    setGroups(prev => [group, ...prev])
    setShowCreateModal(false)
    toast.success('Group created successfully!')
  }

  return (
    <div className='min-h-screen relative bg-slate-50 dark:bg-gray-900'>
      <div className='max-w-6xl mx-auto p-6'>
        {/* Title */}
        <div className='mb-8 flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-slate-900 dark:text-white mb-2'>Groups</h1>
            <p className='text-slate-600 dark:text-gray-400'>Chat with multiple friends at once</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className='flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 active:scale-95 transition text-white cursor-pointer'
          >
            <Plus className='w-5 h-5' />
            New Group
          </button>
        </div>

        {/* Groups List */}
        {loading ? (
          <div className='flex justify-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
          </div>
        ) : groups.length === 0 ? (
          <div className='text-center py-12'>
            <Users className='w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4' />
            <h3 className='text-lg font-medium text-gray-600 dark:text-gray-400 mb-2'>No groups yet</h3>
            <p className='text-gray-500 dark:text-gray-500 mb-4'>Create a group to start chatting with multiple friends</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className='inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
            >
              <Plus className='w-4 h-4' />
              Create Group
            </button>
          </div>
        ) : (
          <div className='flex flex-col gap-3'>
            {groups.map((group) => {
              const lastMessage = group.lastMessage
              const unreadCount = group.unreadCount || 0

              return (
                <div
                  key={group.id}
                  className='max-w-xl flex items-center gap-5 p-6 bg-white dark:bg-gray-800 shadow rounded-md'
                >
                  <div className='relative w-12 h-12 shrink-0'>
                    {group.avatarUrl ? (
                      <img src={group.avatarUrl} alt="" className='w-12 h-12 rounded-full object-cover' />
                    ) : (
                      <div className='w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center'>
                        <Users className='w-6 h-6 text-white' />
                      </div>
                    )}
                    {unreadCount > 0 && (
                      <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center'>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>

                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                      <p className='font-medium text-slate-700 dark:text-white truncate'>{group.name}</p>
                      {group.isMuted && (
                        <span className='text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded'>
                          Muted
                        </span>
                      )}
                    </div>
                    <p className='text-sm text-slate-500 dark:text-gray-400'>
                      {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                      {group.role === 'admin' && (
                        <span className='ml-2 text-blue-500'>Admin</span>
                      )}
                    </p>
                    {lastMessage && (
                      <div className='mt-1 flex items-center gap-2'>
                        <p className='text-sm text-gray-600 dark:text-gray-400 truncate'>
                          {lastMessage.sender?.fullName?.split(' ')[0] || 'Someone'}:{' '}
                          {lastMessage.messageType === 'system'
                            ? lastMessage.content
                            : lastMessage.content || (lastMessage.messageType === 'image' ? 'Sent an image' : '')}
                        </p>
                        <span className='text-xs text-gray-400 shrink-0'>
                          {formatTime(lastMessage.createdAt)}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => navigate(`/groups/${group.id}`)}
                    className='size-10 flex items-center justify-center text-sm rounded bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-800 dark:text-white active:scale-95 transition cursor-pointer'
                  >
                    <MessageSquare className='w-4 h-4' />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleGroupCreated}
        />
      )}
    </div>
  )
}

export default GroupChats
