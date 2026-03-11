import { BadgeCheck, ChevronLeft, ChevronRight, Heart, MoreVertical, Trash2, X, Eye, Volume2, VolumeX } from 'lucide-react'
import React, { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useSelector } from 'react-redux'
import api from '../api/axios'
import toast from 'react-hot-toast'
import moment from 'moment'

const STORY_DURATION = 5000 // 5 seconds for images/text

const StoryViewer = ({ storyGroup, onClose, onDelete, onNextGroup, onPrevGroup, hasNextGroup, hasPrevGroup }) => {
    const currentUser = useSelector((state) => state.user.value)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [progress, setProgress] = useState(0)
    const [showMenu, setShowMenu] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [likedStories, setLikedStories] = useState({})
    const [likesCounts, setLikesCounts] = useState({})
    const [showLikesModal, setShowLikesModal] = useState(false)
    const [likers, setLikers] = useState([])
    const [loadingLikes, setLoadingLikes] = useState(false)
    const [muted, setMuted] = useState(true)
    const videoRef = useRef(null)
    const longPressTimer = useRef(null)

    const stories = storyGroup?.stories || []
    const user = storyGroup?.user || {}
    const currentStory = stories[currentIndex]

    const mediaType = currentStory?.mediaType || currentStory?.media_type
    const mediaUrl = currentStory?.mediaUrl || currentStory?.media_url
    const backgroundColor = currentStory?.backgroundColor || currentStory?.background_color
    const profilePicture = user?.profilePicture || user?.profile_picture
    const fullName = user?.fullName || user?.full_name

    const isOwner = currentUser?.id === user?.id

    // Reset index when group changes
    useEffect(() => {
        setCurrentIndex(0)
        setProgress(0)
        setShowMenu(false)
        setShowLikesModal(false)
    }, [storyGroup?.user?.id])

    // Initialize liked state
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

    // Mark as viewed
    useEffect(() => {
        if (!currentStory || isOwner) return
        const markAsViewed = async () => {
            try { await api.post(`/api/story/view/${currentStory.id}`) }
            catch (e) { console.error('Failed to mark viewed:', e) }
        }
        markAsViewed()
    }, [currentStory?.id, isOwner])

    const currentLikesCount = likesCounts[currentStory?.id] || 0
    const isCurrentLiked = likedStories[currentStory?.id] || false

    // Go next story, if last → next user group
    const goNext = useCallback(() => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(prev => prev + 1)
            setProgress(0)
        } else if (onNextGroup) {
            onNextGroup()
        } else {
            onClose()
        }
    }, [currentIndex, stories.length, onNextGroup, onClose])

    // Go prev story, if first → prev user group
    const goPrev = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1)
            setProgress(0)
        } else if (onPrevGroup) {
            onPrevGroup()
        }
    }, [currentIndex, onPrevGroup])

    // Timer for auto-advance (images/text only)
    useEffect(() => {
        if (!currentStory || mediaType === 'video' || isPaused) return

        setProgress(0)
        const interval = 50
        let elapsed = 0

        const progressInterval = setInterval(() => {
            elapsed += interval
            setProgress((elapsed / STORY_DURATION) * 100)
            if (elapsed >= STORY_DURATION) {
                goNext()
            }
        }, interval)

        return () => clearInterval(progressInterval)
    }, [currentIndex, currentStory?.id, mediaType, isPaused, goNext])

    // Video progress tracking
    useEffect(() => {
        if (mediaType !== 'video' || !videoRef.current) return

        const video = videoRef.current
        const handleTimeUpdate = () => {
            if (video.duration) {
                setProgress((video.currentTime / video.duration) * 100)
            }
        }
        video.addEventListener('timeupdate', handleTimeUpdate)
        return () => video.removeEventListener('timeupdate', handleTimeUpdate)
    }, [mediaType, currentIndex])

    // Keyboard nav
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight') goNext()
            else if (e.key === 'ArrowLeft') goPrev()
            else if (e.key === 'Escape') onClose()
            else if (e.key === ' ') { e.preventDefault(); setIsPaused(p => !p) }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [goNext, goPrev, onClose])

    // Long press to pause
    const handlePointerDown = (e) => {
        if (e.target.closest('button') || e.target.closest('[data-no-pause]')) return
        longPressTimer.current = setTimeout(() => setIsPaused(true), 200)
    }
    const handlePointerUp = () => {
        clearTimeout(longPressTimer.current)
        setIsPaused(false)
    }

    // Tap left/right to navigate
    const handleTap = (e) => {
        if (e.target.closest('button') || e.target.closest('[data-no-pause]')) return
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        if (x < rect.width / 3) goPrev()
        else if (x > (rect.width * 2) / 3) goNext()
    }

    const handleDelete = async () => {
        try {
            const { data } = await api.delete(`/api/story/${currentStory.id}`)
            if (data.success) {
                toast.success('Story deleted')
                onDelete && onDelete(currentStory.id)
                if (stories.length === 1) onClose()
                else if (currentIndex >= stories.length - 1) setCurrentIndex(prev => prev - 1)
            } else toast.error(data.message)
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to delete')
        }
        setShowMenu(false)
    }

    const handleLike = async (e) => {
        e.stopPropagation()
        if (isOwner) return
        try {
            const { data } = await api.post(`/api/story/like/${currentStory.id}`)
            if (data.success) {
                setLikedStories(prev => ({ ...prev, [currentStory.id]: data.data.liked }))
                setLikesCounts(prev => ({ ...prev, [currentStory.id]: data.data.likesCount }))
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to like')
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
                setIsPaused(true)
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to load likes')
        }
        setLoadingLikes(false)
    }

    if (!currentStory) return null

    const renderContent = () => {
        switch (mediaType) {
            case 'image':
                return <img src={mediaUrl} alt="" className='max-w-full max-h-full object-contain' />
            case 'video':
                return (
                    <video
                        ref={videoRef}
                        onEnded={goNext}
                        src={mediaUrl}
                        className='max-w-full max-h-full object-contain'
                        autoPlay
                        playsInline
                        muted={muted}
                    />
                )
            case 'text':
                return (
                    <div className='w-full h-full flex items-center justify-center p-8'>
                        <p className='text-white text-xl md:text-2xl text-center font-medium leading-relaxed'>
                            {currentStory.content}
                        </p>
                    </div>
                )
            default:
                return null
        }
    }

    return createPortal(
        <div className='fixed inset-0 bg-black z-[9999] flex items-center justify-center'>
            {/* Previous group indicator */}
            {hasPrevGroup && (
                <button
                    onClick={(e) => { e.stopPropagation(); onPrevGroup() }}
                    className='absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition'
                >
                    <ChevronLeft className='w-6 h-6' />
                </button>
            )}

            {/* Next group indicator */}
            {(hasNextGroup || currentIndex < stories.length - 1) && (
                <button
                    onClick={(e) => { e.stopPropagation(); goNext() }}
                    className='absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition'
                >
                    <ChevronRight className='w-6 h-6' />
                </button>
            )}

            {/* Story Container */}
            <div
                className='relative w-full max-w-[420px] h-full max-h-[100dvh] md:max-h-[90vh] md:rounded-2xl overflow-hidden'
                onClick={handleTap}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                {/* Background */}
                <div
                    className='absolute inset-0'
                    style={{ backgroundColor: mediaType === 'text' ? (backgroundColor || '#1f2937') : '#000' }}
                />

                {/* Progress Bars */}
                <div className='absolute top-0 left-0 right-0 z-20 flex gap-[3px] px-2 pt-2'>
                    {stories.map((_, index) => (
                        <div key={index} className='flex-1 h-[3px] bg-white/20 rounded-full overflow-hidden'>
                            <div
                                className='h-full bg-white rounded-full'
                                style={{
                                    width: index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%',
                                    transition: index === currentIndex ? 'width 50ms linear' : 'none',
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div className='absolute top-4 left-0 right-0 z-20 flex items-center justify-between px-3'>
                    <div className='flex items-center gap-2.5'>
                        <div className='relative'>
                            <img src={profilePicture} alt="" className='w-9 h-9 rounded-full object-cover ring-2 ring-white/30' />
                        </div>
                        <div>
                            <div className='flex items-center gap-1 text-white text-sm font-semibold'>
                                <span>{fullName}</span>
                                {user?.isVerified && <BadgeCheck size={14} className='text-blue-400' />}
                            </div>
                            <p className='text-white/50 text-[11px]'>{moment(currentStory.createdAt).fromNow()}</p>
                        </div>
                    </div>

                    <div className='flex items-center gap-0.5'>
                        {/* Mute for video */}
                        {mediaType === 'video' && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setMuted(!muted) }}
                                className='text-white p-2 hover:bg-white/10 rounded-full transition'
                            >
                                {muted ? <VolumeX className='w-5 h-5' /> : <Volume2 className='w-5 h-5' />}
                            </button>
                        )}

                        {/* Pause indicator */}
                        {isPaused && mediaType !== 'video' && (
                            <span className='text-white/50 text-xs px-2'>PAUSED</span>
                        )}

                        {/* Owner menu */}
                        {isOwner && (
                            <div className='relative' data-no-pause>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
                                    className='text-white p-2 hover:bg-white/10 rounded-full transition'
                                >
                                    <MoreVertical className='w-5 h-5' />
                                </button>
                                {showMenu && (
                                    <div className='absolute right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-1 min-w-36 overflow-hidden'>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete() }}
                                            className='w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-sm'
                                        >
                                            <Trash2 className='w-4 h-4' /> Delete Story
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            onClick={(e) => { e.stopPropagation(); onClose() }}
                            className='text-white p-2 hover:bg-white/10 rounded-full transition'
                        >
                            <X className='w-6 h-6' />
                        </button>
                    </div>
                </div>

                {/* Story Content */}
                <div className='w-full h-full flex items-center justify-center'>
                    {renderContent()}
                </div>

                {/* Bottom Bar */}
                <div className='absolute bottom-0 left-0 right-0 z-20 px-4 pb-4 pt-12 bg-gradient-to-t from-black/60 to-transparent'>
                    <div className='flex items-center justify-between'>
                        {/* Views count (for owner) */}
                        <div className='flex items-center gap-3'>
                            {isOwner && (
                                <span className='flex items-center gap-1 text-white/60 text-sm'>
                                    <Eye className='w-4 h-4' />
                                    {currentStory.viewsCount || 0}
                                </span>
                            )}
                        </div>

                        {/* Like */}
                        <div>
                            {isOwner ? (
                                <button
                                    onClick={(e) => { e.stopPropagation(); fetchLikes() }}
                                    className='flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 rounded-full text-white transition'
                                    disabled={loadingLikes}
                                >
                                    <Heart className={`w-5 h-5 ${currentLikesCount > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                                    <span className='text-sm'>{currentLikesCount}</span>
                                </button>
                            ) : (
                                <button
                                    onClick={handleLike}
                                    className='p-2 bg-white/15 hover:bg-white/25 rounded-full text-white transition active:scale-90'
                                >
                                    <Heart className={`w-6 h-6 transition-all ${isCurrentLiked ? 'fill-red-500 text-red-500' : ''}`} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Likes Modal */}
                {showLikesModal && (
                    <div
                        className='absolute inset-0 bg-black/80 z-30 flex items-end md:items-center justify-center'
                        onClick={(e) => { e.stopPropagation(); setShowLikesModal(false); setIsPaused(false) }}
                    >
                        <div
                            className='bg-white dark:bg-gray-800 rounded-t-2xl md:rounded-2xl w-full md:w-80 max-h-[60vh] overflow-hidden'
                            onClick={e => e.stopPropagation()}
                        >
                            <div className='p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between'>
                                <h3 className='font-semibold text-gray-900 dark:text-white'>Likes ({likers.length})</h3>
                                <button onClick={() => { setShowLikesModal(false); setIsPaused(false) }} className='text-gray-400 hover:text-gray-600'>
                                    <X className='w-5 h-5' />
                                </button>
                            </div>
                            <div className='overflow-y-auto max-h-[50vh]'>
                                {likers.length === 0 ? (
                                    <div className='p-8 text-center text-gray-400'>No likes yet</div>
                                ) : (
                                    likers.map(liker => (
                                        <div key={liker.id} className='flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700'>
                                            <img src={liker.profilePicture} alt="" className='w-10 h-10 rounded-full object-cover' />
                                            <div>
                                                <p className='font-medium text-gray-900 dark:text-white text-sm'>{liker.fullName}</p>
                                                <p className='text-xs text-gray-400'>@{liker.username}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    )
}

export default StoryViewer
