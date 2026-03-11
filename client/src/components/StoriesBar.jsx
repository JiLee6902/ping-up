import React, { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import moment from 'moment'
import StoryModal from './StoryModal'
import StoryViewer from './StoryViewer'
import api from '../api/axios'
import toast from 'react-hot-toast'

const StoriesBar = () => {

    const [storyGroups, setStoryGroups] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [viewingGroupIndex, setViewingGroupIndex] = useState(null)

    const fetchStories = async () => {
        try {
            const { data } = await api.get('/api/story/get')
            if (data.success){
                const groupedData = data.data || data.stories || []
                // Sort: unviewed first, then viewed
                const sorted = [...groupedData].sort((a, b) => {
                    if (a.hasUnviewedStories && !b.hasUnviewedStories) return -1
                    if (!a.hasUnviewedStories && b.hasUnviewedStories) return 1
                    return 0
                })
                setStoryGroups(sorted)
            } else {
                toast(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(()=>{
        fetchStories()
    },[])

    // Go to next user's stories
    const handleNextGroup = () => {
        if (viewingGroupIndex !== null && viewingGroupIndex < storyGroups.length - 1) {
            setViewingGroupIndex(viewingGroupIndex + 1)
        } else {
            setViewingGroupIndex(null)
            fetchStories()
        }
    }

    // Go to previous user's stories
    const handlePrevGroup = () => {
        if (viewingGroupIndex !== null && viewingGroupIndex > 0) {
            setViewingGroupIndex(viewingGroupIndex - 1)
        }
    }

    const handleClose = () => {
        setViewingGroupIndex(null)
        fetchStories()
    }

  return (
    <div className='w-screen sm:w-[calc(100vw-240px)] lg:max-w-2xl no-scrollbar overflow-x-auto px-4'>

        <div className='flex gap-3 pb-5'>
            {/* Add Story Card */}
            <div onClick={()=>setShowModal(true)} className='rounded-xl shadow-sm min-w-[76px] max-w-[76px] h-[120px] cursor-pointer hover:shadow-lg transition-all duration-200 border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex-shrink-0'>
                <div className='h-full flex flex-col items-center justify-center'>
                    <div className='size-9 bg-gray-800 dark:bg-gray-600 rounded-full flex items-center justify-center mb-2'>
                        <Plus className='w-4 h-4 text-white'/>
                    </div>
                    <p className='text-[11px] font-medium text-slate-600 dark:text-gray-400 text-center'>Add Story</p>
                </div>
            </div>

            {/* Story Cards - One per user */}
            {storyGroups.map((group, index) => {
                const user = group.user
                const stories = group.stories || []
                const hasUnviewed = group.hasUnviewedStories
                if (stories.length === 0) return null

                const latestStory = stories[0]
                const mediaType = latestStory?.mediaType || latestStory?.media_type
                const mediaUrl = latestStory?.mediaUrl || latestStory?.media_url
                const backgroundColor = latestStory?.backgroundColor || latestStory?.background_color
                const profilePicture = user?.profilePicture || user?.profile_picture
                const fullName = user?.fullName || user?.full_name

                return (
                    <div
                        onClick={() => setViewingGroupIndex(index)}
                        key={user?.id || index}
                        className='relative rounded-xl shadow min-w-[76px] max-w-[76px] h-[120px] cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden flex-shrink-0 active:scale-95'
                    >
                        {/* Background */}
                        {mediaType === 'text' ? (
                            <div className='absolute inset-0' style={{ backgroundColor: backgroundColor || '#1f2937' }} />
                        ) : (
                            <div className='absolute inset-0 bg-black'>
                                {mediaType === 'image' ? (
                                    <img src={mediaUrl} alt="" className='h-full w-full object-cover opacity-80'/>
                                ) : (
                                    <video src={mediaUrl} className='h-full w-full object-cover opacity-80'/>
                                )}
                            </div>
                        )}

                        {/* Gradient overlay */}
                        <div className='absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60' />

                        {/* User avatar with ring */}
                        <div className={`absolute top-2 left-1/2 -translate-x-1/2 z-10 rounded-full p-[2px] ${hasUnviewed ? 'bg-gradient-to-tr from-blue-500 to-purple-500' : 'bg-gray-400/50'}`}>
                            <img src={profilePicture} alt="" className='size-8 rounded-full object-cover border-2 border-black'/>
                        </div>

                        {/* Story count badge */}
                        {stories.length > 1 && (
                            <div className='absolute top-1.5 right-1.5 z-10 bg-blue-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center'>
                                {stories.length}
                            </div>
                        )}

                        {/* Text preview for text stories */}
                        {mediaType === 'text' && latestStory?.content && (
                            <p className='absolute top-12 left-1 right-1 text-white/80 text-[9px] leading-tight line-clamp-3 z-10 text-center'>
                                {latestStory.content}
                            </p>
                        )}

                        {/* Username */}
                        <p className='absolute bottom-1.5 left-1 right-1 text-white text-[10px] font-medium truncate z-10 text-center'>
                            {fullName?.split(' ')[0]}
                        </p>
                    </div>
                )
            })}
        </div>

        {/* Add Story Modal */}
        {showModal && <StoryModal setShowModal={setShowModal} fetchStories={fetchStories}/>}

        {/* View Story - with cross-user navigation */}
        {viewingGroupIndex !== null && storyGroups[viewingGroupIndex] && (
            <StoryViewer
                storyGroup={storyGroups[viewingGroupIndex]}
                onClose={handleClose}
                onDelete={() => fetchStories()}
                onNextGroup={handleNextGroup}
                onPrevGroup={handlePrevGroup}
                hasNextGroup={viewingGroupIndex < storyGroups.length - 1}
                hasPrevGroup={viewingGroupIndex > 0}
            />
        )}
    </div>
  )
}

export default StoriesBar
