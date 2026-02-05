import React, { useState, useEffect } from 'react'
import { Wallet as WalletIcon, TrendingUp, TrendingDown, Plus, CreditCard, Crown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'

const Wallet = () => {
  const navigate = useNavigate()
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchWalletData = async () => {
    try {
      const [balanceRes, transactionsRes] = await Promise.all([
        api.get('/api/wallet/balance'),
        api.get('/api/wallet/transactions'),
      ])
      if (balanceRes.data) {
        setWallet(balanceRes.data.wallet)
      }
      if (transactionsRes.data) {
        setTransactions(transactionsRes.data)
      }
    } catch (error) {
      console.error('Failed to fetch wallet data:', error)
      toast.error('Failed to load wallet data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWalletData()
  }, [])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'top_up':
      case 'bonus':
        return <TrendingUp className='w-5 h-5 text-green-500' />
      case 'purchase':
      case 'refund':
        return <TrendingDown className='w-5 h-5 text-red-500' />
      default:
        return <WalletIcon className='w-5 h-5 text-gray-500' />
    }
  }

  const getTransactionLabel = (type) => {
    switch (type) {
      case 'top_up': return 'Top Up'
      case 'purchase': return 'Purchase'
      case 'refund': return 'Refund'
      case 'bonus': return 'Bonus'
      default: return type
    }
  }

  return (
    <div className='h-full overflow-y-auto bg-slate-50 dark:bg-gray-900'>
      <div className='max-w-2xl mx-auto p-4'>
        {/* Header */}
        <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-6'>My Wallet</h1>

        {loading ? (
          <div className='flex justify-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white'></div>
          </div>
        ) : (
          <>
            {/* Balance Card */}
            <div className='bg-gray-900 dark:bg-gray-800 rounded-2xl p-6 text-white mb-6'>
              <div className='flex items-center justify-between mb-4'>
                <span className='text-sm opacity-80'>Current balance</span>
                <WalletIcon className='w-6 h-6 opacity-80' />
              </div>
              <div className='text-4xl font-bold mb-2'>
                {wallet?.balance?.toLocaleString() || 0} <span className='text-xl'>coins</span>
              </div>
              <div className='text-sm opacity-80'>
                Total top-up: {wallet?.totalTopUp?.toLocaleString() || 0} | Spent: {wallet?.totalSpent?.toLocaleString() || 0}
              </div>
            </div>

            {/* Action Buttons */}
            <div className='grid grid-cols-2 gap-4 mb-6'>
              <button
                onClick={() => navigate('/topup')}
                className='flex items-center justify-center gap-2 bg-white dark:bg-gray-800 rounded-xl p-4 shadow hover:shadow-md transition-shadow'
              >
                <Plus className='w-5 h-5 text-green-500' />
                <span className='font-medium text-gray-900 dark:text-white'>Top Up</span>
              </button>
              <button
                onClick={() => navigate('/subscription')}
                className='flex items-center justify-center gap-2 bg-white dark:bg-gray-800 rounded-xl p-4 shadow hover:shadow-md transition-shadow'
              >
                <Crown className='w-5 h-5 text-yellow-500' />
                <span className='font-medium text-gray-900 dark:text-white'>Premium</span>
              </button>
            </div>

            {/* Transaction History */}
            <div className='bg-white dark:bg-gray-800 rounded-xl shadow'>
              <div className='p-4 border-b border-gray-200 dark:border-gray-700'>
                <h2 className='font-semibold text-gray-900 dark:text-white'>Transaction History</h2>
              </div>
              {transactions.length === 0 ? (
                <div className='p-8 text-center'>
                  <CreditCard className='w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3' />
                  <p className='text-gray-500 dark:text-gray-400'>No transactions yet</p>
                </div>
              ) : (
                <div className='divide-y divide-gray-200 dark:divide-gray-700'>
                  {transactions.map((tx) => (
                    <div key={tx.id} className='p-4 flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        {getTransactionIcon(tx.type)}
                        <div>
                          <p className='font-medium text-gray-900 dark:text-white'>
                            {getTransactionLabel(tx.type)}
                          </p>
                          <p className='text-sm text-gray-500 dark:text-gray-400'>
                            {tx.description || formatDate(tx.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className='text-right'>
                        <p className={`font-semibold ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                        </p>
                        <p className='text-xs text-gray-500 dark:text-gray-400'>
                          So du: {tx.balanceAfter?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Wallet
