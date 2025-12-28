import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Search, Filter, X, Calendar, Image, Video, MapPin, Hash, User, SlidersHorizontal, Loader2 } from 'lucide-react'
import PostCard from '../components/PostCard'
import Loading from '../components/Loading'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'

// Custom debounce function
const debounce = (func, wait) => {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

const AdvancedSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [suggestions, setSuggestions] = useState({ hashtags: [], users: [] })
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const searchRef = useRef(null)

  // Filter states
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    mediaFilter: '',
    fromUser: '',
    hashtag: '',
    location: '',
    sortBy: 'date',
    sortOrder: 'desc',
  })

  const mediaOptions = [
    { value: '', label: 'All Posts' },
    { value: 'any', label: 'Has Media' },
    { value: 'images', label: 'Has Images' },
    { value: 'video', label: 'Has Video' },
    { value: 'none', label: 'Text Only' },
  ]

  const sortOptions = [
    { value: 'date', label: 'Date' },
    { value: 'likes', label: 'Most Liked' },
    { value: 'comments', label: 'Most Commented' },
  ]

  // Fetch suggestions with debounce
  const fetchSuggestions = useMemo(
    () => debounce(async (searchQuery) => {
      if (searchQuery.length < 2) {
        setSuggestions({ hashtags: [], users: [] })
        return
      }
      try {
        const { data } = await api.get(`/api/post/search/suggestions?q=${encodeURIComponent(searchQuery)}`)
        if (data.success) {
          setSuggestions(data.data)
        }
      } catch (error) {
        // Silent fail
      }
    }, 300),
    []
  )

  // Perform search
  const performSearch = async () => {
    if (!query.trim() && !filters.fromUser && !filters.hashtag && !filters.location && !filters.mediaFilter) {
      toast.error('Please enter a search query or apply filters')
      return
    }

    setLoading(true)
    setHasSearched(true)
    setShowSuggestions(false)

    try {
      const params = new URLSearchParams()
      if (query.trim()) params.append('query', query.trim())
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)
      if (filters.mediaFilter) params.append('mediaFilter', filters.mediaFilter)
      if (filters.fromUser) params.append('fromUser', filters.fromUser)
      if (filters.hashtag) params.append('hashtag', filters.hashtag)
      if (filters.location) params.append('location', filters.location)
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)

      const { data } = await api.get(`/api/post/advanced-search?${params.toString()}`)
      if (data.success) {
        setPosts(data.data || [])
      } else {
        toast.error(data.message || 'Search failed')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    performSearch()
  }

  const handleQueryChange = (e) => {
    const value = e.target.value
    setQuery(value)
    fetchSuggestions(value)
    setShowSuggestions(true)
  }

  const handleSuggestionClick = (type, value) => {
    if (type === 'hashtag') {
      setFilters({ ...filters, hashtag: value })
      setQuery('')
    } else if (type === 'user') {
      setFilters({ ...filters, fromUser: value })
      setQuery('')
    }
    setShowSuggestions(false)
    setTimeout(() => performSearch(), 100)
  }

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      mediaFilter: '',
      fromUser: '',
      hashtag: '',
      location: '',
      sortBy: 'date',
      sortOrder: 'desc',
    })
  }

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== 'date' && v !== 'desc').length

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-search on initial load if query param exists
  useEffect(() => {
    if (searchParams.get('q')) {
      performSearch()
    }
  }, [])

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      <div className='max-w-4xl mx-auto p-4 md:p-6'>
        {/* Header */}
        <div className='mb-6'>
          <h1 className='text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2'>
            Advanced Search
          </h1>
          <p className='text-gray-600 dark:text-gray-400'>
            Find posts with powerful filters
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className='mb-4'>
          <div className='relative' ref={searchRef}>
            <div className='flex gap-2'>
              <div className='relative flex-1'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                <input
                  type='text'
                  placeholder='Search posts...'
                  value={query}
                  onChange={handleQueryChange}
                  onFocus={() => setShowSuggestions(true)}
                  className='w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
              <button
                type='button'
                onClick={() => setShowFilters(!showFilters)}
                className={`relative px-4 py-3 rounded-xl border transition-colors ${
                  showFilters || activeFiltersCount > 0
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <SlidersHorizontal className='w-5 h-5' />
                {activeFiltersCount > 0 && (
                  <span className='absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center'>
                    {activeFiltersCount}
                  </span>
                )}
              </button>
              <button
                type='submit'
                disabled={loading}
                className='px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50'
              >
                {loading ? <Loader2 className='w-5 h-5 animate-spin' /> : 'Search'}
              </button>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && (suggestions.hashtags.length > 0 || suggestions.users.length > 0) && (
              <div className='absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden'>
                {suggestions.hashtags.length > 0 && (
                  <div className='p-2'>
                    <p className='text-xs text-gray-500 dark:text-gray-400 px-2 mb-1'>Hashtags</p>
                    {suggestions.hashtags.map((tag, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestionClick('hashtag', tag)}
                        className='w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-left'
                      >
                        <Hash className='w-4 h-4 text-blue-500' />
                        <span className='text-gray-900 dark:text-white'>#{tag}</span>
                      </button>
                    ))}
                  </div>
                )}
                {suggestions.users.length > 0 && (
                  <div className='p-2 border-t border-gray-200 dark:border-gray-700'>
                    <p className='text-xs text-gray-500 dark:text-gray-400 px-2 mb-1'>Users</p>
                    {suggestions.users.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleSuggestionClick('user', user.username)}
                        className='w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-left'
                      >
                        <img
                          src={user.profilePicture || '/default-avatar.png'}
                          alt=''
                          className='w-8 h-8 rounded-full object-cover'
                        />
                        <div>
                          <p className='text-gray-900 dark:text-white font-medium'>{user.fullName}</p>
                          <p className='text-sm text-gray-500 dark:text-gray-400'>@{user.username}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </form>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className='flex flex-wrap gap-2 mb-4'>
            {filters.dateFrom && (
              <span className='inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm'>
                <Calendar className='w-3 h-3' />
                From: {filters.dateFrom}
                <button onClick={() => setFilters({ ...filters, dateFrom: '' })}>
                  <X className='w-3 h-3' />
                </button>
              </span>
            )}
            {filters.dateTo && (
              <span className='inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm'>
                <Calendar className='w-3 h-3' />
                To: {filters.dateTo}
                <button onClick={() => setFilters({ ...filters, dateTo: '' })}>
                  <X className='w-3 h-3' />
                </button>
              </span>
            )}
            {filters.mediaFilter && (
              <span className='inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-sm'>
                {filters.mediaFilter === 'images' && <Image className='w-3 h-3' />}
                {filters.mediaFilter === 'video' && <Video className='w-3 h-3' />}
                {mediaOptions.find(o => o.value === filters.mediaFilter)?.label}
                <button onClick={() => setFilters({ ...filters, mediaFilter: '' })}>
                  <X className='w-3 h-3' />
                </button>
              </span>
            )}
            {filters.fromUser && (
              <span className='inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm'>
                <User className='w-3 h-3' />
                @{filters.fromUser}
                <button onClick={() => setFilters({ ...filters, fromUser: '' })}>
                  <X className='w-3 h-3' />
                </button>
              </span>
            )}
            {filters.hashtag && (
              <span className='inline-flex items-center gap-1 px-3 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 rounded-full text-sm'>
                <Hash className='w-3 h-3' />
                #{filters.hashtag}
                <button onClick={() => setFilters({ ...filters, hashtag: '' })}>
                  <X className='w-3 h-3' />
                </button>
              </span>
            )}
            {filters.location && (
              <span className='inline-flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-sm'>
                <MapPin className='w-3 h-3' />
                {filters.location}
                <button onClick={() => setFilters({ ...filters, location: '' })}>
                  <X className='w-3 h-3' />
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className='text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            >
              Clear all
            </button>
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <div className='bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-6 mb-6'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='font-semibold text-gray-900 dark:text-white'>Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className='text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {/* Date Range */}
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  <Calendar className='w-4 h-4 inline mr-1' />
                  From Date
                </label>
                <input
                  type='date'
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className='w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  <Calendar className='w-4 h-4 inline mr-1' />
                  To Date
                </label>
                <input
                  type='date'
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className='w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              {/* Media Filter */}
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  <Image className='w-4 h-4 inline mr-1' />
                  Media Type
                </label>
                <select
                  value={filters.mediaFilter}
                  onChange={(e) => setFilters({ ...filters, mediaFilter: e.target.value })}
                  className='w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  {mediaOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* From User */}
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  <User className='w-4 h-4 inline mr-1' />
                  From User
                </label>
                <input
                  type='text'
                  placeholder='@username'
                  value={filters.fromUser}
                  onChange={(e) => setFilters({ ...filters, fromUser: e.target.value })}
                  className='w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              {/* Hashtag */}
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  <Hash className='w-4 h-4 inline mr-1' />
                  Hashtag
                </label>
                <input
                  type='text'
                  placeholder='#hashtag'
                  value={filters.hashtag}
                  onChange={(e) => setFilters({ ...filters, hashtag: e.target.value.replace('#', '') })}
                  className='w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              {/* Location */}
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  <MapPin className='w-4 h-4 inline mr-1' />
                  Location
                </label>
                <input
                  type='text'
                  placeholder='City or place name'
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className='w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              {/* Sort By */}
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  className='w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  Order
                </label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value })}
                  className='w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value='desc'>Newest First</option>
                  <option value='asc'>Oldest First</option>
                </select>
              </div>
            </div>

            <div className='flex justify-end gap-2 mt-4'>
              <button
                onClick={clearFilters}
                className='px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              >
                Clear Filters
              </button>
              <button
                onClick={() => { setShowFilters(false); performSearch(); }}
                className='px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100'
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <Loading height='40vh' />
        ) : (
          <div className='space-y-4'>
            {hasSearched && (
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                {posts.length} {posts.length === 1 ? 'result' : 'results'} found
              </p>
            )}
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            {hasSearched && posts.length === 0 && (
              <div className='text-center py-12'>
                <Search className='w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>No posts found</h3>
                <p className='text-gray-500 dark:text-gray-400'>
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdvancedSearch
