import React, { useState } from 'react'
import { Search } from 'lucide-react'
import UserCard from '../components/UserCard'
import Loading from '../components/Loading'
import api from '../api/axios'
import toast from 'react-hot-toast'

const Discover = () => {
  const [input, setInput] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async (e) => {
    if (e.key === 'Enter' && input.trim()) {
      setLoading(true)
      try {
        const { data } = await api.post('/api/user/discover', { query: input.trim() })
        if (data.success) {
          setUsers(data.data || [])
        } else {
          toast.error(data.message)
        }
      } catch (error) {
        toast.error(error.message)
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-800'>
      <div className='max-w-6xl mx-auto p-6'>

        {/* Title */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white mb-2'>Discover People</h1>
          <p className='text-slate-600 dark:text-gray-300'>Connect with amazing people and grow your network</p>
        </div>

        {/* Search */}
        <div className='mb-8 shadow-md rounded-md border border-slate-200/60 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80'>
          <div className='p-6'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-400 w-5 h-5' />
              <input type="text" placeholder='Search people by name, username, bio, or location...' className='pl-10 sm:pl-12 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md max-sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500' onChange={(e) => setInput(e.target.value)} value={input} onKeyUp={handleSearch} />
            </div>
          </div>
        </div>

        <div className='flex flex-wrap gap-6'>
          {users.map((user) => (
            <UserCard user={user} key={user.id} />
          ))}
        </div>

        {
          loading && (<Loading height='60vh' />)
        }

      </div>
    </div>
  )
}

export default Discover
