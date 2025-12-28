import React from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const Notification = ({t, message}) => {
  const navigate = useNavigate()

  // Support both old (snake_case) and new (camelCase) message formats
  const fromUser = message.fromUser || message.from_user_id || {}
  const userId = fromUser.id || fromUser._id
  const fullName = fromUser.fullName || fromUser.full_name || 'User'
  const profilePicture = fromUser.profilePicture || fromUser.profile_picture
  const messageText = message.text || ''

  return (
    <div className={`max-w-md w-full bg-white shadow-lg rounded-lg flex border border-gray-300 hover:scale-105 transition`}>
      <div className='flex-1 p-4'>
        <div className='flex items-start'>
            {profilePicture && (
              <img src={profilePicture} alt="" className='h-10 w-10 rounded-full flex-shrink-0 mt-0.5'/>
            )}
            <div className='ml-3 flex-1'>
                <p className="text-sm font-medium text-gray-900">
                    {fullName} </p>
                <p className="text-sm text-gray-500">
                     {messageText.slice(0, 50)} </p>
            </div>
        </div>
      </div>
      <div className='flex border-l border-gray-200'>
        <button onClick={()=>{
            navigate(`/messages/${userId}`);
            toast.dismiss(t.id)
        }} className='p-4 text-gray-900 font-semibold'>
            Reply
        </button>
      </div>
    </div>
  )
}

export default Notification
