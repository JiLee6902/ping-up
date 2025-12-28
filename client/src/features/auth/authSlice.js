import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axios.js'
import toast from 'react-hot-toast'

const TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'

// Get tokens from localStorage
const getStoredTokens = () => ({
  accessToken: localStorage.getItem(TOKEN_KEY),
  refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY)
})

// Save tokens to localStorage
const saveTokens = (accessToken, refreshToken) => {
  localStorage.setItem(TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

// Clear tokens from localStorage
const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

const initialState = {
  user: null,
  accessToken: getStoredTokens().accessToken,
  refreshToken: getStoredTokens().refreshToken,
  isAuthenticated: !!getStoredTokens().accessToken,
  isLoading: false,
  error: null,
  // 2FA state
  requiresTwoFactor: false,
  tempToken: null
}

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/api/auth/login', { email, password })

      // Check if 2FA is required
      if (data.requiresTwoFactor) {
        return {
          requiresTwoFactor: true,
          tempToken: data.tempToken
        }
      }

      if (data.success) {
        const { accessToken, refreshToken } = data.data.tokens
        saveTokens(accessToken, refreshToken)
        return {
          user: data.data.user,
          accessToken,
          refreshToken
        }
      }
      return rejectWithValue(data.message || 'Login failed')
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed')
    }
  }
)

export const loginWithTwoFactor = createAsyncThunk(
  'auth/loginWithTwoFactor',
  async ({ tempToken, code }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/api/auth/login/2fa', { tempToken, code })
      if (data.success) {
        const { accessToken, refreshToken } = data.data.tokens
        saveTokens(accessToken, refreshToken)
        return {
          user: data.data.user,
          accessToken,
          refreshToken
        }
      }
      return rejectWithValue(data.message || 'Verification failed')
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Invalid verification code')
    }
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async ({ name, username, email, password }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/api/auth/register', {
        fullName: name,
        username,
        email,
        password
      })
      if (data.success) {
        const { accessToken, refreshToken } = data.data.tokens
        saveTokens(accessToken, refreshToken)
        return {
          user: data.data.user,
          accessToken,
          refreshToken
        }
      }
      return rejectWithValue(data.message || 'Registration failed')
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed')
    }
  }
)

export const refreshAccessToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { refreshToken } = getState().auth
      const { data } = await api.post('/api/auth/refresh', { refreshToken })
      if (data.success) {
        saveTokens(data.accessToken, data.refreshToken)
        return data
      }
      clearTokens()
      return rejectWithValue('Session expired')
    } catch (error) {
      clearTokens()
      return rejectWithValue('Session expired')
    }
  }
)

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { accessToken } = getState().auth
      const { data } = await api.get('/api/user/data', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (data.success) {
        return data.data
      }
      return rejectWithValue(data.message || 'Failed to fetch user')
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      clearTokens()
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.error = null
      state.requiresTwoFactor = false
      state.tempToken = null
    },
    clearError: (state) => {
      state.error = null
    },
    setTokens: (state, action) => {
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      state.isAuthenticated = true
      saveTokens(action.payload.accessToken, action.payload.refreshToken)
    },
    clear2FA: (state) => {
      state.requiresTwoFactor = false
      state.tempToken = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        // Check if 2FA is required
        if (action.payload.requiresTwoFactor) {
          state.requiresTwoFactor = true
          state.tempToken = action.payload.tempToken
        } else {
          state.user = action.payload.user
          state.accessToken = action.payload.accessToken
          state.refreshToken = action.payload.refreshToken
          state.isAuthenticated = true
          toast.success('Login successful!')
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        toast.error(action.payload)
      })
      // Login with 2FA
      .addCase(loginWithTwoFactor.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginWithTwoFactor.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        state.refreshToken = action.payload.refreshToken
        state.isAuthenticated = true
        state.requiresTwoFactor = false
        state.tempToken = null
        toast.success('Login successful!')
      })
      .addCase(loginWithTwoFactor.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        toast.error(action.payload)
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        state.refreshToken = action.payload.refreshToken
        state.isAuthenticated = true
        toast.success('Registration successful!')
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        toast.error(action.payload)
      })
      // Refresh token
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken
        state.refreshToken = action.payload.refreshToken
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        state.user = null
        state.accessToken = null
        state.refreshToken = null
        state.isAuthenticated = false
      })
      // Fetch current user
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  }
})

export const { logout, clearError, setTokens, clear2FA } = authSlice.actions
export default authSlice.reducer
