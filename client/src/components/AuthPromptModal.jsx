import React from 'react'
import { X, LogIn, UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const AuthPromptModal = ({ isOpen, onClose, action = 'interact' }) => {
  const navigate = useNavigate()

  if (!isOpen) return null

  const actionMessages = {
    like: 'like this post',
    comment: 'comment on this post',
    share: 'share this post',
    follow: 'follow this user',
    bookmark: 'bookmark this post',
    interact: 'interact with posts'
  }

  const handleLogin = () => {
    onClose()
    navigate('/login')
  }

  const handleRegister = () => {
    onClose()
    navigate('/register')
  }

  return (
    <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4'>
      <div className='bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700'>
          <div className='w-6' />
          <h2 className='font-semibold text-gray-900 dark:text-white'>
            Join PingUp
          </h2>
          <button
            onClick={onClose}
            className='p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors'
          >
            <X className='w-5 h-5 text-gray-600 dark:text-gray-400' />
          </button>
        </div>

        {/* Content */}
        <div className='p-6 text-center'>
          <div className='w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4'>
            <LogIn className='w-8 h-8 text-white' />
          </div>

          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
            Sign in to {actionMessages[action] || actionMessages.interact}
          </h3>

          <p className='text-sm text-gray-500 dark:text-gray-400 mb-6'>
            Create an account or log in to connect with friends, share your thoughts, and explore the community.
          </p>

          <div className='space-y-3'>
            <button
              onClick={handleLogin}
              className='w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium py-3 px-4 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors'
            >
              <LogIn className='w-5 h-5' />
              Log in
            </button>

            <button
              onClick={handleRegister}
              className='w-full flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-medium py-3 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'
            >
              <UserPlus className='w-5 h-5' />
              Create account
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className='px-6 pb-6'>
          <p className='text-xs text-center text-gray-400 dark:text-gray-500'>
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthPromptModal
