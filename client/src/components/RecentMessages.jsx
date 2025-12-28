import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import moment from 'moment'
import { useSelector } from 'react-redux'
import api from '../api/axios'
import toast from 'react-hot-toast'

const RecentMessages = () => {
  const [messages, setMessages] = useState([])
  const { user } = useSelector((state) => state.auth)

  const fetchRecentMessages = async () => {
    try {
      const { data } = await api.get('/api/user/recent-messages')
      if (data.success) {
        const messageList = data.data?.messages || data.messages || []

        // Group messages by sender and get the latest message for each sender
        const groupedMessages = messageList.reduce((acc, message) => {
          // Support both camelCase and snake_case
          const fromUser = message.fromUser || message.from_user_id || {}
          const senderId = fromUser.id || fromUser._id
          if (!acc[senderId] || new Date(message.createdAt) > new Date(acc[senderId].createdAt)) {
            acc[senderId] = message
          }
          return acc
        }, {})

        // Sort messages by date
        const sortedMessages = Object.values(groupedMessages).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

        setMessages(sortedMessages)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  useEffect(() => {
    if (user) {
      fetchRecentMessages()
      const interval = setInterval(fetchRecentMessages, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  return (
    <div className='bg-white max-w-xs mt-4 p-4 min-h-20 rounded-md shadow text-xs text-slate-800'>
      <h3 className='font-semibold text-slate-8 mb-4'>Recent Messages</h3>
      <div className='flex flex-col max-h-56 overflow-y-scroll no-scrollbar'>
        {
          messages.map((message, index) => {
            const fromUser = message.fromUser || message.from_user_id || {}
            const userId = fromUser.id || fromUser._id
            const fullName = fromUser.fullName || fromUser.full_name || 'User'
            const profilePicture = fromUser.profilePicture || fromUser.profile_picture

            return (
              <Link to={`/messages/${userId}`} key={index} className='flex items-start gap-2 py-2 hover:bg-slate-100'>
                {profilePicture && <img src={profilePicture} alt="" className='w-8 h-8 rounded-full' />}
                <div className='w-full'>
                  <div className='flex justify-between'>
                    <p className='font-medium'>{fullName}</p>
                    <p className='text-[10px] text-slate-400'>{moment(message.createdAt).fromNow()}</p>
                  </div>
                  <div className='flex justify-between'>
                    <p className='text-gray-500'>{message.text ? message.text : 'Media'}</p>
                    {!message.seen && <p className='bg-gray-800 text-white w-4 h-4 flex items-center justify-center rounded-full text-[10px]'>1</p>}
                  </div>
                </div>
              </Link>
            )
          })
        }
      </div>
    </div>
  )
}

export default RecentMessages
