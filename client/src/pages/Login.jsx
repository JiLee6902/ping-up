import React, { useState, useEffect } from 'react'
import { assets } from '../assets/assets'
import { Star, Eye, EyeOff, Loader2, Shield, ArrowLeft, UserRound } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { login, loginWithTwoFactor, clear2FA, guestLogin } from '../features/auth/authSlice'
import { Link, useNavigate } from 'react-router-dom'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [guestLoading, setGuestLoading] = useState(false)

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isLoading, requiresTwoFactor, tempToken, isAuthenticated } = useSelector((state) => state.auth)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await dispatch(login({ email, password }))
    if (login.fulfilled.match(result) && !result.payload.requiresTwoFactor) {
      navigate('/')
    }
  }

  const handleTwoFactorSubmit = async (e) => {
    e.preventDefault()
    const result = await dispatch(loginWithTwoFactor({ tempToken, code: twoFactorCode }))
    if (loginWithTwoFactor.fulfilled.match(result)) {
      navigate('/')
    }
  }

  const handleGuestLogin = async () => {
    setGuestLoading(true)
    const result = await dispatch(guestLogin())
    setGuestLoading(false)
    if (guestLogin.fulfilled.match(result)) {
      navigate('/')
    }
  }

  const handleBack = () => {
    dispatch(clear2FA())
    setTwoFactorCode('')
  }

  return (
    <div className='min-h-screen flex flex-col md:flex-row'>
      {/* Background Image */}
      <img src={assets.bgImage} alt="" className='absolute top-0 left-0 -z-1 w-full h-full object-cover'/>

      {/* left side : Branding  */}
      <div className='flex-1 flex flex-col items-start justify-between p-6 md:p-10 lg:pl-40'>
        <img src={assets.logo} alt="" className='h-12 object-contain'/>
        <div>
          <div className='flex items-center gap-3 mb-4 max-md:mt-10'>
            <img src={assets.group_users} alt="" className='h-8 md:h-10'/>
            <div>
              <div className='flex'>
                {Array(5).fill(0).map((_, i)=>(<Star key={i} className='size-4 md:size-4.5 text-transparent fill-gray-500'/>))}
              </div>
              <p>Used by 12k+ developers</p>
            </div>
          </div>
          <h1 className='text-3xl md:text-6xl md:pb-2 font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent'>More than just friends truly connect</h1>
          <p className='text-xl md:text-3xl text-gray-700 max-w-72 md:max-w-md'>connect with global community on pingup.</p>
        </div>
        <span className='md:h-10'></span>
      </div>

      {/* Right side: Login Form */}
      <div className='flex-1 flex items-center justify-center p-6 sm:p-10'>
        <div className='w-full max-w-md bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8'>
          {!requiresTwoFactor ? (
            <>
              <h2 className='text-2xl font-bold text-gray-800 mb-2'>Welcome back</h2>
              <p className='text-gray-600 mb-6'>Sign in to your account</p>

              <form onSubmit={handleSubmit} className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Email</label>
                  <input
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className='w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-500'
                    placeholder='Enter your email'
                    required
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Password</label>
                  <div className='relative'>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className='w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-500'
                      placeholder='Enter your password'
                      required
                    />
                    <button
                      type='button'
                      onClick={() => setShowPassword(!showPassword)}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700'
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  type='submit'
                  disabled={isLoading}
                  className='w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                >
                  {isLoading ? (
                    <>
                      <Loader2 className='animate-spin' size={20} />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className='flex items-center gap-3 my-4'>
                <div className='flex-1 h-px bg-gray-300'></div>
                <span className='text-sm text-gray-500'>or</span>
                <div className='flex-1 h-px bg-gray-300'></div>
              </div>

              {/* Guest Login Button */}
              <button
                type='button'
                onClick={handleGuestLogin}
                disabled={isLoading || guestLoading}
                className='w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-gray-300'
              >
                {guestLoading ? (
                  <>
                    <Loader2 className='animate-spin' size={20} />
                    Entering as guest...
                  </>
                ) : (
                  <>
                    <UserRound size={20} />
                    Continue as Guest
                  </>
                )}
              </button>

              <p className='text-center mt-6 text-gray-600'>
                Don't have an account?{' '}
                <Link to='/register' className='text-gray-900 hover:text-gray-700 font-semibold'>
                  Sign Up
                </Link>
              </p>
            </>
          ) : (
            <>
              <button
                onClick={handleBack}
                className='flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4'
              >
                <ArrowLeft size={18} />
                Back
              </button>

              <div className='flex items-center gap-3 mb-4'>
                <div className='p-3 bg-blue-100 rounded-full'>
                  <Shield className='w-6 h-6 text-blue-600' />
                </div>
                <div>
                  <h2 className='text-xl font-bold text-gray-800'>Two-Factor Authentication</h2>
                  <p className='text-sm text-gray-600'>Enter the code from your authenticator app</p>
                </div>
              </div>

              <form onSubmit={handleTwoFactorSubmit} className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Verification Code</label>
                  <input
                    type='text'
                    maxLength={8}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                    className='w-full px-4 py-4 text-center text-2xl tracking-widest rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-500'
                    placeholder='000000'
                    autoFocus
                    required
                  />
                  <p className='text-xs text-gray-500 mt-2 text-center'>
                    Enter the 6-digit code from your authenticator app, or an 8-character backup code
                  </p>
                </div>

                <button
                  type='submit'
                  disabled={isLoading || twoFactorCode.length < 6}
                  className='w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                >
                  {isLoading ? (
                    <>
                      <Loader2 className='animate-spin' size={20} />
                      Verifying...
                    </>
                  ) : (
                    'Verify'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login
