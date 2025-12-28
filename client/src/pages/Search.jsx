import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search as SearchIcon, X, SlidersHorizontal } from 'lucide-react'
import api from '../api/axios'
import PostCard from '../components/PostCard'
import Loading from '../components/Loading'

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const searchPosts = async (searchQuery) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    setHasSearched(true)
    try {
      const { data } = await api.get(`/api/post/search?q=${encodeURIComponent(searchQuery)}`)
      if (data.success) {
        setPosts(data.data)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  // Search when URL query changes
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) {
      setQuery(q)
      searchPosts(q)
    }
  }, [searchParams])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      setSearchParams({ q: query })
      searchPosts(query)
    }
  }

  const handleClear = () => {
    setQuery('')
    setSearchParams({})
    setPosts([])
    setHasSearched(false)
  }

  const refreshPosts = () => {
    if (query.trim()) {
      searchPosts(query)
    }
  }

  return (
    <div className='h-full overflow-y-auto bg-slate-50 dark:bg-gray-900'>
      <div className='max-w-2xl mx-auto p-4'>
        {/* Search Header */}
        <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-6'>Search</h1>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className='mb-4'>
          <div className='relative'>
            <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
            <input
              type='text'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search posts, hashtags...'
              className='w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
            {query && (
              <button
                type='button'
                onClick={handleClear}
                className='absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full'
              >
                <X className='w-4 h-4 text-gray-400' />
              </button>
            )}
          </div>
        </form>

        {/* Advanced Search Link */}
        <div className='mb-6'>
          <Link
            to='/advanced-search'
            className='inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'
          >
            <SlidersHorizontal className='w-4 h-4' />
            Advanced Search with filters
          </Link>
        </div>

        {/* Search Results */}
        {loading ? (
          <div className='flex justify-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white'></div>
          </div>
        ) : hasSearched ? (
          <>
            {/* Results Count */}
            <p className='text-sm text-gray-500 dark:text-gray-400 mb-4'>
              {posts.length} {posts.length === 1 ? 'result' : 'results'} for "{query}"
            </p>

            {/* Posts */}
            {posts.length === 0 ? (
              <div className='text-center py-12'>
                <SearchIcon className='w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4' />
                <p className='text-gray-500 dark:text-gray-400'>No posts found</p>
                <p className='text-gray-400 dark:text-gray-500 text-sm mt-1'>Try a different search term</p>
              </div>
            ) : (
              <div className='space-y-4'>
                {posts.map((post) => (
                  <PostCard
                    key={post.id || post._id}
                    post={post}
                    onPostUpdate={refreshPosts}
                    onPostRemoved={(id) => setPosts(prev => prev.filter(p => (p.id || p._id) !== id))}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className='text-center py-12'>
            <SearchIcon className='w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4' />
            <p className='text-gray-500 dark:text-gray-400'>Search for posts or hashtags</p>
            <p className='text-gray-400 dark:text-gray-500 text-sm mt-1'>Try searching for #hashtags or keywords</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Search
