import React, { useState } from 'react'
import { Search, Users, Loader2, UserSearch } from 'lucide-react'
import UserCard from '../components/UserCard'
import { UserCardSkeleton } from '../components/Skeleton'
import api from '../api/axios'
import toast from 'react-hot-toast'

const Discover = () => {
  const [input, setInput] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (e) => {
    if (e.key === 'Enter' && input.trim()) {
      setLoading(true)
      setHasSearched(true)
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
        <div className='mb-8 shadow-md rounded-xl border border-slate-200/60 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden'>
          <div className='p-4'>
            <div className='relative'>
              <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-400 w-5 h-5' />
              <input
                type='text'
                placeholder='Search by name, username, bio, or location...'
                className='pl-12 pr-4 py-3 w-full border border-gray-200 dark:border-gray-600 rounded-lg text-base bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
                onChange={(e) => setInput(e.target.value)}
                value={input}
                onKeyUp={handleSearch}
              />
              {loading && (
                <Loader2 className='absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin' />
              )}
            </div>
            <p className='text-xs text-gray-400 mt-2 ml-1'>Press Enter to search</p>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <UserCardSkeleton key={i} />
            ))}
          </div>
        ) : hasSearched && users.length === 0 ? (
          <div className='text-center py-16 px-4'>
            <div className='w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-800 dark:to-slate-800 rounded-full flex items-center justify-center'>
              <UserSearch className='w-10 h-10 text-gray-400' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
              No results found
            </h3>
            <p className='text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto'>
              Try searching with different keywords or check your spelling
            </p>
          </div>
        ) : users.length > 0 ? (
          <>
            <p className='text-sm text-gray-500 dark:text-gray-400 mb-4'>
              Found {users.length} {users.length === 1 ? 'person' : 'people'}
            </p>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
              {users.map((user) => (
                <UserCard user={user} key={user.id} />
              ))}
            </div>
          </>
        ) : (
          <div className='text-center py-16 px-4'>
            <div className='w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center'>
              <Users className='w-10 h-10 text-blue-500' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
              Find your people
            </h3>
            <p className='text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto'>
              Search for friends, colleagues, or interesting people to connect with
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Discover
