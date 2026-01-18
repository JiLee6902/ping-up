import React, { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import moment from 'moment'
import StoryModal from './StoryModal'
import StoryViewer from './StoryViewer'
import api from '../api/axios'
import toast from 'react-hot-toast'

const StoriesBar = () => {

    const [storyGroups, setStoryGroups] = useState([]) // Grouped by user
    const [showModal, setShowModal] = useState(false)
    const [viewingGroup, setViewingGroup] = useState(null) // {user, stories: [...]}

    const fetchStories = async () => {
        try {
            const { data } = await api.get('/api/story/get')
            if (data.success){
                // Server returns grouped stories: [{user, stories: [...]}]
                const groupedData = data.data || data.stories || []
                setStoryGroups(groupedData)
            }else{
                toast(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(()=>{
        fetchStories()
    },[])

  return (
    <div className='w-screen sm:w-[calc(100vw-240px)] lg:max-w-2xl no-scrollbar overflow-x-auto px-4'>

        <div className='flex gap-4 pb-5'>
            {/* Add Story Card */}
            <div onClick={()=>setShowModal(true)} className='rounded-lg shadow-sm min-w-30 max-w-30 max-h-40 aspect-[3/4] cursor-pointer hover:shadow-lg transition-all duration-200 border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'>
                <div className='h-full flex flex-col items-center justify-center p-4'>
                    <div className='size-10 bg-gray-800 dark:bg-gray-600 rounded-full flex items-center justify-center mb-3'>
                        <Plus className='w-5 h-5 text-white'/>
                    </div>
                    <p className='text-sm font-medium text-slate-700 dark:text-gray-300 text-center'>Create Story</p>
                </div>
            </div>
            {/* Story Cards - One per user */}
            {storyGroups.map((group, index) => {
                const user = group.user
                const stories = group.stories || []
                const hasUnviewedStories = group.hasUnviewedStories
                if (stories.length === 0) return null

                // Get the latest story for preview
                const latestStory = stories[0]
                const mediaType = latestStory?.mediaType || latestStory?.media_type
                const mediaUrl = latestStory?.mediaUrl || latestStory?.media_url
                const profilePicture = user?.profilePicture || user?.profile_picture
                const storyCount = stories.length

                // Ring color based on viewed status
                const ringClass = hasUnviewedStories
                    ? 'ring-2 ring-blue-500' // Unviewed - blue ring
                    : 'ring-2 ring-gray-400' // All viewed - gray ring

                return (
                    <div
                        onClick={() => setViewingGroup(group)}
                        key={user?.id || index}
                        className='relative rounded-lg shadow min-w-30 max-w-30 max-h-40 cursor-pointer hover:shadow-lg transition-all duration-200 bg-gradient-to-b from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black active:scale-95 overflow-hidden'
                    >
                        {/* User avatar with ring indicator - blue for unviewed, gray for viewed */}
                        <div className={`absolute top-3 left-3 z-10 ${ringClass} rounded-full`}>
                            <img src={profilePicture} alt="" className='size-8 rounded-full object-cover shadow'/>
                        </div>


                        <p className='absolute top-18 left-3 text-white/60 text-sm truncate max-w-24 z-10'>{latestStory?.content}</p>
                        <p className='text-white absolute bottom-1 right-2 z-10 text-xs'>{moment(latestStory?.createdAt).fromNow()}</p>

                        {mediaType !== 'text' && (
                            <div className='absolute inset-0 z-1 rounded-lg bg-black overflow-hidden'>
                                {mediaType === "image" ? (
                                    <img src={mediaUrl} alt="" className='h-full w-full object-cover hover:scale-110 transition duration-500 opacity-70 hover:opacity-80'/>
                                ) : (
                                    <video src={mediaUrl} className='h-full w-full object-cover hover:scale-110 transition duration-500 opacity-70 hover:opacity-80'/>
                                )}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>

        {/* Add Story Modal */}
        {showModal && <StoryModal setShowModal={setShowModal} fetchStories={fetchStories}/>}

        {/* View Story Modal - Now handles multiple stories from same user */}
        {viewingGroup && (
            <StoryViewer
                storyGroup={viewingGroup}
                onClose={() => {
                    setViewingGroup(null)
                    fetchStories() // Refetch to update viewed status
                }}
                onDelete={() => fetchStories()}
            />
        )}

    </div>
  )
}

export default StoriesBar
