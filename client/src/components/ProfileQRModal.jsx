import React, { useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, Download, Share2, Copy } from 'lucide-react'
import toast from 'react-hot-toast'

const ProfileQRModal = ({ user, onClose }) => {
  const qrRef = useRef(null)
  const profileUrl = `${window.location.origin}/profile/${user.id || user._id}`
  const profilePicture = user.profilePicture || user.profile_picture
  const fullName = user.fullName || user.full_name || 'User'

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector('svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = 300
      canvas.height = 300
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, 300, 300)
      ctx.drawImage(img, 0, 0, 300, 300)

      const link = document.createElement('a')
      link.download = `${user.username || 'profile'}-qr.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast.success('QR code downloaded!')
    }
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${fullName}'s Profile`,
          text: `Check out ${fullName}'s profile on PingUp!`,
          url: profileUrl,
        })
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyLink()
        }
      }
    } else {
      handleCopyLink()
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl)
    toast.success('Profile link copied!')
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      <div className='absolute inset-0 bg-black/50' onClick={onClose} />
      <div className='relative bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl'>
        <button
          onClick={onClose}
          className='absolute top-4 right-4 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors'
        >
          <X className='w-5 h-5 text-gray-500 dark:text-gray-400' />
        </button>

        <h2 className='text-xl font-bold text-center mb-2 text-gray-900 dark:text-white'>
          My QR Code
        </h2>
        <p className='text-center text-gray-500 dark:text-gray-400 text-sm mb-4'>
          Scan to view profile
        </p>

        <div ref={qrRef} className='flex justify-center p-4 bg-white rounded-xl mx-auto w-fit'>
          <QRCodeSVG
            value={profileUrl}
            size={200}
            level='M'
            includeMargin
            imageSettings={profilePicture ? {
              src: profilePicture,
              height: 40,
              width: 40,
              excavate: true,
            } : undefined}
          />
        </div>

        <div className='text-center mt-4'>
          <p className='font-semibold text-gray-900 dark:text-white'>{fullName}</p>
          <p className='text-gray-500 dark:text-gray-400 text-sm'>@{user.username}</p>
        </div>

        <div className='flex gap-3 mt-6'>
          <button
            onClick={handleCopyLink}
            className='flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-700 dark:text-gray-200 font-medium'
          >
            <Copy className='w-4 h-4' />
            Copy
          </button>
          <button
            onClick={handleDownload}
            className='flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-700 dark:text-gray-200 font-medium'
          >
            <Download className='w-4 h-4' />
            Save
          </button>
          <button
            onClick={handleShare}
            className='flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium'
          >
            <Share2 className='w-4 h-4' />
            Share
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfileQRModal
