import React from 'react'
import { assets } from '../assets/assets'
import { Link, useNavigate } from 'react-router-dom'
import MenuItems from './MenuItems'
import { CirclePlus, LogOut, LogIn, UserPlus } from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../features/auth/authSlice'
import ThemeToggle from './ThemeToggle'

const Sidebar = ({ sidebarOpen, setSidebarOpen, isAuthenticated = true }) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector((state) => state.user.value)

  const handleSignOut = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className={`w-60 xl:w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col justify-between items-center max-sm:absolute top-0 bottom-0 z-20 ${sidebarOpen ? 'translate-x-0' : 'max-sm:-translate-x-full'} transition-all duration-300 ease-in-out`}>
      <div className='w-full'>
        <img onClick={() => navigate('/')} src={assets.logo} className='w-26 ml-7 my-2 cursor-pointer dark:invert' alt="" />
        <hr className='border-gray-300 dark:border-gray-700 mb-8' />

        {isAuthenticated ? (
          <>
            <MenuItems setSidebarOpen={setSidebarOpen} />

            <Link to='/create-post' className='flex items-center justify-center gap-2 py-2.5 mt-6 mx-6 rounded-lg bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 active:scale-95 transition text-white cursor-pointer'>
              <CirclePlus className='w-5 h-5' />
              Create Post
            </Link>
          </>
        ) : (
          <div className='px-6 space-y-3'>
            <p className='text-sm text-gray-500 dark:text-gray-400 mb-4'>
              Join PingUp to connect with friends and share your thoughts.
            </p>
            <Link to='/login' className='flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 active:scale-95 transition text-white cursor-pointer'>
              <LogIn className='w-5 h-5' />
              Log in
            </Link>
            <Link to='/register' className='flex items-center justify-center gap-2 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition cursor-pointer'>
              <UserPlus className='w-5 h-5' />
              Create account
            </Link>
          </div>
        )}
      </div>

      <div className='w-full border-t border-gray-200 dark:border-gray-700 p-4 px-7'>
        {isAuthenticated && user ? (
          <div className='flex items-center justify-between'>
            <div onClick={() => navigate('/profile')} className='flex gap-2 items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 -m-2 rounded-lg transition'>
              <img
                src={user?.profilePicture || user?.profile_picture || '/default-avatar.png'}
                alt={user?.fullName || user?.full_name}
                className='w-10 h-10 rounded-full object-cover'
              />
              <div>
                <h1 className='text-sm font-medium dark:text-white'>{user?.fullName || user?.full_name}</h1>
                <p className='text-xs text-gray-500 dark:text-gray-400'>@{user?.username}</p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <ThemeToggle />
              <LogOut onClick={handleSignOut} className='w-4.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition cursor-pointer' />
            </div>
          </div>
        ) : (
          <div className='flex items-center justify-center'>
            <ThemeToggle />
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar
