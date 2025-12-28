import React, { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react'

const ImageLightbox = ({ images, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [scale, setScale] = useState(1)

  const currentImage = images[currentIndex]

  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          goToPrevious()
          break
        case 'ArrowRight':
          goToNext()
          break
        default:
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [currentIndex])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
    setScale(1)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
    setScale(1)
  }

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 3))
  }

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.5, 0.5))
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = currentImage
    link.download = `image-${currentIndex + 1}`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className='fixed inset-0 z-50 bg-black/95 flex items-center justify-center'>
      {/* Top Bar */}
      <div className='absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10'>
        <span className='text-white text-sm'>
          {currentIndex + 1} / {images.length}
        </span>
        <div className='flex items-center gap-2'>
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className='p-2 text-white hover:bg-white/10 rounded-full disabled:opacity-50'
          >
            <ZoomOut className='w-5 h-5' />
          </button>
          <span className='text-white text-sm min-w-[50px] text-center'>
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            disabled={scale >= 3}
            className='p-2 text-white hover:bg-white/10 rounded-full disabled:opacity-50'
          >
            <ZoomIn className='w-5 h-5' />
          </button>
          <button
            onClick={handleDownload}
            className='p-2 text-white hover:bg-white/10 rounded-full'
          >
            <Download className='w-5 h-5' />
          </button>
          <button
            onClick={onClose}
            className='p-2 text-white hover:bg-white/10 rounded-full'
          >
            <X className='w-5 h-5' />
          </button>
        </div>
      </div>

      {/* Main Image */}
      <div
        className='w-full h-full flex items-center justify-center overflow-hidden'
        onClick={onClose}
      >
        <img
          src={currentImage}
          alt={`Image ${currentIndex + 1}`}
          className='max-w-full max-h-full object-contain transition-transform duration-200'
          style={{ transform: `scale(${scale})` }}
          onClick={(e) => e.stopPropagation()}
          draggable={false}
        />
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
            className='absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/10 rounded-full'
          >
            <ChevronLeft className='w-8 h-8' />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goToNext(); }}
            className='absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/10 rounded-full'
          >
            <ChevronRight className='w-8 h-8' />
          </button>
        </>
      )}

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/50 rounded-lg'>
          {images.map((img, index) => (
            <button
              key={index}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); setScale(1); }}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition ${
                index === currentIndex ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img} alt='' className='w-full h-full object-cover' />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ImageLightbox
