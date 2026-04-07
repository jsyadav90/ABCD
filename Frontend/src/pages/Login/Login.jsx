/**
 * Page: Login
 * Description: User ko credentials se sign-in karata hai. Agar pehle se authenticated ho to dashboard par bhejta hai.
 * Major Logics:
 * - Basic validation (empty fields, min password length)
 * - Auth context se login() call aur error handling
 */
import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Input, Button, Alert } from '../../components'
import AuthLayout from '../../layouts/AuthLayout'
import './Login.css'

const Login = () => {
  const navigate = useNavigate()
  const { login, reauth, clearError, isAuthenticated, needsReauth, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [flashMessage, setFlashMessage] = useState(null)
  const [isReauthMode, setIsReauthMode] = useState(false)
  const [fromReauthMode, setFromReauthMode] = useState(false)
  const [formData, setFormData] = useState({
    loginId: '', // Can be username, userId, or email
    password: ''
  })

  // Check if we need re-authentication
  useEffect(() => {
    if (needsReauth && !isAuthenticated) {
      setIsReauthMode(true)
      setFromReauthMode(false)
    } else if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [needsReauth, isAuthenticated, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    clearError()
    setFlashMessage(null)
  }

  const switchToNormalLogin = () => {
    setIsReauthMode(false)
    setFromReauthMode(true)
    setFormData({ loginId: '', password: '' })
    clearError()
    setFlashMessage(null)
  }

  const switchBackToReauth = () => {
    setIsReauthMode(true)
    setFromReauthMode(false)
    setFormData({ loginId: '', password: '' })
    clearError()
    setFlashMessage(null)
  }

  const validateForm = () => {
    if (!isReauthMode && !formData.loginId.trim()) {
      setFlashMessage({
        type: 'warning',
        title: 'Validation Error',
        message: 'Username, email, or user ID is required'
      })
      return false
    }
    if (!formData.password) {
      setFlashMessage({
        type: 'warning',
        title: 'Validation Error',
        message: 'Password is required'
      })
      return false
    }
    if (formData.password.length < 6) {
      setFlashMessage({
        type: 'warning',
        title: 'Validation Error',
        message: 'Password must be at least 8 characters'
      })
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setFlashMessage(null)

    let result
    if (isReauthMode) {
      // Re-authentication mode - only password needed
      result = await reauth(formData.password)
    } else {
      // Normal login mode
      result = await login(formData.loginId, formData.password)
    }

    if (result.success) {
      navigate('/dashboard')
    } else {
      console.error('[LOGIN-PAGE] Login failed:', result.error)
      setFlashMessage({
        type: 'danger',
        title: 'Authentication Error',
        message: result.error || 'Invalid login credentials'
      })
    }

    setLoading(false)
  }

  useEffect(() => {
    if (!flashMessage) return

    const timer = setTimeout(() => {
      clearError()
      setFlashMessage(null)
    }, 4000)

    return () => clearTimeout(timer)
  }, [flashMessage, clearError])

  return (
    <AuthLayout 
      title={isReauthMode ? "Session Expired" : "Welcome Back"} 
      subtitle={isReauthMode ? "Please enter your password to continue" : "Sign in to your account"}
    >
      {flashMessage && (
        <Alert
          type={flashMessage.type}
          title={flashMessage.title}
          className="flash-alert"
          onClose={() => {
            clearError()
            setFlashMessage(null)
          }}
        >
          {flashMessage.message}
        </Alert>
      )}

      {isReauthMode && user && (
        <div className="reauth-user-info">
          <div className="user-avatar">
            <span>{user.name?.charAt(0)?.toUpperCase() || 'U'}</span>
          </div>
          <div className="reauth-user-details">
            <p className="user-name">{user.name} ({user.userId || user.email})</p>
            <p className="user-email">{user.email}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="login-form">
        {!isReauthMode && (
          <Input
            type="text"
            name="loginId"
            label="Username, Email, or User ID"
            placeholder="Enter your username, email, or user ID"
            value={formData.loginId}
            onChange={handleChange}
            required
            disabled={loading}
            autoFocus
          />
        )}

        {/* {isReauthMode && user && (
          <div className="reauth-user-display">
            <span className="reauth-user-text">
              {user.name} ({user.userId || user.email})
            </span>
          </div>
        )} */}

        <Input
          type="password"
          name="password"
          label={isReauthMode ? "Enter Password" : "Password"}
          placeholder={isReauthMode ? "Enter your password to continue" : "Enter your password"}
          value={formData.password}
          onChange={handleChange}
          required
          disabled={loading}
          autoComplete="current-password"
          autoFocus={isReauthMode}
        />

        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={loading}
          className="login-button"
        >
          {loading ? (isReauthMode ? 'Verifying...' : 'Signing In...') : (isReauthMode ? 'Continue' : 'Sign In')}
        </Button>
      </form>

      {isReauthMode && (
        <div className="reauth-actions">
          <Button
            type="button"
            variant="link"
            onClick={switchToNormalLogin}
            className="switch-user-link"
          >
            Login with different user
          </Button>
        </div>
      )}

      {!isReauthMode && fromReauthMode && (
        <div className="reauth-actions">
          <Button
            type="button"
            variant="link"
            onClick={switchBackToReauth}
            className="switch-user-link"
          >
            Back to {user?.name || 'logged in user'}
          </Button>
        </div>
      )}

      {!isReauthMode && (
        <div className="login-footer">
          <p>
            <Link to="/forgot-password" className="forgot-link">
              Forgot Password?
            </Link>
          </p>
        </div>
      )}
    </AuthLayout>
  )
}

export default Login
