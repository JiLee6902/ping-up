import React, { useState, useEffect } from 'react'
import { X, Send, Trash2, CornerDownRight, Heart, Smile } from 'lucide-react'
import { useSelector } from 'react-redux'
import api from '../api/axios'
import toast from 'react-hot-toast'
import moment from 'moment'
import EmojiPicker from './EmojiPicker'

const CommentsModal = ({ postId, onClose, onCommentAdded }) => {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null) // { id, username }
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const currentUser = useSelector((state) => state.user.value)

  useEffect(() => {
    fetchComments()
  }, [postId])

  const fetchComments = async () => {
    try {
      const { data } = await api.get(`/api/comment/${postId}`)
      if (data.success) {
        setComments(data.comments)
      }
    } catch (error) {
      toast.error('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  const handleEmojiSelect = (emoji) => {
    setNewComment((prev) => prev + emoji)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim() || submitting) return

    setSubmitting(true)
    try {
      const payload = {
        postId,
        content: newComment.trim(),
      }

      if (replyingTo) {
        payload.parentId = replyingTo.id
      }

      const { data } = await api.post('/api/comment/add', payload)

      if (data.success) {
        if (replyingTo) {
          // Add reply to parent comment's children (supports nested)
          const addReplyToComment = (commentsList) => {
            return commentsList.map(c => {
              if (c.id === replyingTo.id) {
                return { ...c, children: [data.comment, ...(c.children || [])] }
              }
              if (c.children && c.children.length > 0) {
                return { ...c, children: addReplyToComment(c.children) }
              }
              return c
            })
          }
          setComments(addReplyToComment(comments))
        } else {
          setComments([data.comment, ...comments])
        }
        setNewComment('')
        setReplyingTo(null)
        setShowEmojiPicker(false)
        onCommentAdded && onCommentAdded()
        toast.success(data.message)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId, parentId = null) => {
    try {
      const { data } = await api.delete(`/api/comment/${commentId}`)
      if (data.success) {
        // Recursively remove comment from tree
        const removeComment = (commentsList) => {
          return commentsList
            .filter(c => c.id !== commentId)
            .map(c => ({
              ...c,
              children: c.children ? removeComment(c.children) : []
            }))
        }
        setComments(removeComment(comments))
        onCommentAdded && onCommentAdded()
        toast.success('Comment deleted')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('Failed to delete comment')
    }
  }

  const handleLike = async (commentId) => {
    try {
      const { data } = await api.post(`/api/comment/like/${commentId}`)
      if (data.success) {
        // Recursively update comment likes in tree
        const updateLikes = (commentsList) => {
          return commentsList.map(c => {
            if (c.id === commentId) {
              return {
                ...c,
                likesCount: data.data.likesCount,
                isLiked: data.data.isLiked
              }
            }
            if (c.children?.length) {
              return { ...c, children: updateLikes(c.children) }
            }
            return c
          })
        }
        setComments(updateLikes(comments))
      }
    } catch (error) {
      toast.error('Failed to like comment')
    }
  }

  const renderComment = (comment, isReply = false, parentId = null) => {
    const commentUser = comment.user || {}
    const commentUserId = commentUser.id || commentUser._id
    const profilePicture = commentUser.profilePicture || commentUser.profile_picture
    const fullName = commentUser.fullName || commentUser.full_name || 'User'
    const isOwner = currentUser?.id === commentUserId || currentUser?._id === commentUserId

    return (
      <div key={comment.id} className={`flex gap-3 ${isReply ? 'ml-8 mt-2' : ''}`}>
        {isReply && <CornerDownRight className='w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-2' />}
        <img
          src={profilePicture || '/default-avatar.png'}
          alt=""
          className='w-8 h-8 rounded-full object-cover flex-shrink-0'
        />
        <div className='flex-1 min-w-0'>
          <div className='bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2'>
            <div className='flex items-center gap-2'>
              <span className='font-medium text-sm dark:text-white'>{fullName}</span>
              <span className='text-xs text-gray-500 dark:text-gray-400'>
                {moment(comment.createdAt).fromNow()}
              </span>
            </div>
            <p className='text-sm text-gray-800 dark:text-gray-200 mt-1 break-words'>{comment.content}</p>
          </div>
          <div className='flex items-center gap-3 mt-1'>
            {!isOwner && (
              <button
                onClick={() => handleLike(comment.id)}
                className={`text-xs flex items-center gap-1 ${comment.isLiked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-red-500'}`}
              >
                <Heart className={`w-3 h-3 ${comment.isLiked ? 'fill-red-500' : ''}`} />
                {comment.likesCount > 0 && <span>{comment.likesCount}</span>}
              </button>
            )}
            {isOwner && comment.likesCount > 0 && (
              <span className='text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1'>
                <Heart className='w-3 h-3 text-red-500 fill-red-500' />
                {comment.likesCount}
              </span>
            )}
            <button
              onClick={() => setReplyingTo({ id: comment.id, username: commentUser.username || fullName, parentId: parentId })}
              className='text-xs text-blue-500 hover:text-blue-600'
            >
              Reply
            </button>
            {isOwner && (
              <button
                onClick={() => handleDelete(comment.id, parentId)}
                className='text-xs text-red-500 hover:text-red-600 flex items-center gap-1'
              >
                <Trash2 className='w-3 h-3' />
                Delete
              </button>
            )}
          </div>

          {/* Render replies */}
          {comment.children && comment.children.length > 0 && (
            <div className='mt-2'>
              {comment.children.map(child => renderComment(child, true, comment.id))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className='fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4' onClick={onClose}>
      <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-lg max-h-[80vh] flex flex-col' onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b dark:border-gray-700'>
          <h2 className='text-lg font-semibold dark:text-white'>Comments</h2>
          <button onClick={onClose} className='p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full'>
            <X className='w-5 h-5 dark:text-white' />
          </button>
        </div>

        {/* Comments List */}
        <div className='flex-1 overflow-y-auto p-4 space-y-4'>
          {loading ? (
            <div className='text-center text-gray-500 dark:text-gray-400 py-8'>Loading...</div>
          ) : comments.length === 0 ? (
            <div className='text-center text-gray-500 dark:text-gray-400 py-8'>No comments yet. Be the first to comment!</div>
          ) : (
            comments.map((comment) => renderComment(comment))
          )}
        </div>

        {/* Reply indicator */}
        {replyingTo && (
          <div className='px-4 py-2 bg-blue-50 dark:bg-blue-900/30 flex items-center justify-between'>
            <span className='text-sm text-blue-600 dark:text-blue-400'>
              Replying to @{replyingTo.username}
            </span>
            <button onClick={() => setReplyingTo(null)} className='text-blue-600 dark:text-blue-400 hover:text-blue-700'>
              <X className='w-4 h-4' />
            </button>
          </div>
        )}

        {/* Comment Input */}
        <form onSubmit={handleSubmit} className='p-4 border-t dark:border-gray-700'>
          <div className='flex gap-2 items-center'>
            {/* Emoji Button */}
            <div className='relative'>
              <button
                type='button'
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className='p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition'
              >
                <Smile className='w-5 h-5' />
              </button>
              {showEmojiPicker && (
                <EmojiPicker
                  onEmojiSelect={handleEmojiSelect}
                  onClose={() => setShowEmojiPicker(false)}
                />
              )}
            </div>
            <input
              type='text'
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyingTo ? 'Write a reply...' : 'Write a comment...'}
              className='flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-full focus:outline-none focus:border-gray-400 dark:focus:border-gray-500'
              maxLength={500}
            />
            <button
              type='submit'
              disabled={!newComment.trim() || submitting}
              className='p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <Send className='w-5 h-5' />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CommentsModal
