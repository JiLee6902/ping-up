import React from 'react'
import { Crown, BadgeCheck } from 'lucide-react'

const PremiumBadge = ({ type = 'crown', size = 'sm', className = '' }) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const iconSize = sizeClasses[size] || sizeClasses.sm

  if (type === 'verified') {
    return (
      <BadgeCheck
        className={`${iconSize} text-blue-500 ${className}`}
        fill='currentColor'
        strokeWidth={2.5}
      />
    )
  }

  return (
    <Crown className={`${iconSize} text-yellow-500 ${className}`} />
  )
}

export const VerifiedBadge = ({ size = 'sm', className = '' }) => (
  <PremiumBadge type='verified' size={size} className={className} />
)

export default PremiumBadge
