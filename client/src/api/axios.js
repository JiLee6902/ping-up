import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_BASEURL
})

// Request interceptor - attach token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If 401 and not already retried, and user has token (was authenticated)
    if (error.response?.status === 401 && !originalRequest._retry) {
      const accessToken = localStorage.getItem('accessToken')

      // Only try to refresh if user was authenticated
      if (accessToken) {
        originalRequest._retry = true

        try {
          const refreshToken = localStorage.getItem('refreshToken')
          if (!refreshToken) {
            throw new Error('No refresh token')
          }

          const { data } = await axios.post(
            `${import.meta.env.VITE_BASEURL}/api/auth/refresh`,
            { refreshToken }
          )

          if (data.accessToken) {
            localStorage.setItem('accessToken', data.accessToken)
            localStorage.setItem('refreshToken', data.refreshToken)
            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
            return api(originalRequest)
          }
        } catch (refreshError) {
          // Clear tokens and redirect to login
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      }
    }

    return Promise.reject(error)
  }
)

export default api
