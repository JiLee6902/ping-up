import React, { useState, useEffect } from 'react'
import { Crown, Check, Star, Sparkles, Calendar, Shield } from 'lucide-react'
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
      toast.error(`So du khong du. Can ${price} coins, hien co ${balance} coins`)
      navigate('/topup')
      return
    }

    setPurchasing(true)
    try {
      const { data } = await api.post('/api/subscription/purchase', { plan })
      if (data?.subscription) {
        toast.success('Nang cap Premium thanh cong!')
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
    { icon: <Shield className='w-5 h-5' />, text: 'Huy hieu xac minh' },
    { icon: <Sparkles className='w-5 h-5' />, text: 'Khong quang cao' },
    { icon: <Star className='w-5 h-5' />, text: 'Dang bai khong gioi han' },
    { icon: <Check className='w-5 h-5' />, text: 'Upload video' },
    { icon: <Check className='w-5 h-5' />, text: 'Xem ai da xem profile' },
    { icon: <Check className='w-5 h-5' />, text: 'Ghim bai viet' },
    { icon: <Check className='w-5 h-5' />, text: 'Len lich dang bai' },
    { icon: <Check className='w-5 h-5' />, text: '4 lua chon poll (thay vi 2)' },
    { icon: <Check className='w-5 h-5' />, text: 'Story khong gioi han' },
    { icon: <Check className='w-5 h-5' />, text: 'Nhom chat khong gioi han' },
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
                      Con {status.daysRemaining} ngay
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-2 text-sm text-yellow-100'>
                  <Calendar className='w-4 h-4' />
                  <span>
                    Het han: {new Date(status.subscription.premiumExpiresAt).toLocaleDateString('vi-VN')}
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
                Mo khoa tat ca tinh nang cao cap
              </p>
            </div>

            {/* Features List */}
            <div className='bg-white dark:bg-gray-800 rounded-xl shadow mb-6'>
              <div className='p-4 border-b border-gray-200 dark:border-gray-700'>
                <h3 className='font-semibold text-gray-900 dark:text-white'>Quyen loi Premium</h3>
              </div>
              <div className='p-4 space-y-3'>
                {premiumFeatures.map((feature, index) => (
                  <div key={index} className='flex items-center gap-3'>
                    <div className='text-yellow-500'>{feature.icon}</div>
                    <span className='text-gray-700 dark:text-gray-300'>{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Plans */}
            {plans && (
              <div className='space-y-4 mb-6'>
                {/* Monthly */}
                <div className='bg-white dark:bg-gray-800 rounded-xl shadow p-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                        Premium Hang Thang
                      </h3>
                      <p className='text-gray-500 dark:text-gray-400 text-sm'>
                        {plans.monthly.days} ngay
                      </p>
                    </div>
                    <div className='text-right'>
                      <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                        {plans.monthly.price} <span className='text-sm'>coins</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePurchase('monthly')}
                    disabled={purchasing}
                    className='w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl disabled:opacity-50 transition-colors'
                  >
                    {purchasing ? 'Dang xu ly...' : 'Mua ngay'}
                  </button>
                </div>

                {/* Yearly */}
                <div className='bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow p-4 relative overflow-hidden'>
                  <div className='absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full'>
                    Tiet kiem 17%
                  </div>
                  <div className='flex items-center justify-between text-white'>
                    <div>
                      <h3 className='text-lg font-semibold'>
                        Premium Hang Nam
                      </h3>
                      <p className='text-indigo-200 text-sm'>
                        {plans.yearly.days} ngay
                      </p>
                    </div>
                    <div className='text-right'>
                      <p className='text-2xl font-bold'>
                        {plans.yearly.price} <span className='text-sm'>coins</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePurchase('yearly')}
                    disabled={purchasing}
                    className='w-full mt-4 py-3 bg-white text-indigo-600 font-semibold rounded-xl disabled:opacity-50 hover:bg-gray-100 transition-colors'
                  >
                    {purchasing ? 'Dang xu ly...' : 'Mua ngay'}
                  </button>
                </div>
              </div>
            )}

            {/* Balance Info */}
            <div className='text-center'>
              <p className='text-gray-500 dark:text-gray-400 mb-2'>
                So du hien tai: <span className='font-semibold'>{balance.toLocaleString()} coins</span>
              </p>
              <button
                onClick={() => navigate('/topup')}
                className='text-indigo-600 dark:text-indigo-400 font-medium hover:underline'
              >
                Nap them coins
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Subscription
