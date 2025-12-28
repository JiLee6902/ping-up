import React, { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Lock } from 'lucide-react'
import Loading from '../components/Loading'
import UserProfileInfo from '../components/UserProfileInfo'
import PostCard from '../components/PostCard'
import moment from 'moment'
import ProfileModal from '../components/ProfileModal'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'

const Profile = () => {
  const currentUser = useSelector((state) => state.user.value)
  const { profileId, username } = useParams()
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [likedPosts, setLikedPosts] = useState([])
  const [activeTab, setActiveTab] = useState('posts')
  const [showEdit, setShowEdit] = useState(false)
  const [canViewContent, setCanViewContent] = useState(true)
  const [hasPendingRequest, setHasPendingRequest] = useState(false)
  const [loadingLikes, setLoadingLikes] = useState(false)

  const fetchUser = async (id) => {
    try {
      const { data } = await api.post(`/api/user/profiles`, { userId: id })
      if (data.success) {
        const responseData = data.data || data
        setUser(responseData.user || responseData.profile)
        setPosts(responseData.posts || [])
        setCanViewContent(responseData.canViewContent !== false)
        setHasPendingRequest(responseData.hasPendingRequest || false)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const fetchUserByUsername = async (uname) => {
    try {
      const { data } = await api.post(`/api/user/profiles`, { username: uname })
      if (data.success) {
        const responseData = data.data || data
        setUser(responseData.user || responseData.profile)
        setPosts(responseData.posts || [])
        setCanViewContent(responseData.canViewContent !== false)
        setHasPendingRequest(responseData.hasPendingRequest || false)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const fetchLikedPosts = async (id) => {
    if (loadingLikes) return
    setLoadingLikes(true)
    try {
      const { data } = await api.get(`/api/post/liked/${id}`)
      if (data.success) {
        setLikedPosts(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch liked posts')
    }
    setLoadingLikes(false)
  }

  useEffect(() => {
    if (username) {
      fetchUserByUsername(username)
    } else {
      const userId = profileId || currentUser?.id || currentUser?._id
      if (userId) {
        fetchUser(userId)
      }
    }
  }, [profileId, username, currentUser])

  // Fetch liked posts when switching to likes tab
  useEffect(() => {
    if (activeTab === 'likes' && canViewContent) {
      const userId = profileId || currentUser?.id || currentUser?._id
      if (userId && likedPosts.length === 0) {
        fetchLikedPosts(userId)
      }
    }
  }, [activeTab, profileId, currentUser])

  return user ? (
    <div className='relative h-full overflow-y-scroll bg-gray-50 p-6'>
      <div className='max-w-3xl mx-auto'>
        {/* Profile Card */}
        <div className='bg-white rounded-2xl shadow overflow-hidden'>
          {/* Cover Photo */}
          <div className='h-40 md:h-56 bg-gradient-to-r from-gray-300 via-gray-200 to-gray-100'>
            {(user.coverPhoto || user.cover_photo) && <img src={user.coverPhoto || user.cover_photo} alt='' className='w-full h-full object-cover' />}
          </div>
          {/* User Info */}
          <UserProfileInfo
            user={user}
            posts={posts}
            profileId={profileId}
            setShowEdit={setShowEdit}
            hasPendingRequest={hasPendingRequest}
            onFollowChange={() => fetchUser(profileId || currentUser?.id || currentUser?._id)}
          />
        </div>

        {/* Private Account Message */}
        {!canViewContent && user.isPrivate && (
          <div className='mt-6 bg-white rounded-xl shadow p-8 text-center'>
            <Lock className='w-16 h-16 text-gray-400 mx-auto mb-4' />
            <h3 className='text-xl font-semibold text-gray-900 mb-2'>This Account is Private</h3>
            <p className='text-gray-500'>Follow this account to see their posts and photos.</p>
          </div>
        )}

        {/* Tabs - Only show if can view content */}
        {canViewContent && (
          <div className='mt-6'>
            <div className='bg-white rounded-xl shadow p-1 flex max-w-md mx-auto'>
              {["posts", "media", "likes"].map((tab) => (
                <button onClick={() => setActiveTab(tab)} key={tab} className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${activeTab === tab ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"}`}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            {/* Posts */}
            {activeTab === 'posts' && (
              <div className='mt-6 flex flex-col items-center gap-6'>
                {posts.length > 0 ? posts.map((post) => (
                  <PostCard
                    key={post.id || post._id}
                    post={post}
                    onPostRemoved={(postId) => setPosts(posts.filter(p => (p.id || p._id) !== postId))}
                    onPostUpdate={() => fetchUser(profileId || currentUser?.id || currentUser?._id)}
                  />
                )) : (
                  <p className='text-gray-500 py-8'>No posts yet</p>
                )}
              </div>
            )}

            {/* Media */}
            {activeTab === 'media' && (
              <div className='mt-6'>
                {posts.filter((post) => (post.imageUrls || post.image_urls || []).length > 0).length > 0 ? (
                  <div className='flex flex-wrap gap-1'>
                    {posts.filter((post) => (post.imageUrls || post.image_urls || []).length > 0).map((post) => {
                      const images = post.imageUrls || post.image_urls || []
                      return (
                        <React.Fragment key={post.id || post._id}>
                          {images.map((image, index) => (
                            <Link target='_blank' to={image} key={index} className='relative group'>
                              <img src={image} className='w-48 h-48 object-cover' alt="" />
                              <p className='absolute bottom-0 right-0 text-xs p-1 px-3 backdrop-blur-xl text-white opacity-0 group-hover:opacity-100 transition duration-300'>Posted {moment(post.createdAt).fromNow()}</p>
                            </Link>
                          ))}
                        </React.Fragment>
                      )
                    })}
                  </div>
                ) : (
                  <p className='text-gray-500 py-8 text-center'>No media yet</p>
                )}
              </div>
            )}

            {/* Likes */}
            {activeTab === 'likes' && (
              <div className='mt-6 flex flex-col items-center gap-6'>
                {loadingLikes ? (
                  <Loading height='20vh' />
                ) : likedPosts.length > 0 ? (
                  likedPosts.map((post) => (
                    <PostCard
                      key={post.id || post._id}
                      post={post}
                      onPostUpdate={() => fetchLikedPosts(profileId || currentUser?.id || currentUser?._id)}
                    />
                  ))
                ) : (
                  <p className='text-gray-500 py-8'>No liked posts yet</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {/* Edit Profile Modal */}
      {showEdit && <ProfileModal setShowEdit={setShowEdit} />}
    </div>
  ) : (<Loading />)
}

export default Profile
