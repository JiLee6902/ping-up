import React, { useState, useEffect } from 'react'
import { Crown, Check, Star, Sparkles, Calendar, Shield, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'

const Subscription = () => {
  const navigate = useNavigate()
  const [status, setStatus] = useState(null)
  const [plans, setPlans] = useState(null)
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [expandedPlan, setExpandedPlan] = useState(null)

  const fetchData = async () => {
    try {
      const [statusRes, plansRes, balanceRes] = await Promise.all([
        api.get('/api/subscription/status'),
        api.get('/api/subscription/plans'),
        api.get('/api/wallet/balance'),
      ])
      setStatus(statusRes.data)
      setPlans(plansRes.data)
      setBalance(balanceRes.data?.balance || 0)
    } catch (error) {
      console.error('Failed to fetch subscription data:', error)
      toast.error('Failed to load subscription data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handlePurchase = async (plan) => {
    const price = plans[plan]?.price || 0
    if (balance < price) {
      toast.error(`Insufficient balance. Need ${price} coins, you have ${balance} coins`)
      navigate('/topup')
      return
    }

    setPurchasing(true)
    try {
      const { data } = await api.post('/api/subscription/purchase', { plan })
      if (data?.subscription) {
        toast.success('Premium upgrade successful!')
        setStatus(data)
        fetchData()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Purchase failed')
    } finally {
      setPurchasing(false)
    }
  }

  const premiumFeatures = [
    { icon: <Shield className='w-5 h-5' />, text: 'Verified badge' },
    { icon: <Sparkles className='w-5 h-5' />, text: 'Ad-free experience' },
    { icon: <Star className='w-5 h-5' />, text: 'Unlimited posts' },
    { icon: <Check className='w-5 h-5' />, text: 'Video uploads' },
    { icon: <Check className='w-5 h-5' />, text: 'See who viewed your profile' },
    { icon: <Check className='w-5 h-5' />, text: 'Pin posts' },
    { icon: <Check className='w-5 h-5' />, text: 'Schedule posts' },
    { icon: <Check className='w-5 h-5' />, text: 'Create polls in posts' },
    { icon: <Check className='w-5 h-5' />, text: 'Unlimited stories' },
    { icon: <Check className='w-5 h-5' />, text: 'Unlimited group chats' },
  ]

  return (
    <div className='h-full overflow-y-auto bg-slate-50 dark:bg-gray-900'>
      <div className='max-w-2xl mx-auto p-4'>
        {loading ? (
          <div className='flex justify-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white'></div>
          </div>
        ) : (
          <>
            {/* Current Status */}
            {status?.isPremium && (
              <div className='bg-gradient-to-r from-yellow-500 to-amber-500 rounded-2xl p-6 text-white mb-6'>
                <div className='flex items-center gap-3 mb-3'>
                  <Crown className='w-8 h-8' />
                  <div>
                    <h2 className='text-xl font-bold'>Premium Active</h2>
                    <p className='text-yellow-100'>
                      {status.daysRemaining} days remaining
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-2 text-sm text-yellow-100'>
                  <Calendar className='w-4 h-4' />
                  <span>
                    Expires: {new Date(status.subscription.premiumExpiresAt).toLocaleDateString('en-US')}
                  </span>
                </div>
              </div>
            )}

            {/* Header */}
            <div className='text-center mb-8'>
              <Crown className='w-16 h-16 mx-auto text-yellow-500 mb-4' />
              <h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
                PingUp Premium
              </h1>
              <p className='text-gray-500 dark:text-gray-400'>
                Unlock all premium features
              </p>
            </div>

            {/* Plans */}
            {plans && (
              <div className='space-y-4 mb-6'>
                {/* Monthly */}
                <div className='bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden'>
                  <div
                    className='p-4 cursor-pointer'
                    onClick={() => setExpandedPlan(expandedPlan === 'monthly' ? null : 'monthly')}
                  >
                    <div className='flex items-center justify-between'>
                      <div>
                        <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                          Monthly Premium
                        </h3>
                        <p className='text-gray-500 dark:text-gray-400 text-sm'>
                          {plans.monthly.days} days
                        </p>
                      </div>
                      <div className='flex items-center gap-3'>
                        <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                          {plans.monthly.price} <span className='text-sm'>coins</span>
                        </p>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedPlan === 'monthly' ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </div>
                  {expandedPlan === 'monthly' && (
                    <div className='px-4 pb-4'>
                      <div className='border-t border-gray-200 dark:border-gray-700 pt-3 mb-3 space-y-2'>
                        {premiumFeatures.map((feature, index) => (
                          <div key={index} className='flex items-center gap-2'>
                            <div className='text-yellow-500'>{feature.icon}</div>
                            <span className='text-sm text-gray-700 dark:text-gray-300'>{feature.text}</span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => handlePurchase('monthly')}
                        disabled={purchasing}
                        className='w-full py-3 bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 text-white font-semibold rounded-xl disabled:opacity-50 transition-colors'
                      >
                        {purchasing ? 'Processing...' : 'Buy Now'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Yearly */}
                <div className='bg-gray-900 dark:bg-gray-700 rounded-xl shadow overflow-hidden relative'>
                  <div className='absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full z-10'>
                    Save 17%
                  </div>
                  <div
                    className='p-4 cursor-pointer'
                    onClick={() => setExpandedPlan(expandedPlan === 'yearly' ? null : 'yearly')}
                  >
                    <div className='flex items-center justify-between text-white'>
                      <div>
                        <h3 className='text-lg font-semibold'>
                          Yearly Premium
                        </h3>
                        <p className='text-gray-300 text-sm'>
                          {plans.yearly.days} days
                        </p>
                      </div>
                      <div className='flex items-center gap-3'>
                        <p className='text-2xl font-bold'>
                          {plans.yearly.price} <span className='text-sm'>coins</span>
                        </p>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedPlan === 'yearly' ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </div>
                  {expandedPlan === 'yearly' && (
                    <div className='px-4 pb-4'>
                      <div className='border-t border-gray-600 pt-3 mb-3 space-y-2'>
                        {premiumFeatures.map((feature, index) => (
                          <div key={index} className='flex items-center gap-2'>
                            <div className='text-yellow-400'>{feature.icon}</div>
                            <span className='text-sm text-gray-200'>{feature.text}</span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => handlePurchase('yearly')}
                        disabled={purchasing}
                        className='w-full py-3 bg-white text-gray-900 font-semibold rounded-xl disabled:opacity-50 hover:bg-gray-100 transition-colors'
                      >
                        {purchasing ? 'Processing...' : 'Buy Now'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Balance Info */}
            <div className='text-center'>
              <p className='text-gray-500 dark:text-gray-400 mb-2'>
                Current balance: <span className='font-semibold'>{balance.toLocaleString()} coins</span>
              </p>
              <button
                onClick={() => navigate('/topup')}
                className='text-gray-900 dark:text-white font-medium hover:underline'
              >
                Top up coins
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Subscription
