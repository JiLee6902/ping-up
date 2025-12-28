import React, { useState, useEffect } from 'react'
import { Bookmark } from 'lucide-react'
import api from '../api/axios'
import PostCard from '../components/PostCard'

const Saved = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchSavedPosts = async () => {
    try {
      const { data } = await api.get('/api/post/saved')
      if (data.success) {
        setPosts(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch saved posts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSavedPosts()
  }, [])

  const handlePostRemoved = (postId) => {
    setPosts(prev => prev.filter(p => (p.id || p._id) !== postId))
  }

  const handlePostUnsaved = (postId) => {
    // Remove post from list when unsaved
    setPosts(prev => prev.filter(p => (p.id || p._id) !== postId))
  }

  return (
    <div className='h-full overflow-y-auto bg-slate-50 dark:bg-gray-900'>
      <div className='max-w-2xl mx-auto p-4'>
        {/* Header */}
        <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-6'>Saved Posts</h1>

        {/* Content */}
        {loading ? (
          <div className='flex justify-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white'></div>
          </div>
        ) : posts.length === 0 ? (
          <div className='text-center py-12'>
            <Bookmark className='w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4' />
            <p className='text-gray-500 dark:text-gray-400'>No saved posts yet</p>
            <p className='text-gray-400 dark:text-gray-500 text-sm mt-1'>Posts you save will appear here</p>
          </div>
        ) : (
          <div className='space-y-4'>
            {posts.map((post) => (
              <PostCard
                key={post.id || post._id}
                post={post}
                onPostUpdate={fetchSavedPosts}
                onPostRemoved={handlePostRemoved}
                onBookmarkChange={(postId, isBookmarked) => {
                  if (!isBookmarked) {
                    handlePostUnsaved(postId)
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Saved
