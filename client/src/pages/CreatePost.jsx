import React, { useState, useRef } from 'react'
import { Image, X, Smile, MapPin, Video } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSelector } from "react-redux"
import api from '../api/axios'
import { useNavigate } from 'react-router-dom'
import EmojiPicker from '../components/EmojiPicker'

const MAX_VIDEO_SIZE_MB = 100

const CreatePost = () => {
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [images, setImages] = useState([])
  const [video, setVideo] = useState(null)
  const [videoPreview, setVideoPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showLocationInput, setShowLocationInput] = useState(false)
  const [location, setLocation] = useState('')
  const [locationLat, setLocationLat] = useState(null)
  const [locationLng, setLocationLng] = useState(null)
  const [gettingLocation, setGettingLocation] = useState(false)
  const videoInputRef = useRef(null)

  const user = useSelector((state) => state.user.value)

  const handleEmojiSelect = (emoji) => {
    setContent((prev) => prev + emoji)
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setLocationLat(latitude)
        setLocationLng(longitude)

        // Try to get location name using reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14`
          )
          const data = await response.json()
          if (data.display_name) {
            // Extract shorter location name
            const parts = data.display_name.split(', ')
            const shortLocation = parts.slice(0, 3).join(', ')
            setLocation(shortLocation)
          } else {
            setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
          }
        } catch {
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        }
        setGettingLocation(false)
        setShowLocationInput(true)
      },
      (error) => {
        setGettingLocation(false)
        if (error.code === error.PERMISSION_DENIED) {
          toast.error('Location permission denied')
        } else {
          toast.error('Unable to get location')
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }

  const clearLocation = () => {
    setLocation('')
    setLocationLat(null)
    setLocationLng(null)
    setShowLocationInput(false)
  }

  const handleVideoSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate video type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo']
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid video format. Supported: MP4, MOV, WebM, AVI')
      return
    }

    // Validate video size
    if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      toast.error(`Video size must be less than ${MAX_VIDEO_SIZE_MB}MB`)
      return
    }

    // Cannot have both images and video
    if (images.length > 0) {
      toast.error('Cannot have both images and video. Remove images first.')
      return
    }

    setVideo(file)
    setVideoPreview(URL.createObjectURL(file))
  }

  const clearVideo = () => {
    setVideo(null)
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview)
    }
    setVideoPreview(null)
    if (videoInputRef.current) {
      videoInputRef.current.value = ''
    }
  }

  const handleSubmit = async () => {
    if (!images.length && !content && !video) {
      return toast.error('Please add content, image, or video')
    }
    setLoading(true)

    // Determine post type
    let postType = 'text'
    if (video) {
      postType = content ? 'text_with_video' : 'video'
    } else if (images.length) {
      postType = content ? 'text_with_image' : 'image'
    }

    try {
      const formData = new FormData()
      formData.append('content', content)
      formData.append('postType', postType)
      images.forEach((image) => {
        formData.append('images', image)
      })
      if (video) {
        formData.append('video', video)
      }
      if (location) {
        formData.append('location', location)
      }
      if (locationLat !== null) {
        formData.append('locationLat', locationLat)
      }
      if (locationLng !== null) {
        formData.append('locationLng', locationLng)
      }

      const { data } = await api.post('/api/post/add', formData)

      if (data.success) {
        navigate('/')
      } else {
        console.log(data.message)
        throw new Error(data.message)
      }
    } catch (error) {
      console.log(error.message)
      throw new Error(error.message)
    }
    setLoading(false)
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-800'>
      <div className='max-w-6xl mx-auto p-6'>
        {/* Title */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white mb-2'>Create Post</h1>
          <p className='text-slate-600 dark:text-gray-400'>Share your thoughts with the world</p>
        </div>

        {/* Form */}
        <div className='max-w-xl bg-white dark:bg-gray-800 p-4 sm:p-8 sm:pb-3 rounded-xl shadow-md space-y-4'>
          {/* Header */}
          <div className='flex items-center gap-3'>
            <img src={user?.profilePicture || user?.profile_picture} alt="" className='w-12 h-12 rounded-full shadow object-cover' />
            <div>
              <h2 className='font-semibold dark:text-white'>{user?.fullName || user?.full_name}</h2>
              <p className='text-sm text-gray-500 dark:text-gray-400'>@{user?.username}</p>
            </div>
          </div>

          {/* Text Area */}
          <textarea className='w-full resize-none max-h-20 mt-4 text-sm outline-none placeholder-gray-400 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500' placeholder="What's happening?" onChange={(e) => setContent(e.target.value)} value={content} />

          {/* Location Display */}
          {(location || showLocationInput) && (
            <div className='flex items-center gap-2 mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg'>
              <MapPin className='w-4 h-4 text-red-500 flex-shrink-0' />
              <input
                type='text'
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder='Enter location...'
                className='flex-1 text-sm bg-transparent outline-none dark:text-white'
              />
              <button
                type='button'
                onClick={clearLocation}
                className='p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition'
              >
                <X className='w-4 h-4 text-gray-500' />
              </button>
            </div>
          )}

          {/* Images */}
          {
            images.length > 0 && <div className='flex flex-wrap gap-2 mt-4'>
              {images.map((image, i) => (
                <div key={i} className='relative group'>
                  <img src={URL.createObjectURL(image)} className='h-20 rounded-md' alt="" />
                  <div onClick={() => setImages(images.filter((_, index) => index !== i))} className='absolute hidden group-hover:flex justify-center items-center top-0 right-0 bottom-0 left-0 bg-black/40 rounded-md cursor-pointer'>
                    <X className="w-6 h-6 text-white" />
                  </div>
                </div>
              ))}
            </div>
          }

          {/* Video Preview */}
          {videoPreview && (
            <div className='mt-4 relative'>
              <video
                src={videoPreview}
                controls
                className='w-full max-h-64 rounded-lg object-contain bg-black'
              />
              <button
                type='button'
                onClick={clearVideo}
                className='absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition'
              >
                <X className='w-5 h-5' />
              </button>
            </div>
          )}

          {/* Bottom Bar */}
          <div className='flex items-center justify-between pt-3 border-t border-gray-300 dark:border-gray-600'>
            <div className='flex items-center gap-2'>
              {/* Image Button */}
              <label
                htmlFor="images"
                className={`flex items-center gap-2 text-sm transition cursor-pointer ${video ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                title={video ? 'Remove video to add images' : 'Add images'}
              >
                <Image className='size-6' />
              </label>

              <input
                type="file"
                id="images"
                accept='image/*'
                hidden
                multiple
                disabled={!!video}
                onChange={(e) => {
                  if (!video) {
                    setImages([...images, ...e.target.files])
                  }
                }}
              />

              {/* Video Button */}
              <label
                htmlFor="video"
                className={`flex items-center gap-2 text-sm transition cursor-pointer ${images.length > 0 ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : video ? 'text-blue-500' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                title={images.length > 0 ? 'Remove images to add video' : 'Add video'}
              >
                <Video className='size-6' />
              </label>

              <input
                type="file"
                id="video"
                ref={videoInputRef}
                accept='video/*'
                hidden
                disabled={images.length > 0}
                onChange={handleVideoSelect}
              />

              {/* Emoji Button */}
              <div className='relative'>
                <button
                  type='button'
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition'
                >
                  <Smile className='size-6' />
                </button>
                {showEmojiPicker && (
                  <EmojiPicker
                    onEmojiSelect={handleEmojiSelect}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                )}
              </div>

              {/* Location Button */}
              <button
                type='button'
                onClick={location ? () => setShowLocationInput(true) : getCurrentLocation}
                disabled={gettingLocation}
                className={`text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition ${location ? 'text-red-500' : ''}`}
                title={location ? 'Edit location' : 'Add location'}
              >
                {gettingLocation ? (
                  <div className='size-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin' />
                ) : (
                  <MapPin className='size-6' />
                )}
              </button>
            </div>

            <button disabled={loading} onClick={() => toast.promise(
              handleSubmit(),
              {
                loading: 'uploading ...',
                success: <p>Post Added </p>,
                error: <p>Post Not Added</p>,
              }
            )} className='text-sm bg-gray-900 hover:bg-gray-800 dark:bg-blue-600 dark:hover:bg-blue-700 active:scale-95 transition text-white font-medium px-8 py-2 rounded-md cursor-pointer'>
              Publish Post
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreatePost
