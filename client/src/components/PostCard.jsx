import React, { useState, useRef } from 'react'
import { BadgeCheck, Heart, MessageCircle, Share2, Repeat2, MoreHorizontal, Trash2, Edit2, X, Link2, Bookmark, ImagePlus, Flag, MapPin } from 'lucide-react'
import moment from 'moment'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import api from '../api/axios'
import toast from 'react-hot-toast'
import CommentsModal from './CommentsModal'
import ReportModal from './ReportModal'
import ImageLightbox from './ImageLightbox'

const PostCard = ({ post, onPostUpdate, onPostRemoved, onBookmarkChange, isAuthenticated = true, onAuthPrompt }) => {
  const navigate = useNavigate()

  // Support both camelCase and snake_case
  const content = post.content || ''

  // Function to render content with clickable hashtags and mentions
  const renderContentWithLinks = (text) => {
    if (!text) return null
    // Match both hashtags and mentions
    const pattern = /(#\w+|@\w+)/g
    const parts = text.split(pattern)
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        return (
          <span
            key={index}
            className='text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline'
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/search?q=${encodeURIComponent(part)}`)
            }}
          >
            {part}
          </span>
        )
      }
      if (part.startsWith('@')) {
        const username = part.substring(1)
        return (
          <span
            key={index}
            className='text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline'
            onClick={(e) => {
              e.stopPropagation()
              // Navigate to user profile by username
              navigate(`/profile/username/${username}`)
            }}
          >
            {part}
          </span>
        )
      }
      return part
    })
  }
  const imageUrls = post.imageUrls || post.image_urls || []
  const postUser = post.user || {}
  const postUserId = postUser.id || postUser._id
  const postId = post.id || post._id
  const profilePicture = postUser.profilePicture || postUser.profile_picture
  const fullName = postUser.fullName || postUser.full_name || 'User'
  const postType = post.postType || post.post_type
  const postLocation = post.location
  const videoUrl = post.videoUrl || post.video_url

  // Repost data
  const originalPost = post.originalPost || post.original_post
  const isRepost = postType === 'repost'

  // If it's a repost but originalPost is missing, don't render
  if (isRepost && !originalPost) {
    return null
  }

  const [likesCount, setLikesCount] = useState(post.likesCount ?? post.likes_count ?? 0)
  const [isLiked, setIsLiked] = useState(post.isLiked ?? false)
  const [commentsCount, setCommentsCount] = useState(post.commentsCount ?? post.comments_count ?? 0)
  const [sharesCount, setSharesCount] = useState(post.sharesCount ?? post.shares_count ?? 0)
  const [isReposted, setIsReposted] = useState(post.isReposted ?? false)
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked ?? false)
  const [showComments, setShowComments] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editContent, setEditContent] = useState(content)
  const [editImages, setEditImages] = useState(imageUrls)
  const [removedImages, setRemovedImages] = useState([])
  const [newImages, setNewImages] = useState([])
  const [newImagePreviews, setNewImagePreviews] = useState([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const editFileInputRef = useRef(null)
  const currentUser = useSelector((state) => state.user.value)

  const isOwnPost = currentUser?.id === postUserId || currentUser?._id === postUserId

  const handleLike = async () => {
    if (!isAuthenticated) {
      onAuthPrompt?.('like')
      return
    }
    try {
      const { data } = await api.post(`/api/post/like`, { postId })

      if (data.success) {
        toast.success(data.message)
        const responseData = data.data || data
        setLikesCount(responseData.likesCount ?? likesCount)
        setIsLiked(responseData.isLiked ?? !isLiked)
      } else {
        toast(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleRepost = async () => {
    if (!isAuthenticated) {
      onAuthPrompt?.('share')
      return
    }
    try {
      const targetPostId = isRepost ? (originalPost._id || originalPost.id) : postId
      const endpoint = isReposted ? '/api/post/unrepost' : '/api/post/repost'
      const { data } = await api.post(endpoint, { postId: targetPostId })

      if (data.success) {
        toast.success(data.message)
        if (isReposted) {
          // If this is a repost card and user unreposts, remove the card from feed
          if (isRepost) {
            onPostRemoved && onPostRemoved(postId)
          } else {
            setSharesCount(prev => Math.max(0, prev - 1))
            setIsReposted(false)
          }
        } else {
          setSharesCount(prev => prev + 1)
          setIsReposted(true)
        }
        onPostUpdate && onPostUpdate()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }
  }

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      onAuthPrompt?.('bookmark')
      return
    }
    try {
      const { data } = await api.post('/api/post/bookmark', { postId })
      if (data.success) {
        toast.success(data.message)
        setIsBookmarked(data.data.isBookmarked)
        onBookmarkChange && onBookmarkChange(postId, data.data.isBookmarked)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa bài viết này?')) return

    setIsDeleting(true)
    try {
      const { data } = await api.delete(`/api/post/${postId}`)
      if (data.success) {
        toast.success('Đã xóa bài viết')
        onPostRemoved && onPostRemoved(postId)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa bài viết')
    }
    setIsDeleting(false)
    setShowMenu(false)
  }

  const handleEditImageRemove = (imgUrl) => {
    setEditImages(prev => prev.filter(url => url !== imgUrl))
    setRemovedImages(prev => [...prev, imgUrl])
  }

  const handleNewImageSelect = (e) => {
    const files = Array.from(e.target.files)
    const totalImages = editImages.length + newImages.length + files.length

    if (totalImages > 4) {
      toast.error('Tối đa 4 ảnh cho mỗi bài viết')
      return
    }

    setNewImages(prev => [...prev, ...files])

    // Create previews
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewImagePreviews(prev => [...prev, reader.result])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index))
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleEdit = async () => {
    const totalImages = editImages.length + newImages.length
    if (!editContent.trim() && totalImages === 0) {
      toast.error('Bài viết phải có nội dung hoặc ảnh')
      return
    }

    setIsEditing(true)
    try {
      const formData = new FormData()
      formData.append('content', editContent)
      formData.append('removedImages', JSON.stringify(removedImages))

      newImages.forEach(file => {
        formData.append('images', file)
      })

      const { data } = await api.put(`/api/post/${postId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (data.success) {
        toast.success('Đã cập nhật bài viết')
        setShowEditModal(false)
        setRemovedImages([])
        setNewImages([])
        setNewImagePreviews([])
        onPostUpdate && onPostUpdate()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật bài viết')
    }
    setIsEditing(false)
  }

  const openEditModal = () => {
    setEditContent(content)
    setEditImages(imageUrls)
    setRemovedImages([])
    setNewImages([])
    setNewImagePreviews([])
    setShowEditModal(true)
    setShowMenu(false)
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/post/${postId}`
    navigator.clipboard.writeText(url)
    toast.success('Đã copy link')
    setShowMenu(false)
  }

  const handleCommentAdded = () => {
    setCommentsCount(prev => prev + 1)
  }

  // Render the actual post content (used for both original and reposted content)
  const renderPostContent = (postData, isEmbedded = false) => {
    const contentText = postData.content || ''
    const images = postData.imageUrls || postData.image_urls || []
    const embeddedVideoUrl = postData.videoUrl || postData.video_url
    const user = postData.user || {}
    const userId = user.id || user._id
    const userProfilePic = user.profilePicture || user.profile_picture
    const userFullName = user.fullName || user.full_name || 'User'
    const embeddedLocation = postData.location

    return (
      <div className={isEmbedded ? 'border border-gray-200 dark:border-gray-700 rounded-lg p-3 mt-2' : ''}>
        {/* User Info */}
        <div onClick={() => navigate('/profile/' + userId)} className='inline-flex items-center gap-3 cursor-pointer'>
          {userProfilePic && <img src={userProfilePic} alt="" className='w-10 h-10 rounded-full object-cover shadow' />}
          <div>
            <div className='flex items-center space-x-1'>
              <span className='dark:text-white'>{userFullName}</span>
              <BadgeCheck className='w-4 h-4 text-blue-500' />
            </div>
            <div className='text-gray-500 dark:text-gray-400 text-sm'>@{user.username} • {moment(postData.createdAt).fromNow()}</div>
          </div>
        </div>

        {/* Location */}
        {embeddedLocation && (
          <div className='flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-1'>
            <MapPin className='w-3.5 h-3.5 text-red-500' />
            <span>{embeddedLocation}</span>
          </div>
        )}

        {/* Content */}
        {contentText && <div className='text-gray-800 dark:text-gray-200 text-sm whitespace-pre-line mt-3'>{renderContentWithLinks(contentText)}</div>}

        {/* Images */}
        {images.length > 0 && (
          <div className='grid grid-cols-2 gap-2 mt-3'>
            {images.map((img, index) => (
              <img src={img} key={index} className={`w-full h-48 object-cover rounded-lg ${images.length === 1 && 'col-span-2 h-auto'}`} alt="" />
            ))}
          </div>
        )}

        {/* Video */}
        {embeddedVideoUrl && (
          <div className='mt-3'>
            <video
              src={embeddedVideoUrl}
              controls
              className='w-full rounded-lg max-h-64 object-contain bg-black'
              preload='metadata'
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className='bg-white dark:bg-gray-800 rounded-xl shadow p-4 space-y-4 w-full max-w-2xl relative'>
      {/* Menu Button */}
      <div className='absolute top-4 right-4'>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className='p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors'
        >
          <MoreHorizontal className='w-5 h-5 text-gray-500 dark:text-gray-400' />
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <>
            <div className='fixed inset-0 z-10' onClick={() => setShowMenu(false)} />
            <div className='absolute right-0 top-8 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 z-20 min-w-[160px]'>
              <button
                onClick={handleCopyLink}
                className='w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2'
              >
                <Link2 className='w-4 h-4' /> Copy link
              </button>
              {isOwnPost && !isRepost && (
                <>
                  <button
                    onClick={openEditModal}
                    className='w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2'
                  >
                    <Edit2 className='w-4 h-4' /> Chỉnh sửa
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className='w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2'
                  >
                    <Trash2 className='w-4 h-4' /> {isDeleting ? 'Đang xóa...' : 'Xóa'}
                  </button>
                </>
              )}
              {isOwnPost && isRepost && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className='w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2'
                >
                  <Trash2 className='w-4 h-4' /> {isDeleting ? 'Đang xóa...' : 'Xóa repost'}
                </button>
              )}
              {!isOwnPost && (
                <button
                  onClick={() => { setShowReportModal(true); setShowMenu(false); }}
                  className='w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2'
                >
                  <Flag className='w-4 h-4' /> Report
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {isRepost ? (
        <>
          {/* Repost Header */}
          <div className='flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm'>
            <Repeat2 className='w-4 h-4' />
            <span onClick={() => navigate('/profile/' + postUserId)} className='cursor-pointer hover:underline'>
              {fullName}
            </span>
            <span>shared this</span>
            <span>• {moment(post.createdAt).fromNow()}</span>
          </div>

          {/* Original Post Content */}
          {originalPost && renderPostContent(originalPost, true)}
        </>
      ) : (
        <>
          {/* User Info */}
          <div onClick={() => navigate('/profile/' + postUserId)} className='inline-flex items-center gap-3 cursor-pointer'>
            {profilePicture && <img src={profilePicture} alt="" className='w-10 h-10 rounded-full object-cover shadow' />}
            <div>
              <div className='flex items-center space-x-1'>
                <span className='dark:text-white'>{fullName}</span>
                <BadgeCheck className='w-4 h-4 text-blue-500' />
              </div>
              <div className='text-gray-500 dark:text-gray-400 text-sm'>@{postUser.username} • {moment(post.createdAt).fromNow()}</div>
            </div>
          </div>

          {/* Location */}
          {postLocation && (
            <div className='flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-1'>
              <MapPin className='w-3.5 h-3.5 text-red-500' />
              <span>{postLocation}</span>
            </div>
          )}

          {/* Content */}
          {content && <div className='text-gray-800 dark:text-gray-200 text-sm whitespace-pre-line'>{renderContentWithLinks(content)}</div>}

          {/* Images */}
          {imageUrls.length > 0 && (
            <div className='grid grid-cols-2 gap-2'>
              {imageUrls.map((img, index) => (
                <img
                  src={img}
                  key={index}
                  className={`w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition ${imageUrls.length === 1 && 'col-span-2 h-auto'}`}
                  alt=""
                  onClick={() => { setLightboxIndex(index); setLightboxOpen(true); }}
                />
              ))}
            </div>
          )}

          {/* Video */}
          {videoUrl && (
            <div className='mt-2'>
              <video
                src={videoUrl}
                controls
                className='w-full rounded-lg max-h-96 object-contain bg-black'
                preload='metadata'
              />
            </div>
          )}
        </>
      )}

      {/* Actions */}
      <div className='flex items-center justify-between text-gray-600 dark:text-gray-400 text-sm pt-3 border-t border-gray-200 dark:border-gray-700'>
        <div className='flex items-center gap-1'>
          {/* Like Button */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
              isLiked
                ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-500'
            }`}
          >
            <Heart
              className={`w-[18px] h-[18px] transition-transform duration-200 ${
                isLiked ? 'fill-red-500 scale-110' : ''
              } active:scale-125`}
            />
            <span className='font-medium'>{likesCount}</span>
          </button>

          {/* Comment Button */}
          <button
            onClick={() => {
              if (!isAuthenticated) {
                onAuthPrompt?.('comment')
                return
              }
              setShowComments(true)
            }}
            className='flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-500 transition-all duration-200 cursor-pointer'
          >
            <MessageCircle className='w-[18px] h-[18px]' />
            <span className='font-medium'>{commentsCount}</span>
          </button>

          {/* Repost Button */}
          <button
            onClick={handleRepost}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
              isReposted
                ? 'text-green-500 bg-green-50 dark:bg-green-900/20'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-green-500'
            }`}
          >
            <Share2 className={`w-[18px] h-[18px] ${isReposted ? 'fill-green-500' : ''}`} />
            <span className='font-medium'>{sharesCount}</span>
          </button>
        </div>

        {/* Bookmark Button */}
        <button
          onClick={handleBookmark}
          className={`p-2 rounded-full transition-all duration-200 cursor-pointer ${
            isBookmarked
              ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-yellow-500'
          }`}
        >
          <Bookmark className={`w-[18px] h-[18px] ${isBookmarked ? 'fill-yellow-500' : ''}`} />
        </button>
      </div>

      {/* Comments Modal */}
      {showComments && (
        <CommentsModal
          postId={isRepost ? (originalPost._id || originalPost.id) : postId}
          onClose={() => setShowComments(false)}
          onCommentAdded={handleCommentAdded}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
          <div className='absolute inset-0 bg-black/50' onClick={() => setShowEditModal(false)} />
          <div className='relative bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold'>Chỉnh sửa bài viết</h3>
              <button onClick={() => setShowEditModal(false)} className='p-1 hover:bg-gray-100 rounded-full'>
                <X className='w-5 h-5' />
              </button>
            </div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className='w-full border border-gray-300 rounded-lg p-3 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='Nội dung bài viết...'
            />

            {/* Existing Images */}
            {editImages.length > 0 && (
              <div className='mt-4'>
                <p className='text-sm text-gray-600 mb-2'>Ảnh hiện tại:</p>
                <div className='grid grid-cols-2 gap-2'>
                  {editImages.map((img, index) => (
                    <div key={index} className='relative'>
                      <img src={img} className='w-full h-32 object-cover rounded-lg' alt='' />
                      <button
                        onClick={() => handleEditImageRemove(img)}
                        className='absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600'
                      >
                        <X className='w-4 h-4' />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images Preview */}
            {newImagePreviews.length > 0 && (
              <div className='mt-4'>
                <p className='text-sm text-gray-600 mb-2'>Ảnh mới:</p>
                <div className='grid grid-cols-2 gap-2'>
                  {newImagePreviews.map((preview, index) => (
                    <div key={index} className='relative'>
                      <img src={preview} className='w-full h-32 object-cover rounded-lg' alt='' />
                      <button
                        onClick={() => handleRemoveNewImage(index)}
                        className='absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600'
                      >
                        <X className='w-4 h-4' />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Image Button */}
            {(editImages.length + newImages.length) < 4 && (
              <div className='mt-4'>
                <input
                  type='file'
                  ref={editFileInputRef}
                  onChange={handleNewImageSelect}
                  accept='image/*'
                  multiple
                  className='hidden'
                />
                <button
                  onClick={() => editFileInputRef.current?.click()}
                  className='flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50'
                >
                  <ImagePlus className='w-5 h-5' />
                  Thêm ảnh
                </button>
                <p className='text-xs text-gray-500 mt-1'>
                  Còn {4 - editImages.length - newImages.length} ảnh có thể thêm
                </p>
              </div>
            )}

            <div className='flex justify-end gap-2 mt-4'>
              <button
                onClick={() => setShowEditModal(false)}
                className='px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg'
              >
                Hủy
              </button>
              <button
                onClick={handleEdit}
                disabled={isEditing}
                className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50'
              >
                {isEditing ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          type='post'
          targetId={postId}
          targetName={content?.substring(0, 50) || 'This post'}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* Image Lightbox */}
      {lightboxOpen && imageUrls.length > 0 && (
        <ImageLightbox
          images={imageUrls}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  )
}

export default PostCard
