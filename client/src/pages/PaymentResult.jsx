import React, { useEffect, useState } from 'react'
import { CheckCircle, XCircle, ArrowRight, Home } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const PaymentResult = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const success = searchParams.get('success') === 'true'
  const message = searchParams.get('message') || ''
  const orderId = searchParams.get('orderId') || ''

  return (
    <div className='h-full overflow-y-auto bg-slate-50 dark:bg-gray-900 flex items-center justify-center'>
      <div className='max-w-md w-full mx-4'>
        <div className='bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center'>
          {success ? (
            <>
              <div className='w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6'>
                <CheckCircle className='w-12 h-12 text-green-500' />
              </div>
              <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
                Thanh toan thanh cong!
              </h1>
              <p className='text-gray-500 dark:text-gray-400 mb-2'>
                {decodeURIComponent(message)}
              </p>
              {orderId && (
                <p className='text-sm text-gray-400 dark:text-gray-500 mb-6'>
                  Ma don hang: {orderId}
                </p>
              )}
            </>
          ) : (
            <>
              <div className='w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6'>
                <XCircle className='w-12 h-12 text-red-500' />
              </div>
              <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
                Thanh toan that bai
              </h1>
              <p className='text-gray-500 dark:text-gray-400 mb-2'>
                {decodeURIComponent(message) || 'Da co loi xay ra'}
              </p>
              {orderId && (
                <p className='text-sm text-gray-400 dark:text-gray-500 mb-6'>
                  Ma don hang: {orderId}
                </p>
              )}
            </>
          )}

          <div className='space-y-3'>
            <button
              onClick={() => navigate('/wallet')}
              className='w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors'
            >
              Xem vi cua toi
              <ArrowRight className='w-5 h-5' />
            </button>
            <button
              onClick={() => navigate('/')}
              className='w-full py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors'
            >
              <Home className='w-5 h-5' />
              Ve trang chu
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentResult
