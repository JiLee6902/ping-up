import { BadgeCheck, ChevronLeft, ChevronRight, Heart, MoreVertical, Trash2, X } from 'lucide-react'
import React, { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import api from '../api/axios'
import toast from 'react-hot-toast'
import moment from 'moment'

const StoryViewer = ({ storyGroup, onClose, onDelete }) => {
    const currentUser = useSelector((state) => state.user.value)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [progress, setProgress] = useState(0)
    const [showMenu, setShowMenu] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [likedStories, setLikedStories] = useState({}) // Track liked state per story
    const [likesCounts, setLikesCounts] = useState({}) // Track likes count per story
    const [showLikesModal, setShowLikesModal] = useState(false)
    const [likers, setLikers] = useState([])
    const [loadingLikes, setLoadingLikes] = useState(false)

    const stories = storyGroup?.stories || []
    const user = storyGroup?.user || {}
    const currentStory = stories[currentIndex]

    // Handle both camelCase and snake_case
    const mediaType = currentStory?.mediaType || currentStory?.media_type
    const mediaUrl = currentStory?.mediaUrl || currentStory?.media_url
    const backgroundColor = currentStory?.backgroundColor || currentStory?.background_color
    const profilePicture = user?.profilePicture || user?.profile_picture
    const fullName = user?.fullName || user?.full_name

    const isOwner = currentUser?.id === user?.id

    // Initialize liked state from story data
    useEffect(() => {
        const initialLiked = {}
        const initialCounts = {}
        stories.forEach(story => {
            initialLiked[story.id] = story.isLiked || false
            initialCounts[story.id] = story.likesCount || 0
        })
        setLikedStories(initialLiked)
        setLikesCounts(initialCounts)
    }, [stories])

    // Mark story as viewed when viewing
    useEffect(() => {
        if (!currentStory || isOwner) return // Don't mark own stories as viewed

        const markAsViewed = async () => {
            try {
                await api.post(`/api/story/view/${currentStory.id}`)
            } catch (error) {
                // Silently fail - viewing should not block user
                console.error('Failed to mark story as viewed:', error)
            }
        }

        markAsViewed()
    }, [currentStory?.id, isOwner])

    const currentLikesCount = likesCounts[currentStory?.id] || 0
    const isCurrentLiked = likedStories[currentStory?.id] || false

    // Go to next story
    const goNext = useCallback(() => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(prev => prev + 1)
            setProgress(0)
        } else {
            onClose()
        }
    }, [currentIndex, stories.length, onClose])

    // Go to previous story
    const goPrev = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1)
            setProgress(0)
        }
    }, [currentIndex])

    // Timer for auto-advance
    useEffect(() => {
        if (!currentStory || mediaType === 'video' || isPaused) return

        setProgress(0)
        const duration = 5000 // 5 seconds per story
        const interval = 50
        let elapsed = 0

        const progressInterval = setInterval(() => {
            elapsed += interval
            setProgress((elapsed / duration) * 100)

            if (elapsed >= duration) {
                goNext()
            }
        }, interval)

        return () => clearInterval(progressInterval)
    }, [currentIndex, currentStory, mediaType, isPaused, goNext])

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight') goNext()
            else if (e.key === 'ArrowLeft') goPrev()
            else if (e.key === 'Escape') onClose()
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [goNext, goPrev, onClose])

    const handleDelete = async () => {
        try {
            const { data } = await api.delete(`/api/story/${currentStory.id}`)
            if (data.success) {
                toast.success('Story deleted')
                onDelete && onDelete(currentStory.id)

                // If this was the last story, close viewer
                if (stories.length === 1) {
                    onClose()
                } else if (currentIndex >= stories.length - 1) {
                    setCurrentIndex(prev => prev - 1)
                }
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to delete story')
        }
        setShowMenu(false)
    }

    const handleLike = async (e) => {
        e.stopPropagation()
        if (isOwner) return

        try {
            const { data } = await api.post(`/api/story/like/${currentStory.id}`)
            if (data.success) {
                setLikedStories(prev => ({
                    ...prev,
                    [currentStory.id]: data.data.liked
                }))
                setLikesCounts(prev => ({
                    ...prev,
                    [currentStory.id]: data.data.likesCount
                }))
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to like story')
        }
    }

    const fetchLikes = async () => {
        if (!isOwner) return

        setLoadingLikes(true)
        try {
            const { data } = await api.get(`/api/story/likes/${currentStory.id}`)
            if (data.success) {
                setLikers(data.data)
                setShowLikesModal(true)
                setIsPaused(true) // Pause while viewing likes
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to load likes')
        }
        setLoadingLikes(false)
    }

    // Handle click on left/right side of screen
    const handleScreenClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const clickX = e.clientX - rect.left
        const width = rect.width

        if (clickX < width / 3) {
            goPrev()
        } else if (clickX > (width * 2) / 3) {
            goNext()
        }
    }

    if (!currentStory) return null

    const renderContent = () => {
        switch (mediaType) {
            case 'image':
                return (
                    <img src={mediaUrl} alt="" className='max-w-full max-h-full object-contain' />
                )
            case 'video':
                return (
                    <video
                        onEnded={goNext}
                        src={mediaUrl}
                        className='max-w-full max-h-full object-contain'
                        controls
                        autoPlay
                    />
                )
            case 'text':
                return (
                    <div className='w-full h-full flex items-center justify-center p-8 text-white text-2xl text-center'>
                        {currentStory.content}
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <div
            className='fixed inset-0 bg-black/95 z-[100] flex items-center justify-center'
            onClick={handleScreenClick}
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
        >
            {/* Story Container */}
            <div className='relative w-full max-w-md h-full max-h-[90vh] mx-auto' onClick={e => e.stopPropagation()}>
                {/* Progress Bars */}
                <div className='absolute top-2 left-2 right-2 z-20 flex gap-1'>
                    {stories.map((_, index) => (
                        <div key={index} className='flex-1 h-1 bg-white/30 rounded-full overflow-hidden'>
                            <div
                                className='h-full bg-white transition-all duration-100 ease-linear rounded-full'
                                style={{
                                    width: index < currentIndex
                                        ? '100%'
                                        : index === currentIndex
                                            ? `${progress}%`
                                            : '0%'
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div className='absolute top-6 left-2 right-2 z-20 flex items-center justify-between'>
                    {/* User Info */}
                    <div className='flex items-center gap-3 p-2 rounded-lg bg-black/30 backdrop-blur-sm'>
                        <img src={profilePicture} alt="" className='w-10 h-10 rounded-full object-cover ring-2 ring-white/50' />
                        <div>
                            <div className='flex items-center gap-1.5 text-white font-semibold'>
                                <span>{fullName}</span>
                                <BadgeCheck size={16} className='text-blue-400' />
                            </div>
                            <p className='text-white/60 text-xs'>{moment(currentStory.createdAt).fromNow()}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className='flex items-center gap-1'>
                        {isOwner && (
                            <div className='relative'>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
                                    className='text-white p-2 hover:bg-white/10 rounded-full transition cursor-pointer'
                                >
                                    <MoreVertical className='w-5 h-5' />
                                </button>
                                {showMenu && (
                                    <div className='absolute right-0 mt-1 bg-white rounded-lg shadow-lg py-1 min-w-32'>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete() }}
                                            className='w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer'
                                        >
                                            <Trash2 className='w-4 h-4' /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        <button
                            onClick={(e) => { e.stopPropagation(); onClose() }}
                            className='text-white p-2 hover:bg-white/10 rounded-full transition cursor-pointer'
                        >
                            <X className='w-6 h-6' />
                        </button>
                    </div>
                </div>

                {/* Story Content */}
                <div
                    className='w-full h-full flex items-center justify-center rounded-xl overflow-hidden'
                    style={{ backgroundColor: mediaType === 'text' ? backgroundColor : '#000' }}
                    onClick={handleScreenClick}
                >
                    {renderContent()}
                </div>

                {/* Navigation Arrows */}
                {currentIndex > 0 && (
                    <button
                        onClick={(e) => { e.stopPropagation(); goPrev() }}
                        className='absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition cursor-pointer'
                    >
                        <ChevronLeft className='w-6 h-6' />
                    </button>
                )}
                {currentIndex < stories.length - 1 && (
                    <button
                        onClick={(e) => { e.stopPropagation(); goNext() }}
                        className='absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition cursor-pointer'
                    >
                        <ChevronRight className='w-6 h-6' />
                    </button>
                )}

                {/* Story Counter */}
                <div className='absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm'>
                    {currentIndex + 1} / {stories.length}
                </div>

                {/* Like Button / Likes Count */}
                <div className='absolute bottom-4 right-4 z-20'>
                    {isOwner ? (
                        // Owner: Show likes count, click to see who liked
                        <button
                            onClick={(e) => { e.stopPropagation(); fetchLikes() }}
                            className='flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition cursor-pointer'
                            disabled={loadingLikes}
                        >
                            <Heart className={`w-5 h-5 ${currentLikesCount > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                            <span className='text-sm font-medium'>{currentLikesCount}</span>
                        </button>
                    ) : (
                        // Non-owner: Show like button
                        <button
                            onClick={handleLike}
                            className='flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition cursor-pointer active:scale-95'
                        >
                            <Heart className={`w-6 h-6 transition-all ${isCurrentLiked ? 'fill-red-500 text-red-500 scale-110' : 'hover:scale-110'}`} />
                        </button>
                    )}
                </div>

                {/* Likes Modal - Only for owner */}
                {showLikesModal && (
                    <div
                        className='absolute inset-0 bg-black/80 z-30 flex items-center justify-center'
                        onClick={(e) => { e.stopPropagation(); setShowLikesModal(false); setIsPaused(false) }}
                    >
                        <div
                            className='bg-white dark:bg-gray-800 rounded-xl w-80 max-h-96 overflow-hidden'
                            onClick={e => e.stopPropagation()}
                        >
                            <div className='p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between'>
                                <h3 className='font-semibold text-gray-900 dark:text-white'>Likes ({likers.length})</h3>
                                <button
                                    onClick={() => { setShowLikesModal(false); setIsPaused(false) }}
                                    className='text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer'
                                >
                                    <X className='w-5 h-5' />
                                </button>
                            </div>
                            <div className='overflow-y-auto max-h-72'>
                                {likers.length === 0 ? (
                                    <div className='p-8 text-center text-gray-500'>
                                        No likes yet
                                    </div>
                                ) : (
                                    likers.map(liker => (
                                        <div key={liker.id} className='flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700'>
                                            <img
                                                src={liker.profilePicture}
                                                alt={liker.fullName}
                                                className='w-10 h-10 rounded-full object-cover'
                                            />
                                            <div>
                                                <p className='font-medium text-gray-900 dark:text-white'>{liker.fullName}</p>
                                                <p className='text-sm text-gray-500'>@{liker.username}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default StoryViewer
