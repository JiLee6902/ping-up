import React, { useState, useEffect } from 'react'
import { assets } from '../assets/assets'
import { Star, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { register } from '../features/auth/authSlice'
import { Link, useNavigate } from 'react-router-dom'

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isLoading, isGuest, user: guestUser } = useSelector((state) => state.auth)

  useEffect(() => {
    if (isGuest && guestUser) {
      setFormData((prev) => ({
        ...prev,
        name: guestUser.fullName || '',
        username: guestUser.username || '',
      }))
    }
  }, [isGuest, guestUser])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    const result = await dispatch(register({
      name: formData.name,
      username: formData.username,
      email: formData.email,
      password: formData.password
    }))

    if (register.fulfilled.match(result)) {
      navigate('/')
    }
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

      {/* Right side: Register Form */}
      <div className='flex-1 flex items-center justify-center p-6 sm:p-10'>
        <div className='w-full max-w-md bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8'>
          <h2 className='text-2xl font-bold text-gray-800 mb-2'>Create account</h2>
          <p className='text-gray-600 mb-6'>Join the community today</p>

          {isGuest && (
            <div className='mb-4 p-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg'>
              <p className='text-sm text-gray-700 dark:text-gray-300'>
                Converting your guest account. Your data will be preserved.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Full Name</label>
              <input
                type='text'
                name='name'
                value={formData.name}
                onChange={handleChange}
                className='w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-500'
                placeholder='Enter your full name'
                required
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Username</label>
              <input
                type='text'
                name='username'
                value={formData.username}
                onChange={handleChange}
                className='w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-500'
                placeholder='Choose a username'
                required
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Email</label>
              <input
                type='email'
                name='email'
                value={formData.email}
                onChange={handleChange}
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
                  name='password'
                  value={formData.password}
                  onChange={handleChange}
                  className='w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-500'
                  placeholder='Create a password'
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

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Confirm Password</label>
              <input
                type='password'
                name='confirmPassword'
                value={formData.confirmPassword}
                onChange={handleChange}
                className='w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-500'
                placeholder='Confirm your password'
                required
              />
            </div>

            {error && (
              <p className='text-red-500 text-sm'>{error}</p>
            )}

            <button
              type='submit'
              disabled={isLoading}
              className='w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
            >
              {isLoading ? (
                <>
                  <Loader2 className='animate-spin' size={20} />
                  Creating account...
                </>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>

          <p className='text-center mt-6 text-gray-600'>
            Already have an account?{' '}
            <Link to='/login' className='text-gray-900 hover:text-gray-700 font-semibold'>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
