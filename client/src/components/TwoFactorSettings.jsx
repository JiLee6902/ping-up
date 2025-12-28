import React, { useState, useEffect } from 'react'
import { X, Shield, ShieldCheck, ShieldOff, Copy, Check, AlertTriangle, RefreshCw } from 'lucide-react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const TwoFactorSettings = ({ onClose }) => {
  const [status, setStatus] = useState({ enabled: false, backupCodesRemaining: 0 })
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState('status') // status, setup, verify, backup, disable
  const [setupData, setSetupData] = useState(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCodes, setBackupCodes] = useState([])
  const [copiedCodes, setCopiedCodes] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const { data } = await api.get('/api/auth/2fa/status')
      if (data.success) {
        setStatus(data.data)
      }
    } catch (error) {
      toast.error('Failed to fetch 2FA status')
    }
    setLoading(false)
  }

  const handleSetup = async () => {
    setIsSubmitting(true)
    try {
      const { data } = await api.post('/api/auth/2fa/setup')
      if (data.success) {
        setSetupData(data.data)
        setStep('setup')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to setup 2FA')
    }
    setIsSubmitting(false)
  }

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code')
      return
    }

    setIsSubmitting(true)
    try {
      const { data } = await api.post('/api/auth/2fa/enable', { code: verificationCode })
      if (data.success) {
        setBackupCodes(data.data.backupCodes)
        setStep('backup')
        setStatus({ enabled: true, backupCodesRemaining: 10 })
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid verification code')
    }
    setIsSubmitting(false)
  }

  const handleDisable = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code')
      return
    }

    setIsSubmitting(true)
    try {
      const { data } = await api.post('/api/auth/2fa/disable', { code: verificationCode })
      if (data.success) {
        setStatus({ enabled: false, backupCodesRemaining: 0 })
        setStep('status')
        setVerificationCode('')
        toast.success('Two-factor authentication disabled')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid verification code')
    }
    setIsSubmitting(false)
  }

  const handleRegenerateBackupCodes = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code')
      return
    }

    setIsSubmitting(true)
    try {
      const { data } = await api.post('/api/auth/2fa/regenerate-backup-codes', { code: verificationCode })
      if (data.success) {
        setBackupCodes(data.data.backupCodes)
        setStep('backup')
        setStatus(prev => ({ ...prev, backupCodesRemaining: 10 }))
        setVerificationCode('')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid verification code')
    }
    setIsSubmitting(false)
  }

  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n')
    navigator.clipboard.writeText(codesText)
    setCopiedCodes(true)
    toast.success('Backup codes copied to clipboard')
    setTimeout(() => setCopiedCodes(false), 2000)
  }

  if (loading) {
    return (
      <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
        <div className='bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6'>
          <div className='flex justify-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white dark:bg-gray-800 rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700'>
          <div className='flex items-center gap-2'>
            <Shield className='w-5 h-5 text-blue-500' />
            <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Two-Factor Authentication</h2>
          </div>
          <button onClick={onClose} className='p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full'>
            <X className='w-5 h-5 text-gray-500' />
          </button>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto p-4'>
          {/* Status View */}
          {step === 'status' && (
            <div className='space-y-4'>
              <div className={`p-4 rounded-lg flex items-center gap-3 ${status.enabled ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700'}`}>
                {status.enabled ? (
                  <ShieldCheck className='w-8 h-8 text-green-500' />
                ) : (
                  <ShieldOff className='w-8 h-8 text-gray-400' />
                )}
                <div>
                  <p className={`font-medium ${status.enabled ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {status.enabled ? 'Enabled' : 'Not Enabled'}
                  </p>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>
                    {status.enabled
                      ? `${status.backupCodesRemaining} backup codes remaining`
                      : 'Add an extra layer of security to your account'}
                  </p>
                </div>
              </div>

              {!status.enabled ? (
                <button
                  onClick={handleSetup}
                  disabled={isSubmitting}
                  className='w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-lg text-white font-medium'
                >
                  {isSubmitting ? 'Setting up...' : 'Enable Two-Factor Authentication'}
                </button>
              ) : (
                <div className='space-y-2'>
                  <button
                    onClick={() => setStep('regenerate')}
                    className='w-full py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2'
                  >
                    <RefreshCw className='w-4 h-4' />
                    Regenerate Backup Codes
                  </button>
                  <button
                    onClick={() => setStep('disable')}
                    className='w-full py-2.5 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/20'
                  >
                    Disable Two-Factor Authentication
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Setup View */}
          {step === 'setup' && setupData && (
            <div className='space-y-4'>
              <div className='text-center'>
                <p className='text-gray-600 dark:text-gray-300 mb-4'>
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                <img src={setupData.qrCode} alt="QR Code" className='mx-auto w-48 h-48 bg-white p-2 rounded-lg' />
              </div>

              <div className='bg-gray-50 dark:bg-gray-700 p-3 rounded-lg'>
                <p className='text-xs text-gray-500 dark:text-gray-400 mb-1'>Or enter this code manually:</p>
                <p className='font-mono text-sm text-gray-900 dark:text-white break-all'>{setupData.secret}</p>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  Enter the 6-digit code from your app
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className='w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-200 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div className='flex gap-2'>
                <button
                  onClick={() => { setStep('status'); setVerificationCode(''); setSetupData(null) }}
                  className='flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300'
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerify}
                  disabled={isSubmitting || verificationCode.length !== 6}
                  className='flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-lg text-white font-medium'
                >
                  {isSubmitting ? 'Verifying...' : 'Verify & Enable'}
                </button>
              </div>
            </div>
          )}

          {/* Backup Codes View */}
          {step === 'backup' && (
            <div className='space-y-4'>
              <div className='flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg'>
                <AlertTriangle className='w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5' />
                <div>
                  <p className='text-sm font-medium text-yellow-800 dark:text-yellow-200'>Save your backup codes</p>
                  <p className='text-sm text-yellow-700 dark:text-yellow-300'>
                    Store these codes in a safe place. You can use them to sign in if you lose access to your authenticator app.
                  </p>
                </div>
              </div>

              <div className='bg-gray-50 dark:bg-gray-700 p-4 rounded-lg'>
                <div className='grid grid-cols-2 gap-2'>
                  {backupCodes.map((code, index) => (
                    <div key={index} className='font-mono text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-600 px-2 py-1 rounded text-center'>
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={copyBackupCodes}
                className='w-full py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2'
              >
                {copiedCodes ? <Check className='w-4 h-4 text-green-500' /> : <Copy className='w-4 h-4' />}
                {copiedCodes ? 'Copied!' : 'Copy Backup Codes'}
              </button>

              <button
                onClick={() => { setStep('status'); setBackupCodes([]); setVerificationCode('') }}
                className='w-full py-2.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-medium'
              >
                Done
              </button>
            </div>
          )}

          {/* Disable View */}
          {step === 'disable' && (
            <div className='space-y-4'>
              <p className='text-gray-600 dark:text-gray-300'>
                To disable two-factor authentication, enter a verification code from your authenticator app.
              </p>

              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className='w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-200 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div className='flex gap-2'>
                <button
                  onClick={() => { setStep('status'); setVerificationCode('') }}
                  className='flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300'
                >
                  Cancel
                </button>
                <button
                  onClick={handleDisable}
                  disabled={isSubmitting || verificationCode.length !== 6}
                  className='flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-lg text-white font-medium'
                >
                  {isSubmitting ? 'Disabling...' : 'Disable 2FA'}
                </button>
              </div>
            </div>
          )}

          {/* Regenerate Backup Codes View */}
          {step === 'regenerate' && (
            <div className='space-y-4'>
              <p className='text-gray-600 dark:text-gray-300'>
                Enter a verification code from your authenticator app to generate new backup codes. This will invalidate all existing backup codes.
              </p>

              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className='w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-200 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div className='flex gap-2'>
                <button
                  onClick={() => { setStep('status'); setVerificationCode('') }}
                  className='flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300'
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegenerateBackupCodes}
                  disabled={isSubmitting || verificationCode.length !== 6}
                  className='flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-lg text-white font-medium'
                >
                  {isSubmitting ? 'Generating...' : 'Generate New Codes'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TwoFactorSettings
