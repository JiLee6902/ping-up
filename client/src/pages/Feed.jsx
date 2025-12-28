import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import Loading from '../components/Loading'
import StoriesBar from '../components/StoriesBar'
import PostCard from '../components/PostCard'
import RecentMessages from '../components/RecentMessages'
import AuthPromptModal from '../components/AuthPromptModal'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { RefreshCw, Loader2 } from 'lucide-react'

const LIMIT = 10

const Feed = () => {
  const navigate = useNavigate()
  const { accessToken } = useSelector((state) => state.auth)
  const isAuthenticated = !!accessToken

  // Auth prompt modal state
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [authPromptAction, setAuthPromptAction] = useState('interact')
  const [feeds, setFeeds] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  // Default to 'global' for unauthenticated users
  const [activeTab, setActiveTab] = useState(isAuthenticated ? 'foryou' : 'global')

  // Pull to refresh state
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const containerRef = useRef(null)
  const touchStartY = useRef(0)
  const lastScrollTop = useRef(0)

  const fetchFeeds = async (offset = 0, append = false) => {
    try {
      if (!append) setLoading(true)
      else setLoadingMore(true)

      const endpoint = activeTab === 'global' ? '/api/post/global' : '/api/post/feed'
      const { data } = await api.get(`${endpoint}?limit=${LIMIT}&offset=${offset}`)

      if (data.success) {
        const newPosts = data.data || data.posts || []
        if (append) {
          setFeeds((prev) => [...prev, ...newPosts])
        } else {
          setFeeds(newPosts)
        }
        setHasMore(newPosts.length === LIMIT)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
    setLoading(false)
    setLoadingMore(false)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchFeeds(0, false)
    setIsRefreshing(false)
    setPullDistance(0)
  }

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return
    fetchFeeds(feeds.length, true)
  }, [loadingMore, hasMore, feeds.length, activeTab])

  // Infinite scroll
  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target
    lastScrollTop.current = scrollTop

    // Load more when 200px from bottom
    if (scrollHeight - scrollTop - clientHeight < 200 && !loadingMore && hasMore) {
      loadMore()
    }
  }, [loadMore, loadingMore, hasMore])

  // Pull to refresh handlers
  const handleTouchStart = (e) => {
    if (lastScrollTop.current === 0) {
      touchStartY.current = e.touches[0].clientY
      setIsPulling(true)
    }
  }

  const handleTouchMove = (e) => {
    if (!isPulling || lastScrollTop.current > 0) return

    const currentY = e.touches[0].clientY
    const diff = currentY - touchStartY.current

    if (diff > 0 && diff < 150) {
      setPullDistance(diff)
    }
  }

  const handleTouchEnd = () => {
    if (pullDistance > 80 && !isRefreshing) {
      handleRefresh()
    } else {
      setPullDistance(0)
    }
    setIsPulling(false)
  }

  useEffect(() => {
    setFeeds([])
    setHasMore(true)
    fetchFeeds(0, false)
  }, [activeTab])

  return (
    <div
      ref={containerRef}
      className='h-full overflow-y-scroll no-scrollbar py-10 xl:pr-5 flex items-start justify-center xl:gap-8 dark:bg-gray-900'
      onScroll={handleScroll}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Stories and post list */}
      <div className='relative'>
        {/* Pull to refresh indicator */}
        <div
          className='absolute left-1/2 -translate-x-1/2 flex items-center justify-center transition-all duration-200'
          style={{
            top: -40 + pullDistance * 0.5,
            opacity: pullDistance > 30 ? 1 : pullDistance / 30
          }}
        >
          <div className={`p-2 bg-white dark:bg-gray-800 rounded-full shadow ${isRefreshing ? 'animate-spin' : ''}`}>
            {isRefreshing ? (
              <Loader2 className='w-5 h-5 text-blue-500' />
            ) : (
              <RefreshCw
                className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200`}
                style={{ transform: `rotate(${pullDistance * 2}deg)` }}
              />
            )}
          </div>
        </div>

        {isAuthenticated && <StoriesBar />}

        {/* Tabs and Auth buttons */}
        <div className='mx-4 mb-4'>
          {isAuthenticated ? (
            // Authenticated: Show tabs
            <div className='flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg'>
              <button
                onClick={() => setActiveTab('foryou')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'foryou'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                For You
              </button>
              <button
                onClick={() => setActiveTab('global')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'global'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Global
              </button>
            </div>
          ) : (
            // Not authenticated: Show Global Feed title only
            <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
              Global Feed
            </h2>
          )}
        </div>

        {loading ? (
          <Loading height='40vh' />
        ) : (
          <div className='p-4 space-y-6'>
            {feeds.length === 0 ? (
              <div className='text-center py-10 text-gray-500 dark:text-gray-400'>
                {activeTab === 'foryou'
                  ? 'No posts yet. Follow some people to see their posts!'
                  : 'No posts yet.'}
              </div>
            ) : (
              <>
                {feeds.map((post) => (
                  <PostCard
                    key={post.id || post._id}
                    post={post}
                    onPostRemoved={(postId) => setFeeds(feeds.filter(f => (f.id || f._id) !== postId))}
                    onPostUpdate={handleRefresh}
                    isAuthenticated={isAuthenticated}
                    onAuthPrompt={(action) => {
                      setAuthPromptAction(action)
                      setShowAuthPrompt(true)
                    }}
                  />
                ))}

                {/* Loading more indicator */}
                {loadingMore && (
                  <div className='flex justify-center py-4'>
                    <Loader2 className='w-6 h-6 text-blue-500 animate-spin' />
                  </div>
                )}

                {/* End of feed message */}
                {!hasMore && feeds.length > 0 && (
                  <div className='text-center py-6 text-gray-400 dark:text-gray-500 text-sm'>
                    You've reached the end
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className='max-xl:hidden sticky top-0'>
        <div className='max-w-xs bg-white dark:bg-gray-800 text-xs p-4 rounded-md inline-flex flex-col gap-2 shadow'>
          <h3 className='text-slate-800 dark:text-white font-semibold'>Sponsored</h3>
          <img src={assets.sponsored_img} className='w-75 h-50 rounded-md' alt="" />
          <p className='text-slate-600 dark:text-gray-300'>Email marketing</p>
          <p className='text-slate-400 dark:text-gray-500'>Supercharge your marketing with a powerful, easy-to-use platform built for results.</p>
        </div>
        {isAuthenticated && <RecentMessages />}
      </div>

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        isOpen={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        action={authPromptAction}
      />
    </div>
  )
}

export default Feed
