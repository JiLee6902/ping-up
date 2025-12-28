import { BadgeCheck, MoreVertical, Trash2, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import api from '../api/axios'
import toast from 'react-hot-toast'

const StoryViewer = ({viewStory, setViewStory, onDelete}) => {
    const currentUser = useSelector((state) => state.user.value)
    const [progress, setProgress] = useState(0)
    const [showMenu, setShowMenu] = useState(false)

    // Handle both camelCase and snake_case
    const mediaType = viewStory?.mediaType || viewStory?.media_type
    const mediaUrl = viewStory?.mediaUrl || viewStory?.media_url
    const backgroundColor = viewStory?.backgroundColor || viewStory?.background_color
    const storyUser = viewStory?.user || {}
    const profilePicture = storyUser?.profilePicture || storyUser?.profile_picture
    const fullName = storyUser?.fullName || storyUser?.full_name

    const isOwner = currentUser?.id === storyUser?.id

    useEffect(()=>{
        let timer, progressInterval;

        if(viewStory && mediaType !== 'video'){
            setProgress(0)

            const duration = 10000;
            const setTime = 100;
            let elapsed = 0;

           progressInterval = setInterval(() => {
                elapsed += setTime;
                setProgress((elapsed / duration) * 100);
            }, setTime);

             // Close story after duration(10sec)
             timer = setTimeout(()=>{
                setViewStory(null)
             }, duration)
        }

        return ()=>{
            clearTimeout(timer);
            clearInterval(progressInterval)
        }

    }, [viewStory, setViewStory, mediaType])

    const handleClose = ()=>{
        setViewStory(null)
    }

    const handleDelete = async () => {
        try {
            const { data } = await api.delete(`/api/story/${viewStory.id}`)
            if (data.success) {
                toast.success(data.message)
                setViewStory(null)
                onDelete && onDelete(viewStory.id)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to delete story')
        }
    }

    if(!viewStory) return null

    const renderContent = ()=>{
        switch (mediaType) {
            case 'image':
                return (
                    <img src={mediaUrl} alt="" className='max-w-full max-h-screen object-contain'/>
                );
            case 'video':
                return (
                    <video onEnded={()=>setViewStory(null)} src={mediaUrl} className='max-h-screen' controls autoPlay/>
                );
            case 'text':
                return (
                    <div className='w-full h-full flex items-center justify-center p-8 text-white text-2xl text-center'>
                        {viewStory.content}
                    </div>
                );

            default:
                return null;
        }
    }

  return (
    <div className='fixed inset-0 h-screen bg-black bg-opacity-90 z-110 flex items-center justify-center' style={{backgroundColor: mediaType === 'text' ? backgroundColor : '#000000'}}>

      {/* Progress Bar */}
      <div className='absolute top-0 left-0 w-full h-1 bg-gray-700'>
        <div className='h-full bg-white transition-all duration-100 linear' style={{width: `${progress}%`}}>

        </div>
      </div>
      {/* User Info - Top Left */}
      <div className='absolute top-4 left-4 flex items-center space-x-3 p-2 px-4 sm:p-4 sm:px-8 backdrop-blur-2xl rounded bg-black/50'>
        <img src={profilePicture} alt="" className='size-7 sm:size-8 rounded-full object-cover border border-white'/>
        <div className='text-white font-medium flex items-center gap-1.5'>
            <span>{fullName}</span>
            <BadgeCheck size={18}/>
        </div>
      </div>

       {/* Menu Button (for owner) */}
       {isOwner && (
         <div className='absolute top-4 right-16'>
           <button onClick={() => setShowMenu(!showMenu)} className='text-white p-2 hover:bg-white/10 rounded-full transition cursor-pointer'>
             <MoreVertical className='w-6 h-6' />
           </button>
           {showMenu && (
             <div className='absolute right-0 mt-2 bg-white rounded-lg shadow-lg py-1 min-w-32'>
               <button onClick={handleDelete} className='w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer'>
                 <Trash2 className='w-4 h-4' /> Delete
               </button>
             </div>
           )}
         </div>
       )}

       {/* Close Button */}
       <button onClick={handleClose} className='absolute top-4 right-4 text-white text-3xl font-bold focus:outline-none'>
        <X className='w-8 h-8 hover:scale-110 transition cursor-pointer'/>
       </button>

       {/* Content Wrapper */}
       <div className='max-w-[90vw] max-h-[90vh] flex items-center justify-center'>
            {renderContent()}
       </div>
    </div>
  )
}

export default StoryViewer
