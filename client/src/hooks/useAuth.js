import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../features/auth/authSlice'

// Custom hook to replace Clerk's useAuth
export const useAuth = () => {
  const { accessToken, isAuthenticated, isLoading } = useSelector((state) => state.auth)

  // Return token directly (no need for async getToken like Clerk)
  const getToken = () => accessToken

  return {
    getToken,
    isSignedIn: isAuthenticated,
    isLoaded: !isLoading
  }
}

// Custom hook to replace Clerk's useUser
export const useUser = () => {
  const { user, isLoading } = useSelector((state) => state.auth)

  return {
    user,
    isSignedIn: !!user,
    isLoaded: !isLoading
  }
}

// Custom hook to replace Clerk's useClerk
export const useClerk = () => {
  const dispatch = useDispatch()

  const signOut = () => {
    dispatch(logout())
  }

  return {
    signOut
  }
}
