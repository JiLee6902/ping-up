import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { dummyUserData } from '../assets/assets'
import Loading from '../components/Loading'
import { useSelector } from 'react-redux'

const Layout = ({ requireAuth = true }) => {
    const user = useSelector((state)=>state.user.value)
    const { isAuthenticated } = useSelector((state) => state.auth)
    const [sidebarOpen, setSidebarOpen] = useState(false)

    // If requireAuth is true and user hasn't loaded yet, show loading
    // If requireAuth is false (public route), don't require user to be loaded
    if (requireAuth && !user) {
      return <Loading />
    }

  return (
    <div className='w-full flex h-screen'>
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} isAuthenticated={isAuthenticated} />

        <div className='flex-1 bg-slate-50 dark:bg-gray-800'>
            <Outlet />
        </div>
      {
        sidebarOpen ?
        <X className='absolute top-3 right-3 p-2 z-100 bg-white dark:bg-gray-800 rounded-md shadow w-10 h-10 text-gray-600 dark:text-gray-300 sm:hidden' onClick={()=> setSidebarOpen(false)}/>
        :
        <Menu className='absolute top-3 right-3 p-2 z-100 bg-white dark:bg-gray-800 rounded-md shadow w-10 h-10 text-gray-600 dark:text-gray-300 sm:hidden' onClick={()=> setSidebarOpen(true)}/>
      }
    </div>
  )
}

export default Layout
