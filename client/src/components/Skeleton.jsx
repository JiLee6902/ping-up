import React from 'react'

// Basic skeleton shimmer effect
const shimmerClass = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%]'

// Post Card Skeleton
export const PostCardSkeleton = () => (
  <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 space-y-4'>
    {/* Header */}
    <div className='flex items-center gap-3'>
      <div className={`w-12 h-12 rounded-full ${shimmerClass}`} />
      <div className='flex-1 space-y-2'>
        <div className={`h-4 w-32 rounded ${shimmerClass}`} />
        <div className={`h-3 w-24 rounded ${shimmerClass}`} />
      </div>
    </div>
    {/* Content */}
    <div className='space-y-2'>
      <div className={`h-4 w-full rounded ${shimmerClass}`} />
      <div className={`h-4 w-3/4 rounded ${shimmerClass}`} />
    </div>
    {/* Image placeholder */}
    <div className={`h-64 w-full rounded-lg ${shimmerClass}`} />
    {/* Actions */}
    <div className='flex gap-4 pt-2'>
      <div className={`h-8 w-16 rounded ${shimmerClass}`} />
      <div className={`h-8 w-16 rounded ${shimmerClass}`} />
      <div className={`h-8 w-16 rounded ${shimmerClass}`} />
    </div>
  </div>
)

// Chat Item Skeleton
export const ChatItemSkeleton = () => (
  <div className='flex items-center gap-3 px-3 py-2.5'>
    <div className={`w-12 h-12 rounded-full ${shimmerClass}`} />
    <div className='flex-1 space-y-2'>
      <div className={`h-4 w-28 rounded ${shimmerClass}`} />
      <div className={`h-3 w-40 rounded ${shimmerClass}`} />
    </div>
  </div>
)

// User Card Skeleton
export const UserCardSkeleton = () => (
  <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex flex-col items-center'>
    <div className={`w-20 h-20 rounded-full ${shimmerClass}`} />
    <div className={`h-5 w-24 rounded mt-3 ${shimmerClass}`} />
    <div className={`h-4 w-20 rounded mt-2 ${shimmerClass}`} />
    <div className={`h-3 w-32 rounded mt-2 ${shimmerClass}`} />
    <div className={`h-9 w-24 rounded-full mt-4 ${shimmerClass}`} />
  </div>
)

// Story Skeleton
export const StorySkeleton = () => (
  <div className='flex-shrink-0 w-28'>
    <div className={`aspect-[3/4] rounded-xl ${shimmerClass}`} />
  </div>
)

// Notification Skeleton
export const NotificationSkeleton = () => (
  <div className='flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg'>
    <div className={`w-10 h-10 rounded-full ${shimmerClass}`} />
    <div className='flex-1 space-y-2'>
      <div className={`h-4 w-48 rounded ${shimmerClass}`} />
      <div className={`h-3 w-24 rounded ${shimmerClass}`} />
    </div>
  </div>
)

// Profile Header Skeleton
export const ProfileHeaderSkeleton = () => (
  <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden'>
    {/* Cover */}
    <div className={`h-48 ${shimmerClass}`} />
    {/* Profile info */}
    <div className='px-6 pb-6'>
      <div className={`w-32 h-32 rounded-full -mt-16 border-4 border-white dark:border-gray-800 ${shimmerClass}`} />
      <div className='mt-4 space-y-3'>
        <div className={`h-6 w-40 rounded ${shimmerClass}`} />
        <div className={`h-4 w-28 rounded ${shimmerClass}`} />
        <div className={`h-4 w-64 rounded ${shimmerClass}`} />
      </div>
      <div className='flex gap-6 mt-4'>
        <div className={`h-10 w-20 rounded ${shimmerClass}`} />
        <div className={`h-10 w-20 rounded ${shimmerClass}`} />
        <div className={`h-10 w-20 rounded ${shimmerClass}`} />
      </div>
    </div>
  </div>
)

// Comment Skeleton
export const CommentSkeleton = () => (
  <div className='flex gap-3 p-3'>
    <div className={`w-9 h-9 rounded-full ${shimmerClass}`} />
    <div className='flex-1 space-y-2'>
      <div className={`h-4 w-24 rounded ${shimmerClass}`} />
      <div className={`h-3 w-full rounded ${shimmerClass}`} />
      <div className={`h-3 w-2/3 rounded ${shimmerClass}`} />
    </div>
  </div>
)

// Message Skeleton
export const MessageSkeleton = ({ isOwn = false }) => (
  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
    <div className={`${isOwn ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-700'} rounded-2xl px-4 py-2 max-w-[70%]`}>
      <div className={`h-4 ${isOwn ? 'w-32' : 'w-40'} rounded ${shimmerClass}`} />
    </div>
  </div>
)

// Generic skeleton line
export const SkeletonLine = ({ width = 'w-full', height = 'h-4' }) => (
  <div className={`${width} ${height} rounded ${shimmerClass}`} />
)

// Generic skeleton circle
export const SkeletonCircle = ({ size = 'w-12 h-12' }) => (
  <div className={`${size} rounded-full ${shimmerClass}`} />
)

export default {
  PostCardSkeleton,
  ChatItemSkeleton,
  UserCardSkeleton,
  StorySkeleton,
  NotificationSkeleton,
  ProfileHeaderSkeleton,
  CommentSkeleton,
  MessageSkeleton,
  SkeletonLine,
  SkeletonCircle,
}
