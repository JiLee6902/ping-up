import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Heart, MessageCircle, UserPlus, Repeat2, Check, Trash2, CheckCheck } from 'lucide-react'
import moment from 'moment'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { useSocket } from '../context/SocketContext'

const Notifications = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const navigate = useNavigate()
  const { socket } = useSocket()

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/api/notification')
      if (data.success) {
        setNotifications(data.data)
        setUnreadCount(data.data.filter(n => !n.isRead).length)
      }
    } catch (error) {
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket) return

    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev])
      setUnreadCount(prev => prev + 1)
    }

    socket.on('notification', handleNewNotification)

    return () => {
      socket.off('notification', handleNewNotification)
    }
  }, [socket])

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.post(`/api/notification/${notificationId}/read`)
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      toast.error('Failed to mark as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/api/notification/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
      toast.success('All notifications marked as read')
    } catch (error) {
      toast.error('Failed to mark all as read')
    }
  }

  const handleDelete = async (notificationId) => {
    try {
      await api.delete(`/api/notification/${notificationId}`)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      toast.success('Notification deleted')
    } catch (error) {
      toast.error('Failed to delete notification')
    }
  }

  const handleNotificationClick = (notification) => {
    // Mark as read first
    if (!notification.isRead) {
      handleMarkAsRead(notification.id)
    }

    // Navigate based on type
    switch (notification.type) {
      case 'like':
      case 'comment':
      case 'repost':
        if (notification.postId) {
          navigate(`/post/${notification.postId}`)
        }
        break
      case 'follow':
      case 'follow_request':
      case 'follow_accepted':
        if (notification.actor?.id) {
          navigate(`/profile/${notification.actor.id}`)
        }
        break
      default:
        break
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className='w-5 h-5 text-red-500 fill-red-500' />
      case 'comment':
        return <MessageCircle className='w-5 h-5 text-blue-500' />
      case 'follow':
      case 'follow_request':
      case 'follow_accepted':
        return <UserPlus className='w-5 h-5 text-green-500' />
      case 'repost':
        return <Repeat2 className='w-5 h-5 text-purple-500' />
      default:
        return <Bell className='w-5 h-5 text-gray-500' />
    }
  }

  if (loading) {
    return (
      <div className='h-full flex items-center justify-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white'></div>
      </div>
    )
  }

  return (
    <div className='h-full overflow-y-auto bg-slate-50 dark:bg-gray-900'>
      <div className='max-w-2xl mx-auto p-4'>
        {/* Header */}
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-2'>
            <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>Notifications</h1>
            {unreadCount > 0 && (
              <span className='bg-red-500 text-white text-xs px-2 py-0.5 rounded-full'>
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className='flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300'
            >
              <CheckCheck className='w-4 h-4' />
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className='text-center py-12'>
            <Bell className='w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4' />
            <p className='text-gray-500 dark:text-gray-400'>No notifications yet</p>
          </div>
        ) : (
          <div className='space-y-2'>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border transition-all ${
                  notification.isRead ? 'border-gray-100 dark:border-gray-700' : 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20'
                }`}
              >
                <div className='flex items-start gap-3'>
                  {/* Actor Avatar */}
                  <div className='relative'>
                    {notification.actor?.profilePicture ? (
                      <img
                        src={notification.actor.profilePicture}
                        alt={notification.actor.fullName}
                        className='w-12 h-12 rounded-full object-cover cursor-pointer'
                        onClick={() => navigate(`/profile/${notification.actor.id}`)}
                      />
                    ) : (
                      <div className='w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center'>
                        <Bell className='w-6 h-6 text-gray-400' />
                      </div>
                    )}
                    <div className='absolute -bottom-1 -right-1 bg-white rounded-full p-0.5'>
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div
                    className='flex-1 cursor-pointer'
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <p className='text-sm text-gray-800 dark:text-gray-200'>
                      <span className='font-semibold'>{notification.actor?.fullName}</span>{' '}
                      {notification.message?.replace(notification.actor?.fullName, '').trim()}
                    </p>
                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                      {moment(notification.createdAt).fromNow()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className='flex items-center gap-2'>
                    {!notification.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMarkAsRead(notification.id)
                        }}
                        className='p-1.5 text-blue-600 hover:bg-blue-50 rounded-full'
                        title='Mark as read'
                      >
                        <Check className='w-4 h-4' />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(notification.id)
                      }}
                      className='p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full'
                      title='Delete'
                    >
                      <Trash2 className='w-4 h-4' />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Notifications
