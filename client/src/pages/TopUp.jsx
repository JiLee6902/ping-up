import React, { useState, useEffect } from 'react'
import { Coins, Gift, ArrowRight, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'

const TopUp = () => {
  const navigate = useNavigate()
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [processing, setProcessing] = useState(false)

  const fetchPackages = async () => {
    try {
      const { data } = await api.get('/api/payment/packages')
      if (data) {
        setPackages(data)
      }
    } catch (error) {
      console.error('Failed to fetch packages:', error)
      toast.error('Failed to load packages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPackages()
  }, [])

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const handlePurchase = async () => {
    if (!selectedPackage) {
      toast.error('Vui long chon goi nap')
      return
    }

    setProcessing(true)
    try {
      const { data } = await api.post('/api/payment/create-order', {
        packageId: selectedPackage,
      })

      if (data?.paymentUrl) {
        // Redirect to VNPAY
        window.location.href = data.paymentUrl
      } else {
        toast.error('Failed to create payment order')
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast.error(error.response?.data?.message || 'Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className='h-full overflow-y-auto bg-slate-50 dark:bg-gray-900'>
      <div className='max-w-2xl mx-auto p-4'>
        {/* Header */}
        <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>Nap Coins</h1>
        <p className='text-gray-500 dark:text-gray-400 mb-6'>Chon goi nap phu hop voi ban</p>

        {loading ? (
          <div className='flex justify-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white'></div>
          </div>
        ) : (
          <>
            {/* Package Cards */}
            <div className='space-y-4 mb-6'>
              {packages.map((pkg) => {
                const isSelected = selectedPackage === pkg.id
                const totalCoins = pkg.coins + pkg.bonus

                return (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                    }`}
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className={`p-3 rounded-full ${isSelected ? 'bg-indigo-100 dark:bg-indigo-800' : 'bg-gray-100 dark:bg-gray-700'}`}>
                          <Coins className={`w-6 h-6 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`} />
                        </div>
                        <div>
                          <div className='flex items-center gap-2'>
                            <span className='text-xl font-bold text-gray-900 dark:text-white'>
                              {totalCoins.toLocaleString()} coins
                            </span>
                            {pkg.bonus > 0 && (
                              <span className='px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-medium rounded-full flex items-center gap-1'>
                                <Gift className='w-3 h-3' />
                                +{pkg.bonus}
                              </span>
                            )}
                          </div>
                          <p className='text-sm text-gray-500 dark:text-gray-400'>
                            {pkg.coins.toLocaleString()} coins {pkg.bonus > 0 && `+ ${pkg.bonus} bonus`}
                          </p>
                        </div>
                      </div>
                      <div className='text-right'>
                        <p className='text-lg font-semibold text-gray-900 dark:text-white'>
                          {formatVND(pkg.vnd)}
                        </p>
                        {isSelected && (
                          <CheckCircle className='w-5 h-5 text-indigo-500 ml-auto mt-1' />
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Payment Button */}
            <button
              onClick={handlePurchase}
              disabled={!selectedPackage || processing}
              className='w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              {processing ? (
                <>
                  <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
                  Dang xu ly...
                </>
              ) : (
                <>
                  Thanh toan qua VNPAY
                  <ArrowRight className='w-5 h-5' />
                </>
              )}
            </button>

            {/* Info */}
            <p className='text-center text-sm text-gray-500 dark:text-gray-400 mt-4'>
              Ban se duoc chuyen den cong thanh toan VNPAY
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default TopUp
